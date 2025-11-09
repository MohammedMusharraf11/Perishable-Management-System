import { supabase } from '../config/supabaseClient.js';

/**
 * Pricing Algorithm Service
 * PMS-T-072: Implement pricing algorithm service
 * PMS-T-074: Add business logic for discount calculation
 * 
 * Automatically suggests tiered discounts based on expiry proximity
 */

/**
 * Calculate discount percentage based on days until expiry
 * Discount tiers:
 * - 3+ days: 0% discount
 * - 2 days: 10% discount
 * - 1 day: 25% discount
 * - Same day: 40% discount
 */
export const calculateDiscountTier = (daysUntilExpiry) => {
  if (daysUntilExpiry < 0) return 0; // Expired items - no discount suggestion
  if (daysUntilExpiry === 0) return 40; // Same day
  if (daysUntilExpiry === 1) return 25; // 1 day
  if (daysUntilExpiry === 2) return 10; // 2 days
  return 0; // 3+ days
};

/**
 * Calculate estimated revenue for a batch with discount
 * Revenue = quantity * base_price * (1 - discount/100)
 */
const calculateEstimatedRevenue = (quantity, basePrice, discountPercentage) => {
  const discountedPrice = basePrice * (1 - discountPercentage / 100);
  return quantity * discountedPrice;
};

/**
 * Calculate profit margin
 * Assuming cost is 60% of base price (can be adjusted)
 */
const calculateProfitMargin = (basePrice, discountPercentage) => {
  const costPrice = basePrice * 0.6; // Assuming 40% markup
  const sellingPrice = basePrice * (1 - discountPercentage / 100);
  const profit = sellingPrice - costPrice;
  return (profit / sellingPrice) * 100;
};

/**
 * Check if batch already has a pending discount suggestion
 */
const hasPendingDiscountSuggestion = async (batchId) => {
  const { data, error } = await supabase
    .from('discount_suggestions')
    .select('id')
    .eq('batch_id', batchId)
    .eq('status', 'pending') // lowercase to match Supabase convention
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error checking pending suggestions:', error);
  }

  return !!data;
};

/**
 * Create discount suggestion for a batch
 */
const createDiscountSuggestion = async (batch, suggestedDiscount, estimatedRevenue) => {
  try {
    const { data, error } = await supabase
      .from('discount_suggestions')
      .insert({
        batch_id: batch.id,
        suggested_discount_percentage: suggestedDiscount,
        estimated_revenue: estimatedRevenue,
        status: 'pending' // lowercase to match Supabase convention
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create discount suggestion:', error);
      throw error;
    }

    return { created: true, data };
  } catch (error) {
    console.error('Failed to create discount suggestion:', error);
    return { created: false, error: error.message };
  }
};

/**
 * Main function to analyze pricing and generate discount suggestions
 * PMS-T-073: Create cron job for daily pricing analysis
 */
export const analyzePricingAndSuggestDiscounts = async () => {
  const startTime = new Date();
  console.log(`\n${'='.repeat(60)}`);
  console.log(`💰 Pricing Analysis Job Started: ${startTime.toISOString()}`);
  console.log('='.repeat(60));

  const stats = {
    totalBatchesAnalyzed: 0,
    suggestionsCreated: 0,
    skippedAlreadyDiscounted: 0,
    skippedPendingSuggestion: 0,
    skippedNoDiscount: 0,
    totalEstimatedRevenue: 0,
    errors: 0,
    suggestions: []
  };

  try {
    // Query active batches with quantity > 0, expiring within 2 days
    // Exclude batches that already have discounts applied
    const { data: batches, error } = await supabase
      .from('stock_batches')
      .select(`
        id,
        quantity,
        expiry_date,
        current_discount_percentage,
        status,
        items (
          id,
          sku,
          name,
          base_price,
          category
        )
      `)
      .gt('quantity', 0)
      .in('status', ['ACTIVE', 'EXPIRING_SOON'])
      .eq('current_discount_percentage', 0); // Only items without existing discounts

    if (error) throw error;

    if (!batches || batches.length === 0) {
      console.log('ℹ️  No batches found for pricing analysis');
      return { success: true, stats };
    }

    console.log(`📊 Analyzing ${batches.length} batches...`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Process each batch
    for (const batch of batches) {
      try {
        stats.totalBatchesAnalyzed++;

        const expiryDate = new Date(batch.expiry_date);
        expiryDate.setHours(0, 0, 0, 0);

        // Calculate days until expiry
        const diffTime = expiryDate.getTime() - today.getTime();
        const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Skip if expired
        if (daysUntilExpiry < 0) {
          continue;
        }

        // Calculate suggested discount
        const suggestedDiscount = calculateDiscountTier(daysUntilExpiry);

        // Skip if no discount needed (3+ days)
        if (suggestedDiscount === 0) {
          stats.skippedNoDiscount++;
          continue;
        }

        // Check if already has pending suggestion
        const hasPending = await hasPendingDiscountSuggestion(batch.id);
        if (hasPending) {
          stats.skippedPendingSuggestion++;
          continue;
        }

        // Calculate estimated revenue
        const estimatedRevenue = calculateEstimatedRevenue(
          batch.quantity,
          batch.items.base_price,
          suggestedDiscount
        );

        // Calculate profit margin
        const profitMargin = calculateProfitMargin(
          batch.items.base_price,
          suggestedDiscount
        );

        // Create discount suggestion
        const result = await createDiscountSuggestion(
          batch,
          suggestedDiscount,
          estimatedRevenue
        );

        if (result.created) {
          stats.suggestionsCreated++;
          stats.totalEstimatedRevenue += estimatedRevenue;

          const suggestion = {
            batchId: batch.id,
            sku: batch.items.sku,
            name: batch.items.name,
            quantity: batch.quantity,
            basePrice: batch.items.base_price,
            daysUntilExpiry,
            suggestedDiscount,
            estimatedRevenue: estimatedRevenue.toFixed(2),
            profitMargin: profitMargin.toFixed(2)
          };

          stats.suggestions.push(suggestion);

          console.log(`  💡 Suggestion created: ${batch.items.name} (${batch.items.sku})`);
          console.log(`     Days until expiry: ${daysUntilExpiry}, Discount: ${suggestedDiscount}%, Revenue: ₹${estimatedRevenue.toFixed(2)}`);
        }
      } catch (batchError) {
        console.error(`  ❌ Error processing batch ${batch.id}:`, batchError.message);
        stats.errors++;
      }
    }

    // Sort suggestions by estimated revenue (descending)
    stats.suggestions.sort((a, b) => b.estimatedRevenue - a.estimatedRevenue);

    const endTime = new Date();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log('📈 Pricing Analysis Summary:');
    console.log('-'.repeat(60));
    console.log(`  Total Batches Analyzed: ${stats.totalBatchesAnalyzed}`);
    console.log(`  Discount Suggestions Created: ${stats.suggestionsCreated}`);
    console.log(`  Skipped (No Discount Needed): ${stats.skippedNoDiscount}`);
    console.log(`  Skipped (Pending Suggestion): ${stats.skippedPendingSuggestion}`);
    console.log(`  Total Estimated Revenue: ₹${stats.totalEstimatedRevenue.toFixed(2)}`);
    console.log(`  Errors: ${stats.errors}`);
    console.log(`  Duration: ${duration}s`);
    console.log(`  Completed: ${endTime.toISOString()}`);
    
    if (stats.suggestions.length > 0) {
      console.log('\n📋 Top Suggestions by Revenue Impact:');
      console.log('-'.repeat(60));
      stats.suggestions.slice(0, 5).forEach((s, i) => {
        console.log(`  ${i + 1}. ${s.name} (${s.sku})`);
        console.log(`     Qty: ${s.quantity}, Discount: ${s.suggestedDiscount}%, Revenue: ₹${s.estimatedRevenue}`);
      });
    }
    
    console.log('='.repeat(60) + '\n');

    return { success: true, stats, duration };
  } catch (error) {
    console.error('❌ Pricing Analysis Job Failed:', error.message);
    console.log('='.repeat(60) + '\n');
    return { success: false, error: error.message, stats };
  }
};

/**
 * Get all pending discount suggestions ranked by revenue impact
 */
export const getPendingDiscountSuggestions = async () => {
  try {
    const { data, error } = await supabase
      .from('discount_suggestions')
      .select(`
        id,
        batch_id,
        suggested_discount_percentage,
        estimated_revenue,
        status,
        created_at,
        stock_batches (
          id,
          quantity,
          expiry_date,
          items (
            sku,
            name,
            base_price,
            category
          )
        )
      `)
      .eq('status', 'pending') // lowercase to match Supabase convention
      .order('estimated_revenue', { ascending: false });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Failed to fetch pending suggestions:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Test function to run pricing analysis manually
 */
export const testPricingAnalysis = async () => {
  console.log('🧪 Running Pricing Analysis Test...\n');
  const result = await analyzePricingAndSuggestDiscounts();
  return result;
};

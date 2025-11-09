/**
 * Integration Test Script for Pricing Analysis
 * 
 * This script tests the complete discount suggestion workflow:
 * 1. Run pricing analysis
 * 2. Fetch pending suggestions
 * 3. Display results
 * 
 * Usage: node src/scripts/test-pricing-analysis.js
 */

import { 
  analyzePricingAndSuggestDiscounts,
  getPendingDiscountSuggestions 
} from '../services/pricingAlgorithm.service.js';

const runIntegrationTest = async () => {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 PRICING ANALYSIS INTEGRATION TEST');
  console.log('='.repeat(70) + '\n');

  try {
    // Step 1: Run pricing analysis
    console.log('📊 Step 1: Running pricing analysis...\n');
    const analysisResult = await analyzePricingAndSuggestDiscounts();

    if (!analysisResult.success) {
      console.error('❌ Pricing analysis failed:', analysisResult.error);
      process.exit(1);
    }

    console.log('\n✅ Pricing analysis completed successfully!\n');

    // Step 2: Fetch pending suggestions
    console.log('📋 Step 2: Fetching pending suggestions...\n');
    const suggestionsResult = await getPendingDiscountSuggestions();

    if (!suggestionsResult.success) {
      console.error('❌ Failed to fetch suggestions:', suggestionsResult.error);
      process.exit(1);
    }

    const suggestions = suggestionsResult.data || [];
    console.log(`✅ Found ${suggestions.length} pending suggestions\n`);

    // Step 3: Display results
    if (suggestions.length > 0) {
      console.log('='.repeat(70));
      console.log('📊 PENDING DISCOUNT SUGGESTIONS (Ranked by Revenue Impact)');
      console.log('='.repeat(70) + '\n');

      suggestions.forEach((suggestion, index) => {
        const batch = suggestion.stock_batches;
        const item = batch.items;
        const expiryDate = new Date(batch.expiry_date);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

        console.log(`${index + 1}. ${item.name} (${item.sku})`);
        console.log(`   Category: ${item.category}`);
        console.log(`   Quantity: ${batch.quantity} ${item.unit || 'units'}`);
        console.log(`   Base Price: ₹${parseFloat(item.base_price).toFixed(2)}`);
        console.log(`   Days Until Expiry: ${daysUntilExpiry}`);
        console.log(`   Suggested Discount: ${suggestion.suggested_discount_percentage}%`);
        console.log(`   Estimated Revenue: ₹${parseFloat(suggestion.estimated_revenue).toFixed(2)}`);
        console.log(`   Status: ${suggestion.status}`);
        console.log(`   Created: ${new Date(suggestion.created_at).toLocaleString()}`);
        console.log('-'.repeat(70));
      });

      // Summary statistics
      const totalRevenue = suggestions.reduce(
        (sum, s) => sum + parseFloat(s.estimated_revenue || 0), 
        0
      );

      console.log('\n📈 SUMMARY STATISTICS');
      console.log('='.repeat(70));
      console.log(`Total Pending Suggestions: ${suggestions.length}`);
      console.log(`Total Potential Revenue: ₹${totalRevenue.toFixed(2)}`);
      console.log(`Average Discount: ${(suggestions.reduce((sum, s) => sum + s.suggested_discount_percentage, 0) / suggestions.length).toFixed(2)}%`);
      console.log('='.repeat(70) + '\n');
    } else {
      console.log('ℹ️  No pending discount suggestions at this time.\n');
      console.log('Possible reasons:');
      console.log('  - No items expiring within 2 days');
      console.log('  - All eligible items already have discounts');
      console.log('  - All eligible items already have pending suggestions\n');
    }

    // Test summary
    console.log('='.repeat(70));
    console.log('✅ INTEGRATION TEST COMPLETED SUCCESSFULLY');
    console.log('='.repeat(70));
    console.log('\nTest Results:');
    console.log(`  ✓ Pricing analysis executed`);
    console.log(`  ✓ Suggestions fetched successfully`);
    console.log(`  ✓ ${analysisResult.stats.suggestionsCreated} new suggestions created`);
    console.log(`  ✓ ${suggestions.length} total pending suggestions`);
    console.log('='.repeat(70) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Integration test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

// Run the test
runIntegrationTest();

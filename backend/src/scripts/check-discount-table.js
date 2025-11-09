/**
 * Diagnostic script to check discount_suggestions table structure
 * Usage: node src/scripts/check-discount-table.js
 */

import { supabase } from '../config/supabaseClient.js';

const checkTableStructure = async () => {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 Checking discount_suggestions table structure');
  console.log('='.repeat(60) + '\n');

  try {
    // Try to query the table
    const { data, error } = await supabase
      .from('discount_suggestions')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error querying table:', error);
      return;
    }

    console.log('✅ Table exists and is accessible\n');

    if (data && data.length > 0) {
      console.log('📊 Sample row structure:');
      console.log(JSON.stringify(data[0], null, 2));
      console.log('\n📋 Column names:');
      Object.keys(data[0]).forEach((key, index) => {
        console.log(`  ${index + 1}. ${key}`);
      });
    } else {
      console.log('ℹ️  Table is empty - no sample data available');
    }

    // Try to insert a test record
    console.log('\n🧪 Testing insert operation...');
    
    // First, get a valid batch_id
    const { data: batches } = await supabase
      .from('stock_batches')
      .select('id')
      .limit(1);

    if (!batches || batches.length === 0) {
      console.log('⚠️  No stock batches available for testing');
      return;
    }

    const testBatchId = batches[0].id;

    const { data: insertData, error: insertError } = await supabase
      .from('discount_suggestions')
      .insert({
        batch_id: testBatchId,
        suggested_discount_percentage: 10,
        estimated_revenue: 100,
        status: 'PENDING'
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Insert test failed:', insertError);
      console.log('\nError details:');
      console.log('  Code:', insertError.code);
      console.log('  Message:', insertError.message);
      console.log('  Details:', insertError.details);
      console.log('  Hint:', insertError.hint);
    } else {
      console.log('✅ Insert test successful!');
      console.log('Inserted record:', insertData);
      
      // Clean up test record
      await supabase
        .from('discount_suggestions')
        .delete()
        .eq('id', insertData.id);
      console.log('🧹 Test record cleaned up');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }

  console.log('\n' + '='.repeat(60) + '\n');
};

checkTableStructure();

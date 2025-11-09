/**
 * Check Users Table Structure
 * 
 * This script checks what tables exist and their structure
 * Run: node src/scripts/check-users-table.js
 */

import { supabase } from '../config/supabaseClient.js';

console.log('\n' + '='.repeat(60));
console.log('🔍 CHECKING USERS TABLE');
console.log('='.repeat(60) + '\n');

const checkTables = async () => {
  console.log('Checking for users tables...\n');

  // Try pms_users table
  console.log('1. Checking pms_users table:');
  try {
    const { data, error } = await supabase
      .from('pms_users')
      .select('*')
      .limit(5);

    if (error) {
      console.log('   ❌ pms_users table not found or error:', error.message);
    } else {
      console.log(`   ✅ pms_users table exists with ${data.length} sample rows`);
      if (data.length > 0) {
        console.log('   Columns:', Object.keys(data[0]).join(', '));
        console.log('\n   Sample data:');
        data.forEach((row, i) => {
          console.log(`   ${i + 1}. ID: ${row.id}`);
          console.log(`      Email: ${row.email || 'N/A'}`);
          console.log(`      Name: ${row.name || row.username || 'N/A'}`);
          console.log(`      Role: ${row.role || 'N/A'}`);
          console.log('');
        });
      }
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
  }

  // Try users table
  console.log('\n2. Checking users table:');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(5);

    if (error) {
      console.log('   ❌ users table not found or error:', error.message);
    } else {
      console.log(`   ✅ users table exists with ${data.length} sample rows`);
      if (data.length > 0) {
        console.log('   Columns:', Object.keys(data[0]).join(', '));
        console.log('\n   Sample data:');
        data.forEach((row, i) => {
          console.log(`   ${i + 1}. ID: ${row.id}`);
          console.log(`      Email: ${row.email || 'N/A'}`);
          console.log(`      Name: ${row.name || row.username || 'N/A'}`);
          console.log(`      Role: ${row.role || row.role_id || 'N/A'}`);
          console.log('');
        });
      }
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
  }

  // Check for managers specifically
  console.log('\n3. Checking for Manager role users:');
  
  // Try pms_users with role = 'Manager'
  try {
    const { data, error } = await supabase
      .from('pms_users')
      .select('*')
      .eq('role', 'Manager');

    if (!error && data) {
      console.log(`   ✅ Found ${data.length} managers in pms_users`);
      data.forEach((manager, i) => {
        console.log(`   ${i + 1}. ${manager.name || manager.username || 'N/A'} (${manager.email || 'No email'})`);
      });
    }
  } catch (err) {
    // Ignore
  }

  // Try users with role = 'Manager'
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'Manager');

    if (!error && data) {
      console.log(`   ✅ Found ${data.length} managers in users (direct role column)`);
      data.forEach((manager, i) => {
        console.log(`   ${i + 1}. ${manager.name || manager.username || 'N/A'} (${manager.email || 'No email'})`);
      });
    }
  } catch (err) {
    // Ignore
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ CHECK COMPLETE');
  console.log('='.repeat(60) + '\n');
};

checkTables().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});

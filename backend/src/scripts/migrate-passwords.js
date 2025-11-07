/**
 * Password Migration Script
 * PMS-T-105: Migrate existing plaintext passwords to bcrypt hashes
 * 
 * WARNING: This script should be run ONCE to migrate existing users
 * Run with: node src/scripts/migrate-passwords.js
 */

import bcrypt from 'bcrypt';
import { supabase } from '../config/supabaseClient.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..', '..', '..');
dotenv.config({ path: path.join(projectRoot, '.env') });

const SALT_ROUNDS = 10;

async function migratePasswords() {
  console.log('='.repeat(60));
  console.log('Password Migration Script');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Fetch all users
    console.log('Fetching all users...');
    const { data: users, error: fetchError } = await supabase
      .from('pms_users')
      .select('id, email, password, name');

    if (fetchError) {
      throw new Error(`Failed to fetch users: ${fetchError.message}`);
    }

    if (!users || users.length === 0) {
      console.log('No users found in database.');
      return;
    }

    console.log(`Found ${users.length} users to process.`);
    console.log('');

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        // Check if password is already hashed (bcrypt hashes start with $2b$)
        if (user.password && user.password.startsWith('$2b$')) {
          console.log(`✓ Skipping ${user.email} - already hashed`);
          skippedCount++;
          continue;
        }

        // Hash the plaintext password
        console.log(`Processing ${user.email}...`);
        const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);

        // Update the user's password
        const { error: updateError } = await supabase
          .from('pms_users')
          .update({ password: hashedPassword })
          .eq('id', user.id);

        if (updateError) {
          throw new Error(`Failed to update: ${updateError.message}`);
        }

        console.log(`✓ Migrated ${user.email}`);
        migratedCount++;

      } catch (error) {
        console.error(`✗ Error processing ${user.email}: ${error.message}`);
        errorCount++;
      }
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('Migration Complete!');
    console.log('='.repeat(60));
    console.log(`Total users: ${users.length}`);
    console.log(`Migrated: ${migratedCount}`);
    console.log(`Skipped (already hashed): ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('');

    if (errorCount > 0) {
      console.log('⚠️  Some users failed to migrate. Please review errors above.');
    } else if (migratedCount > 0) {
      console.log('✅ All passwords successfully migrated to bcrypt hashes!');
    } else {
      console.log('ℹ️  All passwords were already hashed. No migration needed.');
    }

  } catch (error) {
    console.error('');
    console.error('❌ Migration failed:', error.message);
    console.error('');
    process.exit(1);
  }
}

// Confirmation prompt
console.log('');
console.log('⚠️  WARNING: This script will migrate all plaintext passwords to bcrypt hashes.');
console.log('This operation cannot be undone.');
console.log('');
console.log('Make sure you have:');
console.log('1. Backed up your database');
console.log('2. Updated the login endpoint to use bcrypt.compare()');
console.log('3. Tested the new authentication flow');
console.log('');

// Run migration
migratePasswords();

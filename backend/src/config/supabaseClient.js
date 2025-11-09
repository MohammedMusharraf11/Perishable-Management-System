import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Use '../.env' to go one level up from /backend to the root .env file
// Use '../.env' to go one level up from /backend/src/config to the root .env file
dotenv.config({ path: '../.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use Service Role Key

// In CI/CD or test environments without credentials, create a mock client
if (!supabaseUrl || !supabaseKey) {
  if (process.env.CI || process.env.NODE_ENV === 'test') {
    console.warn('⚠️  Running in CI/test mode without Supabase credentials - using mock client');
    // Create a mock client for testing
    export const supabase = {
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: [], error: null }),
        update: () => Promise.resolve({ data: [], error: null }),
        delete: () => Promise.resolve({ data: [], error: null }),
      }),
    };
  } else {
    console.error('❌ Missing Supabase URL or Service Role Key in .env file');
    console.error('Make sure your .env file is in the project root, not in /backend');
    process.exit(1);
  }
} else {
  export const supabase = createClient(supabaseUrl, supabaseKey);
}
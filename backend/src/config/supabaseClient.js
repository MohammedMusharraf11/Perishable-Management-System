import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Use '../.env' to go one level up from /backend to the root .env file
dotenv.config({ path: '../.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use Service Role Key

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase URL or Service Role Key in .env file');
  console.error('Make sure your .env file is in the project root, not in /backend');
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseKey);
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('items').select('count').limit(1);
    if (error) throw error;
    return true;
  } catch (error) {
    throw error;
  }
};

export { supabase, testConnection };

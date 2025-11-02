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
    if (error) {
      console.error('Supabase connection test failed:', error.message);
      throw new Error(`Database connection failed: ${error.message}`);
    }
    console.log('Database connection test successful');
    return data;
  } catch (error) {
    console.error('Failed to test database connection:', error);
    throw new Error('Unable to connect to database');
  }
};

export { supabase, testConnection };
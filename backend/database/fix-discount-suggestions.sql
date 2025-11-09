-- Fix discount_suggestions table constraint
-- This script ensures the table has the correct structure and constraints

-- Drop the existing constraint if it exists
ALTER TABLE discount_suggestions 
DROP CONSTRAINT IF EXISTS discount_suggestions_status_check;

-- Add the correct constraint with uppercase values
ALTER TABLE discount_suggestions 
ADD CONSTRAINT discount_suggestions_status_check 
CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'));

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'discount_suggestions'
ORDER BY ordinal_position;

-- Show any existing data
SELECT id, batch_id, suggested_discount_percentage, estimated_revenue, status, created_at
FROM discount_suggestions
LIMIT 5;

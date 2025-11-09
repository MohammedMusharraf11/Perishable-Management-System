-- Fix the status constraint to accept both uppercase and lowercase
-- Run this in your Supabase SQL editor

-- First, drop the existing constraint
ALTER TABLE discount_suggestions 
DROP CONSTRAINT IF EXISTS discount_suggestions_status_check;

-- Add a new constraint that accepts lowercase (which is what Supabase uses)
ALTER TABLE discount_suggestions 
ADD CONSTRAINT discount_suggestions_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'expired'));

-- Update any existing uppercase values to lowercase
UPDATE discount_suggestions 
SET status = LOWER(status)
WHERE status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- Verify the fix
SELECT id, status, created_at 
FROM discount_suggestions 
ORDER BY created_at DESC 
LIMIT 5;

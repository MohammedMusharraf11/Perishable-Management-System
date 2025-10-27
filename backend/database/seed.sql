-- ============================================
-- Perishables Management System (PMS)
-- Seed Data for Development/Testing
-- ============================================

-- Insert a default admin user (password: Admin@123)
-- Password hash generated with bcrypt (10 rounds)
INSERT INTO users (username, email, password_hash, role_id, is_active) 
SELECT 
    'admin',
    'admin@pms.com',
    '$2b$10$rQZ9vXqK5xJ5xJ5xJ5xJ5.5xJ5xJ5xJ5xJ5xJ5xJ5xJ5xJ5xJ5xJ5',
    r.id,
    true
FROM roles r
WHERE r.name = 'ADMIN'
ON CONFLICT (username) DO NOTHING;

-- Insert a default manager user (password: Manager@123)
INSERT INTO users (username, email, password_hash, role_id, is_active)
SELECT 
    'manager',
    'manager@pms.com',
    '$2b$10$rQZ9vXqK5xJ5xJ5xJ5xJ5.5xJ5xJ5xJ5xJ5xJ5xJ5xJ5xJ5xJ5xJ5',
    r.id,
    true
FROM roles r
WHERE r.name = 'MANAGER'
ON CONFLICT (username) DO NOTHING;

-- Insert a default staff user (password: Staff@123)
INSERT INTO users (username, email, password_hash, role_id, is_active)
SELECT 
    'staff',
    'staff@pms.com',
    '$2b$10$rQZ9vXqK5xJ5xJ5xJ5xJ5.5xJ5xJ5xJ5xJ5xJ5xJ5xJ5xJ5xJ5xJ5',
    r.id,
    true
FROM roles r
WHERE r.name = 'STAFF'
ON CONFLICT (username) DO NOTHING;

-- Insert sample stock batches for testing
INSERT INTO stock_batches (item_id, quantity, delivery_date, expiry_date, supplier_batch_number, status, created_by)
SELECT 
    i.id,
    100,
    CURRENT_DATE - INTERVAL '2 days',
    CURRENT_DATE + INTERVAL '5 days',
    'BATCH-001',
    'ACTIVE',
    u.id
FROM items i
CROSS JOIN users u
WHERE i.sku = 'FRT-APL-001' AND u.username = 'staff'
LIMIT 1;

INSERT INTO stock_batches (item_id, quantity, delivery_date, expiry_date, supplier_batch_number, status, created_by)
SELECT 
    i.id,
    50,
    CURRENT_DATE - INTERVAL '5 days',
    CURRENT_DATE + INTERVAL '1 day',
    'BATCH-002',
    'EXPIRING_SOON',
    u.id
FROM items i
CROSS JOIN users u
WHERE i.sku = 'FRT-BAN-001' AND u.username = 'staff'
LIMIT 1;

INSERT INTO stock_batches (item_id, quantity, delivery_date, expiry_date, supplier_batch_number, status, created_by)
SELECT 
    i.id,
    75,
    CURRENT_DATE - INTERVAL '1 day',
    CURRENT_DATE + INTERVAL '7 days',
    'BATCH-003',
    'ACTIVE',
    u.id
FROM items i
CROSS JOIN users u
WHERE i.sku = 'VEG-TOM-001' AND u.username = 'staff'
LIMIT 1;

-- Note: You'll need to generate proper bcrypt hashes for actual passwords
-- Use this Node.js code to generate hashes:
-- const bcrypt = require('bcrypt');
-- const hash = await bcrypt.hash('YourPassword', 10);

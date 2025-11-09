-- ============================================
-- Perishables Management System (PMS)
-- Database Schema for Supabase (PostgreSQL)
-- Sprint 1 - PMS-US-009: Database Setup
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: roles
-- Stores user roles (Manager, Staff, Admin)
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: users
-- Stores user authentication and profile data
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    is_active BOOLEAN DEFAULT true,
    failed_login_attempts INTEGER DEFAULT 0,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: items
-- Product catalog for perishable items
-- ============================================
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    base_price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    unit VARCHAR(50) DEFAULT 'kg',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: stock_batches
-- Tracks individual stock batches with expiry
-- ============================================
CREATE TABLE IF NOT EXISTS stock_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    delivery_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    supplier_batch_number VARCHAR(100),
    current_discount_percentage DECIMAL(5, 2) DEFAULT 0 CHECK (current_discount_percentage >= 0 AND current_discount_percentage <= 100),
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'DEPLETED')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_dates CHECK (expiry_date > delivery_date)
);

-- ============================================
-- TABLE: transactions
-- Logs all quantity changes (sales, returns, adjustments)
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES stock_batches(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('SALE', 'RETURN', 'ADJUSTMENT', 'TRANSFER', 'WASTE')),
    quantity_change INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    reason TEXT,
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: waste_logs
-- Tracks wasted/discarded items
-- ============================================
CREATE TABLE IF NOT EXISTS waste_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES stock_batches(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    waste_reason VARCHAR(50) NOT NULL CHECK (waste_reason IN ('EXPIRED', 'DAMAGED', 'SPOILED', 'OTHER')),
    estimated_loss DECIMAL(10, 2),
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE waste_logs 
ADD COLUMN IF NOT EXISTS user_reference TEXT,
ADD COLUMN IF NOT EXISTS user_role VARCHAR(20);

-- ============================================
-- TABLE: alerts
-- Stores system-generated alerts for expiring items
-- ============================================
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES stock_batches(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('EXPIRED', 'EXPIRING_TODAY', 'EXPIRING_1_DAY', 'EXPIRING_2_DAYS')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- TABLE: discount_suggestions
-- AI-generated discount recommendations
-- ============================================
CREATE TABLE IF NOT EXISTS discount_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES stock_batches(id) ON DELETE CASCADE,
    suggested_discount_percentage DECIMAL(5, 2) NOT NULL CHECK (suggested_discount_percentage >= 0 AND suggested_discount_percentage <= 100),
    estimated_revenue DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED')),
    approved_discount_percentage DECIMAL(5, 2),
    rejection_reason TEXT,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: audit_logs
-- Comprehensive audit trail for all actions
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- INDEXES for Performance Optimization
-- ============================================

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Stock batches indexes
CREATE INDEX idx_stock_batches_item_id ON stock_batches(item_id);
CREATE INDEX idx_stock_batches_expiry_date ON stock_batches(expiry_date);
CREATE INDEX idx_stock_batches_status ON stock_batches(status);
CREATE INDEX idx_stock_batches_delivery_date ON stock_batches(delivery_date);

-- Items table indexes
CREATE INDEX idx_items_sku ON items(sku);
CREATE INDEX idx_items_category ON items(category);

-- Transactions table indexes
CREATE INDEX idx_transactions_batch_id ON transactions(batch_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);

-- Waste logs indexes
CREATE INDEX idx_waste_logs_batch_id ON waste_logs(batch_id);
CREATE INDEX idx_waste_logs_item_id ON waste_logs(item_id);
CREATE INDEX idx_waste_logs_created_at ON waste_logs(created_at);

-- Alerts table indexes
CREATE INDEX idx_alerts_batch_id ON alerts(batch_id);
CREATE INDEX idx_alerts_is_read ON alerts(is_read);
CREATE INDEX idx_alerts_created_at ON alerts(created_at);

-- Discount suggestions indexes
CREATE INDEX idx_discount_suggestions_batch_id ON discount_suggestions(batch_id);
CREATE INDEX idx_discount_suggestions_status ON discount_suggestions(status);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================
-- TRIGGERS for automatic timestamp updates
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_batches_updated_at BEFORE UPDATE ON stock_batches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discount_suggestions_updated_at BEFORE UPDATE ON discount_suggestions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA
-- ============================================

-- Insert default roles
INSERT INTO roles (name, description) VALUES
    ('ADMIN', 'System administrator with full access'),
    ('MANAGER', 'Store manager with access to all features except user management'),
    ('STAFF', 'Department staff with basic inventory operations')
ON CONFLICT (name) DO NOTHING;

-- Insert sample items (Product Catalog)
INSERT INTO items (sku, name, category, base_price, unit) VALUES
    ('FRT-APL-001', 'Red Apples', 'Fruits', 120.00, 'kg'),
    ('FRT-BAN-001', 'Bananas', 'Fruits', 50.00, 'kg'),
    ('VEG-TOM-001', 'Tomatoes', 'Vegetables', 40.00, 'kg'),
    ('VEG-POT-001', 'Potatoes', 'Vegetables', 30.00, 'kg'),
    ('VEG-ONI-001', 'Onions', 'Vegetables', 35.00, 'kg'),
    ('DRY-MLK-001', 'Fresh Milk', 'Dairy', 60.00, 'liter'),
    ('DRY-YGT-001', 'Yogurt', 'Dairy', 80.00, 'kg'),
    ('VEG-CAR-001', 'Carrots', 'Vegetables', 45.00, 'kg'),
    ('FRT-ORG-001', 'Oranges', 'Fruits', 100.00, 'kg'),
    ('VEG-SPN-001', 'Spinach', 'Vegetables', 25.00, 'kg')
ON CONFLICT (sku) DO NOTHING;

-- ============================================
-- VIEWS for Common Queries
-- ============================================

-- View: Active inventory with days until expiry
CREATE OR REPLACE VIEW v_active_inventory AS
SELECT 
    sb.id AS batch_id,
    i.sku,
    i.name AS product_name,
    i.category,
    sb.quantity,
    sb.delivery_date,
    sb.expiry_date,
    (sb.expiry_date - CURRENT_DATE) AS days_until_expiry,
    sb.current_discount_percentage,
    i.base_price,
    (i.base_price * (1 - sb.current_discount_percentage / 100)) AS discounted_price,
    sb.status,
    sb.supplier_batch_number,
    sb.created_at
FROM stock_batches sb
JOIN items i ON sb.item_id = i.id
WHERE sb.status IN ('ACTIVE', 'EXPIRING_SOON')
    AND sb.quantity > 0
ORDER BY sb.expiry_date ASC;

-- View: Expiring items summary
CREATE OR REPLACE VIEW v_expiring_items_summary AS
SELECT 
    COUNT(*) FILTER (WHERE expiry_date < CURRENT_DATE) AS expired_count,
    COUNT(*) FILTER (WHERE expiry_date = CURRENT_DATE) AS expiring_today_count,
    COUNT(*) FILTER (WHERE expiry_date = CURRENT_DATE + INTERVAL '1 day') AS expiring_tomorrow_count,
    COUNT(*) FILTER (WHERE expiry_date BETWEEN CURRENT_DATE + INTERVAL '1 day' AND CURRENT_DATE + INTERVAL '2 days') AS expiring_in_2_days_count
FROM stock_batches
WHERE status IN ('ACTIVE', 'EXPIRING_SOON')
    AND quantity > 0;

-- ============================================
-- COMMENTS for Documentation
-- ============================================

COMMENT ON TABLE users IS 'Stores user authentication and profile information';
COMMENT ON TABLE roles IS 'Defines user roles and permissions';
COMMENT ON TABLE items IS 'Product catalog for perishable items';
COMMENT ON TABLE stock_batches IS 'Tracks individual stock batches with expiry dates';
COMMENT ON TABLE transactions IS 'Logs all inventory quantity changes';
COMMENT ON TABLE waste_logs IS 'Records wasted or discarded items';
COMMENT ON TABLE alerts IS 'System-generated alerts for expiring items';
COMMENT ON TABLE discount_suggestions IS 'AI-generated discount recommendations';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for compliance';

-- ============================================
-- END OF SCHEMA
-- ============================================

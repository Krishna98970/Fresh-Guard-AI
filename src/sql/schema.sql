-- ==============================================================================
-- FRESHGUARD AI — COMPLETE PRODUCTION POSTGRESQL SCHEMA WITH RLS
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    domain VARCHAR(255),
    settings JSONB DEFAULT '{
        "approvalScoreMin": 85,
        "reviewScoreMin": 70,
        "tempWarningC": 15.0,
        "tempCriticalC": 25.0,
        "vibrationWarningG": 0.8,
        "vibrationCriticalG": 1.5,
        "simulationIntervalMs": 3000
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Users (extending Supabase auth.users or standalone profile)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'MANAGER', 'QUALITY_INSPECTOR', 'PACKING_OPERATOR', 'DELIVERY_MANAGER', 'VIEWER')),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    avatar_url TEXT,
    department VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Products
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('FRUITS', 'VEGETABLES', 'LEAFY_GREENS', 'DAIRY', 'BAKERY', 'PERISHABLES')),
    batch_number VARCHAR(100),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    unit VARCHAR(20) DEFAULT 'kg',
    optimal_temp_min NUMERIC(4,1) DEFAULT 2.0,
    optimal_temp_max NUMERIC(4,1) DEFAULT 8.0,
    max_vibration_g NUMERIC(4,2) DEFAULT 0.60,
    fragility_score INTEGER DEFAULT 5 CHECK (fragility_score BETWEEN 1 AND 10),
    freshness_index NUMERIC(5,2) DEFAULT 95.0,
    avg_quality_score NUMERIC(5,2) DEFAULT 90.0,
    defect_rate NUMERIC(5,2) DEFAULT 2.5,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Product Batches
CREATE TABLE IF NOT EXISTS product_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    batch_number VARCHAR(100) NOT NULL,
    harvest_date DATE,
    received_date TIMESTAMPTZ DEFAULT NOW(),
    initial_quantity INTEGER NOT NULL,
    remaining_quantity INTEGER NOT NULL,
    supplier_name VARCHAR(255),
    inspected_status VARCHAR(50) DEFAULT 'PENDING' CHECK (inspected_status IN ('PENDING', 'PASSED', 'FAILED', 'PARTIAL')),
    shelf_life_days INTEGER DEFAULT 7,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_address TEXT NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'PLACED' CHECK (status IN ('PLACED', 'PROCESSING', 'INSPECTION', 'APPROVED', 'REJECTED', 'PACKING', 'READY', 'ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED')),
    quality_status VARCHAR(50) DEFAULT 'PENDING' CHECK (quality_status IN ('PENDING', 'APPROVED', 'REJECTED', 'BYPASSED')),
    packing_status VARCHAR(50) DEFAULT 'PENDING' CHECK (packing_status IN ('PENDING', 'IN_PROGRESS', 'PACKED', 'FLAGGED')),
    delivery_status VARCHAR(50) DEFAULT 'UNASSIGNED' CHECK (delivery_status IN ('UNASSIGNED', 'ASSIGNED', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'FAILED')),
    rider_id UUID,
    rider_name VARCHAR(255),
    handling_risk VARCHAR(20) DEFAULT 'LOW' CHECK (handling_risk IN ('LOW', 'MEDIUM', 'HIGH')),
    delivery_eta TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Order Items
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    quantity NUMERIC(8,2) NOT NULL DEFAULT 1.0,
    unit_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    unit VARCHAR(20) DEFAULT 'kg',
    quality_score NUMERIC(5,2),
    inspected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Quality Inspections
CREATE TABLE IF NOT EXISTS quality_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    batch_number VARCHAR(100),
    inspector_id UUID REFERENCES users(id) ON DELETE SET NULL,
    inspector_name VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    overall_score NUMERIC(5,2) NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
    freshness_score NUMERIC(5,2) NOT NULL CHECK (freshness_score BETWEEN 0 AND 100),
    appearance_score NUMERIC(5,2) NOT NULL CHECK (appearance_score BETWEEN 0 AND 100),
    ripeness_score NUMERIC(5,2) NOT NULL CHECK (ripeness_score BETWEEN 0 AND 100),
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
    decision VARCHAR(20) NOT NULL CHECK (decision IN ('APPROVED', 'REVIEW', 'REJECTED')),
    ai_explanation TEXT,
    recommendation TEXT,
    shelf_life_estimate_days INTEGER DEFAULT 5,
    packaging_advice TEXT,
    is_ai_generated BOOLEAN DEFAULT TRUE,
    inspected_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Inspection Defects
CREATE TABLE IF NOT EXISTS inspection_defects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID REFERENCES quality_inspections(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('BRUISE', 'CUT', 'MOLD', 'DISCOLORATION', 'OVERRIPE', 'DEHYDRATION', 'PEST_DAMAGE')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('MINOR', 'MODERATE', 'SEVERE')),
    location_description TEXT,
    confidence NUMERIC(4,2) DEFAULT 0.95,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Packing Records
CREATE TABLE IF NOT EXISTS packing_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    order_number VARCHAR(100) NOT NULL,
    packer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    packer_name VARCHAR(255) NOT NULL,
    packaging_type VARCHAR(100) NOT NULL,
    fragility_level VARCHAR(50) NOT NULL,
    special_handling_instructions JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'PACKED' CHECK (status IN ('PACKED', 'FLAGGED')),
    damage_reported BOOLEAN DEFAULT FALSE,
    damage_notes TEXT,
    packed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Riders
CREATE TABLE IF NOT EXISTS riders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL CHECK (vehicle_type IN ('E_BIKE', 'MOTORBIKE', 'VAN')),
    vehicle_plate VARCHAR(50),
    status VARCHAR(50) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'ON_DELIVERY', 'OFFLINE')),
    active_deliveries_count INTEGER DEFAULT 0,
    total_deliveries INTEGER DEFAULT 0,
    successful_deliveries INTEGER DEFAULT 0,
    handling_score NUMERIC(5,2) DEFAULT 95.0,
    damage_incidents INTEGER DEFAULT 0,
    avg_delivery_time_minutes NUMERIC(5,1) DEFAULT 18.5,
    reliability_score NUMERIC(5,2) DEFAULT 98.0,
    avatar_url TEXT,
    zone VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Deliveries
CREATE TABLE IF NOT EXISTS deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    order_number VARCHAR(100) NOT NULL,
    rider_id UUID REFERENCES riders(id) ON DELETE RESTRICT,
    rider_name VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    destination_address TEXT NOT NULL,
    destination_area VARCHAR(100) NOT NULL,
    distance_km NUMERIC(5,2) DEFAULT 3.5,
    status VARCHAR(50) DEFAULT 'READY_FOR_DISPATCH' CHECK (status IN ('READY_FOR_DISPATCH', 'IN_TRANSIT', 'AT_RISK', 'DELIVERED', 'FAILED')),
    risk_level VARCHAR(20) DEFAULT 'LOW' CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
    dispatched_at TIMESTAMPTZ,
    estimated_delivery_time TIMESTAMPTZ NOT NULL,
    actual_delivery_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Telemetry Readings
CREATE TABLE IF NOT EXISTS telemetry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_id UUID REFERENCES deliveries(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    temperature_c NUMERIC(5,2) NOT NULL,
    humidity_percent NUMERIC(5,2) NOT NULL,
    vibration_g NUMERIC(5,2) NOT NULL,
    acceleration_g NUMERIC(5,2) NOT NULL,
    speed_kmh NUMERIC(5,2) NOT NULL,
    latitude NUMERIC(10,6),
    longitude NUMERIC(10,6),
    handling_risk VARCHAR(20) DEFAULT 'LOW' CHECK (handling_risk IN ('LOW', 'MEDIUM', 'HIGH')),
    flagged_anomaly TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Handling Events
CREATE TABLE IF NOT EXISTS handling_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_id UUID REFERENCES deliveries(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('HARSH_BRAKE', 'SPEED_BUMP', 'POTHOLE_IMPACT', 'RAPID_ACCELERATION', 'PROLONGED_DELAY', 'TEMPERATURE_SPIKE', 'EXCESSIVE_VIBRATION')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('WARNING', 'CRITICAL')),
    vibration_g NUMERIC(5,2) NOT NULL,
    temperature_c NUMERIC(5,2) NOT NULL,
    description TEXT NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Alerts
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('QUALITY', 'DELIVERY', 'TEMPERATURE', 'VIBRATION', 'DELAY', 'PACKING', 'SYSTEM')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('ORDER', 'INSPECTION', 'DELIVERY', 'PRODUCT', 'SYSTEM')),
    entity_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Customer Feedback
CREATE TABLE IF NOT EXISTS customer_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    order_number VARCHAR(100) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    freshness_rating INTEGER CHECK (freshness_rating BETWEEN 1 AND 5),
    packaging_rating INTEGER CHECK (packaging_rating BETWEEN 1 AND 5),
    delivery_speed_rating INTEGER CHECK (delivery_speed_rating BETWEEN 1 AND 5),
    comment TEXT,
    is_damage_reported BOOLEAN DEFAULT FALSE,
    damage_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    user_name VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    metadata JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_products_org ON products(organization_id);
CREATE INDEX IF NOT EXISTS idx_orders_org_status ON orders(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_inspections_product ON quality_inspections(product_id);
CREATE INDEX IF NOT EXISTS idx_inspections_order ON quality_inspections(order_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_delivery ON telemetry(delivery_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_alerts_org_unread ON alerts(organization_id, is_read);
CREATE INDEX IF NOT EXISTS idx_feedback_order ON customer_feedback(order_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE riders ENABLE ROW LEVEL SECURITY;

-- Sample RLS Policy: Users can view data for their organization
CREATE POLICY org_isolation_products ON products
    FOR ALL
    USING (organization_id = NULLIF(current_setting('app.current_org_id', true), '')::uuid);

CREATE POLICY org_isolation_orders ON orders
    FOR ALL
    USING (organization_id = NULLIF(current_setting('app.current_org_id', true), '')::uuid);

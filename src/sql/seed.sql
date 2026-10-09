-- ==============================================================================
-- FRESHGUARD AI — REALISTIC SEED DATA FOR DEMO & PRODUCTION INITIALIZATION
-- ==============================================================================

-- 1. Default Organization
INSERT INTO organizations (id, name, slug, domain)
VALUES ('a0000000-0000-0000-0000-000000000001', 'FreshGuard Prime Q-Commerce', 'freshguard-prime', 'freshguard.ai')
ON CONFLICT (id) DO NOTHING;

-- 2. Default Users across roles
INSERT INTO users (id, email, name, role, organization_id, department)
VALUES
('u0000000-0000-0000-0000-000000000001', 'admin@freshguard.ai', 'Sarah Chen', 'ADMIN', 'a0000000-0000-0000-0000-000000000001', 'Executive Operations'),
('u0000000-0000-0000-0000-000000000002', 'inspector@freshguard.ai', 'Marcus Rivera', 'QUALITY_INSPECTOR', 'a0000000-0000-0000-0000-000000000001', 'Intake Quality Control'),
('u0000000-0000-0000-0000-000000000003', 'packing@freshguard.ai', 'Elena Rostova', 'PACKING_OPERATOR', 'a0000000-0000-0000-0000-000000000001', 'Fulfillment Center B'),
('u0000000-0000-0000-0000-000000000004', 'delivery@freshguard.ai', 'David Kim', 'DELIVERY_MANAGER', 'a0000000-0000-0000-0000-000000000001', 'Fleet Logistics')
ON CONFLICT (id) DO NOTHING;

-- 3. Realistic Produce Catalog
INSERT INTO products (id, organization_id, name, sku, category, batch_number, stock, unit, optimal_temp_min, optimal_temp_max, max_vibration_g, fragility_score, freshness_index, avg_quality_score, defect_rate, image_url)
VALUES
('p0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Honeycrisp Apples (Crisp Select)', 'FRU-APP-001', 'FRUITS', 'BATCH-APP-942', 1240, 'kg', 1.0, 4.0, 0.70, 4, 94.5, 92.0, 1.8, 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80'),
('p0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Organic Hass Avocados', 'FRU-AVO-002', 'FRUITS', 'BATCH-AVO-184', 580, 'units', 5.0, 10.0, 0.45, 8, 91.2, 89.4, 3.2, 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=600&q=80'),
('p0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'San Marzano Vine Tomatoes', 'VEG-TOM-003', 'VEGETABLES', 'BATCH-TOM-512', 820, 'kg', 10.0, 15.0, 0.40, 9, 88.0, 86.5, 4.5, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80'),
('p0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Baby Spinach (Hydroponic)', 'VEG-SPN-004', 'LEAFY_GREENS', 'BATCH-SPN-831', 410, 'punnets', 1.0, 4.0, 0.50, 7, 96.0, 95.2, 1.2, 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80'),
('p0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'California Sweet Strawberries', 'FRU-STR-005', 'FRUITS', 'BATCH-STR-309', 315, 'boxes', 0.5, 3.0, 0.30, 10, 93.0, 91.0, 2.9, 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=600&q=80'),
('p0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Artisan Sourdough Loaf', 'BAK-SOU-006', 'BAKERY', 'BATCH-BAK-112', 150, 'loaves', 18.0, 22.0, 0.80, 5, 98.0, 97.5, 0.5, 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=600&q=80')
ON CONFLICT (id) DO NOTHING;

-- 4. Fleet Riders
INSERT INTO riders (id, organization_id, name, phone, vehicle_type, vehicle_plate, status, active_deliveries_count, total_deliveries, successful_deliveries, handling_score, damage_incidents, avg_delivery_time_minutes, reliability_score, avatar_url, zone)
VALUES
('r0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Alex Vance', '+1 (555) 234-5678', 'E_BIKE', 'EB-902', 'ON_DELIVERY', 1, 412, 408, 98.2, 1, 16.4, 99.1, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80', 'Downtown Metro'),
('r0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Samir Patel', '+1 (555) 345-6789', 'MOTORBIKE', 'MB-441', 'AVAILABLE', 0, 320, 312, 94.5, 2, 18.2, 97.5, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', 'Westside Hills'),
('r0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Chloe Martin', '+1 (555) 456-7890', 'VAN', 'VN-108', 'AVAILABLE', 0, 580, 574, 97.8, 1, 21.0, 98.9, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80', 'Harbor District')
ON CONFLICT (id) DO NOTHING;

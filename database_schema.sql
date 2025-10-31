-- AgriCredit Database Schema for Supabase
-- Run this script in your Supabase SQL Editor to set up the complete database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('farmer', 'admin', 'investor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE loan_status AS ENUM ('pending', 'approved', 'rejected', 'active', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE repayment_status AS ENUM ('pending', 'paid', 'overdue');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE listing_status AS ENUM ('active', 'sold', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('info', 'warning', 'success', 'error');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('minted', 'transferred', 'retired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE proposal_state AS ENUM ('pending', 'active', 'canceled', 'defeated', 'succeeded', 'queued', 'expired', 'executed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE nft_status AS ENUM ('minting', 'minted', 'harvested');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE cross_chain_status AS ENUM ('initiated', 'locked', 'bridging', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    location VARCHAR(255),
    farm_size DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    role user_role DEFAULT 'farmer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sensor devices table
CREATE TABLE IF NOT EXISTS sensor_devices (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255),
    location VARCHAR(255),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    crop_type VARCHAR(100),
    farm_size DECIMAL(10,2),
    owner_id INTEGER REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    last_seen TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sensor readings table
CREATE TABLE IF NOT EXISTS sensor_readings (
    id SERIAL PRIMARY KEY,
    device_id INTEGER REFERENCES sensor_devices(id) NOT NULL,
    soil_moisture DECIMAL(5,2),
    temperature DECIMAL(5,2),
    humidity DECIMAL(5,2),
    light_level DECIMAL(7,2),
    ph_level DECIMAL(4,2),
    nitrogen DECIMAL(7,2),
    phosphorus DECIMAL(7,2),
    potassium DECIMAL(7,2),
    rainfall DECIMAL(7,2),
    wind_speed DECIMAL(6,2),
    solar_radiation DECIMAL(8,2),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Credit scores table
CREATE TABLE IF NOT EXISTS credit_scores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    trust_score INTEGER,
    confidence DECIMAL(5,4),
    features_used JSONB,
    explanation JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Yield predictions table
CREATE TABLE IF NOT EXISTS yield_predictions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    crop_type VARCHAR(100) NOT NULL,
    predicted_yield DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50) DEFAULT 'tons/hectare',
    confidence_interval_lower DECIMAL(10,2),
    confidence_interval_upper DECIMAL(10,2),
    features_used JSONB,
    important_factors JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Climate analyses table
CREATE TABLE IF NOT EXISTS climate_analyses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    co2_sequestered DECIMAL(15,6),
    ndvi_score DECIMAL(5,4),
    carbon_tokens_mintable DECIMAL(15,6),
    recommendations JSONB,
    confidence DECIMAL(5,4),
    satellite_data JSONB,
    iot_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Loans table
CREATE TABLE IF NOT EXISTS loans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    interest_rate DECIMAL(5,2) NOT NULL,
    duration_months INTEGER NOT NULL,
    status loan_status DEFAULT 'pending',
    purpose TEXT,
    collateral JSONB,
    repayment_schedule JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    disbursed_at TIMESTAMPTZ
);

-- Loan repayments table
CREATE TABLE IF NOT EXISTS loan_repayments (
    id SERIAL PRIMARY KEY,
    loan_id INTEGER REFERENCES loans(id) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    due_date TIMESTAMPTZ NOT NULL,
    paid_date TIMESTAMPTZ,
    status repayment_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketplace listings table
CREATE TABLE IF NOT EXISTS marketplace_listings (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER REFERENCES users(id) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    crop_type VARCHAR(100) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50) DEFAULT 'tons',
    price_per_unit DECIMAL(10,2) NOT NULL,
    location VARCHAR(255),
    quality_grade VARCHAR(20),
    harvest_date TIMESTAMPTZ,
    expiry_date TIMESTAMPTZ,
    status listing_status DEFAULT 'active',
    images JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type notification_type DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Carbon credits table
CREATE TABLE IF NOT EXISTS carbon_credits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    amount DECIMAL(15,6) NOT NULL,
    transaction_type transaction_type NOT NULL,
    transaction_hash VARCHAR(255),
    verification_proof JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Governance proposals table
CREATE TABLE IF NOT EXISTS governance_proposals (
    id SERIAL PRIMARY KEY,
    proposal_id INTEGER UNIQUE NOT NULL,
    proposer_address VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    targets JSONB,
    values JSONB,
    signatures JSONB,
    calldatas JSONB,
    start_block INTEGER,
    end_block INTEGER,
    state proposal_state DEFAULT 'pending',
    transaction_hash VARCHAR(255),
    execution_tx_hash VARCHAR(255),
    executed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Governance votes table
CREATE TABLE IF NOT EXISTS governance_votes (
    id SERIAL PRIMARY KEY,
    proposal_id INTEGER REFERENCES governance_proposals(proposal_id) NOT NULL,
    voter_address VARCHAR(255) NOT NULL,
    support BOOLEAN NOT NULL,
    voting_power INTEGER NOT NULL,
    reason TEXT,
    transaction_hash VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Farm NFTs table
CREATE TABLE IF NOT EXISTS farm_nfts (
    id SERIAL PRIMARY KEY,
    token_id INTEGER UNIQUE NOT NULL,
    farmer_address VARCHAR(255) NOT NULL,
    farm_name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    size DECIMAL(10,2) NOT NULL,
    crop_type VARCHAR(100) NOT NULL,
    expected_yield DECIMAL(10,2) NOT NULL,
    soil_type VARCHAR(100),
    irrigation_type VARCHAR(100),
    certifications JSONB,
    metadata_uri VARCHAR(500),
    status nft_status DEFAULT 'minting',
    transaction_hash VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Harvest records table
CREATE TABLE IF NOT EXISTS harvest_records (
    id SERIAL PRIMARY KEY,
    token_id INTEGER REFERENCES farm_nfts(token_id) NOT NULL,
    actual_yield DECIMAL(10,2) NOT NULL,
    harvest_date TIMESTAMPTZ NOT NULL,
    quality_grade VARCHAR(20),
    notes TEXT,
    transaction_hash VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Liquidity positions table
CREATE TABLE IF NOT EXISTS liquidity_positions (
    id SERIAL PRIMARY KEY,
    user_address VARCHAR(255) NOT NULL,
    token_a VARCHAR(255) NOT NULL,
    token_b VARCHAR(255) NOT NULL,
    amount_a DECIMAL(36,18) NOT NULL,
    amount_b DECIMAL(36,18) NOT NULL,
    liquidity_tokens DECIMAL(36,18) NOT NULL,
    fee INTEGER DEFAULT 30,
    pool_address VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pool rewards table
CREATE TABLE IF NOT EXISTS pool_rewards (
    id SERIAL PRIMARY KEY,
    position_id INTEGER REFERENCES liquidity_positions(id) NOT NULL,
    user_address VARCHAR(255) NOT NULL,
    reward_amount DECIMAL(36,18) NOT NULL,
    reward_token VARCHAR(255) NOT NULL,
    claimed_at TIMESTAMPTZ NOT NULL
);

-- Cross-chain transactions table
CREATE TABLE IF NOT EXISTS cross_chain_transactions (
    id SERIAL PRIMARY KEY,
    user_address VARCHAR(255) NOT NULL,
    from_chain VARCHAR(50) NOT NULL,
    to_chain VARCHAR(50) NOT NULL,
    token_symbol VARCHAR(20) NOT NULL,
    amount DECIMAL(36,18) NOT NULL,
    recipient_address VARCHAR(255) NOT NULL,
    bridge_fee DECIMAL(10,4) NOT NULL,
    status cross_chain_status DEFAULT 'initiated',
    source_tx_hash VARCHAR(255),
    destination_tx_hash VARCHAR(255),
    estimated_completion TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE INDEX IF NOT EXISTS idx_sensor_devices_device_id ON sensor_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_sensor_devices_owner_id ON sensor_devices(owner_id);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_device_id ON sensor_readings(device_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp ON sensor_readings(timestamp);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_device_timestamp ON sensor_readings(device_id, timestamp);

CREATE INDEX IF NOT EXISTS idx_credit_scores_user_id ON credit_scores(user_id);

CREATE INDEX IF NOT EXISTS idx_yield_predictions_user_id ON yield_predictions(user_id);

CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_created_at ON loans(created_at);

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_seller_id ON marketplace_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_crop_type ON marketplace_listings(crop_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_location ON marketplace_listings(location);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_created_at ON marketplace_listings(created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);

CREATE INDEX IF NOT EXISTS idx_carbon_credits_user_id ON carbon_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_carbon_credits_transaction_type ON carbon_credits(transaction_type);
CREATE INDEX IF NOT EXISTS idx_carbon_credits_transaction_hash ON carbon_credits(transaction_hash);

CREATE INDEX IF NOT EXISTS idx_governance_proposals_proposal_id ON governance_proposals(proposal_id);
CREATE INDEX IF NOT EXISTS idx_governance_proposals_proposer_address ON governance_proposals(proposer_address);
CREATE INDEX IF NOT EXISTS idx_governance_proposals_state ON governance_proposals(state);

CREATE INDEX IF NOT EXISTS idx_governance_votes_proposal_id ON governance_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_governance_votes_voter_address ON governance_votes(voter_address);
CREATE INDEX IF NOT EXISTS idx_governance_votes_proposal_voter ON governance_votes(proposal_id, voter_address);

CREATE INDEX IF NOT EXISTS idx_farm_nfts_token_id ON farm_nfts(token_id);
CREATE INDEX IF NOT EXISTS idx_farm_nfts_farmer_address ON farm_nfts(farmer_address);
CREATE INDEX IF NOT EXISTS idx_farm_nfts_location ON farm_nfts(location);
CREATE INDEX IF NOT EXISTS idx_farm_nfts_crop_type ON farm_nfts(crop_type);
CREATE INDEX IF NOT EXISTS idx_farm_nfts_status ON farm_nfts(status);

CREATE INDEX IF NOT EXISTS idx_harvest_records_token_id ON harvest_records(token_id);
CREATE INDEX IF NOT EXISTS idx_harvest_records_harvest_date ON harvest_records(harvest_date);
CREATE INDEX IF NOT EXISTS idx_harvest_records_token_date ON harvest_records(token_id, harvest_date);

CREATE INDEX IF NOT EXISTS idx_liquidity_positions_user_address ON liquidity_positions(user_address);
CREATE INDEX IF NOT EXISTS idx_liquidity_positions_token_a ON liquidity_positions(token_a);
CREATE INDEX IF NOT EXISTS idx_liquidity_positions_token_b ON liquidity_positions(token_b);

CREATE INDEX IF NOT EXISTS idx_pool_rewards_position_id ON pool_rewards(position_id);
CREATE INDEX IF NOT EXISTS idx_pool_rewards_user_address ON pool_rewards(user_address);
CREATE INDEX IF NOT EXISTS idx_pool_rewards_claimed_at ON pool_rewards(claimed_at);
CREATE INDEX IF NOT EXISTS idx_pool_rewards_position_claimed ON pool_rewards(position_id, claimed_at);

CREATE INDEX IF NOT EXISTS idx_cross_chain_transactions_user_address ON cross_chain_transactions(user_address);
CREATE INDEX IF NOT EXISTS idx_cross_chain_transactions_from_chain ON cross_chain_transactions(from_chain);
CREATE INDEX IF NOT EXISTS idx_cross_chain_transactions_to_chain ON cross_chain_transactions(to_chain);
CREATE INDEX IF NOT EXISTS idx_cross_chain_transactions_token_symbol ON cross_chain_transactions(token_symbol);
CREATE INDEX IF NOT EXISTS idx_cross_chain_transactions_status ON cross_chain_transactions(status);
CREATE INDEX IF NOT EXISTS idx_cross_chain_transactions_source_tx_hash ON cross_chain_transactions(source_tx_hash);
CREATE INDEX IF NOT EXISTS idx_cross_chain_transactions_destination_tx_hash ON cross_chain_transactions(destination_tx_hash);
CREATE INDEX IF NOT EXISTS idx_cross_chain_user_status ON cross_chain_transactions(user_address, status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO users (email, username, hashed_password, full_name, phone, location, farm_size, is_active, is_verified, role)
VALUES
    ('admin@agricredit.africa', 'admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeK2cBBuuP0f5K.Gi', 'System Admin', '+254700000000', 'Nairobi, Kenya', 100.0, true, true, 'admin'),
    ('farmer1@example.com', 'farmer1', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeK2cBBuuP0f5K.Gi', 'John Farmer', '+254711111111', 'Nakuru, Kenya', 5.0, true, true, 'farmer'),
    ('investor1@example.com', 'investor1', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeK2cBBuuP0f5K.Gi', 'Jane Investor', '+254722222222', 'Nairobi, Kenya', null, true, true, 'investor')
ON CONFLICT (email) DO NOTHING;

-- Insert sample sensor device
INSERT INTO sensor_devices (device_id, name, location, latitude, longitude, crop_type, farm_size, owner_id, is_active)
VALUES
    ('SENSOR001', 'Farm Sensor Alpha', 'Nakuru Farm', -0.3031, 36.0800, 'Maize', 5.0, 2, true)
ON CONFLICT (device_id) DO NOTHING;

-- Insert sample sensor readings
INSERT INTO sensor_readings (device_id, soil_moisture, temperature, humidity, light_level, ph_level, timestamp)
VALUES
    (1, 65.5, 24.3, 72.1, 85000.0, 6.8, NOW() - INTERVAL '1 hour'),
    (1, 67.2, 25.1, 70.5, 92000.0, 6.9, NOW() - INTERVAL '30 minutes'),
    (1, 63.8, 23.8, 74.2, 78000.0, 6.7, NOW())
ON CONFLICT DO NOTHING;

-- Insert sample marketplace listing
INSERT INTO marketplace_listings (seller_id, title, description, crop_type, quantity, unit, price_per_unit, location, quality_grade, status)
VALUES
    (2, 'Premium Maize Harvest', 'High-quality maize from Nakuru region, Grade A', 'Maize', 10.5, 'tons', 250.00, 'Nakuru, Kenya', 'A', 'active')
ON CONFLICT DO NOTHING;

-- Create Row Level Security (RLS) policies for multi-tenant security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE yield_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE climate_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_repayments ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE carbon_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE harvest_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE liquidity_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_chain_transactions ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (users can only access their own data)
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can view own devices" ON sensor_devices FOR SELECT USING (owner_id::text = auth.uid()::text);
CREATE POLICY "Users can manage own devices" ON sensor_devices FOR ALL USING (owner_id::text = auth.uid()::text);

CREATE POLICY "Users can view own sensor data" ON sensor_readings FOR SELECT USING (
    device_id IN (SELECT id FROM sensor_devices WHERE owner_id::text = auth.uid()::text)
);

CREATE POLICY "Users can view own credit scores" ON credit_scores FOR SELECT USING (user_id::text = auth.uid()::text);
CREATE POLICY "Users can view own yield predictions" ON yield_predictions FOR SELECT USING (user_id::text = auth.uid()::text);
CREATE POLICY "Users can view own loans" ON loans FOR SELECT USING (user_id::text = auth.uid()::text);
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id::text = auth.uid()::text);
CREATE POLICY "Users can view own carbon credits" ON carbon_credits FOR SELECT USING (user_id::text = auth.uid()::text);

-- Climate analyses policies
CREATE POLICY "Users can view own climate analyses" ON climate_analyses FOR SELECT USING (user_id::text = auth.uid()::text OR user_id IS NULL);

-- Loan repayments policies
CREATE POLICY "Users can view own loan repayments" ON loan_repayments FOR SELECT USING (
    loan_id IN (SELECT id FROM loans WHERE user_id::text = auth.uid()::text)
);

-- Governance policies (public read, admin write)
CREATE POLICY "Anyone can view governance proposals" ON governance_proposals FOR SELECT USING (true);
CREATE POLICY "Admins can manage governance proposals" ON governance_proposals FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);

CREATE POLICY "Anyone can view governance votes" ON governance_votes FOR SELECT USING (true);
CREATE POLICY "Users can create governance votes" ON governance_votes FOR INSERT WITH CHECK (voter_address = auth.jwt() ->> 'wallet_address');

-- NFT policies (public read for some, owner write)
CREATE POLICY "Anyone can view farm NFTs" ON farm_nfts FOR SELECT USING (true);
CREATE POLICY "Farmers can manage own NFTs" ON farm_nfts FOR ALL USING (farmer_address = auth.jwt() ->> 'wallet_address');

CREATE POLICY "Anyone can view harvest records" ON harvest_records FOR SELECT USING (true);

-- DeFi policies
CREATE POLICY "Users can view own liquidity positions" ON liquidity_positions FOR SELECT USING (user_address = auth.jwt() ->> 'wallet_address');
CREATE POLICY "Users can manage own liquidity positions" ON liquidity_positions FOR ALL USING (user_address = auth.jwt() ->> 'wallet_address');

CREATE POLICY "Users can view own pool rewards" ON pool_rewards FOR SELECT USING (user_address = auth.jwt() ->> 'wallet_address');

-- Cross-chain policies
CREATE POLICY "Users can view own cross-chain transactions" ON cross_chain_transactions FOR SELECT USING (user_address = auth.jwt() ->> 'wallet_address');
CREATE POLICY "Users can create cross-chain transactions" ON cross_chain_transactions FOR INSERT WITH CHECK (user_address = auth.jwt() ->> 'wallet_address');

-- Admin policies (admins can access everything)
CREATE POLICY "Admins can access all users" ON users FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);

-- Public read access for marketplace listings
CREATE POLICY "Anyone can view marketplace listings" ON marketplace_listings FOR SELECT USING (true);
CREATE POLICY "Users can create marketplace listings" ON marketplace_listings FOR INSERT WITH CHECK (seller_id::text = auth.uid()::text);
CREATE POLICY "Sellers can update own listings" ON marketplace_listings FOR UPDATE USING (seller_id::text = auth.uid()::text);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE sensor_readings;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_listings;
ALTER PUBLICATION supabase_realtime ADD TABLE loans;

-- Create views for analytics
CREATE OR REPLACE VIEW user_stats AS
SELECT
    u.id,
    u.username,
    u.full_name,
    u.farm_size,
    COUNT(DISTINCT sd.id) as device_count,
    COUNT(DISTINCT l.id) as loan_count,
    COUNT(DISTINCT cc.id) as carbon_credit_count,
    MAX(sr.timestamp) as last_sensor_reading
FROM users u
LEFT JOIN sensor_devices sd ON u.id = sd.owner_id
LEFT JOIN loans l ON u.id = l.user_id
LEFT JOIN carbon_credits cc ON u.id = cc.user_id
LEFT JOIN sensor_devices sd2 ON u.id = sd2.owner_id
LEFT JOIN sensor_readings sr ON sd2.id = sr.device_id
GROUP BY u.id, u.username, u.full_name, u.farm_size;

CREATE OR REPLACE VIEW system_stats AS
SELECT
    (SELECT COUNT(*) FROM users WHERE is_active = true) as active_users,
    (SELECT COUNT(*) FROM sensor_devices WHERE is_active = true) as active_devices,
    (SELECT COUNT(*) FROM sensor_readings WHERE timestamp > NOW() - INTERVAL '24 hours') as readings_last_24h,
    (SELECT COUNT(*) FROM loans WHERE status = 'active') as active_loans,
    (SELECT COUNT(*) FROM marketplace_listings WHERE status = 'active') as active_listings,
    (SELECT SUM(amount) FROM carbon_credits) as total_carbon_credits;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🎉 AgriCredit database schema deployed successfully!';
    RAISE NOTICE '📊 Created 18 tables with proper indexes and relationships';
    RAISE NOTICE '🔒 Enabled Row Level Security for ALL tables';
    RAISE NOTICE '📈 Created analytics views for dashboard';
    RAISE NOTICE '⚡ Enabled realtime subscriptions for key tables';
    RAISE NOTICE '👤 Inserted sample data for testing';
    RAISE NOTICE '🛡️  Configured comprehensive RLS policies';
END $$;
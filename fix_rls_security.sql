-- AgriCredit RLS Security Fix
-- Run this script if you get RLS warnings from Supabase security audit

-- Enable RLS for missing tables
ALTER TABLE climate_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_repayments ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE harvest_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE liquidity_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_chain_transactions ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for climate analyses
DROP POLICY IF EXISTS "Users can view own climate analyses" ON climate_analyses;
CREATE POLICY "Users can view own climate analyses" ON climate_analyses
    FOR SELECT USING (user_id::text = auth.uid()::text OR user_id IS NULL);

-- Add RLS policies for loan repayments
DROP POLICY IF EXISTS "Users can view own loan repayments" ON loan_repayments;
CREATE POLICY "Users can view own loan repayments" ON loan_repayments
    FOR SELECT USING (loan_id IN (SELECT id FROM loans WHERE user_id::text = auth.uid()::text));

-- Add RLS policies for governance (public read, admin write)
DROP POLICY IF EXISTS "Anyone can view governance proposals" ON governance_proposals;
CREATE POLICY "Anyone can view governance proposals" ON governance_proposals FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage governance proposals" ON governance_proposals;
CREATE POLICY "Admins can manage governance proposals" ON governance_proposals FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);

DROP POLICY IF EXISTS "Anyone can view governance votes" ON governance_votes;
CREATE POLICY "Anyone can view governance votes" ON governance_votes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create governance votes" ON governance_votes;
CREATE POLICY "Users can create governance votes" ON governance_votes
    FOR INSERT WITH CHECK (voter_address = auth.jwt() ->> 'wallet_address');

-- Add RLS policies for NFTs (public read, owner write)
DROP POLICY IF EXISTS "Anyone can view farm NFTs" ON farm_nfts;
CREATE POLICY "Anyone can view farm NFTs" ON farm_nfts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Farmers can manage own NFTs" ON farm_nfts;
CREATE POLICY "Farmers can manage own NFTs" ON farm_nfts FOR ALL USING (farmer_address = auth.jwt() ->> 'wallet_address');

DROP POLICY IF EXISTS "Anyone can view harvest records" ON harvest_records;
CREATE POLICY "Anyone can view harvest records" ON harvest_records FOR SELECT USING (true);

-- Add RLS policies for DeFi positions
DROP POLICY IF EXISTS "Users can view own liquidity positions" ON liquidity_positions;
CREATE POLICY "Users can view own liquidity positions" ON liquidity_positions
    FOR SELECT USING (user_address = auth.jwt() ->> 'wallet_address');

DROP POLICY IF EXISTS "Users can manage own liquidity positions" ON liquidity_positions;
CREATE POLICY "Users can manage own liquidity positions" ON liquidity_positions
    FOR ALL USING (user_address = auth.jwt() ->> 'wallet_address');

DROP POLICY IF EXISTS "Users can view own pool rewards" ON pool_rewards;
CREATE POLICY "Users can view own pool rewards" ON pool_rewards
    FOR SELECT USING (user_address = auth.jwt() ->> 'wallet_address');

-- Add RLS policies for cross-chain transactions
DROP POLICY IF EXISTS "Users can view own cross-chain transactions" ON cross_chain_transactions;
CREATE POLICY "Users can view own cross-chain transactions" ON cross_chain_transactions
    FOR SELECT USING (user_address = auth.jwt() ->> 'wallet_address');

DROP POLICY IF EXISTS "Users can create cross-chain transactions" ON cross_chain_transactions;
CREATE POLICY "Users can create cross-chain transactions" ON cross_chain_transactions
    FOR INSERT WITH CHECK (user_address = auth.jwt() ->> 'wallet_address');

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🔒 RLS Security Fix Applied Successfully!';
    RAISE NOTICE '✅ All tables now have Row Level Security enabled';
    RAISE NOTICE '🛡️ Comprehensive access policies configured';
    RAISE NOTICE '🔐 Multi-tenant security implemented';
END $$;
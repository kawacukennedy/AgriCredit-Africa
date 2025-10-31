-- Comprehensive RLS Fix for AgriCredit Database
-- Run this script to ensure all tables have RLS properly enabled and configured

-- Step 1: Enable RLS for all tables (in correct order)
DO $$
DECLARE
    table_name text;
    tables_to_fix text[] := ARRAY[
        'users', 'sensor_devices', 'sensor_readings', 'credit_scores',
        'yield_predictions', 'climate_analyses', 'loans', 'loan_repayments',
        'marketplace_listings', 'notifications', 'carbon_credits',
        'governance_proposals', 'governance_votes', 'farm_nfts',
        'harvest_records', 'liquidity_positions', 'pool_rewards',
        'cross_chain_transactions'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables_to_fix
    LOOP
        -- Enable RLS if not already enabled
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
        RAISE NOTICE 'Enabled RLS for table: %', table_name;
    END LOOP;
END $$;

-- Step 2: Drop all existing policies to avoid conflicts
DO $$
DECLARE
    policy_record record;
BEGIN
    FOR policy_record IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                      policy_record.policyname,
                      policy_record.schemaname,
                      policy_record.tablename);
        RAISE NOTICE 'Dropped policy: %.%', policy_record.tablename, policy_record.policyname;
    END LOOP;
END $$;

-- Step 3: Recreate all RLS policies

-- User policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);
CREATE POLICY "Admins can access all users" ON users FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);

-- Sensor device policies
CREATE POLICY "Users can view own devices" ON sensor_devices FOR SELECT USING (owner_id::text = auth.uid()::text);
CREATE POLICY "Users can manage own devices" ON sensor_devices FOR ALL USING (owner_id::text = auth.uid()::text);

-- Sensor reading policies
CREATE POLICY "Users can view own sensor data" ON sensor_readings FOR SELECT USING (
    device_id IN (SELECT id FROM sensor_devices WHERE owner_id::text = auth.uid()::text)
);

-- Credit score policies
CREATE POLICY "Users can view own credit scores" ON credit_scores FOR SELECT USING (user_id::text = auth.uid()::text);

-- Yield prediction policies
CREATE POLICY "Users can view own yield predictions" ON yield_predictions FOR SELECT USING (user_id::text = auth.uid()::text);

-- Climate analysis policies
CREATE POLICY "Users can view own climate analyses" ON climate_analyses FOR SELECT USING (user_id::text = auth.uid()::text OR user_id IS NULL);

-- Loan policies
CREATE POLICY "Users can view own loans" ON loans FOR SELECT USING (user_id::text = auth.uid()::text);

-- Loan repayment policies
CREATE POLICY "Users can view own loan repayments" ON loan_repayments FOR SELECT USING (
    loan_id IN (SELECT id FROM loans WHERE user_id::text = auth.uid()::text)
);

-- Marketplace listing policies
CREATE POLICY "Anyone can view marketplace listings" ON marketplace_listings FOR SELECT USING (true);
CREATE POLICY "Users can create marketplace listings" ON marketplace_listings FOR INSERT WITH CHECK (seller_id::text = auth.uid()::text);
CREATE POLICY "Sellers can update own listings" ON marketplace_listings FOR UPDATE USING (seller_id::text = auth.uid()::text);

-- Notification policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id::text = auth.uid()::text);

-- Carbon credit policies
CREATE POLICY "Users can view own carbon credits" ON carbon_credits FOR SELECT USING (user_id::text = auth.uid()::text);

-- Governance policies
CREATE POLICY "Anyone can view governance proposals" ON governance_proposals FOR SELECT USING (true);
CREATE POLICY "Admins can manage governance proposals" ON governance_proposals FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);
CREATE POLICY "Anyone can view governance votes" ON governance_votes FOR SELECT USING (true);
CREATE POLICY "Users can create governance votes" ON governance_votes FOR INSERT WITH CHECK (voter_address = auth.jwt() ->> 'wallet_address');

-- NFT policies
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

-- Step 4: Verification function
CREATE OR REPLACE FUNCTION verify_rls_setup()
RETURNS TABLE(table_name text, rls_enabled boolean, policy_count bigint) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.table_name::text,
        t.row_security::boolean as rls_enabled,
        COUNT(p.policyname)::bigint as policy_count
    FROM information_schema.tables t
    LEFT JOIN pg_policies p ON p.tablename = t.table_name AND p.schemaname = t.table_schema
    WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
        AND t.table_name IN (
            'users', 'sensor_devices', 'sensor_readings', 'credit_scores',
            'yield_predictions', 'climate_analyses', 'loans', 'loan_repayments',
            'marketplace_listings', 'notifications', 'carbon_credits',
            'governance_proposals', 'governance_votes', 'farm_nfts',
            'harvest_records', 'liquidity_positions', 'pool_rewards',
            'cross_chain_transactions'
        )
    GROUP BY t.table_name, t.row_security
    ORDER BY t.table_name;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Run verification
SELECT * FROM verify_rls_setup();

-- Success message
DO $$
DECLARE
    total_tables integer;
    rls_enabled_tables integer;
    tables_with_policies integer;
BEGIN
    SELECT COUNT(*) INTO total_tables FROM verify_rls_setup();
    SELECT COUNT(*) INTO rls_enabled_tables FROM verify_rls_setup() WHERE rls_enabled = true;
    SELECT COUNT(*) INTO tables_with_policies FROM verify_rls_setup() WHERE policy_count > 0;

    RAISE NOTICE '🎉 Comprehensive RLS Fix Completed!';
    RAISE NOTICE '📊 Total tables: %', total_tables;
    RAISE NOTICE '✅ RLS enabled: %', rls_enabled_tables;
    RAISE NOTICE '🛡️ With policies: %', tables_with_policies;

    IF rls_enabled_tables = total_tables AND tables_with_policies = total_tables THEN
        RAISE NOTICE '🎯 ALL TABLES SECURE: Complete RLS protection active!';
    ELSE
        RAISE EXCEPTION '⚠️ Some tables may still have RLS issues. Check verification results above.';
    END IF;
END $$;
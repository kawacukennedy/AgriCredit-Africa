-- AgriCredit Database Drop Script
-- Run this script to completely remove all AgriCredit database objects
-- WARNING: This will permanently delete all data and schema objects!

-- Step 1: Drop all tables (in reverse dependency order)
DROP TABLE IF EXISTS cross_chain_transactions CASCADE;
DROP TABLE IF EXISTS pool_rewards CASCADE;
DROP TABLE IF EXISTS liquidity_positions CASCADE;
DROP TABLE IF EXISTS harvest_records CASCADE;
DROP TABLE IF EXISTS farm_nfts CASCADE;
DROP TABLE IF EXISTS governance_votes CASCADE;
DROP TABLE IF EXISTS governance_proposals CASCADE;
DROP TABLE IF EXISTS carbon_credits CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS marketplace_listings CASCADE;
DROP TABLE IF EXISTS loan_repayments CASCADE;
DROP TABLE IF EXISTS loans CASCADE;
DROP TABLE IF EXISTS climate_analyses CASCADE;
DROP TABLE IF EXISTS yield_predictions CASCADE;
DROP TABLE IF EXISTS credit_scores CASCADE;
DROP TABLE IF EXISTS sensor_readings CASCADE;
DROP TABLE IF EXISTS sensor_devices CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Step 2: Drop custom types
DROP TYPE IF EXISTS cross_chain_status CASCADE;
DROP TYPE IF EXISTS nft_status CASCADE;
DROP TYPE IF EXISTS proposal_state CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS listing_status CASCADE;
DROP TYPE IF EXISTS repayment_status CASCADE;
DROP TYPE IF EXISTS loan_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Step 3: Drop views
DROP VIEW IF EXISTS system_stats CASCADE;
DROP VIEW IF EXISTS user_stats CASCADE;

-- Step 4: Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS verify_rls_setup() CASCADE;

-- Step 5: Drop extensions (optional - only if not used elsewhere)
-- DROP EXTENSION IF EXISTS "pgcrypto" CASCADE;
-- DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;

-- Step 6: Drop indexes (these should be dropped with CASCADE, but just in case)
DROP INDEX IF EXISTS idx_cross_chain_user_status CASCADE;
DROP INDEX IF EXISTS idx_cross_chain_transactions_destination_tx_hash CASCADE;
DROP INDEX IF EXISTS idx_cross_chain_transactions_source_tx_hash CASCADE;
DROP INDEX IF EXISTS idx_cross_chain_transactions_token_symbol CASCADE;
DROP INDEX IF EXISTS idx_cross_chain_transactions_status CASCADE;
DROP INDEX IF EXISTS idx_cross_chain_transactions_to_chain CASCADE;
DROP INDEX IF EXISTS idx_cross_chain_transactions_from_chain CASCADE;
DROP INDEX IF EXISTS idx_cross_chain_transactions_user_address CASCADE;
DROP INDEX IF EXISTS idx_pool_rewards_position_claimed CASCADE;
DROP INDEX IF EXISTS idx_pool_rewards_claimed_at CASCADE;
DROP INDEX IF EXISTS idx_pool_rewards_user_address CASCADE;
DROP INDEX IF EXISTS idx_pool_rewards_position_id CASCADE;
DROP INDEX IF EXISTS idx_liquidity_positions_token_b CASCADE;
DROP INDEX IF EXISTS idx_liquidity_positions_token_a CASCADE;
DROP INDEX IF EXISTS idx_liquidity_positions_user_address CASCADE;
DROP INDEX IF EXISTS idx_harvest_records_token_date CASCADE;
DROP INDEX IF EXISTS idx_harvest_records_harvest_date CASCADE;
DROP INDEX IF EXISTS idx_harvest_records_token_id CASCADE;
DROP INDEX IF EXISTS idx_farm_nfts_status CASCADE;
DROP INDEX IF EXISTS idx_farm_nfts_crop_type CASCADE;
DROP INDEX IF EXISTS idx_farm_nfts_location CASCADE;
DROP INDEX IF EXISTS idx_farm_nfts_farmer_address CASCADE;
DROP INDEX IF EXISTS idx_farm_nfts_token_id CASCADE;
DROP INDEX IF EXISTS idx_governance_votes_proposal_voter CASCADE;
DROP INDEX IF EXISTS idx_governance_votes_voter_address CASCADE;
DROP INDEX IF EXISTS idx_governance_votes_proposal_id CASCADE;
DROP INDEX IF EXISTS idx_governance_proposals_state CASCADE;
DROP INDEX IF EXISTS idx_governance_proposals_proposer_address CASCADE;
DROP INDEX IF EXISTS idx_governance_proposals_proposal_id CASCADE;
DROP INDEX IF EXISTS idx_carbon_credits_transaction_hash CASCADE;
DROP INDEX IF EXISTS idx_carbon_credits_transaction_type CASCADE;
DROP INDEX IF EXISTS idx_carbon_credits_user_id CASCADE;
DROP INDEX IF EXISTS idx_notifications_user_unread CASCADE;
DROP INDEX IF EXISTS idx_notifications_created_at CASCADE;
DROP INDEX IF EXISTS idx_notifications_is_read CASCADE;
DROP INDEX IF EXISTS idx_notifications_type CASCADE;
DROP INDEX IF EXISTS idx_notifications_user_id CASCADE;
DROP INDEX IF EXISTS idx_marketplace_listings_created_at CASCADE;
DROP INDEX IF EXISTS idx_marketplace_listings_status CASCADE;
DROP INDEX IF EXISTS idx_marketplace_listings_location CASCADE;
DROP INDEX IF EXISTS idx_marketplace_listings_crop_type CASCADE;
DROP INDEX IF EXISTS idx_marketplace_listings_seller_id CASCADE;
DROP INDEX IF EXISTS idx_loans_created_at CASCADE;
DROP INDEX IF EXISTS idx_loans_status CASCADE;
DROP INDEX IF EXISTS idx_loans_user_id CASCADE;
DROP INDEX IF EXISTS idx_yield_predictions_user_id CASCADE;
DROP INDEX IF EXISTS idx_credit_scores_user_id CASCADE;
DROP INDEX IF EXISTS idx_sensor_readings_device_timestamp CASCADE;
DROP INDEX IF EXISTS idx_sensor_readings_timestamp CASCADE;
DROP INDEX IF EXISTS idx_sensor_readings_device_id CASCADE;
DROP INDEX IF EXISTS idx_sensor_devices_owner_id CASCADE;
DROP INDEX IF EXISTS idx_sensor_devices_device_id CASCADE;
DROP INDEX IF EXISTS idx_users_role CASCADE;
DROP INDEX IF EXISTS idx_users_username CASCADE;
DROP INDEX IF EXISTS idx_users_email CASCADE;

-- Step 7: Remove realtime publications
DROP PUBLICATION IF EXISTS supabase_realtime CASCADE;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🗑️ AgriCredit database schema completely dropped!';
    RAISE NOTICE '⚠️ All data and schema objects have been permanently removed';
    RAISE NOTICE '🔄 Ready for fresh schema deployment';
END $$;
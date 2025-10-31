#!/usr/bin/env python3
"""
Test script to validate AgriCredit database schema deployment
Tests RLS enablement and policy configuration
"""

import os
import sys
import re
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_schema_syntax():
    """Test that the schema file has valid SQL syntax and RLS setup"""
    try:
        schema_path = "/Volumes/RCA/agricredit/database_schema.sql"

        if not os.path.exists(schema_path):
            logger.error(f"❌ Schema file not found: {schema_path}")
            return False

        with open(schema_path, 'r', encoding='utf-8') as f:
            schema_content = f.read()

        # Basic syntax checks
        if "CREATE TABLE" not in schema_content:
            logger.error("❌ No CREATE TABLE statements found")
            return False

        if "ENABLE ROW LEVEL SECURITY" not in schema_content:
            logger.error("❌ No RLS enablement statements found")
            return False

        # Count RLS statements
        rls_count = schema_content.count("ENABLE ROW LEVEL SECURITY")
        expected_tables = 18
        if rls_count != expected_tables:
            logger.error(f"❌ Expected {expected_tables} RLS statements, found {rls_count}")
            return False

        # Check that all expected tables have RLS enabled
        expected_tables_list = [
            'users', 'sensor_devices', 'sensor_readings', 'credit_scores',
            'yield_predictions', 'climate_analyses', 'loans', 'loan_repayments',
            'marketplace_listings', 'notifications', 'carbon_credits',
            'governance_proposals', 'governance_votes', 'farm_nfts',
            'harvest_records', 'liquidity_positions', 'pool_rewards',
            'cross_chain_transactions'
        ]

        tables_with_rls = []
        for table in expected_tables_list:
            if f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY" in schema_content:
                tables_with_rls.append(table)
            else:
                logger.error(f"❌ Missing RLS for table: {table}")

        if len(tables_with_rls) != expected_tables:
            logger.error(f"❌ Only {len(tables_with_rls)}/{expected_tables} tables have RLS enabled")
            return False

        # Check that policies are defined
        if "CREATE POLICY" not in schema_content:
            logger.error("❌ No RLS policies found")
            return False

        policy_count = schema_content.count("CREATE POLICY")
        if policy_count < 20:  # Should have at least 20 policies
            logger.warning(f"⚠️  Only {policy_count} policies found, expected more")

        logger.info(f"✅ Schema validation passed:")
        logger.info(f"   - {rls_count} RLS statements found")
        logger.info(f"   - {policy_count} policies configured")
        logger.info(f"   - All {expected_tables} tables have RLS enabled")
        return True

    except Exception as e:
        logger.error(f"❌ Schema validation error: {e}")
        return False

def validate_rls_completeness():
    """Validate that all tables have RLS enabled and policies exist"""
    try:
        schema_path = "/Volumes/RCA/agricredit/database_schema.sql"

        with open(schema_path, 'r', encoding='utf-8') as f:
            schema_content = f.read()

        expected_tables = [
            'users', 'sensor_devices', 'sensor_readings', 'credit_scores',
            'yield_predictions', 'climate_analyses', 'loans', 'loan_repayments',
            'marketplace_listings', 'notifications', 'carbon_credits',
            'governance_proposals', 'governance_votes', 'farm_nfts',
            'harvest_records', 'liquidity_positions', 'pool_rewards',
            'cross_chain_transactions'
        ]

        missing_rls = []
        for table in expected_tables:
            rls_pattern = f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY"
            if rls_pattern not in schema_content:
                missing_rls.append(table)

        if missing_rls:
            for table in missing_rls:
                logger.error(f"❌ Missing RLS for table: {table}")
            return False

        # Check that RLS is enabled before policies are created
        rls_section_start = schema_content.find("-- Create Row Level Security")
        policies_start = schema_content.find("-- Basic RLS policies")

        if rls_section_start == -1 or policies_start == -1:
            logger.error("❌ Could not find RLS or policies sections")
            return False

        if policies_start < rls_section_start:
            logger.error("❌ Policies defined before RLS enablement section")
            return False

        logger.info("✅ All tables have RLS enabled and properly ordered")
        return True

    except Exception as e:
        logger.error(f"❌ RLS completeness validation error: {e}")
        return False

def main():
    """Main test function"""
    logger.info("🚀 Starting AgriCredit database schema validation")

    # Test 1: Schema syntax and RLS count
    logger.info("📄 Test 1: Validating schema syntax and RLS setup...")
    syntax_ok = test_schema_syntax()

    # Test 2: RLS completeness validation
    logger.info("🔒 Test 2: Validating RLS completeness...")
    order_ok = validate_rls_completeness()

    # Summary
    logger.info("📊 Validation Results Summary:")
    logger.info(f"   Schema Syntax & RLS: {'✅ PASS' if syntax_ok else '❌ FAIL'}")
    logger.info(f"   RLS Order: {'✅ PASS' if order_ok else '❌ FAIL'}")

    if syntax_ok and order_ok:
        logger.info("🎉 Schema validation successful! Ready for deployment.")
        logger.info("💡 Next steps:")
        logger.info("   1. Deploy schema to Supabase SQL Editor")
        logger.info("   2. Run security audit to verify no RLS warnings")
        logger.info("   3. Test with sample data")
        return 0
    else:
        logger.error("❌ Schema validation failed. Please check the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
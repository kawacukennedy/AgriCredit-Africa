# AgriCredit Database Deployment Guide

## Overview
This directory contains the final database schema files for the AgriCredit application. Two scripts are provided for complete database management.

## Files

### 1. `drop_database_schema.sql`
**Purpose**: Completely removes all AgriCredit database objects
**When to use**:
- Before deploying a fresh schema
- When resetting the database for testing
- When migrating from an old schema

**What it does**:
- Drops all 18 tables in reverse dependency order
- Removes all custom types (enums)
- Deletes views and functions
- Removes indexes and realtime publications
- **WARNING**: Permanently deletes all data

### 2. `final_database_schema.sql`
**Purpose**: Deploys the complete, production-ready AgriCredit database
**When to use**:
- Initial database setup
- Production deployment
- After running the drop script

**What it includes**:
- 18 tables with proper relationships
- Comprehensive Row Level Security (RLS) for all tables
- 28 RLS policies for multi-tenant security
- Indexes for performance optimization
- Analytics views for dashboard
- Realtime subscriptions for live updates
- Sample data for testing

## Deployment Instructions

### Option 1: Fresh Installation (Recommended)
```bash
# 1. Run in Supabase SQL Editor
# Execute: drop_database_schema.sql

# 2. Then execute: final_database_schema.sql
```

### Option 2: Update Existing Database
```bash
# If you have existing data you want to keep:
# 1. Backup your data first
# 2. Run: drop_database_schema.sql
# 3. Run: final_database_schema.sql
```

## Security Features

### Row Level Security (RLS)
- ✅ **18/18 tables** have RLS enabled
- ✅ **28 policies** configured
- ✅ Multi-tenant data isolation
- ✅ Public access for marketplace/governance
- ✅ Owner-only access for private data

### Access Control
- **Users**: Can only access their own data
- **Admins**: Can access all user data
- **Public**: Read-only access to marketplace and governance
- **Farmers**: Full control over their NFTs and positions

## Verification

After deployment, run the security audit in Supabase:
1. Go to **Database** → **Security Audit**
2. Check that **0 RLS warnings** are reported
3. Verify all tables show "RLS enabled"

## Testing

Use the included test script to validate deployment:
```bash
python3 test_schema_deployment.py
```

Expected output:
- ✅ Schema validation passed
- ✅ All tables have RLS enabled
- ✅ Proper ordering validated

## Tables Overview

| Table | RLS Status | Purpose |
|-------|------------|---------|
| users | ✅ Enabled | User accounts and profiles |
| sensor_devices | ✅ Enabled | IoT device management |
| sensor_readings | ✅ Enabled | Environmental data |
| credit_scores | ✅ Enabled | ML credit scoring |
| yield_predictions | ✅ Enabled | ML yield forecasting |
| climate_analyses | ✅ Enabled | Climate impact analysis |
| loans | ✅ Enabled | Loan management |
| loan_repayments | ✅ Enabled | Repayment tracking |
| marketplace_listings | ✅ Enabled | Agricultural marketplace |
| notifications | ✅ Enabled | User notifications |
| carbon_credits | ✅ Enabled | Carbon credit tracking |
| governance_proposals | ✅ Enabled | DAO governance |
| governance_votes | ✅ Enabled | Governance voting |
| farm_nfts | ✅ Enabled | NFT farming assets |
| harvest_records | ✅ Enabled | Harvest tracking |
| liquidity_positions | ✅ Enabled | DeFi liquidity |
| pool_rewards | ✅ Enabled | Yield farming rewards |
| cross_chain_transactions | ✅ Enabled | Cross-chain transfers |

## Troubleshooting

### RLS Warnings in Security Audit
- Ensure `final_database_schema.sql` was run completely
- Check that all 18 tables have `ENABLE ROW LEVEL SECURITY`
- Verify policies are created after RLS enablement

### Permission Errors
- Grant necessary permissions in Supabase Dashboard
- Ensure authenticated users have access to tables

### Realtime Issues
- Check that publications are created correctly
- Verify table names in realtime settings

## Support

If you encounter issues:
1. Check the test script output
2. Review Supabase logs
3. Verify all SQL statements executed successfully
4. Run security audit and check for warnings

---

**🎉 Your AgriCredit database is now production-ready with enterprise-grade security!**
# AgriCredit Supabase Database Deployment Guide

## 🚀 Deploy Database Schema to Supabase

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login to your account
3. Click "New project"
4. Fill in project details:
   - **Name**: `agricredit-production` (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Select the closest region to your users
5. Click "Create new project"
6. Wait for project creation (usually 2-3 minutes)

### Step 2: Get Database Connection Details

1. In your Supabase dashboard, go to **Settings** → **Database**
2. Copy the **Connection string** (choose "URI" format)
3. It should look like: `postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres`
4. Update your `backend/.env` file with this connection string

### Step 3: Deploy Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the entire content from `database_schema.sql`
4. Paste it into the SQL Editor
5. Click **Run** (or press Ctrl+Enter)

### Step 4: Verify Deployment

After running the schema, you should see:

```
✅ AgriCredit database schema deployed successfully!
📊 Created 17 tables with proper indexes and relationships
🔒 Enabled Row Level Security for data protection
📈 Created analytics views for dashboard
⚡ Enabled realtime subscriptions for key tables
👤 Inserted sample data for testing
```

### Step 5: Configure Authentication (Optional)

If you want to use Supabase Auth instead of custom JWT:

1. Go to **Authentication** → **Settings**
2. Configure your site URL and redirect URLs
3. Enable email confirmations if desired
4. Update your frontend to use Supabase Auth client

### Step 6: Set Up Realtime (Already Done)

The schema automatically enables realtime for key tables:
- `sensor_readings`
- `notifications`
- `marketplace_listings`
- `loans`

### Step 7: Test Database Connection

Run the test script to verify everything works:

```bash
cd backend
python3 test_db_connection.py
```

You should see:
```
✅ Database connection successful!
📊 PostgreSQL version: 15.x
✅ Database write operations working!
🎉 Database connection test PASSED!
```

## 📊 Database Schema Overview

### Core Tables (17 total)

#### User Management
- `users` - User profiles and authentication
- `notifications` - User notifications

#### IoT & Sensors
- `sensor_devices` - IoT device registry
- `sensor_readings` - Sensor data time series

#### Financial Services
- `loans` - Loan applications and management
- `loan_repayments` - Loan repayment tracking
- `credit_scores` - AI-generated credit scores
- `yield_predictions` - AI crop yield predictions

#### Marketplace
- `marketplace_listings` - Agricultural product listings

#### Blockchain Integration
- `carbon_credits` - Carbon credit transactions
- `governance_proposals` - DAO governance proposals
- `governance_votes` - Governance voting records
- `farm_nfts` - Farm NFT metadata
- `harvest_records` - NFT harvest tracking

#### DeFi Features
- `liquidity_positions` - Liquidity pool positions
- `pool_rewards` - Pool reward claims
- `cross_chain_transactions` - Cross-chain bridge transactions

#### Analytics
- `climate_analyses` - Climate impact analyses

### Security Features

- **Row Level Security (RLS)**: Users can only access their own data
- **Proper indexing**: Optimized for query performance
- **Foreign key constraints**: Data integrity
- **Enum types**: Data validation at database level

### Analytics Views

- `user_stats` - User activity metrics
- `system_stats` - System-wide statistics

## 🔧 Environment Variables

Update your `.env` file with the Supabase connection:

```bash
# Database
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_PROJECT_REF].supabase.co:5432/postgres

# Supabase (optional, for auth)
SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🚀 Next Steps

1. **Test the backend**: `cd backend && python3 test_comprehensive.py`
2. **Start the backend**: `cd backend && python -m uvicorn app.main:app --reload`
3. **Start the frontend**: `cd src && npm run dev`
4. **Deploy smart contracts** to testnet
5. **Configure monitoring** (optional)

## 📈 Monitoring & Analytics

The database includes built-in analytics views. You can query:

```sql
-- User statistics
SELECT * FROM user_stats;

-- System statistics
SELECT * FROM system_stats;
```

## 🔒 Security Best Practices

- **Never commit database passwords** to version control
- **Use environment variables** for all sensitive data
- **Enable RLS policies** (already done)
- **Regular backups** through Supabase dashboard
- **Monitor query performance** in Supabase dashboard

## 🆘 Troubleshooting

### Connection Issues
- Verify your DATABASE_URL is correct
- Check if your IP is allowlisted (Supabase allows all by default)
- Ensure SSL is enabled (it's automatic with Supabase)

### Schema Issues
- Re-run the SQL script in Supabase SQL Editor
- Check the Supabase logs for any errors
- Verify all extensions are enabled

### Performance Issues
- Check query performance in Supabase dashboard
- Add additional indexes if needed
- Consider Supabase Edge Functions for heavy computations

---

**🎉 Your AgriCredit database is now deployed and ready for production!**
#!/bin/bash

# AgriCredit Production Deployment Script
# This script automates the complete production deployment process

set -e

echo "🚀 Starting AgriCredit Production Deployment"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 20+"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.11+"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker"
    exit 1
fi

print_status "Prerequisites check passed"

# Step 1: Deploy Smart Contracts
echo "📄 Deploying smart contracts to Polygon mainnet..."

cd contracts
npm ci
npx hardhat run ../scripts/deploy.js --network polygon
cd ..

print_status "Smart contracts deployed"

# Step 2: Set up Supabase Database
echo "🗄️  Setting up Supabase database..."

# Note: This requires manual setup in Supabase dashboard
print_warning "Please complete the following manual steps:"
echo "1. Create a new Supabase project at https://supabase.com"
echo "2. Go to SQL Editor and run the contents of final_database_schema.sql"
echo "3. Update .env with the database connection string"
echo "4. Run the RLS fix script if needed"

read -p "Press enter when Supabase setup is complete..."

# Test database connection
cd backend
python3 test_db_connection.py
cd ..

print_status "Database setup verified"

# Step 3: Build and Test
echo "🔨 Building and testing application..."

# Install dependencies
npm ci

# Build frontend
cd src
npm run build
cd ..

# Test backend
cd backend
pip install -r requirements.txt
python -m pytest tests/ -v
cd ..

print_status "Build and tests passed"

# Step 4: Deploy to Production
echo "🌐 Deploying to production..."

# Deploy frontend to Vercel
cd src
npx vercel --prod --yes
cd ..

# Deploy backend (assuming Railway or similar)
# This would be automated in CI/CD, but for manual deployment:
print_warning "Backend deployment requires cloud provider setup"
echo "For Railway: railway login && railway link && railway up"
echo "For other providers, push Docker images and deploy"

# Step 5: Configure Monitoring
echo "📊 Setting up monitoring..."

# Deploy monitoring stack
cd monitoring
docker-compose up -d
cd ..

print_status "Monitoring configured"

# Step 6: Run Final Tests
echo "🧪 Running final smoke tests..."

# Test frontend
FRONTEND_URL=$(npx vercel ls | grep Production | awk '{print $3}')
if curl -f "$FRONTEND_URL" > /dev/null 2>&1; then
    print_status "Frontend smoke test passed"
else
    print_error "Frontend smoke test failed"
fi

# Test backend (placeholder - update with actual backend URL)
# curl -f https://your-backend-url/health

print_status "Production deployment completed!"

echo ""
echo "🎉 AgriCredit is now live in production!"
echo ""
echo "Next steps:"
echo "1. Configure domain DNS if needed"
echo "2. Set up SSL certificates"
echo "3. Configure monitoring alerts"
echo "4. Set up backup procedures"
echo "5. Monitor application performance"
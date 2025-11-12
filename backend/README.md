# AgriCredit Backend API

A comprehensive FastAPI-based backend service for the AgriCredit agricultural credit platform, featuring AI-powered credit scoring, yield prediction, climate analysis, and IoT sensor data management.

## 🚀 Features

### Core Features
- **User Management**: Registration, authentication, and profile management
- **IoT Sensor Integration**: Real-time sensor data collection and analysis
- **AI Models**:
  - Credit scoring with risk assessment
  - Crop yield prediction
  - Climate impact analysis and carbon sequestration
  - Advanced crop health analysis (CNN-based disease detection)
  - Market price prediction (XGBoost time series)
  - Climate risk assessment
  - Farmer sentiment analysis (NLP)
- **Marketplace**: Agricultural product listings and trading
- **Loan Management**: Loan applications and repayment tracking
- **Notification System**: Real-time alerts and updates

### Technical Features
- **Database**: SQLAlchemy with PostgreSQL/SQLite support
- **Authentication**: JWT-based authentication with role-based access
- **Caching**: Redis-based caching for performance optimization
- **Background Tasks**: Asynchronous processing for AI model training
- **API Documentation**: Auto-generated OpenAPI/Swagger docs
- **Logging**: Structured logging with monitoring
- **Error Handling**: Comprehensive error handling and validation

## 🏗️ Architecture

```
backend/
├── app/
│   ├── main.py              # FastAPI application
│   ├── database/
│   │   ├── config.py        # Database configuration
│   │   └── models.py        # SQLAlchemy models
│   ├── core/
│   │   ├── config.py        # Application settings
│   │   ├── security.py      # Authentication utilities
│   │   └── cache.py         # Redis caching
│   ├── api/
│   │   └── schemas.py       # Pydantic schemas
│   └── __init__.py
├── models/                  # AI models
│   ├── credit_scoring_model.py
│   ├── yield_prediction_model.py
│   └── climate_model.py
├── requirements.txt         # Python dependencies
├── main.py                  # Legacy entry point
└── test_enhanced_backend.py # Test script
```

## 📋 Prerequisites

- Python 3.8+
- PostgreSQL (recommended) or SQLite
- Redis (for caching)
- Virtual environment (recommended)

## 🛠️ Installation

1. **Clone the repository and navigate to backend:**
   ```bash
   cd agricredit/backend
   ```

2. **Create virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   Create a `.env` file in the backend directory:
   ```env
   DATABASE_URL=postgresql://user:password@localhost/agricredit
   SECRET_KEY=your-secret-key-here
   REDIS_URL=redis://localhost:6379
   ACCESS_TOKEN_EXPIRE_MINUTES=30

   # Optional external APIs
   WEATHER_API_KEY=your-weather-api-key
   SATELLITE_API_KEY=your-satellite-api-key
   ```

5. **Initialize database:**
   ```bash
   python3 -c "from app.database.config import engine, Base; Base.metadata.create_all(bind=engine)"
   ```

## 🚀 Running the Application

### Development
```bash
# Activate virtual environment
source venv/bin/activate

# Run with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production
```bash
# Using uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# Or using the legacy main.py
python3 main.py
```

## 📚 API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/openapi.json
- **GraphQL Playground**: http://localhost:8000/graphql
- **Health Check**: http://localhost:8000/health
- **Metrics**: http://localhost:8000/metrics

## 🔑 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Register**: `POST /auth/register`
2. **Login**: `POST /auth/login` (returns access token)
3. **Use token**: Include in header: `Authorization: Bearer <token>`

## 🎯 Key Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user info
- `PUT /auth/me` - Update user profile

### IoT Sensors
- `POST /devices` - Register sensor device
- `GET /devices` - List user devices
- `POST /sensor-data` - Submit sensor readings
- `GET /sensor-data/{device_id}` - Get sensor data

### AI Models
- `POST /ai/credit-scoring` - Credit risk assessment
- `POST /ai/yield-prediction` - Crop yield prediction
- `POST /ai/climate-analysis` - Climate impact analysis

### Advanced AI Services
- `POST /ai/crop-health-analysis` - Crop disease detection and health analysis
- `POST /ai/market-price-prediction` - Agricultural commodity price forecasting
- `POST /ai/climate-risk-assessment` - Climate risk assessment for crops
- `POST /ai/farmer-sentiment-analysis` - NLP-based sentiment analysis

### Analytics & Insights
- `GET /analytics/sensor-insights/{device_id}` - AI-powered sensor data insights

### Marketplace
- `POST /marketplace/listings` - Create product listing
- `GET /marketplace/listings` - Browse listings with advanced filtering (crop type, location, price range, quality grade) and pagination

### Loans
- `POST /loans` - Apply for loan
- `GET /loans` - View loan history

### Notifications
- `GET /notifications` - Get user notifications
- `PUT /notifications/{id}/read` - Mark as read

### Real-time Features
- `WebSocket /ws/{user_id}` - Real-time notifications and sensor alerts
- `POST /iot/process-sensor-batch` - Batch IoT sensor data processing with anomaly detection
- `POST /oracle/update-feeds` - Update oracle data feeds

### Decentralized Storage
- `POST /ipfs/upload` - Upload files to IPFS
- `GET /ipfs/{cid}` - Retrieve IPFS content

### Blockchain Integration
- `GET /blockchain/status` - Blockchain connection status
- `POST /blockchain/identity/create` - Create decentralized identity
- `POST /blockchain/loans` - Create blockchain-based loans
- `POST /blockchain/carbon/mint` - Mint carbon credit tokens
- `POST /blockchain/governance/propose` - Create governance proposals
- `POST /blockchain/nft/farm/mint` - Mint farm NFTs
- `POST /blockchain/pool/create` - Create liquidity pools
- `POST /blockchain/bridge/transfer` - Cross-chain token transfers

### Decentralized Storage
- `POST /ipfs/upload` - Upload files to IPFS
- `GET /ipfs/{cid}` - Retrieve IPFS content

### GraphQL API
- `POST /graphql` - GraphQL endpoint for flexible queries and mutations
  - User management and profiles
  - Sensor data and analytics
  - Marketplace operations
  - Loan and credit information

## 🧪 Testing

Run the test suite:
```bash
python3 test_enhanced_backend.py
```

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///./agricredit.db` | Database connection string |
| `SECRET_KEY` | `your-secret-key-here` | JWT signing key |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | JWT token expiration |
| `WEATHER_API_KEY` | `` | External weather API key |
| `SATELLITE_API_KEY` | `` | Satellite imagery API key |

### Database Migration

For production deployments, use Alembic for database migrations:

```bash
# Initialize Alembic
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Initial migration"

# Apply migration
alembic upgrade head
```

## 🚀 Deployment

### Docker

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db/agricredit
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=agricredit
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass

  redis:
    image: redis:7-alpine
```

## 📊 Monitoring

The application includes:
- **Structured Logging**: JSON-formatted logs with context
- **Health Checks**: `GET /health` endpoint
- **Metrics**: Request/response monitoring
- **Error Tracking**: Comprehensive error handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the API documentation at `/docs`
- Review the logs for error details
- Create an issue in the repository

---

**AgriCredit Backend v2.0** - Empowering African farmers with AI-driven agricultural finance.
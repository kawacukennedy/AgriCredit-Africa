import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database.config import Base, get_db
from app.database.models import User
from app.core.security import get_password_hash
from app.core.config import settings

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(scope="function")
def test_db():
    """Create a fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture
def test_user(test_db):
    """Create a test user"""
    user = User(
        email="test@example.com",
        username="testuser",
        hashed_password=get_password_hash("testpass123"),
        full_name="Test User",
        phone="+1234567890",
        location="Test Location",
        farm_size=5.0
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user

class TestAuthentication:
    """Test authentication endpoints"""

    def test_register_user_success(self):
        """Test successful user registration"""
        user_data = {
            "email": "newuser@example.com",
            "username": "newuser",
            "password": "securepass123",
            "full_name": "New User",
            "phone": "+1234567890",
            "location": "Test Farm",
            "farm_size": 10.0
        }

        response = client.post("/auth/register", json=user_data)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == user_data["email"]
        assert data["username"] == user_data["username"]
        assert "id" in data

    def test_register_duplicate_email(self):
        """Test registration with duplicate email"""
        user_data = {
            "email": "duplicate@example.com",
            "username": "user1",
            "password": "pass123",
            "full_name": "User One"
        }

        # First registration
        response1 = client.post("/auth/register", json=user_data)
        assert response1.status_code == 200

        # Duplicate registration
        user_data["username"] = "user2"
        response2 = client.post("/auth/register", json=user_data)
        assert response2.status_code == 400
        assert "already registered" in response2.json()["detail"]

    def test_login_success(self, test_user):
        """Test successful login"""
        login_data = {
            "username": "testuser",
            "password": "testpass123"
        }

        response = client.post("/auth/login", data=login_data)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        login_data = {
            "username": "nonexistent",
            "password": "wrongpass"
        }

        response = client.post("/auth/login", data=login_data)
        assert response.status_code == 401
        assert "Incorrect username or password" in response.json()["detail"]

class TestUserManagement:
    """Test user management endpoints"""

    def test_get_current_user(self, test_user):
        """Test getting current user info"""
        # First login to get token
        login_data = {"username": "testuser", "password": "testpass123"}
        login_response = client.post("/auth/login", data=login_data)
        token = login_response.json()["access_token"]

        # Get user info
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/auth/me", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "testuser"
        assert data["email"] == "test@example.com"

    def test_update_current_user(self, test_user):
        """Test updating current user info"""
        # Login first
        login_data = {"username": "testuser", "password": "testpass123"}
        login_response = client.post("/auth/login", data=login_data)
        token = login_response.json()["access_token"]

        # Update user
        update_data = {
            "full_name": "Updated Name",
            "phone": "+0987654321"
        }
        headers = {"Authorization": f"Bearer {token}"}
        response = client.put("/auth/me", json=update_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["full_name"] == "Updated Name"
        assert data["phone"] == "+0987654321"

class TestSensorManagement:
    """Test sensor device management"""

    def test_register_device(self, test_user):
        """Test registering a new sensor device"""
        # Login first
        login_data = {"username": "testuser", "password": "testpass123"}
        login_response = client.post("/auth/login", data=login_data)
        token = login_response.json()["access_token"]

        device_data = {
            "device_id": "TEST001",
            "name": "Test Sensor",
            "location": "Field A",
            "latitude": -1.2864,
            "longitude": 36.8172,
            "crop_type": "Maize",
            "farm_size": 5.0
        }

        headers = {"Authorization": f"Bearer {token}"}
        response = client.post("/devices", json=device_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["device_id"] == "TEST001"
        assert data["owner_id"] == test_user.id

    def test_get_user_devices(self, test_user):
        """Test getting user's devices"""
        # Login and register a device first
        login_data = {"username": "testuser", "password": "testpass123"}
        login_response = client.post("/auth/login", data=login_data)
        token = login_response.json()["access_token"]

        device_data = {
            "device_id": "TEST002",
            "name": "Test Sensor 2",
            "crop_type": "Wheat"
        }

        headers = {"Authorization": f"Bearer {token}"}
        client.post("/devices", json=device_data, headers=headers)

        # Get devices
        response = client.get("/devices", headers=headers)
        assert response.status_code == 200
        devices = response.json()
        assert len(devices) >= 1
        assert any(d["device_id"] == "TEST002" for d in devices)

class TestAIModels:
    """Test AI model endpoints"""

    def test_credit_scoring(self, test_user):
        """Test credit scoring endpoint"""
        # Login first
        login_data = {"username": "testuser", "password": "testpass123"}
        login_response = client.post("/auth/login", data=login_data)
        token = login_response.json()["access_token"]

        credit_data = {
            "crop_type": "Maize",
            "farm_size": 5.0,
            "location": "Nairobi",
            "historical_data": {
                "repayment_rate": 0.95,
                "satellite_ndvi": 0.75,
                "weather_risk": 0.2
            },
            "mobile_money_usage": 15.0,
            "cooperative_membership": True
        }

        headers = {"Authorization": f"Bearer {token}"}
        response = client.post("/ai/credit-scoring", json=credit_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "data" in data
        assert "credit_score" in data["data"]
        assert "risk_level" in data["data"]

    def test_yield_prediction(self, test_user):
        """Test yield prediction endpoint"""
        # Login first
        login_data = {"username": "testuser", "password": "testpass123"}
        login_response = client.post("/auth/login", data=login_data)
        token = login_response.json()["access_token"]

        yield_data = {
            "crop_type": "Maize",
            "farm_size": 5.0,
            "location": "Nairobi",
            "weather_data": {
                "rainfall": 800.0,
                "temperature": 25.0,
                "fertilizer_usage": 2.0,
                "pest_control": True
            },
            "soil_quality": 0.8,
            "irrigation_access": True
        }

        headers = {"Authorization": f"Bearer {token}"}
        response = client.post("/ai/yield-prediction", json=yield_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "data" in data
        assert "predicted_yield" in data["data"]

    def test_climate_analysis(self, test_user):
        """Test climate analysis endpoint"""
        # Login first
        login_data = {"username": "testuser", "password": "testpass123"}
        login_response = client.post("/auth/login", data=login_data)
        token = login_response.json()["access_token"]

        climate_data = {
            "satellite_data": {
                "ndvi": 0.72,
                "temperature": 24.5,
                "precipitation": 850.0,
                "land_use": "agricultural"
            },
            "iot_sensors": {
                "soil_moisture": 65.0,
                "humidity": 70.0
            }
        }

        headers = {"Authorization": f"Bearer {token}"}
        response = client.post("/ai/climate-analysis", json=climate_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "data" in data
        assert "co2_sequestered" in data["data"]

class TestHealthCheck:
    """Test health check endpoint"""

    def test_health_check(self):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert data["service"] == "AgriCredit AI"
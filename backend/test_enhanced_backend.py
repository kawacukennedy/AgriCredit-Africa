#!/usr/bin/env python3
"""
Test script for the enhanced AgriCredit backend
"""

import sys
import os

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

def test_imports():
    """Test that all enhanced backend modules can be imported"""
    try:
        # Test database imports
        from app.database.config import get_db, engine, Base
        from app.database.models import User, SensorDevice, SensorReading
        print("✓ Database imports successful")

        # Test core imports
        from app.core.config import settings
        from app.core.security import verify_password, get_password_hash
        print("✓ Core imports successful")

        # Test API imports
        from app.api.schemas import UserCreate, SensorReadingCreate
        print("✓ API schemas imports successful")

        # Test AI models
        from models.credit_scoring_model import CreditScoringModel
        from models.yield_prediction_model import YieldPredictionModel
        from models.climate_model import ClimateAnalysisModel
        print("✓ AI models imports successful")

        return True
    except ImportError as e:
        print(f"✗ Import error: {e}")
        return False

def test_database_creation():
    """Test database table creation"""
    try:
        from app.database.config import engine, Base
        from app.database.models import User, SensorDevice, SensorReading

        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✓ Database tables created successfully")
        return True
    except Exception as e:
        print(f"✗ Database creation error: {e}")
        return False

def test_ai_models():
    """Test AI model initialization"""
    try:
        from models.credit_scoring_model import CreditScoringModel
        from models.yield_prediction_model import YieldPredictionModel
        from models.climate_model import ClimateAnalysisModel

        # Initialize models
        credit_model = CreditScoringModel()
        yield_model = YieldPredictionModel()
        climate_model = ClimateAnalysisModel()

        # Test basic functionality
        sample_features = [5.0, 0.9, 10.0, 0.7, 0.8, 1.0, 3.0, 0.85, 0.9, 4.0]
        result = credit_model.predict(sample_features)
        print(f"✓ Credit scoring model working: Score {result['credit_score']}")

        sample_yield_features = [5.0, 0.8, 900.0, 24.0, 2.0, 1.0, 3.0, 15.0, 1.0, 0.5]
        yield_result = yield_model.predict(sample_yield_features)
        print(f"✓ Yield prediction model working: {yield_result['predicted_yield']} tons/hectare")

        sample_satellite = {'ndvi': 0.72, 'temperature': 24.5, 'precipitation': 850.0}
        climate_result = climate_model.analyze_climate_impact(sample_satellite, {})
        print(f"✓ Climate analysis model working: {climate_result['co2_sequestered']} tons CO2")

        return True
    except Exception as e:
        print(f"✗ AI model error: {e}")
        return False

def main():
    """Run all tests"""
    print("Testing Enhanced AgriCredit Backend")
    print("=" * 40)

    tests = [
        ("Module Imports", test_imports),
        ("Database Creation", test_database_creation),
        ("AI Models", test_ai_models),
    ]

    passed = 0
    total = len(tests)

    for test_name, test_func in tests:
        print(f"\nRunning {test_name}...")
        if test_func():
            passed += 1
        else:
            print(f"Failed: {test_name}")

    print("\n" + "=" * 40)
    print(f"Results: {passed}/{total} tests passed")

    if passed == total:
        print("🎉 All tests passed! Enhanced backend is ready.")
        return 0
    else:
        print("❌ Some tests failed. Please check the errors above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
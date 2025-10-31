#!/usr/bin/env python3
"""
Test script to verify Supabase PostgreSQL database connection
"""

import os
import sys

# Load environment variables from .env file
env_file = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_file):
    with open(env_file, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip()

def test_database_connection():
    """Test the database connection using the provided Supabase URL"""

    # Get database URL from environment
    database_url = os.getenv('DATABASE_URL')

    if not database_url:
        print("❌ DATABASE_URL environment variable not found")
        return False

    print(f"🔍 Testing connection to: {database_url.split('@')[1].split('/')[0]}")

    try:
        # Import here to avoid issues if SQLAlchemy is not installed
        from sqlalchemy import create_engine, text
        from sqlalchemy.exc import SQLAlchemyError

        # Create engine
        engine = create_engine(database_url, echo=False)

        # Test connection
        with engine.connect() as connection:
            result = connection.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            print("✅ Database connection successful!")
            print(f"📊 PostgreSQL version: {version.split(' ')[1]}")

            # Test if we can create tables (basic test)
            connection.execute(text("CREATE TABLE IF NOT EXISTS connection_test (id SERIAL PRIMARY KEY, test_column TEXT)"))
            connection.execute(text("INSERT INTO connection_test (test_column) VALUES ('Connection test successful')"))
            connection.execute(text("DROP TABLE connection_test"))
            connection.commit()

            print("✅ Database write operations working!")
            return True

    except ImportError:
        print("❌ SQLAlchemy not installed. Install with: pip install sqlalchemy psycopg2-binary")
        return False
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("🧪 Testing AgriCredit Database Connection")
    print("=" * 50)

    success = test_database_connection()

    if success:
        print("\n🎉 Database connection test PASSED!")
        print("✅ Ready to deploy AgriCredit backend with Supabase")
        sys.exit(0)
    else:
        print("\n💥 Database connection test FAILED!")
        print("❌ Please check your DATABASE_URL and Supabase configuration")
        sys.exit(1)
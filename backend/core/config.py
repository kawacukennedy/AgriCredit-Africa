import os
from typing import List
from pydantic import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost/agricredit"

    # JWT
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "https://agri-credit-africa.vercel.app",
        "https://agricredit-backend.vercel.app"
    ]
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1", "agri-credit-africa.vercel.app", "agricredit-backend.vercel.app"]

    # Environment variable override for CORS (for production deployment)
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "")
    CORS_HOSTS: str = os.getenv("CORS_HOSTS", "")

    # Email
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@agricredit.africa"

    # IPFS
    IPFS_API_URL: str = "http://localhost:5001"

    # Blockchain
    WEB3_PROVIDER_URL: str = "http://localhost:8545"
    CHAIN_ID: int = 1337  # Ganache default

    # AI/ML
    MODEL_CACHE_DIR: str = "./models"
    AI_SERVICE_URL: str = "http://localhost:8001"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # Monitoring
    PROMETHEUS_PORT: int = 9090
    GRAFANA_URL: str = "http://localhost:3001"

    # Security
    ENCRYPTION_KEY: str = "your-32-byte-encryption-key-here"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
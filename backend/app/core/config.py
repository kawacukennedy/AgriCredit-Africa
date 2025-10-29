from decouple import config
from typing import List

class Settings:
    # Database
    DATABASE_URL: str = config("DATABASE_URL", default="sqlite:///./agricredit.db")

    # Security
    SECRET_KEY: str = config("SECRET_KEY", default="your-secret-key-here")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # External APIs
    WEATHER_API_KEY: str = config("WEATHER_API_KEY", default="")
    SATELLITE_API_KEY: str = config("SATELLITE_API_KEY", default="")

    # Redis
    REDIS_URL: str = config("REDIS_URL", default="redis://localhost:6379")

    # CORS
    ALLOWED_ORIGINS: List[str] = config(
        "ALLOWED_ORIGINS",
        default="http://localhost:3000,http://127.0.0.1:3000",
        cast=lambda v: [s.strip() for s in v.split(",")]
    )

    # Email
    SMTP_SERVER: str = config("SMTP_SERVER", default="")
    SMTP_PORT: int = config("SMTP_PORT", default=587, cast=int)
    SMTP_USERNAME: str = config("SMTP_USERNAME", default="")
    SMTP_PASSWORD: str = config("SMTP_PASSWORD", default="")

    # File uploads
    MAX_UPLOAD_SIZE: int = config("MAX_UPLOAD_SIZE", default=10 * 1024 * 1024, cast=int)  # 10MB

    # AI Models
    MODEL_CACHE_DIR: str = config("MODEL_CACHE_DIR", default="./models")

    # Logging
    LOG_LEVEL: str = config("LOG_LEVEL", default="INFO")

settings = Settings()
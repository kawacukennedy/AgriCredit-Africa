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
    CHAINLINK_API_KEY: str = config("CHAINLINK_API_KEY", default="")
    IPFS_API_URL: str = config("IPFS_API_URL", default="http://localhost:5001")

    # Redis
    REDIS_URL: str = config("REDIS_URL", default="redis://localhost:6379")

    # Message Queue
    RABBITMQ_URL: str = config("RABBITMQ_URL", default="amqp://guest:guest@localhost:5672/")

    # CORS
    ALLOWED_ORIGINS: List[str] = config(
        "ALLOWED_ORIGINS",
        default="http://localhost:3000,http://127.0.0.1:3000",
        cast=lambda v: [s.strip() for s in v.split(",")]
    )

    # Trusted hosts
    ALLOWED_HOSTS: List[str] = config(
        "ALLOWED_HOSTS",
        default="localhost,127.0.0.1",
        cast=lambda v: [s.strip() for s in v.split(",")]
    )

    # Email
    SMTP_SERVER: str = config("SMTP_SERVER", default="")
    SMTP_PORT: int = config("SMTP_PORT", default=587, cast=int)
    SMTP_USERNAME: str = config("SMTP_USERNAME", default="")
    SMTP_PASSWORD: str = config("SMTP_PASSWORD", default="")
    EMAIL_FROM: str = config("EMAIL_FROM", default="noreply@agricredit.africa")

    # File uploads
    MAX_UPLOAD_SIZE: int = config("MAX_UPLOAD_SIZE", default=10 * 1024 * 1024, cast=int)  # 10MB
    UPLOAD_DIR: str = config("UPLOAD_DIR", default="./uploads")

    # AI Models
    MODEL_CACHE_DIR: str = config("MODEL_CACHE_DIR", default="./models")

    # Blockchain
    BLOCKCHAIN_RPC_URL: str = config("BLOCKCHAIN_RPC_URL", default="http://localhost:8545")
    BLOCKCHAIN_PRIVATE_KEY: str = config("BLOCKCHAIN_PRIVATE_KEY", default="")
    CHAIN_ID: int = config("CHAIN_ID", default=1337, cast=int)  # Local development default

    # Contract Addresses
    IDENTITY_REGISTRY_ADDRESS: str = config("IDENTITY_REGISTRY_ADDRESS", default="")
    LOAN_MANAGER_ADDRESS: str = config("LOAN_MANAGER_ADDRESS", default="")
    MARKETPLACE_ESCROW_ADDRESS: str = config("MARKETPLACE_ESCROW_ADDRESS", default="")
    GOVERNANCE_DAO_ADDRESS: str = config("GOVERNANCE_DAO_ADDRESS", default="")
    CARBON_TOKEN_ADDRESS: str = config("CARBON_TOKEN_ADDRESS", default="")
    LIQUIDITY_POOL_ADDRESS: str = config("LIQUIDITY_POOL_ADDRESS", default="")
    YIELD_TOKEN_ADDRESS: str = config("YIELD_TOKEN_ADDRESS", default="")
    NFT_FARMING_ADDRESS: str = config("NFT_FARMING_ADDRESS", default="")
    AGRI_CREDIT_ADDRESS: str = config("AGRI_CREDIT_ADDRESS", default="")

    # Oracle Settings
    CHAINLINK_PRICE_FEEDS: Dict[str, str] = {
        'ETH/USD': '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',  # Mainnet
        'BTC/USD': '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c',  # Mainnet
        'MATIC/USD': '0xAB594600376Ec9fD91F8e885dADF0CE036862dE0',  # Mainnet
    }

    # Gas Settings
    GAS_LIMIT_MULTIPLIER: float = config("GAS_LIMIT_MULTIPLIER", default=1.1, cast=float)
    MAX_GAS_PRICE: int = config("MAX_GAS_PRICE", default=500000000000, cast=int)  # 500 gwei
    TENSORFLOW_SERVING_URL: str = config("TENSORFLOW_SERVING_URL", default="http://localhost:8501")

    # Blockchain
    WEB3_PROVIDER_URL: str = config("WEB3_PROVIDER_URL", default="http://localhost:8545")
    CONTRACT_ADDRESSES: dict = {
        "IdentityRegistry": config("IDENTITY_REGISTRY_ADDRESS", default=""),
        "LoanManager": config("LOAN_MANAGER_ADDRESS", default=""),
        "CarbonToken": config("CARBON_TOKEN_ADDRESS", default=""),
        "GovernanceDAO": config("GOVERNANCE_DAO_ADDRESS", default=""),
        "LiquidityPool": config("LIQUIDITY_POOL_ADDRESS", default=""),
        "MarketplaceEscrow": config("MARKETPLACE_ESCROW_ADDRESS", default=""),
        "NFTFarming": config("NFT_FARMING_ADDRESS", default=""),
        "YieldToken": config("YIELD_TOKEN_ADDRESS", default=""),
        "AgriCredit": config("AGRI_CREDIT_ADDRESS", default="")
    }

    # Monitoring
    PROMETHEUS_PORT: int = config("PROMETHEUS_PORT", default=8001, cast=int)
    SENTRY_DSN: str = config("SENTRY_DSN", default="")

    # Logging
    LOG_LEVEL: str = config("LOG_LEVEL", default="INFO")

    # Background Tasks
    CELERY_BROKER_URL: str = config("CELERY_BROKER_URL", default="redis://localhost:6379/0")
    CELERY_RESULT_BACKEND: str = config("CELERY_RESULT_BACKEND", default="redis://localhost:6379/0")

settings = Settings()
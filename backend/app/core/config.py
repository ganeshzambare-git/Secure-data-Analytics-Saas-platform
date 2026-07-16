import os
from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env")

    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:readynest_secure_db_pass@db:5432/readynest")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://redis:6379/0")

    # AES-256-GCM Key (must be exactly 32 bytes)
    AES_SECRET_KEY: str = os.getenv("AES_SECRET_KEY", "y3K9xP2wL4mN7qR1sT8uV5wX0zA3bC6d")

    # JWT Secrets
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super_secret_jwt_key_for_readynest")
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

settings = Settings()

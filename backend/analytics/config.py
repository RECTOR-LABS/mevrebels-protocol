"""
Configuration management for Analytics Service
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings"""

    # Server
    host: str = "0.0.0.0"
    port: int = 3004

    # Database
    database_url: str

    # Redis
    redis_url: str

    # Solana
    helius_devnet_rpc: str
    helius_webhook_secret: str = ""

    # Program IDs
    strategy_registry_program_id: str
    execution_engine_program_id: str
    dao_governance_program_id: str
    flash_loan_program_id: str

    # Indexing
    polling_interval_seconds: int = 5
    batch_size: int = 100

    # Logging
    log_level: str = "INFO"

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()

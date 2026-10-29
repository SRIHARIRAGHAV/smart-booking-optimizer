import os
from dataclasses import dataclass

@dataclass
class Settings:
    APP_NAME: str = "Smart Booking Optimizer"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    MAX_RECOVERY_RETRIES: int = int(os.getenv("MAX_RECOVERY_RETRIES", "3"))
    MAX_EXECUTION_STEPS: int = int(os.getenv("MAX_EXECUTION_STEPS", "25"))
    DEFAULT_CURRENCY: str = "INR"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

settings = Settings()

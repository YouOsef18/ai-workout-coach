import os
from dotenv import load_dotenv

load_dotenv()  # Один раз в приложении

class Config:
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY не установлен в .env")
    
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///workout_app.db")
    DEBUG = os.getenv("DEBUG", "False").lower() == "true"

config = Config()
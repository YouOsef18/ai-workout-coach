from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import logging
import os

import database
from routes import strength, cardio, calendar

# Логирование
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Инициализация и завершение приложения"""
    # Инициализируем БД при старте
    logger.info("Initializing database...")
    await database.init_db()
    yield
    logger.info("Application shutdown")

app = FastAPI(
    title="AI Workout Coach",
    description="Telegram Mini App для отслеживания тренировок",
    lifespan=lifespan
)

# Подключаем маршруты
app.include_router(strength.router)
app.include_router(cardio.router)
app.include_router(calendar.router)

# Раздача статики
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend"))
app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")

@app.get("/health")
async def health_check():
    """Health check для мониторинга"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
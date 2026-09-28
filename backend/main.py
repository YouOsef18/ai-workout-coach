from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import database
from cardio_routes import router as all_workouts_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Создание таблиц при запуске сервера
    await database.init_db()
    yield

app = FastAPI(lifespan=lifespan)

# Подключение всех маршрутов (силовые, кардио, календарь)
app.include_router(all_workouts_router)

# Раздача статики должна быть в самом конце,
# чтобы она не перехватывала запросы к API
app.mount("/", StaticFiles(directory="../frontend", html=True), name="frontend")
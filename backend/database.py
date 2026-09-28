import aiosqlite
import json

DB_NAME = "workout_app.db"

async def init_db():
    async with aiosqlite.connect(DB_NAME) as db:
        # Таблица кардио
        await db.execute("""
            CREATE TABLE IF NOT EXISTS cardio_workouts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                subtype TEXT NOT NULL,
                distance_km REAL NOT NULL,
                duration_sec INTEGER NOT NULL,
                avg_pace TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await db.execute("CREATE INDEX IF NOT EXISTS idx_cardio_date ON cardio_workouts(date)")

        # Таблица силовых
        await db.execute("""
            CREATE TABLE IF NOT EXISTS strength_workouts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                date TEXT NOT NULL,
                workout_data TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await db.execute("CREATE INDEX IF NOT EXISTS idx_strength_date ON strength_workouts(date)")
        await db.commit()

# --- Методы Кардио ---
async def add_cardio_workout(data: dict) -> int:
    async with aiosqlite.connect(DB_NAME) as db:
        cursor = await db.execute("""
            INSERT INTO cardio_workouts (date, subtype, distance_km, duration_sec, avg_pace)
            VALUES (?, ?, ?, ?, ?)
        """, (data["date"], data["subtype"], data["distance_km"], data["duration_sec"], data["avg_pace"]))
        await db.commit()
        return cursor.lastrowid

# --- Методы Силовых ---
async def save_strength_workout(user_id: int, date: str, workout_data: dict):
    async with aiosqlite.connect(DB_NAME) as db:
        await db.execute("DELETE FROM strength_workouts WHERE user_id = ? AND date = ?", (user_id, date))
        await db.execute("""
            INSERT INTO strength_workouts (user_id, date, workout_data)
            VALUES (?, ?, ?)
        """, (user_id, date, json.dumps(workout_data)))
        await db.commit()

async def get_strength_workout(user_id: int, date: str):
    async with aiosqlite.connect(DB_NAME) as db:
        async with db.execute("SELECT workout_data FROM strength_workouts WHERE user_id = ? AND date = ?", (user_id, date)) as cursor:
            row = await cursor.fetchone()
            if row:
                return json.loads(row[0])
            return None

async def delete_strength_workout(user_id: int, date: str):
    async with aiosqlite.connect(DB_NAME) as db:
        # Удаляем силовую тренировку
        await db.execute("DELETE FROM strength_workouts WHERE user_id = ? AND date = ?", (user_id, date))
        # Удаляем кардио-тренировку (там нет user_id, поэтому удаляем просто по дате)
        await db.execute("DELETE FROM cardio_workouts WHERE date = ?", (date,))
        await db.commit()

# --- Метод Календаря ---
async def get_month_markers(year_month: str):
    async with aiosqlite.connect(DB_NAME) as db:
        async with db.execute("SELECT DISTINCT date FROM cardio_workouts WHERE date LIKE ?", (f"{year_month}%",)) as cursor:
            cardio_dates = {row[0] for row in await cursor.fetchall()}

        async with db.execute("SELECT DISTINCT date FROM strength_workouts WHERE date LIKE ?", (f"{year_month}%",)) as cursor:
            strength_dates = {row[0] for row in await cursor.fetchall()}

        all_dates = cardio_dates | strength_dates
        result = []
        for date_str in sorted(all_dates):
            result.append({
                "date": date_str,
                "has_strength": date_str in strength_dates,
                "has_cardio": date_str in cardio_dates
            })
        return result
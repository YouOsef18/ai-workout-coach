import os
import json
from fastapi import APIRouter, HTTPException, Query
from dotenv import load_dotenv
from google import genai
from google.genai import types
from schemas import (
    CardioWorkoutCreate, CardioWorkoutResponse, CalendarDayStatus,
    WorkoutAnalyzeRequest
)
import database

router = APIRouter(tags=["Workouts"])

# Принудительно загружаем переменные из файла .env
load_dotenv()
# Теперь os.getenv точно найдет ключ, а не выдаст None
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# --- РОУТЫ КАРДИО ---
@router.post("/api/workouts/cardio", response_model=CardioWorkoutResponse)
async def create_cardio_entry(payload: CardioWorkoutCreate):
    try:
        new_id = await database.add_cardio_workout(payload.model_dump())
        return {"id": new_id, **payload.model_dump()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

# --- РОУТ КАЛЕНДАРЯ ---
@router.get("/api/workouts/calendar/month-status", response_model=list[CalendarDayStatus])
async def get_calendar_markers(year_month: str = Query(..., pattern=r"^\d{4}-\d{2}$")):
    try:
        return await database.get_month_markers(year_month)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch markers: {str(e)}")

# --- РОУТЫ СИЛОВЫХ ---
@router.post("/api/workout/analyze")
async def analyze_workout_endpoint(payload: WorkoutAnalyzeRequest):
    try:
        exercises_dump = [ex.model_dump() for ex in payload.exercises]
        
        # Формируем строгий промпт с упором на заметки и самочувствие
        prompt = f"""
Ты — профессиональный AI-тренер по силовой подготовке и реабилитации.
Проанализируй выполненную тренировку атлета и составь план на следующую похожую тренировку.

ДАННЫЕ ТРЕНИРОВКИ:
- Название/тип: {payload.workout_name}
- Выполненные упражнения и сеты: {json.dumps(exercises_dump, ensure_ascii=False)}
- Заметки атлета о самочувствии/боли: "{payload.athlete_notes if payload.athlete_notes else 'Заметок нет'}"

КРИТИЧЕСКИ ВАЖНЫЕ ПРАВИЛА:
1. Заметки атлета о боли, дискомфорте в суставах/связках или плохом самочувствии имеют АБСОЛЮТНЫЙ ПРИОРИТЕТ.
2. Если атлет пожаловался на боль (например, плечо, поясница, колени):
   - В поле "coach_notes" обязательно разбери эту проблему, посоветуй снизить интенсивность или технику контроля.
   - В поле "next_workout" СТРОГО ЗАПРЕЩЕНО повышать вес на эту мышечную группу! Предложи облегченный вес, больше повторов или более безопасную вариацию движения.
3. Ответ верни СТРОГО в формате валидного JSON без markdown-разметки (без ```json).

Схема ответа:
{{
  "coach_notes": "Текст разбора тренировки тренером",
  "next_workout": [
    {{"exercise": "Название упражнения", "sets": 3, "weight_kg": 20.0, "cue": "Короткий фокус/акцент на технику"}}
  ]
}}
"""

        # Вызов модели с фоллбеком (сначала пробуем gemini-3.8-flash, при перегрузке/ошибке — gemini-2.5-flash-lite)
        try:
            response = client.models.generate_content(
                model="gemini-3.8-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
        except Exception as primary_err:
            # Проверяем, стоит ли переключиться на запасную модель (например, перегрузка 429/503 или любая ошибка генерации)
            response = client.models.generate_content(
                model="gemini-3.5-flash-lite",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
        
        # Парсим ответ нейросети
        ai_data = json.loads(response.text)
        coach_notes = ai_data.get("coach_notes", "Тренировка успешно сохранена.")
        next_workout = ai_data.get("next_workout", [])

        workout_data = {
            "workout_name": payload.workout_name,
            "exercises": exercises_dump,
            "athlete_notes": payload.athlete_notes,
            "coach_notes": coach_notes,
            "next_workout": next_workout
        }
        
        await database.save_strength_workout(str(payload.user_id), payload.workout_date, workout_data)
        
        return {
            "status": "success",
            "workout": workout_data
        }
    except Exception as e:
        raise HTTPException(sыtatus_code=500, detail=f"Analysis failed: {str(e)}")

@router.get("/api/workout/by-date")
async def get_workout_by_date(user_id: str, workout_date: str):
    try:
        workout = await database.get_strength_workout(str(user_id), workout_date)
        if workout:
            return {"found": True, "workout": workout}
        return {"found": False}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/api/workout")
async def delete_workout_endpoint(user_id: str, workout_date: str):
    try:
        await database.delete_strength_workout(str(user_id), workout_date)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
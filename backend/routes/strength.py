from fastapi import APIRouter, HTTPException
from schemas import WorkoutAnalyzeRequest
from services.workout_service import workout_analyzer
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/strength", tags=["Strength Workouts"])

@router.post("/analyze")
async def analyze_strength_workout(payload: WorkoutAnalyzeRequest):
    """Анализирует и сохраняет силовую тренировку"""
    try:
        result = await workout_analyzer.analyze_and_save(
            payload.user_id,
            payload.workout_date,
            payload.workout_name,
            payload.exercises,
            payload.athlete_notes
        )
        return result
    
    except Exception as e:
        logger.error(f"Error analyzing workout: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.get("/by-date")
async def get_workout_by_date(user_id: str, workout_date: str):
    """Получает сохранённую тренировку"""
    try:
        from database import get_strength_workout
        workout = await get_strength_workout(str(user_id), workout_date)
        if workout:
            return {"found": True, "workout": workout}
        return {"found": False}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("")
async def delete_workout(user_id: str, workout_date: str):
    """Удаляет тренировку"""
    try:
        from database import delete_strength_workout
        await delete_strength_workout(str(user_id), workout_date)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
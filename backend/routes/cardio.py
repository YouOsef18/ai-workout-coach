from fastapi import APIRouter, HTTPException
from schemas import CardioWorkoutCreate, CardioWorkoutResponse
from database import add_cardio_workout
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/cardio", tags=["Cardio Workouts"])

@router.post("", response_model=CardioWorkoutResponse)
async def create_cardio_entry(payload: CardioWorkoutCreate):
    """Сохраняет кардио тренировку"""
    try:
        new_id = await add_cardio_workout(payload.model_dump())
        return {"id": new_id, **payload.model_dump()}
    except Exception as e:
        logger.error(f"Error creating cardio workout: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save: {str(e)}")
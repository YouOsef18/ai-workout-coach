from fastapi import APIRouter, HTTPException, Query
from schemas import CalendarDayStatus
from database import get_month_markers
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/calendar", tags=["Calendar"])

@router.get("/month-status", response_model=list[CalendarDayStatus])
async def get_calendar_markers(year_month: str = Query(..., pattern=r"^\d{4}-\d{2}$"), user_id: int = Query(...) ):
    """Получает маркеры календаря (точки тренировок)"""
    try:
        return await get_month_markers(year_month)
    except Exception as e:
        logger.error(f"Error fetching calendar markers: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch markers: {str(e)}")
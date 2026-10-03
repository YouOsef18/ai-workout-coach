from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

class WorkoutType(str, Enum):
    STRENGTH = "strength"
    CARDIO = "cardio"

class CardioSubtype(str, Enum):
    EASY_RUN = "easy_run"
    INTERVALS = "intervals"
    LONG_RUN = "long_run"

# --- Схемы Кардио ---
class CardioWorkoutCreate(BaseModel):
    user_id: int
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    workout_type: WorkoutType = Field(default=WorkoutType.CARDIO)
    subtype: CardioSubtype
    distance_km: float = Field(..., gt=0)
    duration_sec: int = Field(..., gt=0)
    avg_pace: str = Field(..., pattern=r"^\d{1,2}:\d{2}$")

class CardioWorkoutResponse(CardioWorkoutCreate):
    id: int

class CalendarDayStatus(BaseModel):
    date: str
    has_strength: bool = False
    has_cardio: bool = False

# --- Схемы Силовых тренировок ---
class SetItem(BaseModel):
    weight: float
    reps: int
    rpe: float

class ExerciseItem(BaseModel):
    name: str
    sets: List[SetItem]

class WorkoutAnalyzeRequest(BaseModel):
    user_id: int
    workout_date: str
    workout_name: str
    exercises: List[ExerciseItem]
    athlete_notes: Optional[str] = "Все прошло штатно."
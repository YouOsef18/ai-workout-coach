import json
from services.gemini_service import gemini_service
import database

class WorkoutAnalyzer:
    """Бизнес-логика анализа тренировок"""
    
    @staticmethod
    def build_strength_prompt(exercises, workout_name, athlete_notes) -> str:
        """Формирует промпт для AI тренера"""
        exercises_json = json.dumps(exercises, ensure_ascii=False)
        
        prompt = f"""
Ты — профессиональный AI-тренер по силовой подготовке и реабилитации.
Проанализируй выполненную тренировку атлета и составь план на следующую похожую тренировку.

ДАННЫЕ ТРЕНИРОВКИ:
- Название/тип: {workout_name}
- Выполненные упражнения и сеты: {exercises_json}
- Заметки атлета о самочувствии/боли: "{athlete_notes if athlete_notes else 'Заметок нет'}"

КРИТИЧЕСКИ ВАЖНЫЕ ПРАВИЛА:
1. Заметки атлета о боли имеют АБСОЛЮТНЫЙ ПРИОРИТЕТ
2. Если атлет пожаловался на боль:
   - Разбери эту проблему в поле "coach_notes"
   - В поле "next_workout" НЕ повышай вес на эту мышечную группу
3. Ответ верни СТРОГО в формате JSON без markdown-разметки

{{
  "coach_notes": "Текст разбора тренировки",
  "next_workout": [
    {{"exercise": "Название", "sets": 3, "weight_kg": 20.0, "cue": "Фокус"}}
  ]
}}
"""
        return prompt
    
    @staticmethod
    async def analyze_and_save(user_id: int, workout_date: str, workout_name: str, 
                               exercises: list, athlete_notes: str) -> dict:
        """Анализирует тренировку и сохраняет результат"""
        
        # Формируем промпт
        prompt = WorkoutAnalyzer.build_strength_prompt(
            [ex.model_dump() for ex in exercises],
            workout_name,
            athlete_notes
        )
        
        # Получаем анализ от AI (с фоллбеками внутри)
        ai_data = await gemini_service.analyze_strength_workout(prompt)
        
        # Формируем данные для сохранения
        workout_data = {
            "workout_name": workout_name,
            "exercises": [ex.model_dump() for ex in exercises],
            "athlete_notes": athlete_notes,
            "coach_notes": ai_data.get("coach_notes", ""),
            "next_workout": ai_data.get("next_workout", [])
        }
        
        # Сохраняем в БД
        await database.save_strength_workout(user_id, workout_date, workout_data)
        
        return {
            "status": "success",
            "workout": workout_data
        }

# Инициализируем один раз
workout_analyzer = WorkoutAnalyzer()
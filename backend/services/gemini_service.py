import json
import logging
from google import genai
from google.genai import types
from config import config

logger = logging.getLogger(__name__)

#Модели Gemini для работы
PRIMARY_MODEL = "gemini-3.8-flash"      # ✅ Основная модель
FALLBACK_MODEL = "gemini-3.5-flash-lite" # ✅ Запасная модель

class GeminiService:
    def __init__(self):
        """Инициализирует Gemini клиент один раз"""
        self.client = genai.Client(api_key=config.GEMINI_API_KEY)
    
    async def analyze_strength_workout(self, prompt: str) -> dict:
        """
        Отправляет промпт в Gemini с фоллбеком на вторую модель
        """
        try:
            # Попытка 1: основная модель
            response = self.client.models.generate_content(
                model=PRIMARY_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            return json.loads(response.text)
        
        except Exception as e:
            logger.warning(f"Primary model failed: {e}, trying fallback")
            
            try:
                # Попытка 2: резервная модель
                response = self.client.models.generate_content(
                    model=FALLBACK_MODEL,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json"
                    )
                )
                return json.loads(response.text)
            
            except Exception as e2:
                logger.error(f"Both models failed: {e2}, using fallback")
                
                # Попытка 3: hard fallback
                return {
                    "coach_notes": "Тренировка успешно сохранена! (AI временно недоступен)",
                    "next_workout": []
                }

# Инициализируем один раз
gemini_service = GeminiService()
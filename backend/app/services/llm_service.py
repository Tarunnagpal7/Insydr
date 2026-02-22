import google.generativeai as genai
from app.core.config import settings

class LLMService:
    def __init__(self):
        api_key = settings.GOOGLE_API_KEY
        if not api_key:
            raise ValueError("GOOGLE_API_KEY is not set")
            
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')

    async def generate(self, prompt: str, temperature: float = 0.5) -> str:
        """
        Generate content with configurable temperature.
        
        temperature: 0.0 = deterministic/consistent, 1.0 = creative/varied
        """
        try:
            generation_config = genai.types.GenerationConfig(
                temperature=temperature,
            )
            response = await self.model.generate_content_async(
                prompt,
                generation_config=generation_config,
            )
            return response.text
        except Exception as e:
            print(f"Error generating content with Gemini: {e}")
            raise e

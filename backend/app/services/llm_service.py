import google.generativeai as genai
from app.core.config import settings

class LLMService:
    def __init__(self):
        api_key = settings.GOOGLE_API_KEY
        if not api_key:
            raise ValueError("GOOGLE_API_KEY is not set")
            
        genai.configure(api_key=api_key)
        # print available models for debug if needed, but let's stick to a known working one "gemini-pro"
        # If 'gemini-pro' failed, it might be an API key issue or region issue. 
        # But 'gemini-1.5-flash' is standard.
        # Let's try 'gemini-1.0-pro'
        # Available models: gemini-2.5-flash, gemini-2.5-pro, etc.
        self.model = genai.GenerativeModel('gemini-2.5-flash')

    async def generate(self, prompt: str) -> str:
        try:
            response = await self.model.generate_content_async(prompt)
            return response.text
        except Exception as e:
            print(f"Error generating content with Gemini: {e}")
            raise e

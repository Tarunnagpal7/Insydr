from google import genai
from google.genai import types
from app.core.config import settings

class LLMService:
    def __init__(self):
        self.api_key = settings.GOOGLE_API_KEY
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY is not set")
            
        self.client = genai.Client(api_key=self.api_key)

    async def generate(self, prompt: str, temperature: float = 0.5) -> str:
        """
        Generate content with configurable temperature.
        
        temperature: 0.0 = deterministic/consistent, 1.0 = creative/varied
        """
        try:
            generation_config = types.GenerateContentConfig(
                temperature=temperature,
            )
            response = await self.client.aio.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=generation_config,
            )
            return response.text
        except Exception as e:
            print(f"Error generating content with Gemini: {e}")
            raise e

    async def generate_stream(self, prompt: str, temperature: float = 0.5):
        """
        Stream content from Gemini token-by-token.
        Yields text chunks as they arrive.
        """
        try:
            generation_config = types.GenerateContentConfig(
                temperature=temperature,
            )
            response_stream = await self.client.aio.models.generate_content_stream(
                model='gemini-2.5-flash',
                contents=prompt,
                config=generation_config,
            )
            async for chunk in response_stream:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            print(f"Error streaming content with Gemini: {e}")
            raise e

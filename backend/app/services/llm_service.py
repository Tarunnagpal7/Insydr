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

    async def generate_stream(self, prompt: str, temperature: float = 0.5):
        """
        Stream content from Gemini token-by-token.
        Yields text chunks as they arrive.
        """
        try:
            generation_config = genai.types.GenerationConfig(
                temperature=temperature,
            )
            response = await self.model.generate_content_async(
                prompt,
                generation_config=generation_config,
                stream=True,
            )
            async for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            print(f"Error streaming content with Gemini: {e}")
            raise e

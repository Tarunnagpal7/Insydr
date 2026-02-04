from typing import List, Optional
import os
from huggingface_hub import InferenceClient
from app.core.config import settings

class EmbeddingService:
    def __init__(self):
        token = settings.HF_TOKEN
        # Fallback to env if not in settings, though settings should load from env
        if not token:
             token = os.environ.get("HF_TOKEN")
             
        self.client = InferenceClient(
            provider="auto",
            api_key=token,
        )
        if not token:
            print("WARNING: HF_TOKEN not set. Using public Hugging Face API (rate limits may apply).")
        self.model = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

    def embed_query(self, text: str) -> List[float]:
        return self._get_embedding(text)

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self._get_embedding(t) for t in texts]

    def _get_embedding(self, text: str) -> List[float]:
        if not text:
            return [0.0] * 384
        
        # Clean text
        text = text.replace("\n", " ")
        
        # API call
        # We use feature_extraction to get the embedding vector
        try:
            response = self.client.feature_extraction(text, model=self.model)
        except Exception as e:
            print(f"Error calling HF API: {e}")
            import traceback
            traceback.print_exc()
            raise e

        # Handle response format
        # It's usually a numpy array or list of lists
        if hasattr(response, 'tolist'):
             response = response.tolist()
        
        # If response is nested (batch dim), unnest it.
        # For single input feature_extraction returns [1, 384] or [n_tokens, 384] usually.
        # But we replaced \n with space, so it's one sequence.
        # If mean pooling is not done by API (it usually IS NOT for feature_extraction unless specified),
        # we might get [sequence_length, 384]. We want [384] (sentence embedding).
        # Actually sentence-transformers models via feature_extraction usually return all token embeddings.
        # We need to take MEAN of them if the API doesn't do it.
        # Or better: use "sentence-similarity" task which handles it? 
        # But sentence-similarity takes source + sentences.
        # "feature-extraction" returns raw hidden states.
        
        if isinstance(response, list):
             # Check dims
             if len(response) > 0:
                 if isinstance(response[0], list):
                      if isinstance(response[0][0], list):
                           # [batch, seq, dim] -> [1, seq, 384]
                           # Flatten to [seq, 384]
                           response = response[0]
                      
                      # Now response is [seq_len, 384] approx.
                      # We need to average them to get sentence embedding.
                      # Simple mean pooling
                      try:
                          # Sum columns
                          dim = len(response[0])
                          avg = [0.0] * dim
                          for token_vec in response:
                              for i, val in enumerate(token_vec):
                                  avg[i] += val
                          
                          length = len(response)
                          if length > 0:
                              avg = [x / length for x in avg]
                              return avg
                          else:
                              return [0.0] * dim
                      except:
                          # Fallback/Error if format unexpected
                          print(f"Unexpected embedding format: {response[:1]}...")
                          return [0.0] * 384
             
             return response
            
        return response

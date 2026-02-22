from langchain_text_splitters import RecursiveCharacterTextSplitter
from typing import List
import re


def chunk_text(
    text: str, 
    chunk_size: int = 1000, 
    chunk_overlap: int = 200,
    preserve_headings: bool = True,
) -> List[str]:
    """
    Intelligent text chunking with heading awareness.
    
    - Uses sentence/paragraph-aware splitting
    - Preserves heading context by prepending the last-seen heading to each chunk
    - Configurable chunk size and overlap
    """
    if not text or not text.strip():
        return []
    
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
        length_function=len,
    )
    
    raw_chunks = splitter.split_text(text)
    
    if not preserve_headings:
        return raw_chunks
    
    # Heading-aware post-processing:
    # Prepend the last-seen heading to chunks that don't start with one
    heading_pattern = re.compile(r'^#{1,6}\s+.+|^[A-Z][A-Z\s]{4,}$', re.MULTILINE)
    
    enhanced_chunks = []
    last_heading = ""
    
    for chunk in raw_chunks:
        # Check if this chunk starts with a heading
        lines = chunk.strip().split('\n')
        first_line = lines[0].strip() if lines else ""
        
        if heading_pattern.match(first_line):
            last_heading = first_line
            enhanced_chunks.append(chunk)
        elif last_heading:
            # Prepend the last heading for context
            enhanced_chunks.append(f"{last_heading}\n\n{chunk}")
        else:
            enhanced_chunks.append(chunk)
        
        # Update last_heading if any heading appears in this chunk
        for line in lines:
            if heading_pattern.match(line.strip()):
                last_heading = line.strip()
    
    return enhanced_chunks

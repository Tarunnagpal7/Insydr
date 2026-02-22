"""
Web crawler for knowledge base ingestion.
Crawls a website following links, extracts clean text content,
and yields (url, text) pairs for downstream processing.
"""
import asyncio
import hashlib
from typing import AsyncGenerator, Set, Tuple
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

import httpx
from bs4 import BeautifulSoup


# Elements to strip from pages (navigation, ads, scripts, etc.)
STRIP_TAGS = {'nav', 'footer', 'header', 'script', 'style', 'aside', 'noscript', 'iframe', 'form'}
STRIP_CLASSES = {'nav', 'navbar', 'footer', 'sidebar', 'menu', 'advertisement', 'ad', 'cookie', 'popup'}


class WebCrawler:
    def __init__(self, timeout: float = 15.0, user_agent: str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"):
        self.timeout = timeout
        self.user_agent = user_agent
        self.visited: Set[str] = set()
        self.content_hashes: Set[str] = set()

    def _normalize_url(self, url: str) -> str:
        """Normalize a URL for deduplication."""
        parsed = urlparse(url)
        # Remove fragments, trailing slashes
        normalized = f"{parsed.scheme}://{parsed.netloc}{parsed.path.rstrip('/')}"
        if parsed.query:
            normalized += f"?{parsed.query}"
        return normalized

    def _is_same_domain(self, url: str, base_url: str) -> bool:
        """Check if URL is on the same domain as the base."""
        return urlparse(url).netloc == urlparse(base_url).netloc

    def _extract_text(self, html: str) -> str:
        """Extract clean text from HTML, removing nav/footer/script/ads."""
        soup = BeautifulSoup(html, 'html.parser')
        
        # Remove unwanted tags
        for tag_name in STRIP_TAGS:
            for tag in soup.find_all(tag_name):
                tag.decompose()
        
        # Remove elements with common navigation/ad class names
        for class_name in STRIP_CLASSES:
            for tag in soup.find_all(class_=lambda c: c and class_name in str(c).lower()):
                tag.decompose()
        
        # Remove elements with role attributes that indicate non-content
        for role in ['navigation', 'banner', 'complementary', 'contentinfo']:
            for tag in soup.find_all(attrs={'role': role}):
                tag.decompose()
        
        # Try to find main content area first
        main_content = soup.find('main') or soup.find('article') or soup.find(id='content') or soup.find(class_='content')
        
        if main_content:
            text = main_content.get_text(separator='\n', strip=True)
        else:
            text = soup.get_text(separator='\n', strip=True)
        
        # Clean up excessive whitespace
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        return '\n\n'.join(lines)

    def _extract_links(self, html: str, base_url: str) -> list:
        """Extract all links from HTML."""
        soup = BeautifulSoup(html, 'html.parser')
        links = []
        for a_tag in soup.find_all('a', href=True):
            href = a_tag['href']
            # Resolve relative URLs
            full_url = urljoin(base_url, href)
            # Only follow http/https links
            parsed = urlparse(full_url)
            if parsed.scheme in ('http', 'https'):
                links.append(self._normalize_url(full_url))
        return links

    async def crawl(self, start_url: str, max_depth: int = 2, max_pages: int = 50) -> AsyncGenerator[Tuple[str, str], None]:
        """
        Crawl starting from start_url up to max_depth levels and max_pages pages.
        Yields (url, extracted_text) tuples.
        """
        # Ensure reasonable limits
        max_depth = min(max(1, max_depth), 5)
        max_pages = min(max(1, max_pages), 100)
        
        start_url = self._normalize_url(start_url)
        base_domain = urlparse(start_url).netloc
        
        # BFS crawl queue: (url, depth)
        queue = [(start_url, 0)]
        pages_crawled = 0
        
        async with httpx.AsyncClient(
            timeout=self.timeout,
            follow_redirects=True,
            headers={
                "User-Agent": self.user_agent,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1"
            }
        ) as client:
            while queue and pages_crawled < max_pages:
                url, depth = queue.pop(0)
                
                normalized = self._normalize_url(url)
                if normalized in self.visited:
                    continue
                
                if not self._is_same_domain(url, start_url):
                    continue
                
                self.visited.add(normalized)
                
                try:
                    response = await client.get(url)
                    if response.status_code != 200:
                        continue
                    
                    content_type = response.headers.get('content-type', '')
                    if 'text/html' not in content_type:
                        continue
                    
                    html = response.text
                    text = self._extract_text(html)
                    
                    if not text or len(text) < 50:
                        continue
                    
                    content_hash = hashlib.md5(text.encode()).hexdigest()
                    if content_hash in self.content_hashes:
                        continue
                    self.content_hashes.add(content_hash)
                    
                    pages_crawled += 1
                    yield (url, text)
                    
                    # Extract and queue links for next depth level
                    if depth < max_depth:
                        links = self._extract_links(html, url)
                        for link in links:
                            if self._normalize_url(link) not in self.visited:
                                queue.append((link, depth + 1))
                    
                    # Small delay to be respectful
                    await asyncio.sleep(0.5)
                    
                except Exception as e:
                    print(f"[CRAWLER] Error fetching {url}: {e}")
                    continue

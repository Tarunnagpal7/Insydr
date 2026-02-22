import asyncio
from app.rag.crawler import WebCrawler

async def main():
    crawler = WebCrawler()
    count = 0
    url = "https://en.wikipedia.org/wiki/Virat_Kohli"
    print(f"Testing crawl for: {url}")
    async for page_url, text in crawler.crawl(url, max_depth=1, max_pages=5):
        print(f"Got page: {page_url} (len: {len(text)})")
        count += 1
    print(f"Total pages: {count}")

if __name__ == "__main__":
    asyncio.run(main())

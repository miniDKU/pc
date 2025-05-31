import os
import httpx
import json

NAVER_CLIENT_ID = os.getenv("NAVER_CLIENT_ID", "")
NAVER_CLIENT_SECRET = os.getenv("NAVER_CLIENT_SECRET", "")

async def fetch_naver_products(query: str, limit: int = 5):
    """
    네이버 쇼핑 API를 사용해서 query(부품명)에 대한 제품 리스트와 가격, 링크를 가져옵니다.
    """
    if not NAVER_CLIENT_ID or not NAVER_CLIENT_SECRET:
        raise RuntimeError("네이버 API 인증 정보가 설정되지 않았습니다.")
    
    url = "https://openapi.naver.com/v1/search/shop.json"
    headers = {
        "X-Naver-Client-Id": NAVER_CLIENT_ID,
        "X-Naver-Client-Secret": NAVER_CLIENT_SECRET
    }
    params = {
        "query": query,
        "display": limit,
        "sort": "asc"  # 가격 오름차순
    }
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(url, params=params, headers=headers)
        resp.raise_for_status()
        data = resp.json()
    
    products = []
    for item in data.get("items", [])[:limit]:
        name = item.get("title", "이름 없음").replace("<b>", "").replace("</b>", "")
        price = f"{int(item.get('lprice', 0)):,}원"
        link = item.get("link", "#")
        products.append({
            "name": name,
            "price": price,
            "link": link
        })
    
    return products 
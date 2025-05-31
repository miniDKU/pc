import os
import httpx
import json
from urllib.parse import quote

NAVER_CLIENT_ID = os.getenv("NAVER_CLIENT_ID", "")
NAVER_CLIENT_SECRET = os.getenv("NAVER_CLIENT_SECRET", "")

async def fetch_naver_products(query: str, limit: int = 5):
    """
    네이버 쇼핑 API를 사용해서 query(부품명)에 대한 제품 리스트와 가격, 링크를 가져옵니다.
    """
    if not NAVER_CLIENT_ID or not NAVER_CLIENT_SECRET:
        print("[Naver] NAVER_CLIENT_ID 또는 NAVER_CLIENT_SECRET이 설정되지 않았습니다.")  # 에러 로그 추가
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
    exclude_keywords = [
        "조립", "견적", "패드", "마우스", "키보드", "세트", "완제품",
        "쿨러", "팬", "브라켓", "UPS", "어댑터", "케이블", "리더기", "외장", "노트북", "액세서리",
        "휴대폰", "핸드폰", "스마트폰", "폰케이스", "휴대폰케이스", "스마트폰케이스", "갤럭시", "아이폰",
        "슬림", "미니PC", "본체", "올인원", "브랜드PC", "조립PC", "컴퓨터", "데스크탑", "세트PC"
    ]
    min_price = 10000  # 1만원 미만 상품 제외

    for item in data.get("items", []):
        name = item.get("title", "이름 없음").replace("<b>", "").replace("</b>", "")
        price_int = int(item.get('lprice', 0))
        # 키워드/가격 필터링
        if any(kw in name for kw in exclude_keywords):
            continue
        if price_int < min_price:
            continue
        price = f"{price_int:,}원"
        # link = item.get("link", "#")
        # 네이버 쇼핑 검색 링크로 대체
        search_url = f"https://search.shopping.naver.com/search/all?query={quote(name)}"
        products.append({
            "name": name,
            "price": price,
            "link": search_url
        })
        if len(products) >= limit:
            break

    return products
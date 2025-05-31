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
        "display": limit * 2,  # 필터링을 고려해서 더 많은 결과를 가져옴
        "sort": "rel"  # 정확도순으로 변경
    }
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(url, params=params, headers=headers)
        resp.raise_for_status()
        data = resp.json()
    
    products = []
    # 부품별 제외 키워드 설정
    common_exclude = ["중고", "리퍼", "수리", "중고거래", "매입"]
    part_specific_exclude = {
        "CPU": ["쿨러", "서버용"],
        "메인보드": ["악세서리", "브라켓"],
        "그래픽카드": ["브라켓", "라이저"],
        "메모리": ["노트북용"],
        "SSD": ["외장", "케이스"],
        "파워서플라이": ["케이블", "악세서리"],
        "케이스": ["필름", "커버", "악세서리"]
    }
    
    # 현재 검색 중인 부품 타입 확인
    current_part = None
    for part in part_specific_exclude.keys():
        if part in query:
            current_part = part
            break
    
    # 제외 키워드 설정
    exclude_keywords = common_exclude.copy()
    if current_part and current_part in part_specific_exclude:
        exclude_keywords.extend(part_specific_exclude[current_part])

    min_price = 5000  # 최소 가격 하향 조정

    for item in data.get("items", []):
        name = item.get("title", "이름 없음").replace("<b>", "").replace("</b>", "")
        price_int = int(item.get('lprice', 0))
        
        # 키워드/가격 필터링
        if any(kw.lower() in name.lower() for kw in exclude_keywords):
            continue
        if price_int < min_price:
            continue
            
        price = f"{price_int:,}원"
        mall_name = item.get("mallName", "")
        category = item.get("category1", "")
        
        # 네이버 쇼핑 검색 링크로 대체
        search_url = f"https://search.shopping.naver.com/search/all?query={quote(name)}"
        
        products.append({
            "name": name,
            "price": price,
            "link": search_url,
            "mall": mall_name,
            "category": category
        })
        
        if len(products) >= limit:
            break

    return products
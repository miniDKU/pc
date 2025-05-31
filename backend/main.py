import os
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from schemas import RecommendRequest, GPTResponse, NaverProduct, ErrorResponse
from naver_service import fetch_naver_products
from openai_service import generate_recommendation
from urllib.parse import quote

app = FastAPI()

# CORS 설정
origins = [
    "http://localhost:3000",  # React 개발 서버
    # 배포 시 실제 도메인 추가
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

example_products = {
    "CPU": "AMD 라이젠 5 7600X",
    "메인보드": "ASUS ROG STRIX B650-A",
    "메모리": "삼성전자 DDR5-5600 32GB",
    "SSD": "삼성전자 990 PRO 2TB NVMe",
    "파워서플라이": "시소닉 FOCUS GOLD GX-850",
    "케이스": "리안리 O11 Dynamic EVO",
    "그래픽카드": "NVIDIA GeForce RTX 4070"
}

# 필수 부품만 모두 포함
required_parts = [
    ("CPU", "CPU"),
    ("메인보드", "메인보드"),
    ("그래픽카드", "그래픽카드"),
    ("메모리", "RAM"),
    ("SSD", "SSD"),
    ("파워서플라이", "파워서플라이"),
    ("케이스", "케이스"),
]

@app.post(
    "/recommend",
    response_model=GPTResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def recommend_pc(req: RecommendRequest):
    part_products = {}
    all_products = []

    # 필수 부품 검색
    for kor_name, query_name in required_parts:
        try:
            search_query = query_name
            products = await fetch_naver_products(query=search_query, limit=4)

            if not products:
                print(f"[WARNING] '{kor_name}' 첫 번째 검색 결과가 없습니다. 키워드를 조정하여 재시도합니다.")
                products = await fetch_naver_products(query=query_name, limit=4)
            
            if not products:
                print(f"[WARNING] '{kor_name}' 두 번째 검색 결과가 없습니다. 예시 제품으로 대체합니다.")
                products = [{
                    "name": example_products[kor_name],
                    "price": "정보 없음",
                    "link": f"https://search.shopping.naver.com/search/all?query={quote(example_products[kor_name])}",
                    "mall": "예시",
                    "category": "",
                    "required": True
                }]

            part_products[kor_name] = products
            for prod in products:
                prod_copy = prod.copy()
                prod_copy["part"] = kor_name
                prod_copy["required"] = True
                all_products.append(prod_copy)

            print(f"[DEBUG] Required Part: {kor_name}, Products: {products}")

        except Exception as e:
            print(f"[ERROR] 네이버 쇼핑 API 호출 오류 ({kor_name}): {e}")
            fallback_prod = {
                "name": example_products[kor_name],
                "price": "정보 없음",
                "link": f"https://search.shopping.naver.com/search/all?query={quote(example_products[kor_name])}",
                "mall": "예시",
                "category": "",
                "required": True
            }
            part_products[kor_name] = [fallback_prod]
            prod_copy = fallback_prod.copy()
            prod_copy["part"] = kor_name
            all_products.append(prod_copy)
            print(f"[DEBUG] Part: {kor_name}, Fallback Product: {fallback_prod}")

    # GPT에게 넘길 product_block 생성
    product_blocks = []
    for part, _ in required_parts:
        if part in part_products and part_products[part]:
            lines = []
            for idx, prod in enumerate(part_products[part], start=1):
                mall_info = f" ({prod['mall']})" if prod['mall'] else ""
                lines.append(f"{idx}. {prod['name']}{mall_info} - {prod['price']} (링크: {prod['link']})")
            block = f"[필수] {part} 후보\n" + "\n".join(lines)
            product_blocks.append(block)

    product_block = "\n\n".join(product_blocks)

    try:
        recommendation_text = await generate_recommendation(
            user_prompt=req.prompt,
            products=all_products,
            product_block=product_block
        )
    except Exception as e:
        print(f"[GPT 호출 오류] {e}")
        raise HTTPException(status_code=500, detail=f"GPT 호출 오류: {e}")

    products_for_response = [
        NaverProduct(
            name=prod["name"],
            price=prod["price"],
            link=prod["link"],
            mall=prod.get("mall"),
            category=prod.get("category"),
            part=prod.get("part"),
            required=prod.get("required", True)
        ) for prod in all_products
    ]

    return GPTResponse(
        recommendation=recommendation_text,
        products=products_for_response
    )

if __name__ == "__main__":
    import uvicorn
    if not os.getenv("OPENAI_API_KEY"):
        print("[경고] OPENAI_API_KEY 환경변수가 설정되어 있지 않습니다.")
    if not os.getenv("NAVER_CLIENT_ID") or not os.getenv("NAVER_CLIENT_SECRET"):
        print("[경고] NAVER_CLIENT_ID 또는 NAVER_CLIENT_SECRET 환경변수가 설정되어 있지 않습니다.")
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
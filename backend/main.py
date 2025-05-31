import os
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from schemas import RecommendRequest, GPTResponse, NaverProduct, ErrorResponse
from naver_service import fetch_naver_products
from openai_service import generate_recommendation

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

@app.post(
    "/recommend",
    response_model=GPTResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def recommend_pc(req: RecommendRequest):
    # 부품 종류 리스트 및 검색 쿼리 강화
    part_types = [
        ("CPU", "데스크탑 CPU"),
        ("메인보드", "데스크탑 메인보드"),
        ("그래픽카드", "그래픽카드"),
        ("메모리", "데스크탑 메모리"),
        ("SSD", "SSD"),
        ("파워서플라이", "파워서플라이"),
        ("케이스", "PC 케이스"),
    ]
    part_products = {}
    all_products = []

    # 예시 제품명(후보가 없을 때 대체용)
    example_products = {
        "CPU": "AMD 라이젠 5 5600X",
        "메인보드": "ASUS PRIME B550M-A",
        "그래픽카드": "NVIDIA GeForce RTX 3060",
        "메모리": "삼성전자 DDR4 16GB",
        "SSD": "삼성전자 970 EVO Plus 500GB",
        "파워서플라이": "마이크로닉스 Classic II 600W",
        "케이스": "ABKO NCORE 식스팬 풀 아크릴 LUNAR",
    }

    # 각 부품별로 네이버 쇼핑 API 호출
    for kor_name, query_name in part_types:
        try:
            # 사용자 프롬프트와 부품명을 조합해서 검색
            search_query = f"{query_name} {req.prompt}"
            products = await fetch_naver_products(query=search_query, limit=4)
            # 후보가 없으면 예시 제품명으로 대체
            if not products:
                products = [{
                    "name": example_products[kor_name],
                    "price": "정보 없음",
                    "link": f"https://search.shopping.naver.com/search/all?query={example_products[kor_name]}"
                }]
            part_products[kor_name] = products
            # 전체 products 리스트에 추가 (프론트엔드 표출용)
            for prod in products:
                prod_copy = prod.copy()
                prod_copy["part"] = kor_name
                all_products.append(prod_copy)
        except Exception as e:
            print(f"[네이버 쇼핑 API 호출 오류 - {kor_name}] {e}")
            # 예시 제품명으로 대체
            products = [{
                "name": example_products[kor_name],
                "price": "정보 없음",
                "link": f"https://search.shopping.naver.com/search/all?query={example_products[kor_name]}"
            }]
            part_products[kor_name] = products
            prod_copy = products[0].copy()
            prod_copy["part"] = kor_name
            all_products.append(prod_copy)

    # GPT에게 넘길 product_block 생성
    product_blocks = []
    for part, products in part_products.items():
        lines = []
        for idx, prod in enumerate(products, start=1):
            lines.append(f"{idx}. {prod['name']} - {prod['price']} (링크: {prod['link']})")
        block = f"[{part} 후보]\n" + "\n".join(lines)
        product_blocks.append(block)
    product_block = "\n\n".join(product_blocks)

    # 2) GPT에게 "제품 목록 + 사용자 요청" 보내서 추천 생성
    try:
        recommendation_text = await generate_recommendation(
            user_prompt=req.prompt,
            products=all_products,  # 전체 products도 전달
            product_block=product_block  # 부품별로 나눈 product_block 전달
        )
    except Exception as e:
        print(f"[GPT 호출 오류] {e}")
        raise HTTPException(status_code=500, detail=f"GPT 호출 오류: {e}")

    # 3) 응답 모델을 채워서 반환 (products는 프론트엔드 표출용, 필요시 가공)
    products_for_response = [
        NaverProduct(
            name=prod["name"],
            price=prod["price"],
            link=prod["link"]
        ) for prod in all_products
    ]

    return GPTResponse(
        recommendation=recommendation_text,
        products=products_for_response
    )

if __name__ == "__main__":
    import uvicorn
    # 환경변수 체크 및 경고 출력
    if not os.getenv("OPENAI_API_KEY"):
        print("[경고] OPENAI_API_KEY 환경변수가 설정되어 있지 않습니다.")
    if not os.getenv("NAVER_CLIENT_ID") or not os.getenv("NAVER_CLIENT_SECRET"):
        print("[경고] NAVER_CLIENT_ID 또는 NAVER_CLIENT_SECRET 환경변수가 설정되어 있지 않습니다.")
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
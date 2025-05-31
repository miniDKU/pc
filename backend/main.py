import os
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
    # 1) 네이버 쇼핑 API로 제품 정보 가져오기
    try:
        # 예: "게임용 80만원 이하로 추천해줘" → 여기서는 "게임용 PC 80만원 이하"를 키워드로 사용
        query = req.prompt  
        raw_products = await fetch_naver_products(query=query, limit=5)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"네이버 쇼핑 API 호출 오류: {e}")
    
    # Pydantic 스키마에 맞게 변환
    products = []
    for item in raw_products:
        prod = NaverProduct(
            name=item["name"],
            price=item["price"],
            link=item["link"]
        )
        products.append(prod)
    
    # 2) GPT에게 "제품 목록 + 사용자 요청" 보내서 추천 생성
    try:
        recommendation_text = await generate_recommendation(user_prompt=req.prompt, products=raw_products)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GPT 호출 오류: {e}")
    
    # 3) 응답 모델을 채워서 반환
    return GPTResponse(
        recommendation=recommendation_text,
        products=products
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True) 
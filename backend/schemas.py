from pydantic import BaseModel
from typing import List, Optional, Dict

class RecommendRequest(BaseModel):
    prompt: str

class NaverProduct(BaseModel):
    name: str
    price: str
    link: str
    mall: Optional[str] = None
    category: Optional[str] = None
    part: Optional[str] = None
    required: bool = True  # 필수 부품 여부

class GPTResponse(BaseModel):
    recommendation: str         # GPT가 생성한 추천 텍스트
    products: List[NaverProduct]  # 네이버 쇼핑 API로부터 가져온 제품 리스트

class ErrorResponse(BaseModel):
    detail: str 
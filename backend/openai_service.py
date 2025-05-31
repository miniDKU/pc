import os
import openai

# 환경변수에서 키 불러오기
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
openai.api_key = OPENAI_API_KEY

async def generate_recommendation(user_prompt: str, products: list):
    """
    GPT-3.5/4 ChatCompletion 호출 함수.
    - user_prompt: React에서 받아온 사용자의 자연어 요청
    - products: DanawaService로부터 받아온 제품 리스트 (dict list)
    """
    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY가 설정되지 않았습니다.")
    
    # "제품 목록"을 GPT에게 전달하기 쉽게 문자열로 변환
    product_lines = []
    for idx, prod in enumerate(products, start=1):
        line = f"{idx}. {prod['name']} - {prod['price']} (링크: {prod['link']})"
        product_lines.append(line)
    product_block = "\n".join(product_lines)
    
    system_message = (
        "너는 조립식 PC 전문가야. "
        "아래 다나와에서 가져온 제품 목록을 참고해서, 사용자의 예산과 용도에 맞추어 "
        "최적의 PC 구성을 추천하고, 각 부품을 선택한 이유를 간단히 설명해줘."
    )
    user_message = (
        f"다음 제품 목록 중에서 골라서 조립 PC를 추천해줘:\n{product_block}\n\n"
        f"사용자의 요청: \"{user_prompt}\""
    )
    
    # ChatCompletion 호출 (async)
    response = await openai.ChatCompletion.acreate(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_message}
        ],
        max_tokens=500,
        temperature=0.7,
    )
    
    recommendation_text = response.choices[0].message.content.strip()
    return recommendation_text 
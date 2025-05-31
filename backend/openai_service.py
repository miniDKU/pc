import os
import openai

# 환경변수에서 키 불러오기
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# openai 1.x 클라이언트 객체 생성
client = openai.AsyncOpenAI(api_key=OPENAI_API_KEY)

async def generate_recommendation(user_prompt: str, products: list, product_block: str):
    """
    GPT-3.5/4 ChatCompletion 호출 함수.
    - user_prompt: React에서 받아온 사용자의 자연어 요청
    - products: DanawaService로부터 받아온 제품 리스트 (dict list)
    - product_block: 제품 목록을 문자열로 변환한 블록
    """
    if not OPENAI_API_KEY:
        print("[OpenAI] OPENAI_API_KEY가 설정되지 않았습니다.")  # 에러 로그 추가
        raise RuntimeError("OPENAI_API_KEY가 설정되지 않았습니다.")
    
    system_message = (
        "너는 조립식 PC 전문가야. "
        "아래 네이버 쇼핑에서 가져온 각 부품별 제품 목록을 참고해서, "
        "다음 형식에 맞춰서 정확하게 응답해야 해:\n\n"
        "[부품명]\n"
        "제품: (제품명)\n"
        "추천 이유: (2~4줄로 간단히 설명)\n"
        "링크: (네이버 쇼핑 링크)\n\n"
        "각 부품은 위 형식을 정확히 지켜서 출력해야 하며, 다른 형식은 사용하지 마.\n"
        "필수 부품: CPU, 메인보드, 그래픽카드, 메모리, SSD, 파워서플라이, 케이스\n"
        "추천 이유는 반드시 2~4줄로 작성하고, 전문 용어는 피하고 초보자가 이해하기 쉽게 설명해."
    )
    
    user_message = (
        f"아래 제품 목록을 참고해서 다음 요구사항에 맞는 PC 부품을 추천해줘:\n"
        f"1. 형식을 정확히 지켜서 응답\n"
        f"2. 각 부품별로 제품명, 추천 이유(2~4줄), 링크를 포함\n"
        f"3. 추천 이유는 컴맹도 이해할 수 있게 쉽게 설명\n"
        f"4. 다른 형식이나 설명은 제외\n\n"
        f"{product_block}\n\n"
        f"사용자의 요청: \"{user_prompt}\""
    )
    
    # openai 1.x 방식으로 ChatCompletion 호출
    response = await client.chat.completions.create(
        model="gpt-3.5-turbo-1106",  # 최신 모델 명시
        messages=[
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_message}
        ],
        max_tokens=1500,
        temperature=0.7,
    )
    # 응답 원문을 로그로 출력 (디버깅)
    print("GPT 응답 원문:", response.choices[0].message.content)
    recommendation_text = response.choices[0].message.content
    if not recommendation_text or not recommendation_text.strip():
        raise RuntimeError("GPT 응답이 비어 있습니다. 프롬프트, 모델명, 옵션을 점검하세요.")
    return recommendation_text.strip()
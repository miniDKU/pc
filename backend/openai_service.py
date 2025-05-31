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
        "아래 네이버 쇼핑에서 가져온 각 부품별 제품 목록 중에서만 부품을 골라서, "
        "CPU, 그래픽카드, 메모리, 메인보드, SSD, 파워서플라이, 케이스 이 7가지 부품을 반드시 모두 추천해줘. "
        "각 부품마다 반드시 1개 이상의 실제 후보 제품을 추천하고, 각 후보마다 구체적이고 자세한 추천 이유(reason)를 2~3줄로 작성해. "
        "'없음'이라는 단어는 절대 출력하지 마. "
        "완제품 PC, 미니PC, 노트북, 브랜드PC, 조립PC, 본체, 세트PC, 올인원 등 완제품/세트/노트북/브랜드PC/미니PC 관련 상품은 절대 추천하지 마. "
        "후보가 부족하더라도 반드시 부품(예: CPU, 그래픽카드, 메모리 등)만 추천해. "
        "모든 부품(part)은 반드시 JSON 응답에 포함되어야 하며, 하나라도 누락되면 안 돼. "
        "반드시 아래 예시처럼 JSON 배열 형식으로만 출력해. "
        "예시의 모든 부품(part)이 반드시 포함되어야 해. "
        "JSON 배열에는 반드시 part(부품 종류), candidates(후보 배열: name, reason)만 포함해. 가격과 링크는 절대 넣지 마. "
        "JSON 외의 설명이나 텍스트는 절대 출력하지 마. "
        "예시: "
        '[{"part":"CPU","candidates":[{"name":"AMD 라이젠 5 5600X","reason":"가성비와 게임 성능이 우수함. 최신 게임도 무난하게 구동 가능. 발열과 전력 소모도 적당해 초보자에게 추천."}]},'
        '{"part":"그래픽카드","candidates":[{"name":"NVIDIA GeForce RTX 3060","reason":"최신 게임을 고해상도로 즐길 수 있는 뛰어난 성능. 전력 효율도 우수함."}]},'
        '{"part":"메모리","candidates":[{"name":"삼성전자 DDR4 16GB","reason":"대부분의 게임과 작업에 충분한 용량. 안정성과 호환성이 뛰어남."}]},'
        '{"part":"메인보드","candidates":[{"name":"ASUS PRIME B550M-A","reason":"확장성과 안정성이 우수하며 다양한 CPU와 호환."}]},'
        '{"part":"SSD","candidates":[{"name":"삼성전자 970 EVO Plus 500GB","reason":"빠른 부팅과 로딩 속도. 신뢰성 높은 NVMe SSD."}]},'
        '{"part":"파워서플라이","candidates":[{"name":"마이크로닉스 Classic II 600W","reason":"안정적인 전력 공급과 효율성. 다양한 보호 회로 내장."}]},'
        '{"part":"케이스","candidates":[{"name":"ABKO NCORE 식스팬 풀 아크릴 LUNAR","reason":"쿨링 성능과 디자인 모두 우수한 PC 케이스."}]}]'
    )
    user_message = (
        f"아래 각 부품별 제품 목록에서만 부품을 골라서 조립 PC를 추천해줘. "
        f"반드시 CPU, 그래픽카드, 메모리, 메인보드, SSD, 파워서플라이, 케이스 이 7가지 부품을 빠짐없이 모두 포함해서 JSON 배열로 보여줘. "
        f"각 부품마다 반드시 1개 이상의 실제 후보 제품을 추천하고, 각 후보마다 구체적이고 자세한 추천 이유(reason)를 2~3줄로 작성해. "
        f"'없음'이라는 단어는 절대 출력하지 마. "
        f"완제품 PC, 미니PC, 노트북, 브랜드PC, 조립PC, 본체, 세트PC, 올인원 등 완제품/세트/노트북/브랜드PC/미니PC 관련 상품은 절대 추천하지 마. "
        f"후보가 부족하더라도 반드시 부품(예: CPU, 그래픽카드, 메모리 등)만 추천해. "
        f"모든 부품(part)은 반드시 JSON 응답에 포함되어야 하며, 하나라도 누락되면 안 돼. "
        f"반드시 아래 예시처럼 JSON 배열 형식으로만 출력해. "
        f"예시의 모든 부품(part)이 반드시 포함되어야 해. "
        f"JSON 배열에는 반드시 part(부품 종류), candidates(후보 배열: name, reason)만 포함해. 가격과 링크는 절대 넣지 마. "
        f"JSON 외의 설명이나 텍스트는 절대 출력하지 마.\n"
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
        max_tokens=800,
        temperature=0.7,
        response_format={"type": "json_object"},  # JSON 응답 강제
    )
    # 응답 원문을 로그로 출력 (디버깅)
    print("GPT 응답 원문:", response.choices[0].message.content)
    recommendation_text = response.choices[0].message.content
    if not recommendation_text or not recommendation_text.strip():
        raise RuntimeError("GPT 응답이 비어 있습니다. 프롬프트, 모델명, 옵션을 점검하세요.")
    return recommendation_text.strip()
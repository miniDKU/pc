import React from "react";

interface Candidate {
  name: string;
  reason: string;
  link?: string;
}

interface PartRecommendation {
  part: string;
  candidates: {
    name: string;
    reason: string;
    link?: string;   // link는 나중에 네이버 제품과 매칭해서 붙임
  }[];
}

interface ChatMessageProps {
  message: {
    role: string;
    text: string;
  };
  naverProducts?: Product[];
}

interface Product {
  name: string;
  price: string;
  link: string;
  part?: string;
}

function getSimilarity(str1: string, str2: string): number {
  // 간단한 유사도 계산 (0~1 사이 값 반환)
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  return s1.includes(s2) || s2.includes(s1) ? 0.8 : 0;
}

function PartCard({ part, candidates }: { part: string; candidates: Candidate[] }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="font-bold text-blue-700 mb-2 text-lg">{part}</div>
      <div className="flex flex-col gap-4">
        {candidates.map((cand, idx) => (
          <div key={cand.name + idx} className="mb-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-gray-800 text-base">{cand.name}</span>
              <div className="flex gap-2">
                <a
                  href={
                    cand.link ||
                    `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(
                      cand.name
                    )}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-2 py-0.5 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs font-medium"
                >
                  이동
                </a>
                <a
                  href={`https://search.shopping.naver.com/search/all?query=${encodeURIComponent(
                    cand.name
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-2 py-0.5 bg-green-500 text-white rounded hover:bg-green-600 text-xs font-medium"
                >
                  네이버 쇼핑에서 검색
                </a>
              </div>
            </div>
            <div className="text-gray-700 text-sm mt-1 whitespace-pre-line leading-relaxed">
              {cand.reason}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 텍스트 내 URL을 자동으로 링크로 변환하는 함수
function linkify(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) =>
    urlRegex.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline break-all"
      >
        {part}
      </a>
    ) : (
      part
    )
  );
}

// 텍스트 내 "링크: ..."만 버튼으로 추출 (여러 개도 지원)
function extractLinkButtons(text: string) {
  const linkRegex = /링크:\s*(https?:\/\/[^\s]+)/g;
  const buttons = [];
  let match;
  while ((match = linkRegex.exec(text)) !== null) {
    buttons.push(
      <a
        key={match[1] + match.index}
        href={match[1]}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-semibold mt-2 mr-2 transition"
        style={{ minWidth: 120, textAlign: "center" }}
      >
        네이버 쇼핑에서 보기
      </a>
    );
  }
  return buttons.length > 0 ? <div className="mt-2 flex flex-wrap gap-2">{buttons}</div> : null;
}

// 부품별로 [부품명] 블록을 찾아 버튼을 만듦
function extractPartLinkButtons(text: string) {
  // [부품명] ... 링크: ... 패턴 추출
  const partBlocks = text.split(/\[([^\]]+)\]/).filter(Boolean);
  const buttons = [];
  for (let i = 0; i < partBlocks.length; i += 2) {
    const partName = partBlocks[i];
    const content = partBlocks[i + 1] || "";
    const linkMatch = content.match(/링크:\s*(https?:\/\/[^\s]+)/);
    if (partName && linkMatch) {
      buttons.push(
        <div key={partName} className="mt-2 flex items-center gap-2">
          <span className="font-semibold text-gray-700">{partName.trim()}</span>
          <a
            href={linkMatch[1]}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-semibold transition"
            style={{ minWidth: 120, textAlign: "center" }}
          >
            네이버 쇼핑에서 보기
          </a>
        </div>
      );
    }
  }
  return buttons.length > 0 ? <div className="mt-2 space-y-2">{buttons}</div> : null;
}

// 파싱 실패 시에도 [부품명]별로 카드+버튼 형태로 출력
function renderPartCardsFromText(text: string) {
  // [부품명] ... 패턴으로 분리
  const sections = text.split(/\[([^\]]+)\]/).filter(Boolean);
  const cards = [];
  for (let i = 0; i < sections.length; i += 2) {
    const partName = sections[i];
    let content = sections[i + 1] || "";

    // "링크: ..." 줄을 완전히 제거 (줄바꿈 포함)
    content = content.replace(/^\s*링크:\s*https?:\/\/[^\s]+\s*$/gm, "");

    const productMatch = content.match(/제품:\s*([^\n]+)/);
    const reasonMatch = content.match(/추천 이유:\s*([^\n]+(?:\n[^\n]+)*)/);
    const linkMatch = (sections[i + 1] || "").match(/링크:\s*(https?:\/\/[^\s]+)/);

    if (partName && productMatch && reasonMatch && linkMatch) {
      cards.push(
        <div key={partName} className="bg-white rounded-lg shadow p-4 mb-6 break-words">
          <div className="font-bold text-blue-700 mb-2 text-lg">{partName.trim()}</div>
          <div className="mb-2 font-semibold text-gray-800">{productMatch[1].trim()}</div>
          <div className="text-gray-700 text-sm mb-2 whitespace-pre-line">{reasonMatch[1].trim()}</div>
          <a
            href={linkMatch[1]}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-semibold transition break-words"
            style={{ minWidth: 120, textAlign: "center", wordBreak: "break-all" }}
          >
            네이버 쇼핑에서 보기
          </a>
        </div>
      );
    }
  }
  return cards.length > 0 ? <div>{cards}</div> : null;
}

export default function ChatMessage({ message, naverProducts = [] }: ChatMessageProps) {
  const isUser = message.role === "user";
  let parts: PartRecommendation[] = [];
  let warning = "";
  let parseError = false;
  let isJsonResponse = false;
  const isLoadingMsg = message.role === "assistant" && message.text === "AI가 답변을 작성 중입니다...";

  if (message.role === "assistant" && !isLoadingMsg) {
    try {
      // JSON 파싱 시도
      const parsed = JSON.parse(message.text);
      isJsonResponse = true;

      // 1. 배열 형태
      if (Array.isArray(parsed)) {
        parts = parsed;
      }
      // 2. parts 필드가 배열
      else if (Array.isArray(parsed.parts)) {
        parts = parsed.parts;
        warning = parsed.warning || "";
      }
      // 3. 객체(딕셔너리) 형태: { "CPU": {...}, "메인보드": {...}, ... }
      else if (parsed && typeof parsed === "object") {
        // 단일 부품만 있을 때 { part: "...", candidates: [...] }
        if ((parsed as any).part && Array.isArray((parsed as any).candidates)) {
          parts = [parsed as any];
        } else {
          // 여러 부품이 key로 있는 경우 (딕셔너리 구조)
          const values = Object.values(parsed).filter(
            (v: any) => v && typeof v === "object" && Array.isArray(v.candidates)
          );
          if (values.length > 0) {
            parts = values as PartRecommendation[];
          } else {
            // 기존 방식도 유지
            parts = Object.entries(parsed)
              .filter(([key, value]) => Array.isArray((value as any)?.candidates))
              .map(([key, value]) => ({
                part: key,
                candidates: (value as any).candidates,
              }));
          }
          warning = (parsed as any).warning || "";
        }
      }
      // 링크 자동 매칭 (후보명과 네이버 후보 리스트 비교)
      parts = parts.map((part) => ({
        ...part,
        candidates: part.candidates.map((cand) => {
          let bestMatch: Product | undefined;
          let bestScore = -1;
          naverProducts.forEach((prod) => {
            if (prod.part === part.part) {
              const score = getSimilarity(prod.name, cand.name);
              if (score > bestScore) {
                bestScore = score;
                bestMatch = prod;
              }
            }
          });
          return {
            ...cand,
            link:
              bestMatch?.link ||
              `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(
                cand.name
              )}`,
          };
        }),
      }));
    } catch {
      parseError = true;
      isJsonResponse = false;
    }
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 shadow
          ${isUser
            ? "bg-blue-500 text-white self-end rounded-br-none"
            : "bg-white text-gray-900 self-start rounded-bl-none border"}
        `}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap break-words">{message.text}</div>
        ) : isLoadingMsg ? (
          <div className="text-gray-400">AI 응답을 생성 중입니다...</div>
        ) : parseError && !isJsonResponse ? (
          // 부품별 카드+버튼 형태로 출력
          <div>
            {renderPartCardsFromText(message.text) ||
              <div className="whitespace-pre-wrap break-words">{message.text}</div>
            }
          </div>
        ) : (
          <>
            <div>
              {parts.map((part) => (
                <PartCard key={part.part} part={part.part} candidates={part.candidates} />
              ))}
            </div>
            {warning && (
              <div className="mt-2 text-red-600 font-semibold">{warning}</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

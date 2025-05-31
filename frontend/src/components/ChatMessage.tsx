import React from "react";

interface Candidate {
  name: string;
  reason: string;
  link?: string;
}

interface PartRecommendation {
  part: string;
  candidates: Candidate[];
}

interface Product {
  part: string;
  name: string;
  link: string;
}

interface ChatMessageProps {
  message: { role: "user" | "assistant"; text: string };
  naverProducts?: Product[]; // 네이버 API에서 받아온 전체 후보 리스트
}

// 문자열 유사도(부분 일치 + 대소문자 무시) 계산 함수
function getSimilarity(a: string, b: string) {
  const normA = a.replace(/\s/g, "").toLowerCase();
  const normB = b.replace(/\s/g, "").toLowerCase();
  if (normA === normB) return 100;
  if (normA.includes(normB) || normB.includes(normA)) return 80;
  // 공통 부분 길이 기준 간단 유사도
  let common = 0;
  for (let i = 0; i < Math.min(normA.length, normB.length); i++) {
    if (normA[i] === normB[i]) common++;
    else break;
  }
  return common;
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
              <a
                href={
                  cand.link ||
                  `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(
                    cand.name
                  )}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-2 py-0.5 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs font-medium ml-4"
              >
                이동
              </a>
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

export default function ChatMessage({ message, naverProducts = [] }: ChatMessageProps) {
  const isUser = message.role === "user";
  let parts: PartRecommendation[] = [];
  let warning = "";
  let parseError = false;
  const isLoadingMsg = message.role === "assistant" && message.text === "AI가 답변을 작성 중입니다...";

  if (message.role === "assistant" && !isLoadingMsg) {
    try {
      // 디버깅: GPT 응답 원문 출력
      // console.log("GPT 응답:", message.text);
      const parsed = JSON.parse(message.text);

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
        ) : parseError ? (
          <div className="text-red-500">AI 응답을 이해할 수 없습니다. 다시 시도해 주세요.</div>
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

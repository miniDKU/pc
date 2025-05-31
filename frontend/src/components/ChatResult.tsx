import React from "react";
import ProductTable from "./ProductTable";

interface Product {
  name: string;
  price: string;
  link: string;
  mall?: string;
  category?: string;
  part?: string;
  required?: boolean;
}

interface ChatResultProps {
  recommendation: string;
  products: Product[];
}

function formatRecommendation(text: string) {
  // 부품별 섹션을 찾아서 파싱
  const sections = text.split(/\[([^\]]+)\]/).filter(Boolean);
  const formattedSections = [];

  for (let i = 0; i < sections.length; i += 2) {
    const partName = sections[i];
    const content = sections[i + 1];
    if (!content) continue;

    // 제품명, 추천 이유, 링크 추출
    const productMatch = content.match(/제품:\s*([^\n]+)/);
    const reasonMatch = content.match(/추천 이유:\s*([^\n]+(?:\n[^\n]+)*)/);
    const linkMatch = content.match(/링크:\s*([^\n]+)/);

    if (productMatch) {
      formattedSections.push(
        <div key={partName} className="mb-8 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-blue-600 text-white px-6 py-3">
            <h3 className="text-xl font-semibold">{partName.trim()}</h3>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <h4 className="text-lg font-semibold text-gray-900">
                {productMatch[1].trim()}
              </h4>
            </div>
            {reasonMatch && (
              <div className="mb-4 text-gray-600 whitespace-pre-line">
                {reasonMatch[1].trim()}
              </div>
            )}
            {linkMatch && (
              <div className="mt-4">
                <a
                  href={linkMatch[1].trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white rounded-md text-sm font-medium transition-colors"
                >
                  네이버 쇼핑에서 보기
                </a>
              </div>
            )}
          </div>
        </div>
      );
    }
  }

  return formattedSections;
}

export default function ChatResult({ recommendation, products }: ChatResultProps) {
  if (!recommendation) return null;

  return (
    <div className="mt-6">
      <div className="space-y-4">
        {formatRecommendation(recommendation)}
      </div>
    </div>
  );
}

// ...이 컴포넌트는 채팅형 UI로 변경되어 더 이상 사용되지 않습니다...
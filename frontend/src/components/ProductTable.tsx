import React from "react";

interface Product {
  name: string;
  price: string;
  link: string;
  mall?: string;
  category?: string;
  part?: string;
  required?: boolean;
}

interface ProductTableProps {
  products: Product[];
}

// 부품별 규격 정보 정의
const partSpecs: Record<string, string[]> = {
  "CPU": ["제조사", "코어 수", "기본 클럭", "최대 클럭", "TDP"],
  "메인보드": ["제조사", "소켓", "폼팩터", "칩셋"],
  "메모리": ["제조사", "용량", "규격", "클럭"],
  "SSD": ["제조사", "용량", "타입", "인터페이스"],
  "파워서플라이": ["제조사", "출력", "인증", "팬 크기"],
  "케이스": ["제조사", "크기", "폼팩터", "쿨링"],
  "그래픽카드": ["제조사", "칩셋", "메모리", "코어 클럭"]
};

// 제조사 목록
const manufacturers = {
  CPU: ["AMD", "Intel"],
  메인보드: ["ASUS", "MSI", "GIGABYTE", "ASRock"],
  메모리: ["삼성전자", "G.SKILL", "CORSAIR", "TeamGroup", "Kingston"],
  SSD: ["삼성전자", "WD", "Seagate", "마이크론", "SK하이닉스", "ADATA"],
  파워서플라이: ["시소닉", "마이크로닉스", "CORSAIR", "be quiet!", "쿨러마스터"],
  케이스: ["ABKO", "darkFlash", "마이크로닉스", "CORSAIR", "be quiet!", "쿨러마스터"],
  그래픽카드: ["NVIDIA", "AMD", "ASUS", "MSI", "GIGABYTE", "ZOTAC"]
};

// 제품명에서 규격 정보 추출
function extractSpecs(name: string, part: string): string[] {
  const specs = partSpecs[part] || [];
  const result = specs.map(() => "-");
  
  // 제조사 추출
  const manus = manufacturers[part as keyof typeof manufacturers] || [];
  const foundManu = manus.find(m => name.toUpperCase().includes(m.toUpperCase()));
  if (foundManu) result[0] = foundManu;

  switch (part) {
    case "CPU": {
      // 코어 수 추출 (예: "6코어", "8코어")
      const coreMatch = name.match(/(\d+)코어/);
      if (coreMatch) result[1] = `${coreMatch[1]}코어`;
      
      // 클럭 추출 (예: "3.7GHz", "4.7GHz")
      const clockMatches = name.match(/(\d+\.?\d*)(?:GHz|MHz)/g);
      if (clockMatches) {
        if (clockMatches[0]) result[2] = clockMatches[0];
        if (clockMatches[1]) result[3] = clockMatches[1];
      }
      
      // TDP 추출 (예: "65W", "105W")
      const tdpMatch = name.match(/(\d+)W/);
      if (tdpMatch) result[4] = `${tdpMatch[1]}W`;
      break;
    }
    case "메모리": {
      // 용량 추출 (예: "16GB", "32GB")
      const capMatch = name.match(/(\d+)(?:GB|TB)/);
      if (capMatch) result[1] = capMatch[0];
      
      // 규격 추출 (예: "DDR4", "DDR5")
      const typeMatch = name.match(/(DDR\d)/i);
      if (typeMatch) result[2] = typeMatch[1].toUpperCase();
      
      // 클럭 추출 (예: "3200", "5600")
      const clockMatch = name.match(/(\d{4})/);
      if (clockMatch) result[3] = `${clockMatch[1]}MHz`;
      break;
    }
    case "SSD": {
      // 용량 추출 (예: "500GB", "1TB", "2TB")
      const capMatch = name.match(/(\d+(?:\.\d+)?)(TB|GB)/);
      if (capMatch) result[1] = `${capMatch[1]}${capMatch[2]}`;
      
      // 타입 추출 (SSD/HDD)
      if (name.toUpperCase().includes('SSD')) result[2] = 'SSD';
      else if (name.toUpperCase().includes('HDD')) result[2] = 'HDD';
      
      // 인터페이스 추출
      if (name.toUpperCase().includes('NVME')) result[3] = 'NVMe';
      else if (name.toUpperCase().includes('SATA')) result[3] = 'SATA';
      break;
    }
    case "파워서플라이": {
      // 출력 추출 (예: "650W", "750W")
      const wattMatch = name.match(/(\d+)W/);
      if (wattMatch) result[1] = `${wattMatch[1]}W`;
      
      // 인증 추출 (예: "80 PLUS Gold", "80 PLUS Platinum")
      const certMatch = name.match(/80\s*PLUS\s*(Bronze|Silver|Gold|Platinum|Titanium)/i);
      if (certMatch) result[2] = `80 PLUS ${certMatch[1]}`;
      break;
    }
    case "그래픽카드": {
      // 칩셋 추출 (예: "RTX 4070", "RX 7800")
      const chipsetMatch = name.match(/(RTX|GTX|RX)\s*\d{4}/i);
      if (chipsetMatch) result[1] = chipsetMatch[0].toUpperCase();
      
      // 메모리 용량 추출 (예: "12GB", "16GB")
      const memMatch = name.match(/(\d+)GB/);
      if (memMatch) result[2] = `${memMatch[1]}GB`;
      break;
    }
  }
  
  return result;
}

export default function ProductTable({ products }: ProductTableProps) {
  // 부품 종류별로 그룹화
  const groupedProducts = products.reduce((acc, product) => {
    const part = product.part || "기타";
    if (!acc[part]) {
      acc[part] = [];
    }
    acc[part].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  // 필수 부품을 먼저 정렬
  const sortedParts = Object.keys(groupedProducts).sort((a, b) => {
    const aRequired = groupedProducts[a][0]?.required ?? true;
    const bRequired = groupedProducts[b][0]?.required ?? true;
    if (aRequired && !bRequired) return -1;
    if (!aRequired && bRequired) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="mt-8 space-y-8">
      {sortedParts.map((part) => (
        <div key={part} className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-blue-600 text-white px-6 py-3 flex items-center justify-between">
            <h3 className="text-xl font-semibold">{part}</h3>
            {!groupedProducts[part][0]?.required && (
              <span className="bg-yellow-500 text-white text-sm px-3 py-1 rounded-full">
                선택 사항
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                    제품명
                  </th>
                  {partSpecs[part]?.map((spec, idx) => (
                    <th
                      key={idx}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {spec}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    가격
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    판매처
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {groupedProducts[part].map((product, idx) => {
                  const specs = extractSpecs(product.name, part);
                  return (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-normal">
                        <div className="flex flex-col">
                          <a
                            href={product.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {product.name}
                          </a>
                        </div>
                      </td>
                      {specs.map((spec, specIdx) => (
                        <td
                          key={specIdx}
                          className="px-4 py-4 text-sm text-gray-500"
                        >
                          {spec}
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-semibold text-blue-600">
                          {product.price}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                        {product.mall || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

// ...이 컴포넌트는 ChatMessage 내부로 통합되어 더 이상 사용되지 않습니다...
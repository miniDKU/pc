import React from "react";

interface Product {
  name: string;
  price: string;
  link: string;
}

interface ProductTableProps {
  products: Product[];
}

export default function ProductTable({ products }: ProductTableProps) {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 overflow-auto">
      <h3 className="text-lg font-semibold mb-2">다나와 제품 목록</h3>
      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-3 py-2 text-left">제품명</th>
            <th className="px-3 py-2 text-left">가격</th>
            <th className="px-3 py-2 text-left">링크</th>
          </tr>
        </thead>
        <tbody>
          {products.map((prod, idx) => (
            <tr key={idx} className="border-t">
              <td className="px-3 py-2">{prod.name}</td>
              <td className="px-3 py-2">{prod.price}</td>
              <td className="px-3 py-2">
                <a
                  href={prod.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  확인하기
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ...이 컴포넌트는 ChatMessage 내부로 통합되어 더 이상 사용되지 않습니다...
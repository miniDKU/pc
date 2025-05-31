import React from "react";
import ProductTable from "./ProductTable";

interface Product {
  name: string;
  price: string;
  link: string;
}

interface ChatResultProps {
  recommendation: string;
  products: Product[];
}

export default function ChatResult({ recommendation, products }: ChatResultProps) {
  if (!recommendation) return null;

  return (
    <div className="mt-6 bg-white p-4 rounded-md shadow-md">
      <h2 className="text-xl font-bold mb-2">AI 추천 결과</h2>
      <p className="whitespace-pre-wrap text-gray-800">{recommendation}</p>
      <ProductTable products={products} />
    </div>
  );
} 
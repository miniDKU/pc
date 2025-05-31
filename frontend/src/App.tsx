import React, { useState } from "react";
import api from "./api";
import ChatInput from "./components/ChatInput";
import ChatResult from "./components/ChatResult";

interface Product {
  name: string;
  price: string;
  link: string;
}

function App() {
  const [recommendation, setRecommendation] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const handlePromptSubmit = async (userPrompt: string) => {
    setLoading(true);
    setRecommendation("");
    setProducts([]);

    try {
      const response = await api.post("/recommend", { prompt: userPrompt });
      const data = response.data;
      setRecommendation(data.recommendation);
      setProducts(data.products);
    } catch (error) {
      console.error("에러 발생:", error);
      alert("추천 요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-extrabold text-center">🧑‍💻 PC 조립 도우미</h1>
      <div className="max-w-3xl mx-auto">
        <ChatInput onSubmit={handlePromptSubmit} loading={loading} />
        <ChatResult recommendation={recommendation} products={products} />
      </div>
    </div>
  );
}

export default App;

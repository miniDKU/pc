import React, { useState, useRef, useEffect } from "react";
import api from "./api";
import ChatInput from "./components/ChatInput";
import ChatMessage from "./components/ChatMessage";

interface Product {
  part: string;
  name: string;
  price: string;
  link: string;
}

type Message =
  | { role: "user"; text: string }
  | { role: "assistant"; text: string };

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [naverProducts, setNaverProducts] = useState<Product[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handlePromptSubmit = async (userPrompt: string) => {
    setMessages((prev) => [...prev, { role: "user", text: userPrompt }]);
    setLoading(true);

    try {
      const response = await api.post("/recommend", { prompt: userPrompt });
      const data = response.data;
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.recommendation,
        },
      ]);
      setNaverProducts(data.products); // 네이버 후보 전체 저장
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "추천 요청 중 오류가 발생했습니다.",
        },
      ]);
    } finally {
      setLoading(false); // 반드시 finally에서 loading을 false로!
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex flex-col">
      <header className="py-6 bg-white shadow text-center">
        <h1 className="text-3xl font-extrabold text-blue-700">🧑‍💻 PC 조립 도우미</h1>
        <p className="text-gray-500 mt-1">AI와 대화하며 PC 견적을 받아보세요!</p>
      </header>
      <main className="flex-1 flex flex-col items-center overflow-y-auto">
        <div className="w-full max-w-2xl flex-1 flex flex-col px-2 py-4">
          <div className="flex-1 flex flex-col gap-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 mt-10">
                <span>아래 입력창에 원하는 PC 용도와 예산을 입력해보세요!</span>
              </div>
            )}
            {messages.map((msg, idx) => (
              <ChatMessage
                key={idx}
                message={msg}
                naverProducts={msg.role === "assistant" ? naverProducts : []}
              />
            ))}
            {loading && (
              <ChatMessage
                message={{
                  role: "assistant",
                  text: "AI가 답변을 작성 중입니다...",
                }}
              />
            )}
            <div ref={chatEndRef} />
          </div>
        </div>
      </main>
      <footer className="w-full max-w-2xl mx-auto px-2 pb-4">
        <ChatInput onSubmit={handlePromptSubmit} loading={loading} />
      </footer>
    </div>
  );
}

export default App;

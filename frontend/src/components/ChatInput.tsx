import React, { useState } from "react";

interface ChatInputProps {
  onSubmit: (text: string) => void;
  loading: boolean;
}

export default function ChatInput({ onSubmit, loading }: ChatInputProps) {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) return;
    onSubmit(text.trim());
    setText("");
  };

  return (
    <div className="flex gap-2 mt-6">
      <textarea
        className="flex-1 p-2 border rounded-md focus:outline-none focus:ring"
        rows={3}
        placeholder="예) 게임용 PC 80만원 이하 추천해주세요"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={loading}
      />
      <button
        className={`px-4 py-2 rounded-md text-white ${
          loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
        }`}
        onClick={handleSend}
        disabled={loading}
      >
        {loading ? "로딩 중..." : "보내기"}
      </button>
    </div>
  );
} 
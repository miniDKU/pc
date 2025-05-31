import React, { useState } from "react";

interface ChatInputProps {
  onSubmit: (text: string) => void;
  loading: boolean;
}

export default function ChatInput({ onSubmit, loading }: ChatInputProps) {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim() || loading) return;
    onSubmit(text.trim());
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2 items-end bg-white rounded-lg shadow px-3 py-2">
      <textarea
        className="flex-1 p-2 border rounded-md focus:outline-none focus:ring resize-none"
        rows={2}
        placeholder="예) 게임용 PC 80만원 이하 추천해주세요"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loading}
        maxLength={300}
      />
      <button
        className={`px-4 py-2 rounded-md text-white font-semibold transition
          ${loading || !text.trim()
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"}
        `}
        onClick={handleSend}
        disabled={loading || !text.trim()}
      >
        {loading ? "로딩 중..." : "보내기"}
      </button>
    </div>
  );
}
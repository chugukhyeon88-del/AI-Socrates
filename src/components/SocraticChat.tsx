import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, MathProblem } from "../types";
import { Send, Sparkles, BrainCircuit, Lightbulb, RefreshCw, AlertCircle } from "lucide-react";

interface SocraticChatProps {
  problem: MathProblem;
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  studentAnswer: string;
  studentStep: string;
}

export default function SocraticChat({
  problem,
  messages,
  onSendMessage,
  isLoading,
  studentAnswer,
  studentStep,
}: SocraticChatProps) {
  const [inputText, setInputText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Quick Socratic suggestions
  const quickQuestions = [
    { label: "첫 단계 힌트 받기", text: "이 문제를 푸는 첫 단계는 어떻게 시작해야 할까요?" },
    { label: "내 풀이 검토 부탁하기", text: `제가 쓴 풀이 과정(${studentStep || "작성하지 않음"}) 중에서 잘못된 부분이 어딜까요?` },
    { label: "사용할 공식 힌트", text: "이 문제에서 사용해야 하는 수학 공식이나 성질을 알려주세요." },
    { label: "쉬운 예시 요청", text: "이해를 돕기 위해 더 간단한 수치를 사용한 비슷한 예시를 들어주세요." },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText);
    setInputText("");
  };

  const handleQuickQuestionClick = (text: string) => {
    if (isLoading) return;
    onSendMessage(text);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div id="socratic-tutor" className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[550px] transition-all">
      {/* Tutor Header */}
      <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <BrainCircuit className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-slate-100">소크라테스 AI 수학 코치</span>
              <span className="bg-indigo-500/10 text-[10px] text-indigo-300 border border-indigo-500/20 py-0.5 px-2 rounded-full font-semibold">Tutor</span>
            </div>
            <p className="text-[11px] text-slate-400">질문을 주고받으며 스스로 깨닫도록 돕는 인공지능 선생님</p>
          </div>
        </div>
      </div>

      {/* Warning/Guideline Label */}
      <div className="bg-amber-950/40 border-b border-amber-900/40 px-6 py-2.5 flex items-center gap-2">
        <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
        <p className="text-[11px] text-amber-200 font-medium">
          이 코치는 정답을 바로 알려주지 않고, 질문을 던져 여러분이 정답을 찾아가도록 유도합니다!
        </p>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="p-3 bg-slate-800 rounded-full text-slate-400">
              <Lightbulb className="w-8 h-8" />
            </div>
            <div className="max-w-xs">
              <h4 className="text-sm font-bold text-slate-300">소크라테스 코칭 대화방</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                답이 오답이거나 풀이에 영감이 필요할 때, 아래의 추천 질문 버튼을 누르거나 직접 궁금한 점을 코치에게 물어보세요!
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col ${
                msg.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] text-slate-400 font-medium">
                  {msg.role === "user" ? "나 (학생)" : "소크라테스 코치"}
                </span>
              </div>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-tr-none"
                    : "bg-slate-800 text-slate-100 border border-slate-700/60 rounded-tl-none font-medium"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex items-start gap-1.5">
            <div className="bg-slate-800 rounded-2xl px-4 py-3 border border-slate-700 text-xs text-slate-400 flex items-center gap-2 rounded-tl-none">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>소크라테스 코치가 답변을 생각하는 중...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Socratic Recommendation Buttons */}
      <div className="px-6 py-2 border-t border-slate-800 bg-slate-950/40 overflow-x-auto whitespace-nowrap flex gap-2 no-scrollbar">
        {quickQuestions.map((q, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleQuickQuestionClick(q.text)}
            disabled={isLoading}
            className="inline-flex items-center gap-1 py-1 px-3 rounded-lg border border-slate-700/60 bg-slate-800/40 hover:bg-slate-800 text-xs text-slate-300 hover:text-white transition-all whitespace-nowrap disabled:opacity-50"
          >
            <Lightbulb className="w-3 h-3 text-amber-400" />
            {q.label}
          </button>
        ))}
      </div>

      {/* Custom Input form */}
      <form onSubmit={handleSubmit} className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="질문을 하거나 나의 생각 단계를 적어보세요..."
          className="flex-1 bg-slate-900 border border-slate-800 text-sm text-slate-100 rounded-xl py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl shadow-md transition-all disabled:opacity-50 disabled:hover:bg-indigo-600 flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

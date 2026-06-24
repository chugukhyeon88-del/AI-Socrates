import React, { useState } from "react";
import { Sparkles, FileEdit, GraduationCap, Compass, Activity, ArrowRight, BookOpen } from "lucide-react";
import { MathProblem } from "../types";

interface ProblemGeneratorFormProps {
  onGenerate: (config: { grade: string; topic: string; difficulty: string }) => Promise<void>;
  onCustomProblemSubmit: (problemText: string) => void;
  isLoading: boolean;
}

export default function ProblemGeneratorForm({ onGenerate, onCustomProblemSubmit, isLoading }: ProblemGeneratorFormProps) {
  const [activeTab, setActiveTab] = useState<"ai" | "custom">("ai");

  // AI Generation configuration state
  const [grade, setGrade] = useState("중등 (중학생)");
  const [topic, setTopic] = useState("algebra");
  const [difficulty, setDifficulty] = useState("중");

  // Custom problem input state
  const [customProblemText, setCustomProblemText] = useState("");

  const topics = [
    { value: "arithmetic", label: "기초 연산 (사칙연산 등)" },
    { value: "algebra", label: "대수학 (방정식, 부등식)" },
    { value: "geometry", label: "기하학 (도형의 성질, 부피, 넓이)" },
    { value: "functions", label: "함수와 그래프 (일차/이차함수 등)" },
    { value: "stats", label: "확률과 통계 (평균, 경우의 수 등)" },
    { value: "calculus", label: "미적분학 기초 (극한, 미분과 적분)" }
  ];

  const handleAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const topicLabel = topics.find(t => t.value === topic)?.label || topic;
    onGenerate({ grade, topic: topicLabel, difficulty });
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customProblemText.trim()) return;
    onCustomProblemSubmit(customProblemText);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-6">
      {/* Custom Tabs */}
      <div className="flex border-b border-slate-100 bg-slate-50/50 p-1">
        <button
          onClick={() => setActiveTab("ai")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "ai"
              ? "bg-white text-indigo-600 shadow-sm border border-slate-100"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          AI 맞춤형 문제 생성
        </button>
        <button
          onClick={() => setActiveTab("custom")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "custom"
              ? "bg-white text-indigo-600 shadow-sm border border-slate-100"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <FileEdit className="w-4 h-4" />
          내 숙제/직접 문제 쓰기
        </button>
      </div>

      <div className="p-6">
        {activeTab === "ai" ? (
          /* AI Problem Generation Form */
          <form onSubmit={handleAiSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Grade selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-indigo-500" />
                  학년 선택
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                >
                  <option value="초등 (초등학생)">초등학생</option>
                  <option value="중등 (중학생)">중학생 (일반)</option>
                  <option value="고등 (고등학생)">고등학생 (심화)</option>
                </select>
              </div>

              {/* Topic selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-indigo-500" />
                  주제 / 단원
                </label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                >
                  {topics.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-indigo-500" />
                  난이도
                </label>
                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                  {["하", "중", "상"].map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        difficulty === diff
                          ? "bg-white text-indigo-600 shadow-sm border border-slate-100"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {diff === "하" ? "쉬움 (하)" : diff === "중" ? "보통 (중)" : "어려움 (상)"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all focus:ring-2 focus:ring-indigo-500 ${
                isLoading ? "opacity-75 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>AI 수학 문제 만드는 중...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>소크라테스 AI 맞춤 문제 출제하기</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* Custom Problem Registration Form */
          <form onSubmit={handleCustomSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                문제 지문 입력
              </label>
              <textarea
                value={customProblemText}
                onChange={(e) => setCustomProblemText(e.target.value)}
                placeholder="풀어보고 싶은 수학 문제나 숙제 문항을 직접 입력해주세요.&#13;&#10;예: '두 수의 합이 24이고 차가 6일 때, 두 수의 곱을 구하여라.'"
                rows={4}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm text-slate-700 placeholder:text-slate-400 font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={!customProblemText.trim()}
              className="w-full bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <ArrowRight className="w-5 h-5" />
              <span>이 문제로 소크라테스 튜터 시작하기</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

import React from "react";
import { UserStats } from "../types";
import { Trophy, Flame, BrainCircuit, CheckCircle2, TrendingUp } from "lucide-react";

interface StatsDashboardProps {
  stats: UserStats;
  onResetStats?: () => void;
}

export default function StatsDashboard({ stats, onResetStats }: StatsDashboardProps) {
  // Safe parsing of topic names to Korean
  const topicLabels: { [key: string]: string } = {
    arithmetic: "기초 연산 (산수)",
    algebra: "대수학 (방정식/부등식)",
    geometry: "기하학 (도형)",
    functions: "함수와 그래프",
    stats: "확률과 통계",
    calculus: "미적분학"
  };

  const totalSolved = stats.solvedCount;
  const accuracy = stats.totalAttempts > 0 
    ? Math.round((stats.solvedCount / stats.totalAttempts) * 100) 
    : 0;

  return (
    <div id="stats-dashboard" className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            나의 수학 도전 대시보드
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            소크라테스 튜터와 함께 깊게 생각하는 수학 학습 통계입니다.
          </p>
        </div>
        
        {onResetStats && (
          <button 
            onClick={onResetStats}
            className="text-xs text-slate-400 hover:text-red-500 transition-colors font-medium self-end sm:self-center"
          >
            기록 초기화
          </button>
        )}
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Stat 1: Solved Count */}
        <div className="bg-slate-50 border border-slate-100/50 p-4 rounded-xl flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">해결한 문제</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{totalSolved}개</p>
          </div>
        </div>

        {/* Stat 2: Streak */}
        <div className="bg-slate-50 border border-slate-100/50 p-4 rounded-xl flex items-start gap-3">
          <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">연속 학습 일수</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{stats.streak}일</p>
          </div>
        </div>

        {/* Stat 3: Breakthroughs */}
        <div className="bg-slate-50 border border-slate-100/50 p-4 rounded-xl flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-700 animate-pulse">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">스스로 정답 해결</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{stats.socraticBreakthroughs}회</p>
          </div>
        </div>

        {/* Stat 4: Accuracy */}
        <div className="bg-slate-50 border border-slate-100/50 p-4 rounded-xl flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">제출 성공률</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{accuracy}%</p>
          </div>
        </div>
      </div>

      {/* Topic Mastery Progress Bars */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-indigo-500" />
          단원별 이해도 (Mastery)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
          {Object.entries(stats.topicMastery).map(([topic, mastery]) => (
            <div key={topic} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 font-medium">
                  {topicLabels[topic] || topic}
                </span>
                <span className="text-slate-500 font-bold">{mastery}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    mastery >= 80 ? "bg-emerald-500" :
                    mastery >= 50 ? "bg-indigo-500" :
                    mastery >= 20 ? "bg-amber-500" : "bg-slate-300"
                  }`}
                  style={{ width: `${mastery}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

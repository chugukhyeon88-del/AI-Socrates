import React from "react";
import { Brain, HelpCircle, CheckCircle, Lightbulb, Users } from "lucide-react";

export default function WelcomeIntro() {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-100 rounded-2xl p-6 md:p-8 mb-6 shadow-sm">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="flex-1 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100/60 border border-indigo-200 text-xs text-indigo-700 font-bold">
            <Brain className="w-3.5 h-3.5" />
            소크라테스 대화식 학습법 (Socratic Method)
          </div>
          
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight leading-tight">
            질문과 답변으로 배우는 <span className="text-indigo-600">AI 수학 과외 선생님</span>
          </h1>
          
          <p className="text-slate-600 text-sm md:text-base leading-relaxed">
            단순히 정답과 완제품 풀이를 복사해 붙여넣는 일방적인 공부는 이제 그만! 
            틀린 문제가 생기면 <strong>소크라테스 AI 코치</strong>가 실수를 발견하는 힌트 질문을 던져, 
            결국 여러분의 손으로 직접 최종 정답을 풀어내도록 도와줍니다.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="flex gap-2.5 items-start">
              <div className="p-1 rounded-lg bg-indigo-100 text-indigo-600 font-bold text-xs mt-0.5">01</div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">문제 풀이 도전</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">AI 출제 문제나 숙제를 등록하고 직접 정답을 적어요.</p>
              </div>
            </div>

            <div className="flex gap-2.5 items-start">
              <div className="p-1 rounded-lg bg-indigo-100 text-indigo-600 font-bold text-xs mt-0.5">02</div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">질문하며 생각 넓히기</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">정답이 틀려도 괜찮아요! AI 코치와 단계를 밟아가요.</p>
              </div>
            </div>

            <div className="flex gap-2.5 items-start">
              <div className="p-1 rounded-lg bg-indigo-100 text-indigo-600 font-bold text-xs mt-0.5">03</div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">스스로 해결! (Breakthrough)</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">스스로 정답을 풀었을 때 찾아오는 지적 짜릿함!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info card */}
        <div className="w-full md:w-80 bg-white border border-slate-100 p-5 rounded-xl shadow-sm space-y-3 shrink-0">
          <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            왜 소크라테스식 학습일까요?
          </h3>
          <ul className="space-y-2.5 text-xs text-slate-600">
            <li className="flex gap-2">
              <span className="text-indigo-500 font-bold">✓</span>
              <span>수식을 암기하지 않고 <strong>수학적 원리</strong>를 깨우치게 됩니다.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-500 font-bold">✓</span>
              <span>나만의 계산 오개념을 <strong>AI가 맞춤형</strong>으로 교정해 줍니다.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-500 font-bold">✓</span>
              <span>스스로 풀어낸 성취감으로 <strong>수학 공부 근육</strong>이 튼튼해집니다.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

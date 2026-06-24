import React, { useState, useEffect } from "react";
import { MathProblem, ChatMessage, UserStats, ActiveProblemState } from "./types";
import StatsDashboard from "./components/StatsDashboard";
import ProblemGeneratorForm from "./components/ProblemGeneratorForm";
import SocraticChat from "./components/SocraticChat";
import WelcomeIntro from "./components/WelcomeIntro";
import { 
  Brain, 
  BookOpen, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Award, 
  ArrowRight, 
  Sparkles, 
  PenTool, 
  ChevronDown, 
  ChevronUp,
  BarChart2
} from "lucide-react";

const DEFAULT_STATS: UserStats = {
  solvedCount: 0,
  totalAttempts: 0,
  streak: 1,
  socraticBreakthroughs: 0,
  lastActiveDate: new Date().toLocaleDateString(),
  topicMastery: {
    arithmetic: 10,
    algebra: 10,
    geometry: 5,
    functions: 5,
    stats: 0,
    calculus: 0
  }
};

export default function App() {
  // Persistence of user stats
  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem("socratic_math_stats");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Verify structure
        if (parsed.topicMastery) return parsed;
      } catch (e) {
        console.error("Failed to parse saved stats", e);
      }
    }
    return DEFAULT_STATS;
  });

  // Save stats to LocalStorage whenever they change
  useEffect(() => {
    localStorage.setItem("socratic_math_stats", JSON.stringify(stats));
  }, [stats]);

  // Collapsible sections
  const [showStats, setShowStats] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  // States for active problem workspace
  const [problemState, setProblemState] = useState<ActiveProblemState>({
    problem: null,
    studentAnswer: "",
    studentStep: "",
    isEvaluated: false,
    isCorrect: null,
    feedback: null,
    hasUsedTutor: false,
    isBreakthrough: false
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Parse generated problem topic to update appropriate mastery category
  const getTopicKey = (problemTopic: string): string => {
    const topic = problemTopic.toLowerCase();
    if (topic.includes("연산") || topic.includes("산수") || topic.includes("arithmetic")) return "arithmetic";
    if (topic.includes("대수학") || topic.includes("방정식") || topic.includes("부등식") || topic.includes("algebra")) return "algebra";
    if (topic.includes("기하") || topic.includes("도형") || topic.includes("부피") || topic.includes("geometry")) return "geometry";
    if (topic.includes("함수") || topic.includes("그래프") || topic.includes("functions")) return "functions";
    if (topic.includes("통계") || topic.includes("확률") || topic.includes("경우의 수") || topic.includes("stats")) return "stats";
    if (topic.includes("미적분") || topic.includes("극한") || topic.includes("calculus")) return "calculus";
    return "arithmetic"; // default fallback
  };

  // Helper: Increment streak if active on a new day
  useEffect(() => {
    const todayStr = new Date().toLocaleDateString();
    if (stats.lastActiveDate && stats.lastActiveDate !== todayStr) {
      // Calculate day difference if desired, or simply increment
      setStats(prev => ({
        ...prev,
        streak: prev.streak + 1,
        lastActiveDate: todayStr
      }));
    }
  }, []);

  // Handler: Generate Problem via Server
  const handleGenerateProblem = async (config: { grade: string; topic: string; difficulty: string }) => {
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/generate-problem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      const resData = await response.json();
      
      if (!resData.success) {
        throw new Error(resData.error || "문제를 가져오지 못했습니다.");
      }

      const problem: MathProblem = resData.data;

      // Set active problem state
      setProblemState({
        problem: problem,
        studentAnswer: "",
        studentStep: "",
        isEvaluated: false,
        isCorrect: null,
        feedback: null,
        hasUsedTutor: false,
        isBreakthrough: false
      });
      setChatMessages([]); // clear chat
      setShowIntro(false); // Collapse intro banner to save space
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "문제를 생성하는 도중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler: Register Custom Homework Problem
  const handleCustomProblemSubmit = (problemText: string) => {
    const customProblem: MathProblem = {
      problem: problemText,
      type: "short-answer",
      options: [],
      correctAnswer: "학인 불가 (수동 판별)", // Custom questions don't have built-in correct answer
      explanation: "학생이 직접 등록한 질문입니다. 질문 단계별 유도가 핵심입니다."
    };

    setProblemState({
      problem: customProblem,
      studentAnswer: "",
      studentStep: "",
      isEvaluated: false,
      isCorrect: null,
      feedback: null,
      hasUsedTutor: true, // Auto-enable tutor because it's custom
      isBreakthrough: false
    });

    setChatMessages([]);
    setErrorMessage(null);
    setShowIntro(false);

    // Immediately trigger Socratic Coach first greeting for custom problem
    triggerInitialSocraticGreeting(customProblem, "", "");
  };

  // Helper to trigger Socratic Coach first greeting on incorrect answer
  const triggerInitialSocraticGreeting = async (problem: MathProblem, answer: string, steps: string) => {
    setIsChatLoading(true);
    try {
      const initialSystemPrompt = `안녕하세요! 제가 수학 문제를 풀다가 오답을 내거나 도움이 필요합니다.
우리가 함께 풀어볼 문제는 아래와 같습니다:
"${problem.problem}"

- 제가 처음 적은 풀이: "${steps || "아직 작성하지 않음"}"
- 제가 처음 쓴 답: "${answer || "아직 적지 않음"}"

선생님의 팁 비공개 자료: "${problem.explanation}"

저를 지도해 줄 첫 소크라테스식 힌트 질문이나 격려의 인사를 건네주세요. 절대 최종 정답이나 완성된 풀이를 직접 공개하지 마세요.`;

      const messagesToSend = [
        { role: "user" as const, content: initialSystemPrompt, timestamp: new Date() }
      ];

      const response = await fetch("/api/socratic-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem: problem.problem,
          correctAnswer: problem.correctAnswer,
          explanation: problem.explanation,
          messages: messagesToSend,
          studentAnswer: answer,
          studentStep: steps
        })
      });

      const resData = await response.json();
      if (resData.success) {
        setChatMessages([
          { role: "model", content: resData.content, timestamp: new Date() }
        ]);
      }
    } catch (err) {
      console.error("Failed to load initial greeting", err);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Handler: Evaluate Student's Answer via Server
  const handleCheckAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problemState.problem || isEvaluating) return;

    const { problem, studentAnswer, studentStep, hasUsedTutor } = problemState;
    
    // For custom problems, we always rely on tutor chat to discuss correctness since there is no standard solution
    if (problem.correctAnswer === "학인 불가 (수동 판별)") {
      setProblemState(prev => ({
        ...prev,
        isEvaluated: true,
        isCorrect: false,
        feedback: "이 문제는 직접 등록하신 개별 문항이므로, 정답 검증 및 풀이 검토는 아래 '소크라테스 AI 코치' 대화창을 통해 대화하며 함께 진행해보세요!"
      }));
      return;
    }

    setIsEvaluating(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/check-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem: problem.problem,
          correctAnswer: problem.correctAnswer,
          studentAnswer,
          studentStep,
          explanation: problem.explanation
        })
      });

      const resData = await response.json();
      if (!resData.success) {
        throw new Error(resData.error || "정답 확인 과정 중 실패했습니다.");
      }

      const isCorrect = resData.isCorrect;
      const feedback = resData.feedback;

      // Update statistics
      setStats(prev => {
        const attempts = prev.totalAttempts + 1;
        let solved = prev.solvedCount;
        let breakthroughs = prev.socraticBreakthroughs;
        let updatedMastery = { ...prev.topicMastery };

        const topicKey = getTopicKey(problem.explanation || "");

        if (isCorrect) {
          solved += 1;
          // If they solved it after talking with tutor (meaning they got it wrong first, or hasUsedTutor is active)
          if (hasUsedTutor) {
            breakthroughs += 1;
          }
          // Increase topic mastery by 10% (max 100)
          updatedMastery[topicKey] = Math.min(100, (updatedMastery[topicKey] || 0) + 10);
        }

        return {
          ...prev,
          totalAttempts: attempts,
          solvedCount: solved,
          socraticBreakthroughs: breakthroughs,
          topicMastery: updatedMastery
        };
      });

      setProblemState(prev => ({
        ...prev,
        isEvaluated: true,
        isCorrect,
        feedback,
        isBreakthrough: isCorrect && prev.hasUsedTutor
      }));

      // If they got it wrong, auto-trigger Socratic AI Tutor if chat is empty
      if (!isCorrect && chatMessages.length === 0) {
        setProblemState(prev => ({ ...prev, hasUsedTutor: true }));
        triggerInitialSocraticGreeting(problem, studentAnswer, studentStep);
      }

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "답안을 평가하는 중에 문제가 발생했습니다.");
    } finally {
      setIsEvaluating(false);
    }
  };

  // Handler: Chat Message from Student to AI Tutor
  const handleSendTutorMessage = async (text: string) => {
    if (!problemState.problem || isChatLoading) return;

    // Add user message to state
    const userMsg: ChatMessage = { role: "user", content: text, timestamp: new Date() };
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setIsChatLoading(true);

    try {
      const response = await fetch("/api/socratic-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem: problemState.problem.problem,
          correctAnswer: problemState.problem.correctAnswer,
          explanation: problemState.problem.explanation,
          messages: updatedMessages,
          studentAnswer: problemState.studentAnswer,
          studentStep: problemState.studentStep
        })
      });

      const resData = await response.json();
      if (!resData.success) {
        throw new Error(resData.error || "AI 대화 전송에 실패했습니다.");
      }

      setChatMessages(prev => [
        ...prev,
        { role: "model", content: resData.content, timestamp: new Date() }
      ]);

      // Set that tutor is being used
      setProblemState(prev => ({ ...prev, hasUsedTutor: true }));
    } catch (err: any) {
      console.error(err);
      setChatMessages(prev => [
        ...prev,
        { role: "model", content: "앗, 미안해! 통신 장애가 발생한 것 같아. 다시 한번 차근차근 질문해 주겠니?", timestamp: new Date() }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Handler: Reset Workspace for New Problem
  const handleResetWorkspace = () => {
    setProblemState({
      problem: null,
      studentAnswer: "",
      studentStep: "",
      isEvaluated: false,
      isCorrect: null,
      feedback: null,
      hasUsedTutor: false,
      isBreakthrough: false
    });
    setChatMessages([]);
    setErrorMessage(null);
  };

  // Handler: Reset Local Storage Stats
  const handleResetStats = () => {
    if (window.confirm("수학 도전 및 이해도 통계를 초기화하시겠습니까?")) {
      setStats(DEFAULT_STATS);
      localStorage.setItem("socratic_math_stats", JSON.stringify(DEFAULT_STATS));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans">
      {/* Dynamic Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-md shadow-indigo-600/15">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 leading-tight tracking-tight flex items-center gap-1.5">
                AI Socratic Math Tutor
              </h1>
              <p className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">질문으로 스스로 배우는 수학 교실</p>
            </div>
          </div>

          {/* Top Quick Status stats */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-lg text-orange-700 text-xs font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              연속 {stats.streak}일차 불꽃!
            </div>

            <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg text-emerald-700 text-xs font-bold">
              지식 돌파 {stats.socraticBreakthroughs}회
            </div>

            <button
              onClick={() => setShowStats(!showStats)}
              className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 text-xs font-bold transition-all"
            >
              <BarChart2 className="w-3.5 h-3.5 text-slate-500" />
              {showStats ? "차트 닫기" : "나의 성적표"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Toggleable Intro Banner */}
        <div className="mb-4 flex items-center justify-between">
          <button 
            onClick={() => setShowIntro(!showIntro)}
            className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1"
          >
            {showIntro ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            소크라테스식 공부법이란? {showIntro ? "닫기" : "자세히 보기"}
          </button>
        </div>
        
        {showIntro && <WelcomeIntro />}

        {/* Toggleable Dashboard */}
        {showStats && (
          <StatsDashboard stats={stats} onResetStats={handleResetStats} />
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-sm font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            {errorMessage}
          </div>
        )}

        {/* CORE WORKSPACE */}
        {!problemState.problem ? (
          /* NO ACTIVE PROBLEM: Show problem generation form */
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-6">
              <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">Step 1</span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-2">풀어볼 수학 문제 결정하기</h2>
              <p className="text-sm text-slate-500 mt-1">AI 맞춤형 문제를 출제하거나 학교/학원 숙제 문항을 직접 적어 보세요.</p>
            </div>
            <ProblemGeneratorForm
              onGenerate={handleGenerateProblem}
              onCustomProblemSubmit={handleCustomProblemSubmit}
              isLoading={isGenerating}
            />
          </div>
        ) : (
          /* ACTIVE PROBLEM: Show workspace and tutoring chat split */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left side: Problem Workbook Panel (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                
                {/* Workbook Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">문제 풀이 연습장</span>
                  </div>
                  <button
                    onClick={handleResetWorkspace}
                    className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    다른 문제 풀기
                  </button>
                </div>

                {/* Problem Body */}
                <div className="p-6 md:p-8">
                  <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-inner mb-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-indigo-600 text-[10px] text-white font-extrabold tracking-widest px-3.5 py-1 rounded-bl-xl uppercase shadow-md">
                      Q
                    </div>
                    <p className="text-base md:text-lg font-bold leading-relaxed whitespace-pre-line font-serif text-slate-100">
                      {problemState.problem.problem}
                    </p>
                  </div>

                  {/* Submission Form */}
                  <form onSubmit={handleCheckAnswer} className="space-y-6">
                    
                    {/* Draft Workspace (풀이 연습용 공란) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <PenTool className="w-3.5 h-3.5 text-indigo-500" />
                          나의 생각 및 풀이 단계 (선택 사항)
                        </label>
                        <span className="text-[10px] text-slate-400">코치가 풀이 단계를 읽고 실수를 교정해 줍니다.</span>
                      </div>
                      <textarea
                        value={problemState.studentStep}
                        onChange={(e) => setProblemState(prev => ({ ...prev, studentStep: e.target.value }))}
                        placeholder="이곳에 식을 전개하거나 생각하는 흐름을 편하게 적어 보세요. 오답일 때 코치가 아주 구체적인 오류를 찾아낼 수 있습니다!&#13;&#10;예: '양변에 5를 곱해서 분모를 없앴고, x를 좌변으로 넘겼어.'"
                        rows={5}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm text-slate-700 placeholder:text-slate-400 font-mono"
                        disabled={problemState.isCorrect === true}
                      />
                    </div>

                    {/* Final Answer Input */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-indigo-500" />
                        최종 정답 선택 및 기입
                      </label>

                      {problemState.problem.type === "multiple-choice" && problemState.problem.options.length > 0 ? (
                        /* Render 4 multiple-choice options */
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {problemState.problem.options.map((option, idx) => {
                            const isSelected = problemState.studentAnswer === option;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setProblemState(prev => ({ ...prev, studentAnswer: option }))}
                                disabled={problemState.isCorrect === true}
                                className={`text-left p-4 rounded-xl border text-sm font-semibold transition-all ${
                                  isSelected
                                    ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 ring-2 ring-indigo-600/20"
                                    : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                                }`}
                              >
                                <span className="inline-block bg-slate-100 text-slate-600 rounded px-1.5 py-0.5 mr-2.5 text-xs font-black">
                                  {idx + 1}
                                </span>
                                {option}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        /* Render standard text/numeric short answer input */
                        <input
                          type="text"
                          value={problemState.studentAnswer}
                          onChange={(e) => setProblemState(prev => ({ ...prev, studentAnswer: e.target.value }))}
                          placeholder="수치나 수식 정답을 적어주세요. (예: 15 또는 x=4)"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                          disabled={problemState.isCorrect === true}
                        />
                      )}
                    </div>

                    {/* Action buttons */}
                    {problemState.isCorrect !== true && (
                      <button
                        type="submit"
                        disabled={isEvaluating || !problemState.studentAnswer.trim()}
                        className={`w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all`}
                      >
                        {isEvaluating ? (
                          <>
                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span>AI 정답 확인 중...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5" />
                            <span>내 정답 제출하기</span>
                          </>
                        )}
                      </button>
                    )}
                  </form>
                </div>

                {/* Submission Feedback Panel */}
                {problemState.isEvaluated && problemState.feedback && (
                  <div className={`p-6 border-t ${
                    problemState.isCorrect 
                      ? "bg-emerald-50/50 border-emerald-100" 
                      : "bg-red-50/50 border-red-100"
                  }`}>
                    {problemState.isCorrect ? (
                      /* Correct State */
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-emerald-800 flex items-center gap-1.5">
                              정답입니다! 너무 잘 풀었어요! 🎉
                              {problemState.isBreakthrough && (
                                <span className="bg-amber-100 border border-amber-200 text-amber-700 text-[9px] py-0.5 px-2 rounded-full font-bold uppercase tracking-wider animate-bounce">
                                  스스로 극복 성공!
                                </span>
                              )}
                            </h3>
                            <p className="text-xs text-emerald-600 mt-1 font-medium leading-relaxed">
                              {problemState.feedback}
                            </p>
                          </div>
                        </div>

                        {/* Collapsible Solution Explanation */}
                        <div className="bg-white border border-emerald-200 p-5 rounded-xl text-slate-700 space-y-2">
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            선생님의 비법 해설노트
                          </h4>
                          <p className="text-xs leading-relaxed font-medium whitespace-pre-wrap text-slate-600">
                            {problemState.problem.explanation}
                          </p>
                        </div>

                        {/* Try another button */}
                        <button
                          onClick={handleResetWorkspace}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all w-full sm:w-auto"
                        >
                          <span>새로운 수학 문제 도전하기</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      /* Incorrect State */
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                            <XCircle className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-red-800">아쉽게도 정답이 아닙니다.</h3>
                            <p className="text-xs text-red-600 mt-1 font-medium leading-relaxed">
                              {problemState.feedback}
                            </p>
                          </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                          <p className="text-xs font-semibold text-amber-800 leading-relaxed">
                            💡 <strong>정답을 바로 확인하지 마세요!</strong> 우측(모바일은 아래)의 <strong>'소크라테스 AI 코치'</strong>에게 질문하여, 어느 계산 혹은 수식 단계에서 실수가 발생했는지 단계별로 질문하며 정답을 직접 찾아가 보세요! 언제든지 좌측의 연습장 답안을 수정하여 다시 제출할 수 있습니다.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right side: Socratic Tutor Chat Room (5 cols) */}
            <div className="lg:col-span-5">
              <SocraticChat
                problem={problemState.problem}
                messages={chatMessages}
                onSendMessage={handleSendTutorMessage}
                isLoading={isChatLoading}
                studentAnswer={problemState.studentAnswer}
                studentStep={problemState.studentStep}
              />
            </div>

          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 px-6 mt-16 text-center text-xs text-slate-400 font-medium">
        <p>© 2026 AI Socratic Math Tutor. Crafted with Deep Socratic Method & Google Gemini.</p>
        <p className="mt-1 text-slate-300">문제를 생각하고 깊게 이해하며 스스로 푸는 참된 배움</p>
      </footer>
    </div>
  );
}

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());
const PORT = 3000;

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    let apiKey = process.env.GEMINI_API_KEY;
    
    // Fallback if missing or placeholder
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.includes("MY_GEMINI_API_KEY")) {
      dotenv.config({ path: ".env.example" });
      apiKey = process.env.GEMINI_API_KEY;
    }

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.includes("MY_GEMINI_API_KEY")) {
      throw new Error("GEMINI_API_KEY가 설정되지 않았습니다. AI Studio의 Settings > Secrets에서 설정해주세요.");
    }

    // Clean any surrounding double/single quotes
    const cleanApiKey = apiKey.replace(/^['"]|['"]$/g, "").trim();

    aiClient = new GoogleGenAI({
      apiKey: cleanApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// 1. API: Generate Math Problem
app.post("/api/generate-problem", async (req, res) => {
  try {
    const { grade, topic, difficulty } = req.body;
    const ai = getGeminiClient();

    const prompt = `수학 교사로서 학생들을 위해 맞춤형 수학 문제를 생성해주세요.
아래 세부 사항을 엄격히 준수하여 완벽하게 풀이가 가능하고 명확한 문제를 출제해야 합니다.

출제 세부 기준:
- 대상 학년 (Grade): ${grade || "중등 (중학생)"}
- 주제 (Topic): ${topic || "대수학 (방정식/부등식)"}
- 난이도 (Difficulty): ${difficulty || "중"}

요구사항:
1. 주관식 단답형(Short Answer) 또는 4지선다형 객관식(Multiple Choice) 문제로 출제해주세요. 난이도가 '하'나 '중'인 경우는 가끔 객관식도 좋습니다. 주관식 단답형인 경우 'options' 배열을 빈 배열[]로 비워두세요.
2. 주관식의 정답은 가급적 깔끔한 수치나 알파벳 단어(예: "15", "x=5", "4")로 떨어지도록 유도하세요.
3. 한국어로 자연스럽게 작성하며, 수학 공식은 가급적 알기 쉽게 표현하세요. (수식에는 거듭제곱을 표시하기 위해 ^ 등을 사용하거나 기호를 정확하게 기입하세요)
4. 결과는 지정된 JSON 스키마를 완벽히 준수하여 반환해야 합니다.

주의: 설명(explanation)에는 소크라테스식으로 지도하기 위한 해설과 핵심 힌트 단계를 상세히 기술해 주세요. 학생에게는 직접 노출되지 않고 튜터가 참고하게 됩니다.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            problem: {
              type: Type.STRING,
              description: "생성된 수학 문제 내용 (상세한 지문과 물음 포함)"
            },
            type: {
              type: Type.STRING,
              description: "'multiple-choice' 또는 'short-answer'"
            },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "객관식일 경우 4개의 보기 옵션 목록. 주관식일 경우 반드시 빈 배열 []"
            },
            correctAnswer: {
              type: Type.STRING,
              description: "가장 정확한 최종 정답 값 (예: '12', 'x=3', '50')"
            },
            explanation: {
              type: Type.STRING,
              description: "자세한 단계별 풀이 과정 및 지도 전략 (소크라테스 튜터 참고용)"
            }
          },
          required: ["problem", "type", "options", "correctAnswer", "explanation"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("문제를 생성하지 못했습니다.");
    }

    const problemData = JSON.parse(resultText.trim());
    res.json({ success: true, data: problemData });
  } catch (error: any) {
    console.error("Generate Problem Error:", error);
    res.status(500).json({ success: false, error: error.message || "문제를 생성하는 도중 오류가 발생했습니다." });
  }
});

// 2. API: Evaluate Student's Answer
app.post("/api/check-answer", async (req, res) => {
  try {
    const { problem, correctAnswer, studentAnswer, studentStep, explanation } = req.body;

    if (!studentAnswer && !studentStep) {
      return res.status(400).json({ success: false, error: "답안 또는 풀이 과정을 입력해주세요." });
    }

    const ai = getGeminiClient();

    // Fast check: normalize and compare
    const normCorrect = correctAnswer.toString().replace(/\s+/g, "").toLowerCase();
    const normStudent = studentAnswer ? studentAnswer.toString().replace(/\s+/g, "").toLowerCase() : "";

    let isMatch = false;
    if (normStudent && (normStudent === normCorrect || normStudent.includes(normCorrect) || normCorrect.includes(normStudent))) {
      isMatch = true;
    }

    // Call Gemini for intelligent evaluation, especially if string matching fails or we need step verification
    const prompt = `수학 학생의 답안을 채점하고 피드백을 제공해주세요.
단순히 글자 비교뿐만 아니라, 수학적으로 동치이거나 정답으로 인정할 수 있는지 지능적으로 판별해야 합니다.

문제: ${problem}
원래 정답: ${correctAnswer}
선생님 해설: ${explanation}

학생이 제출한 답안: ${studentAnswer || "풀이만 제출함"}
학생이 제출한 풀이 단계: ${studentStep || "풀이 단계 제출하지 않음"}

요구사항:
1. 학생의 답안이 수학적으로 정답인지 판별해주세요 (isCorrect: true/false).
   - 예: 원래 정답이 '3/2'일 때 학생이 '1.5' 또는 '1과 1/2'로 썼다면 맞춘 것으로 판단합니다.
   - 예: 원래 정답이 'x=4'일 때 학생이 '4'만 적었거나 'x = 4'처럼 띄어쓰기를 다르게 한 경우도 맞춘 것입니다.
2. 친절하고 격려하는 피드백(feedback)을 한국어로 작성해주세요.
   - 학생이 맞췄다면: 칭찬과 함께 핵심 개념을 짚어주세요.
   - 학생이 틀렸다면: 절대 정답을 바로 알려주지 말고, 어디서 실수가 있었는지 가볍게 짚어주거나 "아쉽게도 오답이에요. 함께 차근차근 질문을 통해 풀어볼까요?"처럼 소크라테스식 대화를 유도하세요. 절대 피드백에서 최종 정답 수치나 완성된 풀이를 직접 발설하지 마세요.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isCorrect: {
              type: Type.BOOLEAN,
              description: "학생이 정답을 맞췄는지 여부"
            },
            feedback: {
              type: Type.STRING,
              description: "친절하고 격려하며 힌트를 주는 채점 피드백"
            }
          },
          required: ["isCorrect", "feedback"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("답안을 평가하지 못했습니다.");
    }

    const evaluation = JSON.parse(resultText.trim());
    res.json({ success: true, isCorrect: evaluation.isCorrect, feedback: evaluation.feedback });
  } catch (error: any) {
    console.error("Check Answer Error:", error);
    res.status(500).json({ success: false, error: error.message || "답안을 평가하는 도중 오류가 발생했습니다." });
  }
});

// 3. API: Socratic Chat Guidance
app.post("/api/socratic-chat", async (req, res) => {
  try {
    const { problem, correctAnswer, explanation, messages, studentAnswer, studentStep } = req.body;
    const ai = getGeminiClient();

    const systemInstruction = `당신은 세계 최고의 '소크라테스식 수학 튜터(Socratic Math Tutor)'입니다.
학생이 수학 문제를 틀렸거나 푸는 데 어려움을 겪고 있을 때, 질문과 힌트를 통해 학생 스스로 생각하여 답을 도출하도록 돕는 것이 당신의 사명입니다.

★ 소크라테스식 지도 규칙:
1. 절대 최종 정답(예: "답은 15야")을 먼저 알려주거나 전체 풀이 과정을 직접 완성해 주지 마세요.
2. 학생이 답을 알려달라고 떼를 써도 부드럽게 거절하며 "내가 알려주는 것보다 네가 직접 찾아내면 훨씬 더 기억에 오래 남아! 이 단계를 같이 생각해 볼까?" 하며 질문으로 답해 주세요.
3. 문제를 잘게 나누어 '한 번에 딱 하나의 작은 단계(Sub-goal)'만 해결하도록 유도 질문을 하세요.
4. 학생의 오개념이나 계산 실수를 발견하면 "여기서 이 부분을 다시 한번 계산해 볼까? 어떤 값이 나오니?" 하고 특정 지점을 짚어주세요.
5. 어조는 항상 따뜻하고 친절하며 정서적으로 지지해주고 격려를 아끼지 않아야 합니다.
6. 공식이나 수학적 식은 줄바꿈과 볼드체 등으로 가독성 높게 포맷팅해 주세요.
7. 답변은 한국어로 격식 있고 친절하게 작성하세요.

현재 타겟 정보:
- 풀어야 할 문제: ${problem}
- 진짜 정답 (비공개 정보): ${correctAnswer}
- 해설 및 문제 의도: ${explanation}
- 학생이 처음 제출한 오답: ${studentAnswer || "없음"}
- 학생이 작성했던 풀이: ${studentStep || "없음"}`;

    // Map conversation history
    const chatContents = messages.map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: chatContents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    const aiMessage = response.text || "미안해, 다시 한번 설명해 줄 수 있겠니? 차근차근 함께 해결해 보자!";
    res.json({ success: true, content: aiMessage });
  } catch (error: any) {
    console.error("Socratic Chat Error:", error);
    res.status(500).json({ success: false, error: error.message || "대화 처리 중 오류가 발생했습니다." });
  }
});

// 4. Vite and static delivery setup
async function startServer() {
  try {
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  } catch (err) {
    console.error("Vite/Static server startup error, using fallback static files if built:", err);
    // Try fallback to serving dist if it was built
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

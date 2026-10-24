import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// export const runtime = "nodejs";

const TOTAL_QUESTIONS = 5;
const MAX_QUESTION_LENGTH = 3000;
const MAX_ANSWER_LENGTH = 12000;

const allowedTopics = [
  "Java",
  "DSA",
  "DBMS",
  "Operating Systems",
  "Computer Networks",
] as const;

const allowedDifficulties = ["Easy", "Medium", "Hard"] as const;

type Topic = (typeof allowedTopics)[number];
type Difficulty = (typeof allowedDifficulties)[number];

const responseSchema = {
  type: "json_schema" as const,
  json_schema: {
    name: "mock_interview_response",
    strict: true,
    schema: {
      type: "object",
      properties: {
        question: { type: "string" },
        score: { type: "integer" },
        feedback: { type: "string" },
        strengths: {
          type: "array",
          items: { type: "string" },
        },
        improvements: {
          type: "array",
          items: { type: "string" },
        },
        idealAnswer: { type: "string" },
        nextQuestion: { type: "string" },
        isComplete: { type: "boolean" },
      },
      required: [
        "question",
        "score",
        "feedback",
        "strengths",
        "improvements",
        "idealAnswer",
        "nextQuestion",
        "isComplete",
      ],
      additionalProperties: false,
    },
  },
};

type InterviewResult = {
  question: string;
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  idealAnswer: string;
  nextQuestion: string;
  isComplete: boolean;
};

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) => typeof item === "string" && item.trim().length > 0
    )
  );
}

function validateResult(
  value: unknown,
  mode: "start" | "answer",
  questionNumber?: number
): InterviewResult {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new Error("The AI returned an invalid response.");
  }

  const result = value as Record<string, unknown>;

  if (
    typeof result.question !== "string" ||
    typeof result.score !== "number" ||
    !Number.isInteger(result.score) ||
    result.score < 0 ||
    result.score > 10 ||
    typeof result.feedback !== "string" ||
    !isStringArray(result.strengths) ||
    !isStringArray(result.improvements) ||
    typeof result.idealAnswer !== "string" ||
    typeof result.nextQuestion !== "string" ||
    typeof result.isComplete !== "boolean"
  ) {
    // Empty strengths/improvements arrays are valid.
    const arraysAreValid =
      Array.isArray(result.strengths) &&
      result.strengths.every((item) => typeof item === "string") &&
      Array.isArray(result.improvements) &&
      result.improvements.every((item) => typeof item === "string");

    if (
      typeof result.question !== "string" ||
      typeof result.score !== "number" ||
      !Number.isInteger(result.score) ||
      result.score < 0 ||
      result.score > 10 ||
      typeof result.feedback !== "string" ||
      !arraysAreValid ||
      typeof result.idealAnswer !== "string" ||
      typeof result.nextQuestion !== "string" ||
      typeof result.isComplete !== "boolean"
    ) {
      throw new Error("The AI returned an invalid response.");
    }
  }

  if (mode === "start") {
    if (!result.question.trim()) {
      throw new Error("The AI did not generate an interview question.");
    }

    return {
      question: result.question.trim(),
      score: 0,
      feedback: "",
      strengths: [],
      improvements: [],
      idealAnswer: "",
      nextQuestion: "",
      isComplete: false,
    };
  }

  const isLastQuestion = questionNumber === TOTAL_QUESTIONS;

  if (result.isComplete !== isLastQuestion) {
    throw new Error("The AI returned an invalid completion status.");
  }

  if (
    !isLastQuestion &&
    !result.nextQuestion.trim()
  ) {
    throw new Error("The AI did not generate the next question.");
  }

  if (isLastQuestion && result.nextQuestion.trim()) {
    throw new Error("The final question must not have a next question.");
  }

  if (!result.question.trim() || !result.idealAnswer.trim()) {
    throw new Error("The AI returned incomplete interview feedback.");
  }

  return {
    question: result.question.trim(),
    score: result.score,
    feedback: result.feedback.trim(),
    strengths: result.strengths as string[],
    improvements: result.improvements as string[],
    idealAnswer: result.idealAnswer.trim(),
    nextQuestion: result.nextQuestion.trim(),
    isComplete: result.isComplete,
  };
}

export async function POST(request: Request) {
  try {
    // Verify the user's Supabase session on the server.
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please sign in to use the AI mock interview." },
        { status: 401 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      console.error("GROQ_API_KEY is not configured.");

      return NextResponse.json(
        { error: "The AI service is not configured correctly." },
        { status: 500 }
      );
    }

    // Reject excessively large request bodies.
    const contentLength = Number(
      request.headers.get("content-length") ?? "0"
    );

    if (contentLength > 20000) {
      return NextResponse.json(
        { error: "The request is too large." },
        { status: 413 }
      );
    }

    let body: Record<string, unknown>;

    try {
      const parsed: unknown = await request.json();

      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        return NextResponse.json(
          { error: "Invalid request body." },
          { status: 400 }
        );
      }

      body = parsed as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: "The request must contain valid JSON." },
        { status: 400 }
      );
    }

    const {
      mode,
      topic,
      difficulty,
      questionNumber,
      currentQuestion,
      userAnswer,
      previousQuestions,
    } = body;

    if (
      mode !== "start" &&
      mode !== "answer"
    ) {
      return NextResponse.json(
        { error: "Invalid interview mode." },
        { status: 400 }
      );
    }

    if (
      typeof topic !== "string" ||
      !allowedTopics.includes(topic as Topic) ||
      typeof difficulty !== "string" ||
      !allowedDifficulties.includes(difficulty as Difficulty)
    ) {
      return NextResponse.json(
        { error: "Please select a valid topic and difficulty." },
        { status: 400 }
      );
    }

    if (mode === "answer") {
      if (
        !Number.isInteger(questionNumber) ||
        (questionNumber as number) < 1 ||
        (questionNumber as number) > TOTAL_QUESTIONS ||
        typeof currentQuestion !== "string" ||
        !currentQuestion.trim() ||
        currentQuestion.length > MAX_QUESTION_LENGTH ||
        typeof userAnswer !== "string" ||
        !userAnswer.trim() ||
        userAnswer.length > MAX_ANSWER_LENGTH
      ) {
        return NextResponse.json(
          { error: "Please provide a valid question and answer." },
          { status: 400 }
        );
      }

      if (
        !Array.isArray(previousQuestions) ||
        previousQuestions.length > TOTAL_QUESTIONS ||
        !previousQuestions.every(
          (item) => typeof item === "string" && item.length <= MAX_QUESTION_LENGTH
        )
      ) {
        return NextResponse.json(
          { error: "Invalid interview history." },
          { status: 400 }
        );
      }

      if (
        previousQuestions.length !== questionNumber ||
        previousQuestions[questionNumber as number - 1]?.trim() !==
          currentQuestion.trim()
      ) {
        return NextResponse.json(
          { error: "The interview question history does not match." },
          { status: 400 }
        );
      }
    }

    const groq = new Groq({ apiKey });

    const systemPrompt = `
You are a fair, accurate, encouraging technical interviewer
helping a college student prepare for software engineering placements.

Topic: ${topic}
Difficulty: ${difficulty}
Total questions: ${TOTAL_QUESTIONS}

Evaluate technical correctness, relevance, completeness, and clarity.
Accept valid alternative explanations.
Do not give high marks for incorrect answers.
Use simple, constructive language.
Return only the JSON object matching the supplied schema.
`;

    let userPrompt: string;

    if (mode === "start") {
      userPrompt = `
Start a new mock interview.

Generate question 1 of ${TOTAL_QUESTIONS}.
Topic: ${topic}
Difficulty: ${difficulty}

Ask exactly one clear technical question.
Do not reveal the answer or give hints.

Return:
- question: the interview question
- score: 0
- feedback: empty string
- strengths: empty array
- improvements: empty array
- idealAnswer: empty string
- nextQuestion: empty string
- isComplete: false
`;
    } else {
      const history = previousQuestions as string[];
      const currentNumber = questionNumber as number;
      const isLastQuestion = currentNumber === TOTAL_QUESTIONS;

      userPrompt = `
Evaluate the candidate's answer.

Question ${currentNumber} of ${TOTAL_QUESTIONS}
Topic: ${topic}
Difficulty: ${difficulty}

Current question:
${currentQuestion as string}

Candidate's answer:
${(userAnswer as string).trim()}

Previously asked questions:
${JSON.stringify(history)}

Evaluate the answer and return:
- question: the current question, unchanged
- score: integer from 0 to 10
- feedback: specific feedback on correctness and completeness
- strengths: list of things the candidate did well
- improvements: actionable areas to improve
- idealAnswer: clear and technically accurate model answer
- isComplete: ${isLastQuestion}
- nextQuestion: ${
        isLastQuestion
          ? 'an empty string ""'
          : `one new ${difficulty} ${topic} question for question ${
              currentNumber + 1
            } of ${TOTAL_QUESTIONS}`
      }

${
  isLastQuestion
    ? "This is the final question. Do not generate another question."
    : "Do not repeat any previously asked question. Generate only one next question."
}

Be fair, constructive, and useful for placement preparation.
`;
    }

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: responseSchema,
      temperature: 0.5,
      max_completion_tokens: 2500,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new Error("The AI returned an empty response.");
    }

    let parsedResult: unknown;

    try {
      parsedResult = JSON.parse(content);
    } catch {
      throw new Error("The AI returned invalid JSON.");
    }

    const result = validateResult(
      parsedResult,
      mode,
      mode === "answer" ? (questionNumber as number) : undefined
    );

    if (
      mode === "answer" &&
      result.question !== (currentQuestion as string).trim()
    ) {
      throw new Error("The AI changed the current interview question.");
    }

    if (
      mode === "answer" &&
      questionNumber !== TOTAL_QUESTIONS &&
      (previousQuestions as string[]).some(
        (previous) =>
          previous.trim().toLowerCase() ===
          result.nextQuestion.trim().toLowerCase()
      )
    ) {
      throw new Error(
        "The AI repeated a question. Please try submitting again."
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Mock interview API error:", error);

    if (
      error instanceof Error &&
      (error.name === "APIConnectionTimeoutError" ||
        error.name === "TimeoutError")
    ) {
      return NextResponse.json(
        { error: "The AI request timed out. Please try again." },
        { status: 504 }
      );
    }

    if (
      error instanceof Error &&
      error.message.startsWith("The AI")
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        error:
          "Unable to process the mock interview. Please try again.",
      },
      { status: 500 }
    );
  }
}

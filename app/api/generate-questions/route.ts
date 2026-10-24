
import Groq from "groq-sdk";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is missing from .env.local" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const topic =
      typeof body.topic === "string" ? body.topic : "";
    const difficulty =
      typeof body.difficulty === "string"
        ? body.difficulty
        : "";

    const allowedTopics = [
      "Java",
      "DSA",
      "DBMS",
      "Operating Systems",
      "Computer Networks",
    ];

    const allowedDifficulties = ["Easy", "Medium", "Hard"];

    if (
      !allowedTopics.includes(topic) ||
      !allowedDifficulties.includes(difficulty)
    ) {
      return NextResponse.json(
        { error: "Invalid topic or difficulty." },
        { status: 400 }
      );
    }

    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",

      messages: [
        {
          role: "system",
          content:
            "You are a technical interview tutor. Generate exactly 5 distinct interview questions and clear, accurate, beginner-friendly answers. Follow the requested JSON schema exactly.",
        },
        {
          role: "user",
          content: `Generate 5 ${difficulty} technical interview questions about ${topic}. Each question must have a useful answer.`,
        },
      ],

      response_format: {
        type: "json_schema",
        json_schema: {
          name: "interview_questions",
          strict: true,
          schema: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    answer: { type: "string" },
                  },
                  required: ["question", "answer"],
                  additionalProperties: false,
                },
              },
            },
            required: ["questions"],
            additionalProperties: false,
          },
        },
      },

      temperature: 0.5,
      max_completion_tokens: 4000,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new Error("The AI returned an empty response.");
    }

    const result = JSON.parse(content);

    if (
      !Array.isArray(result.questions) ||
      result.questions.length !== 5 ||
      !result.questions.every(
        (item: { question?: unknown; answer?: unknown }) =>
          typeof item.question === "string" &&
          typeof item.answer === "string"
      )
    ) {
      console.error("Unexpected AI response:", content);

      throw new Error(
        "The AI response did not contain five valid questions."
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Interview question generation error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate questions. Please try again.",
      },
      { status: 500 }
    );
  }
}

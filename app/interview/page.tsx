
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Topic =
  | "Java"
  | "DSA"
  | "DBMS"
  | "Operating Systems"
  | "Computer Networks";

type Difficulty = "Easy" | "Medium" | "Hard";

type Question = {
  question: string;
  answer: string;
};

const topics: Topic[] = [
  "Java",
  "DSA",
  "DBMS",
  "Operating Systems",
  "Computer Networks",
];

const difficulties: Difficulty[] = ["Easy", "Medium", "Hard"];

export default function InterviewPage() {
  const router = useRouter();

  const [topic, setTopic] = useState<Topic>("Java");
  const [difficulty, setDifficulty] =
    useState<Difficulty>("Easy");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function generateQuestions() {
    setLoading(true);
    setError("");
    setMessage("");
    setQuestions([]);
    setRevealed([]);

    try {
      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic, difficulty }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to generate questions."
        );
      }

      if (!Array.isArray(data.questions)) {
        throw new Error("The server returned an invalid response.");
      }

      setQuestions(data.questions);
      setMessage("Your AI interview questions are ready!");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleAnswer(index: number) {
    setRevealed((previous) =>
      previous.includes(index)
        ? previous.filter((item) => item !== index)
        : [...previous, index]
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mb-6 text-blue-400 hover:underline"
        >
          ← Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold">
          AI Interview Preparation
        </h1>

        <p className="mt-2 text-slate-400">
          Generate personalized technical interview questions
          using AI.
        </p>

        <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <label
            htmlFor="topic"
            className="mb-2 block font-medium"
          >
            Select topic
          </label>

          <select
            id="topic"
            value={topic}
            onChange={(event) =>
              setTopic(event.target.value as Topic)
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white"
          >
            {topics.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <label
            htmlFor="difficulty"
            className="mb-2 mt-5 block font-medium"
          >
            Select difficulty
          </label>

          <select
            id="difficulty"
            value={difficulty}
            onChange={(event) =>
              setDifficulty(event.target.value as Difficulty)
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white"
          >
            {difficulties.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={generateQuestions}
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-purple-600 px-5 py-3 font-semibold hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Generating questions..."
              : "Generate AI Questions"}
          </button>

          {loading && (
            <p className="mt-4 text-center text-slate-400">
              AI is preparing your questions. Please wait...
            </p>
          )}

          {message && (
            <p role="status" className="mt-4 text-green-400">
              {message}
            </p>
          )}

          {error && (
            <p role="alert" className="mt-4 text-red-400">
              {error}
            </p>
          )}
        </section>

        {questions.length > 0 && (
          <section className="mt-8">
            <h2 className="text-2xl font-bold">
              Your {topic} Questions
            </h2>

            <p className="mt-2 text-slate-400">
              Difficulty: {difficulty} · Total questions:{" "}
              {questions.length}
            </p>

            <div className="mt-5 space-y-4">
              {questions.map((item, index) => (
                <article
                  key={`${index}-${item.question}`}
                  className="rounded-xl border border-slate-800 bg-slate-900 p-5"
                >
                  <p className="text-sm text-purple-400">
                    Question {index + 1}
                  </p>

                  <h3 className="mt-2 text-lg font-semibold">
                    {item.question}
                  </h3>

                  <button
                    type="button"
                    onClick={() => toggleAnswer(index)}
                    className="mt-4 rounded-lg bg-blue-600 px-4 py-2 font-medium hover:bg-blue-500"
                  >
                    {revealed.includes(index)
                      ? "Hide Answer"
                      : "Reveal Answer"}
                  </button>

                  {revealed.includes(index) && (
                    <div className="mt-4 rounded-lg bg-slate-800 p-4">
                      <h4 className="font-semibold text-green-400">
                        Suggested Answer
                      </h4>

                      <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-200">
                        {item.answer}
                      </p>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

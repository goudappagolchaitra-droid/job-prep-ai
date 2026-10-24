
"use client";

import { useState } from "react";
import Link from "next/link";

type Problem = {
  id: number;
  title: string;
  difficulty: "Easy" | "Medium";
  description: string;
  example: string;
  expectedOutput: string;
};

const problems: Problem[] = [
  {
    id: 1,
    title: "Two Sum",
    difficulty: "Easy",
    description:
      "Given an array of integers nums and an integer target, return the indices of two numbers whose sum equals target.",
    example: "nums = [2, 7, 11, 15], target = 9",
    expectedOutput: "[0, 1]",
  },
  {
    id: 2,
    title: "Reverse a String",
    difficulty: "Easy",
    description:
      "Given a string, return the string with its characters in reverse order.",
    example: 'input = "hello"',
    expectedOutput: '"olleh"',
  },
  {
    id: 3,
    title: "Find Maximum",
    difficulty: "Easy",
    description:
      "Given an array of integers, find and return the largest number.",
    example: "nums = [3, 9, 2, 15, 6]",
    expectedOutput: "15",
  },
];

const starterCode: Record<string, string> = {
  Java: `// Write your Java solution here

class Solution {
    // Add your method
}`,
  Python: `# Write your Python solution here

def solution():
    # Add your logic
    pass`,
  JavaScript: `// Write your JavaScript solution here

function solution() {
    // Add your logic
}`,
};

export default function CodingPracticePage() {
  const [selectedProblemId, setSelectedProblemId] = useState(1);
  const [language, setLanguage] = useState("Java");
  const [code, setCode] = useState(starterCode.Java);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [showExample, setShowExample] = useState(false);

  const selectedProblem =
    problems.find((problem) => problem.id === selectedProblemId) ??
    problems[0];

  function changeLanguage(newLanguage: string) {
    setLanguage(newLanguage);
    setCode(starterCode[newLanguage]);
    setFeedback("");
    setError("");
  }

  function changeProblem(problemId: number) {
    setSelectedProblemId(problemId);
    setFeedback("");
    setError("");
    setShowExample(false);
  }

  async function reviewCode() {
    if (!code.trim()) {
      setError("Please write some code before requesting a review.");
      return;
    }

    setReviewing(true);
    setError("");
    setFeedback("");

    try {
      const response = await fetch("/api/review-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          problem: `${selectedProblem.title}\n${selectedProblem.description}\nExample: ${selectedProblem.example}`,
          code,
          language,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to review your code.");
      }

      setFeedback(data.feedback);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setReviewing(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm text-pink-400">JOBPREP AI</p>
            <h1 className="text-3xl font-bold sm:text-4xl">
              Coding Practice
            </h1>
            <p className="mt-2 text-slate-400">
              Solve problems and improve with AI-powered code reviews.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
          >
            Back to Dashboard
          </Link>
        </header>

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <aside className="h-fit rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-4 text-xl font-semibold">Problems</h2>

            <div className="space-y-3">
              {problems.map((problem) => (
                <button
                  key={problem.id}
                  onClick={() => changeProblem(problem.id)}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    selectedProblemId === problem.id
                      ? "border-pink-500 bg-pink-500/10"
                      : "border-slate-700 hover:bg-slate-800"
                  }`}
                >
                  <span className="block font-medium">
                    {problem.id}. {problem.title}
                  </span>
                  <span className="mt-1 block text-sm text-green-400">
                    {problem.difficulty}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-xl bg-slate-800/70 p-4">
              <h3 className="font-medium">Practice tip</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Try solving the problem yourself first. Then request an AI
                review to understand mistakes and improve your approach.
              </p>
            </div>
          </aside>

          <section className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold">
                  {selectedProblem.title}
                </h2>
                <span className="rounded-full bg-green-500/10 px-3 py-1 text-sm text-green-400">
                  {selectedProblem.difficulty}
                </span>
              </div>

              <p className="leading-7 text-slate-300">
                {selectedProblem.description}
              </p>

              <div className="mt-5 rounded-xl bg-slate-950 p-4">
                <p className="mb-2 text-sm font-semibold text-slate-400">
                  Example
                </p>
                <p className="font-mono text-sm">{selectedProblem.example}</p>

                <button
                  onClick={() => setShowExample(!showExample)}
                  className="mt-4 text-sm text-pink-400 hover:underline"
                >
                  {showExample ? "Hide example output" : "Show example output"}
                </button>

                {showExample && (
                  <p className="mt-3 font-mono text-sm text-green-400">
                    Expected output: {selectedProblem.expectedOutput}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">Your Solution</h2>

                <label className="flex items-center gap-3 text-sm text-slate-300">
                  Language
                  <select
                    value={language}
                    onChange={(event) => changeLanguage(event.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-pink-500"
                  >
                    <option value="Java">Java</option>
                    <option value="Python">Python</option>
                    <option value="JavaScript">JavaScript</option>
                  </select>
                </label>
              </div>

              <textarea
                value={code}
                onChange={(event) => {
                  setCode(event.target.value);
                  setFeedback("");
                  setError("");
                }}
                spellCheck={false}
                aria-label="Write your solution"
                placeholder="Write your solution here..."
                className="min-h-[300px] w-full resize-y rounded-xl border border-slate-700 bg-slate-950 p-4 font-mono text-sm leading-6 text-green-300 outline-none focus:border-pink-500"
              />

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={reviewCode}
                  disabled={reviewing}
                  className="rounded-lg bg-pink-600 px-5 py-3 font-semibold transition hover:bg-pink-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {reviewing ? "Reviewing your code..." : "Review Code with AI"}
                </button>

                <button
                  onClick={() => {
                    setCode(starterCode[language]);
                    setFeedback("");
                    setError("");
                  }}
                  className="rounded-lg border border-slate-700 px-5 py-3 hover:bg-slate-800"
                >
                  Reset Code
                </button>
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-500">
                AI review provides suggestions but does not compile or execute
                your code. Do not include passwords, API keys, or other secrets.
              </p>

              {error && (
                <div
                  role="alert"
                  className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
                >
                  {error}
                </div>
              )}
            </div>

            {feedback && (
              <div className="rounded-2xl border border-pink-500/30 bg-slate-900 p-5 sm:p-6">
                <h2 className="mb-4 text-xl font-semibold">
                  AI Code Review
                </h2>

                <div className="whitespace-pre-wrap break-words leading-7 text-slate-300">
                  {feedback}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

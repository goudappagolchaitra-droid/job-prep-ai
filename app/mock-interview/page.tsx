
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Topic =
  | "Java"
  | "DSA"
  | "DBMS"
  | "Operating Systems"
  | "Computer Networks";

type Difficulty = "Easy" | "Medium" | "Hard";

type Evaluation = {
  question: string;
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  idealAnswer: string;
  nextQuestion: string;
  isComplete: boolean;
};

const topics: Topic[] = [
  "Java",
  "DSA",
  "DBMS",
  "Operating Systems",
  "Computer Networks",
];

const difficulties: Difficulty[] = ["Easy", "Medium", "Hard"];

const TOTAL_QUESTIONS = 5;

export default function MockInterviewPage() {
  const router = useRouter();

  const [topic, setTopic] = useState<Topic>("Java");
  const [difficulty, setDifficulty] = useState<Difficulty>("Easy");

  const [started, setStarted] = useState(false);
  const [question, setQuestion] = useState("");
  const [questionNumber, setQuestionNumber] = useState(1);
  const [answer, setAnswer] = useState("");

  const [questionsAsked, setQuestionsAsked] = useState<string[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);

  const [loading, setLoading] = useState(false);
  const [savingResults, setSavingResults] = useState(false);
  const [savedResults, setSavedResults] = useState(false);
  const [error, setError] = useState("");

  async function callInterviewAPI(
    payload: Record<string, unknown>
  ): Promise<Evaluation> {
    const response = await fetch("/api/mock-interview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Something went wrong.");
    }

    return data as Evaluation;
  }

  async function startInterview() {
    setLoading(true);
    setError("");
    setEvaluation(null);
    setEvaluations([]);
    setQuestionsAsked([]);
    setQuestion("");
    setAnswer("");
    setQuestionNumber(1);
    setStarted(false);
    setSavedResults(false);

    try {
      const data = await callInterviewAPI({
        mode: "start",
        topic,
        difficulty,
      });

      setQuestion(data.question);
      setQuestionsAsked([data.question]);
      setStarted(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to start the interview."
      );
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswer() {
    if (!answer.trim()) {
      setError("Please write your answer before submitting.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await callInterviewAPI({
        mode: "answer",
        topic,
        difficulty,
        questionNumber,
        currentQuestion: question,
        userAnswer: answer.trim(),
        previousQuestions: questionsAsked,
      });

      setEvaluation(data);
      setEvaluations((previous) => [...previous, data]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to evaluate your answer."
      );
    } finally {
      setLoading(false);
    }
  }

  function goToNextQuestion() {
    if (!evaluation || evaluation.isComplete) return;

    const next = evaluation.nextQuestion;

    if (!next) {
      setError("The next question could not be generated. Please try again.");
      return;
    }

    setQuestion(next);
    setQuestionsAsked((previous) => [...previous, next]);
    setQuestionNumber((previous) => previous + 1);
    setAnswer("");
    setEvaluation(null);
    setError("");
  }

  async function saveAndViewResults() {
    if (
      !evaluation?.isComplete ||
      evaluations.length !== TOTAL_QUESTIONS
    ) {
      setError("Please complete all five questions before saving.");
      return;
    }

    setSavingResults(true);
    setError("");

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error(
          "Please sign in before saving your interview results."
        );
      }

      const scores = evaluations.map((item) => item.score);
      const total = scores.reduce((sum, score) => sum + score, 0);
      const average = Number((total / scores.length).toFixed(2));

      const { error: insertError } = await supabase
        .from("mock_interviews")
        .insert({
          user_id: user.id,
          topic,
          difficulty,
          question_scores: scores,
          total_score: total,
          average_score: average,
          questions_completed: evaluations.length,
        });

      if (insertError) {
        throw insertError;
      }

      setSavedResults(true);
      setStarted(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? `Could not save results: ${err.message}`
          : "Could not save interview results. Please try again."
      );
    } finally {
      setSavingResults(false);
    }
  }

  function restartInterview() {
    setStarted(false);
    setQuestion("");
    setQuestionNumber(1);
    setAnswer("");
    setQuestionsAsked([]);
    setEvaluations([]);
    setEvaluation(null);
    setError("");
    setSavedResults(false);
  }

  const totalScore = evaluations.reduce(
    (sum, item) => sum + item.score,
    0
  );

  const averageScore =
    evaluations.length > 0
      ? (totalScore / evaluations.length).toFixed(1)
      : "0.0";

  const interviewComplete =
    evaluation?.isComplete === true &&
    evaluations.length === TOTAL_QUESTIONS;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mb-6 text-blue-400 hover:underline"
        >
          ← Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold sm:text-4xl">
          AI Mock Interview
        </h1>

        <p className="mt-3 text-slate-400">
          Practise technical interviews, submit your answers, and
          receive AI-powered feedback.
        </p>

        {!started && !interviewComplete && (
          <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">
              Set up your interview
            </h2>

            <label
              htmlFor="topic"
              className="mb-2 mt-5 block text-sm font-medium"
            >
              Technical topic
            </label>

            <select
              id="topic"
              value={topic}
              onChange={(event) =>
                setTopic(event.target.value as Topic)
              }
              disabled={loading || savingResults}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3"
            >
              {topics.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <label
              htmlFor="difficulty"
              className="mb-2 mt-5 block text-sm font-medium"
            >
              Difficulty level
            </label>

            <select
              id="difficulty"
              value={difficulty}
              onChange={(event) =>
                setDifficulty(event.target.value as Difficulty)
              }
              disabled={loading || savingResults}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3"
            >
              {difficulties.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <div className="mt-5 rounded-lg bg-slate-800 p-4 text-sm text-slate-300">
              <p>• {TOTAL_QUESTIONS} technical questions</p>
              <p className="mt-2">• AI feedback after each answer</p>
              <p className="mt-2">• Score out of 10 per question</p>
              <p className="mt-2">• Final performance summary</p>
              <p className="mt-2">• Save results to your account</p>
            </div>

            <button
              type="button"
              onClick={startInterview}
              disabled={loading || savingResults}
              className="mt-6 w-full rounded-lg bg-purple-600 px-5 py-3 font-semibold hover:bg-purple-500 disabled:opacity-50"
            >
              {loading ? "Preparing interview..." : "Start Interview"}
            </button>
          </section>
        )}

        {started && (
          <>
            <div className="mt-8 flex items-center justify-between gap-4">
              <span className="rounded-full bg-purple-900/60 px-3 py-1 text-sm text-purple-300">
                {topic}
              </span>

              <span className="text-sm text-slate-400">
                Question {questionNumber} of {TOTAL_QUESTIONS}
              </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-purple-500 transition-all"
                style={{
                  width: `${(questionNumber / TOTAL_QUESTIONS) * 100}%`,
                }}
              />
            </div>

            <section className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <p className="text-sm text-purple-400">
                Interview question
              </p>

              <h2 className="mt-3 text-xl font-semibold leading-8">
                {question}
              </h2>

              {!evaluation && (
                <>
                  <label
                    htmlFor="answer"
                    className="mb-2 mt-6 block font-medium"
                  >
                    Your answer
                  </label>

                  <textarea
                    id="answer"
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    placeholder="Explain your answer in your own words..."
                    rows={7}
                    disabled={loading}
                    className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 leading-7 outline-none focus:border-purple-500 disabled:opacity-60"
                  />

                  <p className="mt-2 text-sm text-slate-500">
                    Try to explain the concept clearly, as you would
                    in a real interview.
                  </p>

                  <button
                    type="button"
                    onClick={submitAnswer}
                    disabled={loading}
                    className="mt-5 w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500 disabled:opacity-50"
                  >
                    {loading
                      ? "Evaluating your answer..."
                      : "Submit Answer"}
                  </button>
                </>
              )}

              {evaluation && (
                <div className="mt-6 space-y-5">
                  <div className="rounded-xl border border-purple-800 bg-purple-950/40 p-5">
                    <p className="text-sm text-purple-300">
                      Your score
                    </p>
                    <p className="mt-1 text-4xl font-bold">
                      {evaluation.score}
                      <span className="text-xl text-slate-400">
                        {" "}/ 10
                      </span>
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-blue-300">
                      AI Feedback
                    </h3>
                    <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-300">
                      {evaluation.feedback}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-green-400">
                      What you did well
                    </h3>
                    {evaluation.strengths.length > 0 ? (
                      <ul className="mt-2 list-disc space-y-2 pl-5 text-slate-300">
                        {evaluation.strengths.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-slate-400">
                        Keep practising to build your strengths.
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-amber-300">
                      Areas to improve
                    </h3>
                    {evaluation.improvements.length > 0 ? (
                      <ul className="mt-2 list-disc space-y-2 pl-5 text-slate-300">
                        {evaluation.improvements.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-slate-400">
                        No specific improvements were suggested.
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl bg-slate-800 p-5">
                    <h3 className="font-semibold text-green-300">
                      Suggested answer
                    </h3>
                    <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-200">
                      {evaluation.idealAnswer}
                    </p>
                  </div>

                  {evaluation.isComplete ? (
                    <button
                      type="button"
                      onClick={saveAndViewResults}
                      disabled={savingResults}
                      className="w-full rounded-lg bg-purple-600 px-5 py-3 font-semibold hover:bg-purple-500 disabled:opacity-50"
                    >
                      {savingResults
                        ? "Saving Results..."
                        : "Save & View Final Results"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={goToNextQuestion}
                      disabled={loading}
                      className="w-full rounded-lg bg-purple-600 px-5 py-3 font-semibold hover:bg-purple-500 disabled:opacity-50"
                    >
                      Next Question →
                    </button>
                  )}
                </div>
              )}
            </section>
          </>
        )}

        {interviewComplete && (
          <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-2xl font-bold">
              Interview Complete!
            </h2>

            {savedResults && (
              <p className="mt-3 rounded-lg border border-green-800 bg-green-950/40 p-3 text-green-300">
                Interview results saved successfully!
              </p>
            )}

            <p className="mt-2 text-slate-400">
              Great job finishing your {topic} mock interview.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-slate-800 p-4">
                <p className="text-sm text-slate-400">
                  Total score
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {totalScore} / 50
                </p>
              </div>

              <div className="rounded-xl bg-slate-800 p-4">
                <p className="text-sm text-slate-400">
                  Average score
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {averageScore} / 10
                </p>
              </div>
            </div>

            <h3 className="mt-7 text-lg font-semibold">
              Your performance
            </h3>

            <div className="mt-4 space-y-3">
              {evaluations.map((item, index) => (
                <div
                  key={`${index}-${item.question}`}
                  className="rounded-lg border border-slate-800 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">
                      {index + 1}. {item.question}
                    </p>
                    <span className="shrink-0 font-bold text-purple-300">
                      {item.score}/10
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {item.feedback}
                  </p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={restartInterview}
              className="mt-6 w-full rounded-lg bg-purple-600 px-5 py-3 font-semibold hover:bg-purple-500"
            >
              Start Another Interview
            </button>
          </section>
        )}

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-lg border border-red-800 bg-red-950/40 p-4 text-red-300"
          >
            {error}
          </div>
        )}

        {loading && started && (
          <p className="mt-4 text-center text-slate-400">
            AI is processing your response. Please wait...
          </p>
        )}
      </div>
    </main>
  );
}

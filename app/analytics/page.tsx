
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

type Interview = {
  id: string;
  topic: string;
  difficulty: string;
  total_score: number;
  average_score: number;
  questions_completed: number;
  created_at: string;
};

export default function AnalyticsPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadAnalytics() {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (!active) return;

      if (authError || !authData.user) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("mock_interviews")
        .select(
          "id, topic, difficulty, total_score, average_score, questions_completed, created_at"
        )
        .eq("user_id", authData.user.id)
        .order("created_at", { ascending: true });

      if (!active) return;

      if (error) {
        setErrorMessage(error.message);
      } else {
        setInterviews((data ?? []) as Interview[]);
      }

      setLoading(false);
    }

    loadAnalytics();

    return () => {
      active = false;
    };
  }, [router, supabase]);

  const totalInterviews = interviews.length;

  const averageScore =
    totalInterviews > 0
      ? interviews.reduce(
          (sum, item) => sum + Number(item.average_score),
          0
        ) / totalInterviews
      : 0;

  const bestScore =
    totalInterviews > 0
      ? Math.max(...interviews.map((item) => item.total_score))
      : 0;

  const recentInterviews = interviews.slice(-7).reverse();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Loading your performance analytics...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-5 text-white sm:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Performance Analytics
            </h1>
            <p className="mt-2 text-slate-400">
              Track your mock interview progress with JobPrep AI.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800"
          >
            ← Dashboard
          </Link>
        </div>

        {errorMessage && (
          <div className="mt-6 rounded-lg border border-red-700 bg-red-950 p-4 text-red-200">
            Could not load analytics: {errorMessage}
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Total Mock Interviews
            </p>
            <p className="mt-3 text-4xl font-bold text-blue-400">
              {totalInterviews}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Average Score
            </p>
            <p className="mt-3 text-4xl font-bold text-emerald-400">
              {averageScore.toFixed(1)}
              <span className="text-lg text-slate-400"> / 10</span>
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Best Interview Score
            </p>
            <p className="mt-3 text-4xl font-bold text-purple-400">
              {bestScore}
              <span className="text-lg text-slate-400"> / 50</span>
            </p>
          </div>
        </div>

        <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">
            Recent Score Trend
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Average score out of 10 for your last seven interviews.
          </p>

          {recentInterviews.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-slate-700 p-8 text-center">
              <p className="text-slate-300">
                No interview scores yet.
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Complete a mock interview to see your performance chart.
              </p>
              <Link
                href="/mock-interview"
                className="mt-5 inline-block rounded-lg bg-emerald-600 px-5 py-3 font-semibold hover:bg-emerald-500"
              >
                Start Mock Interview
              </Link>
            </div>
          ) : (
            <div className="mt-8 flex h-64 items-end gap-3 overflow-x-auto border-b border-slate-700 pb-2">
              {recentInterviews.map((item, index) => {
                const score = Math.max(
                  0,
                  Math.min(10, Number(item.average_score) || 0)
                );

                return (
                  <div
                    key={item.id}
                    className="flex h-full min-w-12 flex-1 flex-col items-center justify-end gap-2"
                  >
                    <span className="text-xs text-slate-300">
                      {score.toFixed(1)}
                    </span>

                    <div className="flex h-44 w-full items-end">
                      <div
                        title={`Interview score: ${score.toFixed(1)} / 10`}
                        className="w-full rounded-t-md bg-blue-500 transition-all hover:bg-blue-400"
                        style={{
                          height: `${score * 10}%`,
                          minHeight: "3px",
                        }}
                      />
                    </div>

                    <span className="text-xs text-slate-400">
                      #{totalInterviews - index - recentInterviews.length + 1 + recentInterviews.length}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">
            Recent Interview Results
          </h2>

          {recentInterviews.length === 0 ? (
            <p className="mt-4 text-slate-400">
              Your completed interviews will appear here.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {recentInterviews.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-slate-800 bg-slate-950 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">
                        {item.topic}
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {item.difficulty} ·{" "}
                        {item.questions_completed} questions completed
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-bold text-emerald-400">
                        {item.total_score} / 50
                      </p>
                      <p className="text-sm text-slate-400">
                        {Number(item.average_score).toFixed(1)} / 10
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/mock-interview"
            className="rounded-lg bg-emerald-600 px-5 py-3 font-semibold hover:bg-emerald-500"
          >
            Practice Again →
          </Link>

          <Link
            href="/interview-history"
            className="rounded-lg bg-purple-600 px-5 py-3 font-semibold hover:bg-purple-500"
          >
            View Full History →
          </Link>
        </div>
      </div>
    </main>
  );
}

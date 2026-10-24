
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Interview = {
  id: string;
  topic: string;
  difficulty: string;
  question_scores: number[] | null;
  total_score: number;
  average_score: number;
  questions_completed: number;
  created_at: string;
};

const topics = [
  "All Topics",
  "Java",
  "DSA",
  "DBMS",
  "Operating Systems",
  "Computer Networks",
];

const difficulties = ["All Levels", "Easy", "Medium", "Hard"];

function formatDate(date: string) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Date unavailable";
  }

  return parsed.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function scoreColor(score: number) {
  if (score >= 8) return "text-emerald-400";
  if (score >= 5) return "text-amber-400";
  return "text-rose-400";
}

export default function InterviewHistoryPage() {
  const router = useRouter();

  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("All Topics");
  const [selectedDifficulty, setSelectedDifficulty] =
    useState("All Levels");

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      const supabase = createClient();

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          router.replace("/login");
          return;
        }

        const { data, error: historyError } = await supabase
          .from("mock_interviews")
          .select(
            "id, topic, difficulty, question_scores, total_score, average_score, questions_completed, created_at"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (historyError) throw historyError;

        if (active) {
          setInterviews((data ?? []) as Interview[]);
          setError("");
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load interview history."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadHistory();

    return () => {
      active = false;
    };
  }, [router]);

  // Filters affect the displayed list, not the overall statistics.
  const filteredInterviews = useMemo(() => {
    const query = search.trim().toLowerCase();

    return interviews.filter((item) => {
      const matchesSearch =
        !query || item.topic.toLowerCase().includes(query);

      const matchesTopic =
        selectedTopic === "All Topics" ||
        item.topic === selectedTopic;

      const matchesDifficulty =
        selectedDifficulty === "All Levels" ||
        item.difficulty === selectedDifficulty;

      return matchesSearch && matchesTopic && matchesDifficulty;
    });
  }, [interviews, search, selectedTopic, selectedDifficulty]);

  const stats = useMemo(() => {
    if (interviews.length === 0) {
      return { average: 0, best: 0, completed: 0 };
    }

    const average =
      interviews.reduce(
        (sum, item) => sum + Number(item.average_score || 0),
        0
      ) / interviews.length;

    const best = Math.max(
      ...interviews.map((item) => Number(item.total_score || 0))
    );

    const completed = interviews.reduce(
      (sum, item) => sum + Number(item.questions_completed || 0),
      0
    );

    return { average, best, completed };
  }, [interviews]);

  // Display the five most recent interview averages.
  // Reverse them so the oldest of these appears first.
  const recentTrend = useMemo(
    () => interviews.slice(0, 5).reverse(),
    [interviews]
  );

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mb-7 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          <span aria-hidden="true">←</span> Back to Dashboard
        </button>

        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-400">
              Your progress
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Interview History
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
              Review your mock interviews, compare scores, and see how
              your placement preparation is progressing.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/mock-interview")}
            className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold transition hover:bg-purple-500"
          >
            + New Mock Interview
          </button>
        </header>

        {loading && (
          <div
            role="status"
            className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-8 text-slate-300"
          >
            <p className="animate-pulse">
              Loading your interview history...
            </p>
          </div>
        )}

        {!loading && error && (
          <section
            role="alert"
            className="mt-8 rounded-2xl border border-rose-900 bg-rose-950/30 p-6"
          >
            <h2 className="font-semibold text-rose-300">
              Unable to load interview history
            </h2>
            <p className="mt-2 break-words text-sm text-rose-200/80">
              {error}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg border border-rose-800 px-4 py-2 text-sm hover:bg-rose-900/40"
            >
              Try Again
            </button>
          </section>
        )}

        {!loading && !error && interviews.length === 0 && (
          <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10 text-3xl">
              🎯
            </div>
            <h2 className="mt-5 text-xl font-semibold">
              Your journey starts here
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">
              You haven't saved a mock interview yet. Complete your
              first interview to start tracking your scores and progress.
            </p>
            <button
              type="button"
              onClick={() => router.push("/mock-interview")}
              className="mt-6 rounded-xl bg-purple-600 px-6 py-3 font-semibold hover:bg-purple-500"
            >
              Start Your First Interview
            </button>
          </section>
        )}

        {!loading && !error && interviews.length > 0 && (
          <>
            <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Interviews completed"
                value={String(interviews.length)}
                detail="All saved interviews"
                icon="🎤"
              />
              <StatCard
                label="Overall average"
                value={stats.average.toFixed(1)}
                suffix="/ 10"
                detail="Average across interviews"
                icon="📊"
              />
              <StatCard
                label="Best total score"
                value={String(stats.best)}
                suffix="/ 50"
                detail="Your highest interview score"
                icon="🏆"
              />
              <StatCard
                label="Questions answered"
                value={String(stats.completed)}
                detail="Across all saved interviews"
                icon="💡"
              />
            </section>

            {recentTrend.length > 0 && (
              <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">
                      Recent performance
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Average score out of 10 for your latest interviews.
                    </p>
                  </div>
                  <span className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400">
                    Last {recentTrend.length} interviews
                  </span>
                </div>

                <div className="mt-7 flex h-44 items-end gap-3 sm:gap-5">
                  {recentTrend.map((item, index) => {
                    const score = Math.max(
                      0,
                      Math.min(10, Number(item.average_score) || 0)
                    );
                    const height = `${Math.max(score * 10, 3)}%`;

                    return (
                      <div
                        key={item.id}
                        className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                        title={`${item.topic}: ${score.toFixed(1)} out of 10`}
                      >
                        <span className="text-xs font-semibold text-slate-200">
                          {score.toFixed(1)}
                        </span>
                        <div className="flex h-full w-full items-end">
                          <div
                            className="mx-auto w-full max-w-14 rounded-t-lg bg-gradient-to-t from-purple-700 to-fuchsia-400 transition-all"
                            style={{ height }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">
                          #{index + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Bars run from 0 to 10. The first bar is the oldest
                  interview in this recent group.
                </p>
              </section>
            )}

            <section className="mt-8">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">
                    Saved interviews
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Showing {filteredInterviews.length} of {interviews.length}{" "}
                    interviews
                  </p>
                </div>

                {(search ||
                  selectedTopic !== "All Topics" ||
                  selectedDifficulty !== "All Levels") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setSelectedTopic("All Topics");
                      setSelectedDifficulty("All Levels");
                    }}
                    className="text-sm text-purple-300 hover:text-purple-200"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <label className="block">
                  <span className="mb-2 block text-xs font-medium text-slate-400">
                    Search by topic
                  </span>
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search Java, DSA..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-purple-500"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-medium text-slate-400">
                    Topic
                  </span>
                  <select
                    value={selectedTopic}
                    onChange={(event) => setSelectedTopic(event.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-purple-500"
                  >
                    {topics.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-medium text-slate-400">
                    Difficulty
                  </span>
                  <select
                    value={selectedDifficulty}
                    onChange={(event) =>
                      setSelectedDifficulty(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-purple-500"
                  >
                    {difficulties.map((difficulty) => (
                      <option key={difficulty} value={difficulty}>
                        {difficulty}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {filteredInterviews.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
                  <h3 className="font-semibold">No matching interviews</h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Try another search or clear your filters.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setSelectedTopic("All Topics");
                      setSelectedDifficulty("All Levels");
                    }}
                    className="mt-4 text-sm font-semibold text-purple-300 hover:text-purple-200"
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {filteredInterviews.map((item) => {
                    const scores = item.question_scores ?? [];
                    const average = Number(item.average_score) || 0;

                    return (
                      <article
                        key={item.id}
                        className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 transition hover:border-slate-700 sm:p-6"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-semibold">
                                {item.topic}
                              </h3>
                              <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
                                {item.difficulty}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-slate-400">
                              {formatDate(item.created_at)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {item.questions_completed} questions completed
                            </p>
                          </div>

                          <div className="sm:text-right">
                            <p className="text-2xl font-bold text-purple-300">
                              {Number(item.total_score) || 0}
                              <span className="text-base font-medium text-slate-500">
                                {" "}
                                / 50
                              </span>
                            </p>
                            <p className={`mt-1 text-sm font-medium ${scoreColor(average)}`}>
                              Average: {average.toFixed(1)} / 10
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 border-t border-slate-800 pt-4">
                          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Individual question scores
                          </p>

                          {scores.length === 0 ? (
                            <p className="text-sm text-slate-500">
                              No individual question scores were saved.
                            </p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {scores.map((score, index) => (
                                <span
                                  key={index}
                                  className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                                >
                                  <span className="text-slate-500">
                                    Q{index + 1}
                                  </span>
                                  <span className={`ml-2 font-semibold ${scoreColor(Number(score))}`}>
                                    {score}/10
                                  </span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

        <footer className="mt-10 border-t border-slate-800 py-6 text-center">
          <p className="text-sm text-slate-500">
            Consistent practice helps you prepare with confidence.
          </p>
          <button
            type="button"
            onClick={() => router.push("/mock-interview")}
            className="mt-3 font-semibold text-purple-300 hover:text-purple-200"
          >
            Practice another interview →
          </button>
        </footer>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  suffix,
  detail,
  icon,
}: {
  label: string;
  value: string;
  suffix?: string;
  detail: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-400">{label}</p>
        <span className="text-xl" aria-hidden="true">
          {icon}
        </span>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight">
        {value}
        {suffix && (
          <span className="ml-1 text-base font-medium text-slate-500">
            {suffix}
          </span>
        )}
      </p>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

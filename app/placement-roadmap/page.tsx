"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const roadmap = [
  {
    week: 1,
    title: "Java Fundamentals",
    subtitle: "Build a strong programming foundation",
    tasks: [
      "Revise variables, data types, operators, and loops",
      "Practice methods, arrays, and strings",
      "Understand OOP: inheritance, polymorphism, abstraction, encapsulation",
      "Solve 5 easy Java coding problems",
    ],
  },
  {
    week: 2,
    title: "Data Structures and Algorithms",
    subtitle: "Start solving problems systematically",
    tasks: [
      "Learn time and space complexity",
      "Practice arrays, strings, and two pointers",
      "Learn searching and sorting algorithms",
      "Solve 5–10 DSA problems and review mistakes",
    ],
  },
  {
    week: 3,
    title: "Core Computer Science",
    subtitle: "Prepare for technical interviews",
    tasks: [
      "Revise DBMS, SQL queries, joins, and normalization",
      "Study OS processes, threads, and deadlocks",
      "Revise computer networks, TCP/IP, HTTP, and DNS",
      "Practice explaining technical concepts aloud",
    ],
  },
  {
    week: 4,
    title: "Intermediate DSA",
    subtitle: "Improve problem-solving ability",
    tasks: [
      "Learn linked lists, stacks, and queues",
      "Practice hash maps, sets, and binary search",
      "Learn recursion and basic backtracking",
      "Solve medium problems and revisit incorrect solutions",
    ],
  },
  {
    week: 5,
    title: "Projects and Development",
    subtitle: "Show practical engineering skills",
    tasks: [
      "Improve one existing project and its README",
      "Understand frontend, backend, APIs, and database flow",
      "Test important features and handle errors",
      "Prepare a clear explanation of project design decisions",
    ],
  },
  {
    week: 6,
    title: "Interview Practice",
    subtitle: "Turn knowledge into interview performance",
    tasks: [
      "Complete a timed coding practice session",
      "Take an AI mock interview",
      "Review weak topics and previous mistakes",
      "Practice your introduction and project explanation",
    ],
  },
  {
    week: 7,
    title: "Advanced Problem Solving",
    subtitle: "Build consistency with tougher problems",
    tasks: [
      "Practice trees, heaps, and graph fundamentals",
      "Study dynamic programming basics",
      "Take part in a coding contest",
      "Review patterns from problems you could not solve",
    ],
  },
  {
    week: 8,
    title: "Placement Readiness",
    subtitle: "Measure progress and prepare to apply",
    tasks: [
      "Take a full mock technical interview",
      "Revise Java, DSA, DBMS, OS, and networks",
      "Update your resume and GitHub projects",
      "Research target companies and practice HR questions",
    ],
  },
];

const allTasks = roadmap.flatMap((week) =>
  week.tasks.map((task) => `${week.week}-${task}`)
);

export default function PlacementRoadmapPage() {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const supabase = createClient();

  const loadProgress = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        setUserId(null);
        setCompleted({});
        setError("Please log in to save and load your roadmap progress.");
        return;
      }

      setUserId(user.id);

      const { data, error: queryError } = await supabase
        .from("roadmap_progress")
        .select("task_key, is_completed")
        .eq("user_id", user.id);

      if (queryError) throw queryError;

      const savedProgress: Record<string, boolean> = {};

      for (const row of data ?? []) {
        if (row.is_completed) {
          savedProgress[row.task_key] = true;
        }
      }

      setCompleted(savedProgress);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load your roadmap progress."
      );
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void loadProgress();
  }, [loadProgress]);

  const completedCount = allTasks.filter(
    (task) => completed[task]
  ).length;

  const progress = Math.round(
    (completedCount / allTasks.length) * 100
  );

  async function toggleTask(taskId: string) {
    if (!userId || saving || loading) return;

    const newStatus = !completed[taskId];

    // Update the screen immediately.
    setCompleted((previous) => ({
      ...previous,
      [taskId]: newStatus,
    }));

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const { error: saveError } = await supabase
        .from("roadmap_progress")
        .upsert(
          {
            user_id: userId,
            task_key: taskId,
            is_completed: newStatus,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,task_key",
          }
        );

      if (saveError) throw saveError;

      setMessage("Progress saved successfully.");
    } catch (err) {
      // Restore the previous state if saving fails.
      setCompleted((previous) => ({
        ...previous,
        [taskId]: !newStatus,
      }));

      setError(
        err instanceof Error
          ? `Could not save progress: ${err.message}`
          : "Could not save progress. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function resetProgress() {
    if (!userId || saving || loading) return;

    const confirmed = window.confirm(
      "Reset all roadmap tasks to incomplete?"
    );

    if (!confirmed) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      // Set every task to false rather than deleting rows.
      // This works with the SELECT, INSERT and UPDATE policies.
      const rows = allTasks.map((taskId) => ({
        user_id: userId,
        task_key: taskId,
        is_completed: false,
        updated_at: new Date().toISOString(),
      }));

      const { error: resetError } = await supabase
        .from("roadmap_progress")
        .upsert(rows, {
          onConflict: "user_id,task_key",
        });

      if (resetError) throw resetError;

      setCompleted({});
      setMessage("Roadmap progress has been reset.");
    } catch (err) {
      setError(
        err instanceof Error
          ? `Could not reset progress: ${err.message}`
          : "Could not reset progress. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/dashboard"
          className="text-sm text-cyan-400 hover:underline"
        >
          ← Back to Dashboard
        </Link>

        <header className="mb-8 mt-6">
          <p className="font-semibold uppercase tracking-widest text-cyan-400">
            Your career preparation
          </p>

          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Placement Roadmap
          </h1>

          <p className="mt-3 max-w-2xl text-slate-400">
            Follow this eight-week roadmap to build Java, DSA, core CS,
            project, and interview skills.
          </p>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-5 break-words rounded-xl border border-red-900 bg-red-950 p-4 text-red-300"
          >
            {error}
          </div>
        )}

        {message && (
          <p role="status" className="mb-5 text-sm text-cyan-400">
            {message}
          </p>
        )}

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Your Progress</h2>
              <p className="mt-1 text-sm text-slate-400">
                {loading
                  ? "Loading saved progress..."
                  : `${completedCount} of ${allTasks.length} tasks completed`}
              </p>
            </div>

            <span className="text-3xl font-bold text-cyan-400">
              {loading ? "..." : `${progress}%`}
            </span>
          </div>

          <div
            className="mt-5 h-3 overflow-hidden rounded-full bg-slate-800"
            role="progressbar"
            aria-label="Placement roadmap progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={loading ? 0 : progress}
          >
            <div
              className="h-full rounded-full bg-cyan-400 transition-all duration-300"
              style={{ width: `${loading ? 0 : progress}%` }}
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/coding-practice"
              className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
            >
              Practice Coding
            </Link>

            <Link
              href="/mock-interview"
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
            >
              Start Mock Interview
            </Link>

            <button
              type="button"
              onClick={resetProgress}
              disabled={loading || saving || !userId}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Reset Progress"}
            </button>
          </div>

          {saving && (
            <p className="mt-3 text-sm text-slate-400">
              Saving your progress...
            </p>
          )}
        </section>

        {loading ? (
          <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6 text-slate-300">
            Loading your roadmap...
          </div>
        ) : (
          <section className="mt-8 space-y-5">
            {roadmap.map((week) => {
              const weekTasks = week.tasks.map(
                (task) => `${week.week}-${task}`
              );

              const weekCompleted = weekTasks.filter(
                (task) => completed[task]
              ).length;

              return (
                <article
                  key={week.week}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-cyan-400">
                        WEEK {week.week}
                      </p>

                      <h2 className="mt-1 text-xl font-bold">
                        {week.title}
                      </h2>

                      <p className="mt-2 text-sm text-slate-400">
                        {week.subtitle}
                      </p>
                    </div>

                    <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
                      {weekCompleted}/{week.tasks.length}
                    </span>
                  </div>

                  <div className="mt-5 space-y-3">
                    {week.tasks.map((task) => {
                      const taskId = `${week.week}-${task}`;

                      return (
                        <label
                          key={taskId}
                          className="flex cursor-pointer items-start gap-3 rounded-lg bg-slate-950 p-3 hover:bg-slate-800"
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(completed[taskId])}
                            disabled={saving}
                            onChange={() => void toggleTask(taskId)}
                            className="mt-1 h-4 w-4 shrink-0 accent-cyan-400"
                          />

                          <span
                            className={
                              completed[taskId]
                                ? "text-slate-500 line-through"
                                : "text-slate-200"
                            }
                          >
                            {task}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {!loading && progress === 100 && (
          <section className="mt-8 rounded-xl border border-emerald-800 bg-slate-900 p-6">
            <h2 className="text-xl font-bold text-emerald-400">
              Roadmap completed!
            </h2>
            <p className="mt-2 text-slate-300">
              Congratulations! Review your weak areas, continue solving
              problems, and keep practicing interviews.
            </p>
          </section>
        )}

        <footer className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link
            href="/study-planner"
            className="text-cyan-400 hover:underline"
          >
            Daily Study Planner →
          </Link>

          <Link
            href="/ai-study-plan"
            className="text-cyan-400 hover:underline"
          >
            Generate AI Study Plan →
          </Link>

          <Link
            href="/placement-readiness"
            className="text-cyan-400 hover:underline"
          >
            Placement Readiness →
          </Link>
        </footer>
      </div>
    </main>
  );
}

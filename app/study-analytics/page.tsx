"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type StudyTask = {
  id: string;
  task: string;
  task_date: string;
  is_completed: boolean;
};

type DailyProgress = {
  dateString: string;
  label: string;
  total: number;
  completed: number;
  percentage: number;
};

export default function StudyAnalyticsPage() {
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [todayString, setTodayString] = useState("");
  const [lastSevenDays, setLastSevenDays] = useState<DailyProgress[]>([]);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Please sign in to view your study analytics.");
      }

      const { data, error: queryError } = await supabase
        .from("study_tasks")
        .select("id, task, task_date, is_completed")
        .eq("user_id", user.id)
        .order("task_date", { ascending: false });

      if (queryError) {
        throw queryError;
      }

      setTasks((data ?? []) as StudyTask[]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load study progress."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    const formatDate = (date: Date) =>
      [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-");

    setTodayString(formatDate(new Date()));

    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));

      return {
        dateString: formatDate(date),
        label: date.toLocaleDateString("en-IN", {
          weekday: "short",
        }),
      };
    });

    setLastSevenDays(
      days.map((day) => {
        const dailyTasks = tasks.filter(
          (task) => task.task_date === day.dateString
        );

        const completed = dailyTasks.filter(
          (task) => task.is_completed
        ).length;

        return {
          ...day,
          total: dailyTasks.length,
          completed,
          percentage:
            dailyTasks.length === 0
              ? 0
              : Math.round((completed / dailyTasks.length) * 100),
        };
      })
    );
  }, [tasks]);

  const completedTasks = tasks.filter(
    (task) => task.is_completed
  ).length;

  const pendingTasks = tasks.length - completedTasks;

  const completionRate =
    tasks.length === 0
      ? 0
      : Math.round((completedTasks / tasks.length) * 100);

  const todayTasks = tasks.filter(
    (task) => task.task_date === todayString
  );

  const todayCompleted = todayTasks.filter(
    (task) => task.is_completed
  ).length;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-cyan-400">
              YOUR LEARNING JOURNEY
            </p>

            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              Study Analytics
            </h1>

            <p className="mt-3 text-slate-400">
              Track your task completion and daily study consistency.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadTasks()}
            disabled={loading}
            className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link
            href="/study-planner"
            className="text-cyan-400 hover:underline"
          >
            Open Study Planner →
          </Link>

          <Link
            href="/ai-study-plan"
            className="text-cyan-400 hover:underline"
          >
            Generate AI Study Plan →
          </Link>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-6 rounded-lg border border-red-800 bg-slate-900 p-4 text-red-300"
          >
            {error}
          </p>
        )}

        {!error && loading && (
          <p className="mt-8 text-slate-400">
            Loading your study data...
          </p>
        )}

        {!loading && !error && (
          <>
            <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Total Tasks" value={tasks.length} />
              <StatCard title="Completed" value={completedTasks} />
              <StatCard title="Pending" value={pendingTasks} />
              <StatCard
                title="Completion Rate"
                value={`${completionRate}%`}
              />
            </section>

            <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">
                    Overall Progress
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Completed tasks compared with all saved tasks.
                  </p>
                </div>

                <span className="text-2xl font-bold text-cyan-400">
                  {completionRate}%
                </span>
              </div>

              <div
                className="mt-5 h-4 overflow-hidden rounded-full bg-slate-800"
                role="progressbar"
                aria-label="Overall task completion"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={completionRate}
              >
                <div
                  className="h-full rounded-full bg-cyan-400 transition-all"
                  style={{ width: `${completionRate}%` }}
                />
              </div>

              <p className="mt-3 text-sm text-slate-400">
                {completedTasks} completed out of {tasks.length} tasks.
              </p>
            </section>

            <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-bold">
                Today&apos;s Progress
              </h2>

              <p className="mt-2 text-slate-400">
                {todayCompleted} of {todayTasks.length} tasks completed today.
              </p>

              {todayTasks.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">
                  No tasks are scheduled for today yet.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {todayTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 rounded-lg bg-slate-950 p-3"
                    >
                      <span
                        className={
                          task.is_completed
                            ? "text-emerald-400"
                            : "text-slate-500"
                        }
                      >
                        {task.is_completed ? "✓" : "○"}
                      </span>

                      <span className="break-words">
                        {task.task}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-bold">Last 7 Days</h2>

              <p className="mt-2 text-sm text-slate-400">
                Daily completion rate for tasks scheduled on each day.
              </p>

              <div className="mt-6 grid grid-cols-7 items-end gap-2 sm:gap-4">
                {lastSevenDays.map((day) => (
                  <div
                    key={day.dateString}
                    className="flex min-w-0 flex-col items-center gap-2"
                  >
                    <span className="text-xs text-slate-400">
                      {day.total === 0 ? "—" : `${day.percentage}%`}
                    </span>

                    <div className="flex h-36 w-full items-end overflow-hidden rounded-t-md bg-slate-800">
                      <div
                        className="w-full rounded-t-md bg-cyan-400 transition-all"
                        style={{
                          height: `${day.percentage}%`,
                          minHeight:
                            day.percentage > 0 ? "4px" : "0px",
                        }}
                        title={`${day.completed} of ${day.total} completed`}
                      />
                    </div>

                    <span className="text-xs text-slate-400">
                      {day.label}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {tasks.length === 0 && (
              <p className="mt-6 rounded-lg border border-slate-800 p-5 text-slate-400">
                Your analytics will appear here after you add tasks in the
                Study Planner.
              </p>
            )}
          </>
        )}

        <div className="mt-8">
          <Link
            href="/dashboard"
            className="text-sm text-slate-400 hover:text-white"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-3 text-3xl font-bold text-cyan-400">
        {value}
      </p>
    </div>
  );
}

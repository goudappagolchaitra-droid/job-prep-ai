"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const challenges = [
  {
    title: "Two Sum",
    difficulty: "Easy",
    topic: "Arrays and Hash Maps",
    description:
      "Given an array of integers nums and an integer target, return the indices of two numbers that add up to target.",
    example: "nums = [2, 7, 11, 15], target = 9",
    output: "[0, 1]",
    hint: "A hash map can help you find the required complement efficiently.",
  },
  {
    title: "Valid Parentheses",
    difficulty: "Easy",
    topic: "Stack",
    description:
      "Determine whether every opening bracket in a string is closed by the correct type of bracket in the correct order.",
    example: 's = "()[]{}"',
    output: "true",
    hint: "Use a stack to remember opening brackets.",
  },
  {
    title: "Best Time to Buy and Sell Stock",
    difficulty: "Easy",
    topic: "Arrays",
    description:
      "Given daily stock prices, find the maximum profit possible from one buy followed by one sell. Return 0 if no profit is possible.",
    example: "prices = [7, 1, 5, 3, 6, 4]",
    output: "5",
    hint: "Track the lowest price seen so far and the best profit.",
  },
  {
    title: "Binary Search",
    difficulty: "Easy",
    topic: "Searching",
    description:
      "Given a sorted array and a target value, return its index or -1 if it is not present.",
    example: "nums = [-1, 0, 3, 5, 9, 12], target = 9",
    output: "4",
    hint: "Check the middle element and eliminate half the search range.",
  },
  {
    title: "Maximum Subarray",
    difficulty: "Medium",
    topic: "Dynamic Programming",
    description:
      "Find the contiguous subarray with the largest possible sum and return that sum.",
    example: "nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]",
    output: "6",
    hint: "At each position, extend the previous subarray or start a new one.",
  },
  {
    title: "Reverse Linked List",
    difficulty: "Easy",
    topic: "Linked Lists",
    description:
      "Given the head of a singly linked list, reverse the list and return its new head.",
    example: "1 -> 2 -> 3 -> 4 -> 5",
    output: "5 -> 4 -> 3 -> 2 -> 1",
    hint: "Track the previous node, current node, and next node.",
  },
  {
    title: "Climbing Stairs",
    difficulty: "Easy",
    topic: "Dynamic Programming",
    description:
      "You can climb one or two steps at a time. Find the number of distinct ways to reach the top of n steps.",
    example: "n = 4",
    output: "5",
    hint: "The number of ways to reach a step depends on the previous two steps.",
  },
];

type ProgressRow = {
  challenge_date: string;
  challenge_title: string;
  is_completed: boolean;
};

function getLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getChallengeIndex(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);

  const dayNumber = Math.floor(
    Date.UTC(year, month - 1, day) / 86400000
  );

  return dayNumber % challenges.length;
}

function getUTCDateString(date: Date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function calculateStreak(rows: ProgressRow[], today: string) {
  if (!today) return 0;

  const completedDates = new Set(
    rows
      .filter((row) => row.is_completed)
      .map((row) => row.challenge_date)
  );

  let currentDate = new Date(`${today}T00:00:00.000Z`);

  // If today is not complete, allow the streak to continue from yesterday.
  if (!completedDates.has(today)) {
    currentDate.setUTCDate(currentDate.getUTCDate() - 1);

    if (!completedDates.has(getUTCDateString(currentDate))) {
      return 0;
    }
  }

  let streak = 0;

  while (completedDates.has(getUTCDateString(currentDate))) {
    streak += 1;
    currentDate.setUTCDate(currentDate.getUTCDate() - 1);
  }

  return streak;
}

export default function DailyChallengePage() {
  const [supabase] = useState(() => createClient());

  // Keep the date empty during server prerendering.
  const [today, setToday] = useState("");

  const [userId, setUserId] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Calculate today's date only after the component mounts in the browser.
  useEffect(() => {
    setToday(getLocalDateString(new Date()));
  }, []);

  const challenge = today
    ? challenges[getChallengeIndex(today)]
    : challenges[0];

  const loadProgress = useCallback(async () => {
    if (!today) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        setUserId(null);
        setCompleted(false);
        setCompletedCount(0);
        setStreak(0);
        setError("Please log in to save your daily challenge progress.");
        return;
      }

      setUserId(user.id);

      const { data, error: queryError } = await supabase
        .from("daily_challenge_progress")
        .select("challenge_date, challenge_title, is_completed")
        .eq("user_id", user.id)
        .order("challenge_date", { ascending: false });

      if (queryError) throw queryError;

      const rows = (data ?? []) as ProgressRow[];

      const todayRow = rows.find(
        (row) => row.challenge_date === today
      );

      setCompleted(Boolean(todayRow?.is_completed));
      setCompletedCount(rows.filter((row) => row.is_completed).length);
      setStreak(calculateStreak(rows, today));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load your challenge progress."
      );
    } finally {
      setLoading(false);
    }
  }, [supabase, today]);

  // Load progress only after today's date has been calculated.
  useEffect(() => {
    if (!today) return;

    void loadProgress();
  }, [today, loadProgress]);

  async function toggleCompleted() {
    if (!userId || !today || saving || loading) return;

    const newStatus = !completed;
    const previousStatus = completed;

    setCompleted(newStatus);
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const now = new Date().toISOString();

      const { error: saveError } = await supabase
        .from("daily_challenge_progress")
        .upsert(
          {
            user_id: userId,
            challenge_date: today,
            challenge_title: challenge.title,
            is_completed: newStatus,
            completed_at: newStatus ? now : null,
            updated_at: now,
          },
          {
            onConflict: "user_id,challenge_date",
          }
        );

      if (saveError) throw saveError;

      await loadProgress();

      setMessage(
        newStatus
          ? "Challenge completed and saved successfully!"
          : "Challenge marked as incomplete."
      );
    } catch (err) {
      setCompleted(previousStatus);

      setError(
        err instanceof Error
          ? `Could not save your progress: ${err.message}`
          : "Could not save progress. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/dashboard"
          className="text-sm text-cyan-400 hover:underline"
        >
          ← Back to Dashboard
        </Link>

        <header className="mb-8 mt-6">
          <p className="font-semibold uppercase tracking-widest text-cyan-400">
            Build a daily habit
          </p>

          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Daily Coding Challenge
          </h1>

          <p className="mt-3 text-slate-400">
            Solve one problem, understand the pattern, and improve your
            problem-solving skills every day.
          </p>

          {today && (
            <p className="mt-3 text-sm text-slate-500">
              Today's date: {today}
            </p>
          )}
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

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-cyan-300">
              Today's Challenge
            </span>

            <span
              className={`rounded-full px-3 py-1 text-sm ${
                challenge.difficulty === "Medium"
                  ? "bg-amber-950 text-amber-300"
                  : "bg-emerald-950 text-emerald-300"
              }`}
            >
              {challenge.difficulty}
            </span>
          </div>

          <h2 className="mt-5 text-2xl font-bold">{challenge.title}</h2>

          <p className="mt-2 text-sm text-slate-400">
            Topic: {challenge.topic}
          </p>

          <div className="mt-6">
            <h3 className="font-semibold">Problem</h3>
            <p className="mt-2 leading-7 text-slate-300">
              {challenge.description}
            </p>
          </div>

          <div className="mt-6 rounded-xl bg-slate-950 p-4">
            <p className="text-sm font-semibold text-slate-300">Example</p>
            <p className="mt-2 break-words font-mono text-sm text-cyan-300">
              {challenge.example}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Output: <span className="text-white">{challenge.output}</span>
            </p>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowHint((value) => !value)}
              className="text-sm text-cyan-400 hover:underline"
            >
              {showHint ? "Hide hint" : "Show hint"}
            </button>

            {showHint && (
              <p className="mt-3 rounded-lg border border-slate-700 p-4 text-slate-300">
                {challenge.hint}
              </p>
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={toggleCompleted}
              disabled={!today || loading || saving || !userId}
              className={`rounded-lg px-4 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                completed
                  ? "border border-emerald-700 text-emerald-300"
                  : "bg-cyan-400 text-slate-950 hover:bg-cyan-300"
              }`}
            >
              {!today || loading
                ? "Loading..."
                : saving
                  ? "Saving..."
                  : completed
                    ? "✓ Completed"
                    : "Mark as Completed"}
            </button>

            <Link
              href="/coding-practice"
              className="rounded-lg border border-slate-700 px-4 py-3 hover:bg-slate-800"
            >
              Open Coding Practice
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Completed Challenges</p>
            <p className="mt-2 text-3xl font-bold text-cyan-400">
              {loading ? "..." : completedCount}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Total saved completions
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Current Streak</p>
            <p className="mt-2 text-3xl font-bold text-amber-400">
              {loading ? "..." : `${streak} days`}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Consecutive completed dates
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Today's Status</p>
            <p className="mt-2 text-xl font-bold">
              {loading
                ? "Loading..."
                : completed
                  ? "Completed ✓"
                  : "Pending"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {completed ? "Well done!" : "Solve today's challenge"}
            </p>
          </div>
        </section>

        <footer className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link
            href="/placement-roadmap"
            className="text-cyan-400 hover:underline"
          >
            Placement Roadmap →
          </Link>

          <Link
            href="/study-planner"
            className="text-cyan-400 hover:underline"
          >
            Daily Study Planner →
          </Link>

          <Link
            href="/daily-challenge-history"
            className="text-cyan-400 hover:underline"
          >
            Challenge History →
          </Link>

          <Link
            href="/dashboard"
            className="text-cyan-400 hover:underline"
          >
            Dashboard →
          </Link>
        </footer>
      </div>
    </main>
  );
}
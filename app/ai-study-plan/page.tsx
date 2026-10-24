"use client";

import { useState } from "react";
import Link from "next/link";

type SavedPlanResponse = {
  error?: string;
  success?: boolean;
  id?: string;
};

type StudyPlanResponse = {
  plan?: string;
  error?: string;
  basedOn?: {
    interviews: number;
    codeReviews: number;
  };
};

export default function AIStudyPlanPage() {
  const [hours, setHours] = useState("4");
  const [days, setDays] = useState("7");
  const [plan, setPlan] = useState("");
  const [basedOn, setBasedOn] = useState<StudyPlanResponse["basedOn"]>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  async function generatePlan() {
    setLoading(true);
    setError("");
    setSaveMessage("");
    setPlan("");
    setBasedOn(undefined);

    try {
      const response = await fetch("/api/study-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hours: Number(hours),
          days: Number(days),
        }),
      });

      const result: StudyPlanResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Could not generate your study plan."
        );
      }

      if (!result.plan) {
        throw new Error("The AI returned an empty study plan.");
      }

      setPlan(result.plan);
      setBasedOn(result.basedOn);
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

  async function savePlan() {
    if (!plan || saving) return;

    setSaving(true);
    setSaveMessage("");
    setError("");

    try {
      const response = await fetch("/api/saved-study-plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `AI Study Plan - ${days} days`,
          plan,
          hours: Number(hours),
          days: Number(days),
        }),
      });

      const result: SavedPlanResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Could not save the study plan."
        );
      }

      setSaveMessage("Study plan saved successfully!");
    } catch (err) {
      setSaveMessage(
        err instanceof Error
          ? err.message
          : "Something went wrong while saving."
      );
    } finally {
      setSaving(false);
    }
  }

  async function copyPlan() {
    try {
      await navigator.clipboard.writeText(plan);
      setSaveMessage("Study plan copied to clipboard!");
    } catch {
      setSaveMessage(
        "Could not copy the plan. Please select and copy the text manually."
      );
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

        <header className="mb-8 mt-5">
          <p className="font-semibold uppercase tracking-widest text-cyan-400">
            AI-powered preparation
          </p>

          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Personalized Study Plan
          </h1>

          <p className="mt-3 max-w-2xl text-slate-400">
            Generate a practical placement preparation plan based on your
            mock interview results and saved code reviews.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Your availability</h2>

          <p className="mt-2 text-sm text-slate-400">
            Choose a realistic schedule you can follow consistently.
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="study-hours"
                className="mb-2 block text-sm text-slate-300"
              >
                Study hours per day
              </label>

              <select
                id="study-hours"
                value={hours}
                onChange={(event) => setHours(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3"
              >
                <option value="1">1 hour</option>
                <option value="2">2 hours</option>
                <option value="3">3 hours</option>
                <option value="4">4 hours</option>
                <option value="5">5 hours</option>
                <option value="6">6 hours</option>
                <option value="8">8 hours</option>
                <option value="10">10 hours</option>
                <option value="12">12 hours</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="plan-days"
                className="mb-2 block text-sm text-slate-300"
              >
                Plan duration
              </label>

              <select
                id="plan-days"
                value={days}
                onChange={(event) => setDays(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3"
              >
                <option value="3">3 days</option>
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="21">21 days</option>
                <option value="30">30 days</option>
              </select>
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-slate-950 p-4">
            <p className="text-sm text-slate-400">
              Your planned commitment
            </p>

            <p className="mt-1 text-2xl font-bold text-cyan-400">
              {Number(hours) * Number(days)} hours
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Across {days} days, at {hours} hours per day.
            </p>
          </div>

          <button
            type="button"
            onClick={generatePlan}
            disabled={loading || saving}
            className="mt-6 w-full rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {loading ? "Generating your plan..." : "Generate My Study Plan"}
          </button>
        </section>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-900 bg-red-950 p-4 text-red-300"
          >
            {error}
          </div>
        )}

        {loading && (
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p className="animate-pulse text-cyan-400">
              Analyzing your preparation history and building your schedule...
            </p>
          </div>
        )}

        {plan && !loading && (
          <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">
                  Your AI Study Plan
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  {hours} hours per day · {days} days
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={copyPlan}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
                >
                  Copy Plan
                </button>

                <button
                  type="button"
                  onClick={savePlan}
                  disabled={saving}
                  className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Plan"}
                </button>
              </div>
            </div>

            {saveMessage && (
              <p
                role="status"
                className="mt-4 text-sm text-cyan-400"
              >
                {saveMessage}
              </p>
            )}

            {basedOn && (
              <p className="mt-4 text-sm text-slate-400">
                Personalization data: {basedOn.interviews} mock interviews and{" "}
                {basedOn.codeReviews} code reviews.
              </p>
            )}

            <div className="mt-6 whitespace-pre-wrap break-words leading-7 text-slate-200">
              {plan}
            </div>

            <div className="mt-6 border-t border-slate-800 pt-5">
              <Link
                href="/saved-study-plans"
                className="text-sm text-cyan-400 hover:underline"
              >
                View Saved Study Plans →
              </Link>
            </div>
          </section>
        )}

        {!plan && !loading && !error && (
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="font-semibold">
              What your plan will include
            </h2>

            <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-slate-400">
              <li>Java and DSA practice recommendations</li>
              <li>Revision topics based on interview feedback</li>
              <li>Daily tasks with time allocations</li>
              <li>Mock interview and coding practice goals</li>
            </ul>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link
            href="/study-planner"
            className="text-cyan-400 hover:underline"
          >
            Open Daily Study Planner →
          </Link>

          <Link
            href="/interview-history"
            className="text-cyan-400 hover:underline"
          >
            View Interview History →
          </Link>

          <Link
            href="/coding-practice"
            className="text-cyan-400 hover:underline"
          >
            Practice Coding →
          </Link>
        </div>
      </div>
    </main>
  );
}
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type SavedPlan = {
  id: string;
  title: string;
  plan_content: string;
  daily_hours: number;
  duration_days: number;
  created_at: string;
};

export default function SavedStudyPlansPage() {
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const { data, error: queryError } = await supabase
        .from("saved_study_plans")
        .select(
          "id, title, plan_content, daily_hours, duration_days, created_at"
        )
        .order("created_at", { ascending: false });

      if (queryError) {
        throw queryError;
      }

      setPlans((data ?? []) as SavedPlan[]);
    } catch {
      setError(
        "Could not load your saved plans. Please check your sign-in and Supabase table."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  async function copyPlan(content: string) {
    try {
      await navigator.clipboard.writeText(content);
      setMessage("Plan copied to clipboard!");
    } catch {
      setMessage("Could not copy the plan. Please select and copy its text.");
    }
  }

  async function deletePlan(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this saved study plan?"
    );

    if (!confirmed) return;

    setDeletingId(id);
    setError("");
    setMessage("");

    try {
      const supabase = createClient();

      const { error: deleteError } = await supabase
        .from("saved_study_plans")
        .delete()
        .eq("id", id);

      if (deleteError) {
        throw deleteError;
      }

      setPlans((currentPlans) =>
        currentPlans.filter((plan) => plan.id !== id)
      );
      setMessage("Study plan deleted successfully.");
    } catch {
      setError("Could not delete this plan. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold text-cyan-400">
              YOUR LEARNING JOURNEY
            </p>

            <h1 className="text-3xl font-bold sm:text-4xl">
              Saved Study Plans
            </h1>

            <p className="mt-3 text-slate-400">
              View, copy, and manage your personalized AI study plans.
            </p>
          </div>

          <Link
            href="/ai-study-plan"
            className="rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
          >
            + Generate New Plan
          </Link>
        </div>

        {message && (
          <p
            role="status"
            className="mb-5 rounded-lg border border-cyan-800 bg-slate-900 p-3 text-sm text-cyan-300"
          >
            {message}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mb-5 rounded-lg border border-red-800 bg-slate-900 p-3 text-sm text-red-300"
          >
            {error}
          </p>
        )}

        {loading ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
            Loading your saved plans...
          </div>
        ) : plans.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
            <h2 className="text-xl font-semibold">No saved plans yet</h2>

            <p className="mt-3 text-slate-400">
              Generate an AI study plan and save it here for later.
            </p>

            <Link
              href="/ai-study-plan"
              className="mt-6 inline-block rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
            >
              Create Your First Plan
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-sm text-slate-400">
              {plans.length} saved {plans.length === 1 ? "plan" : "plans"}
            </p>

            {plans.map((plan) => (
              <article
                key={plan.id}
                className="rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row">
                  <div className="min-w-0">
                    <h2 className="break-words text-xl font-bold">
                      {plan.title}
                    </h2>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-cyan-300">
                        {plan.daily_hours} hours/day
                      </span>

                      <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-cyan-300">
                        {plan.duration_days} days
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-slate-500">
                      Saved: {new Date(plan.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-start gap-2">
                    <button
                      type="button"
                      onClick={() => void copyPlan(plan.plan_content)}
                      className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
                    >
                      Copy Plan
                    </button>

                    <button
                      type="button"
                      onClick={() => void deletePlan(plan.id)}
                      disabled={deletingId === plan.id}
                      className="rounded-lg border border-red-800 px-4 py-2 text-sm text-red-300 hover:bg-red-950 disabled:opacity-50"
                    >
                      {deletingId === plan.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>

                <details className="mt-5">
                  <summary className="cursor-pointer font-medium text-cyan-400 hover:text-cyan-300">
                    View full study plan
                  </summary>

                  <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-4 font-sans text-sm leading-7 text-slate-300">
                    {plan.plan_content}
                  </pre>
                </details>
              </article>
            ))}
          </div>
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
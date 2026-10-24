
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type CodeReview = {
  id: string;
  problem_title: string;
  language: string;
  submitted_code: string;
  feedback: string;
  created_at: string;
};

export default function CodeReviewHistoryPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<CodeReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedReview, setExpandedReview] = useState<string | null>(null);

  useEffect(() => {
    async function loadReviews() {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/login");
        return;
      }

      const { data, error: queryError } = await supabase
        .from("code_reviews")
        .select(
          "id, problem_title, language, submitted_code, feedback, created_at"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (queryError) {
        setError("Unable to load your code review history. Please try again.");
        setLoading(false);
        return;
      }

      setReviews((data ?? []) as CodeReview[]);
      setLoading(false);
    }

    loadReviews();
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm text-pink-400">JOBPREP AI</p>
            <h1 className="text-3xl font-bold sm:text-4xl">
              Code Review History
            </h1>
            <p className="mt-2 text-slate-400">
              Revisit your submitted code and AI feedback.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800"
          >
            Dashboard
          </Link>
        </header>

        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Saved reviews</p>
          <p className="mt-1 text-3xl font-bold">{reviews.length}</p>
        </div>

        {loading && (
          <p className="py-10 text-center text-slate-400">
            Loading your reviews...
          </p>
        )}

        {!loading && error && (
          <div
            role="alert"
            className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300"
          >
            {error}
          </div>
        )}

        {!loading && !error && reviews.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
            <h2 className="text-xl font-semibold">No reviews yet</h2>
            <p className="mt-2 text-slate-400">
              Submit a solution and request an AI review to see it here.
            </p>
            <Link
              href="/coding-practice"
              className="mt-5 inline-block rounded-lg bg-pink-600 px-5 py-3 font-semibold hover:bg-pink-500"
            >
              Start Coding Practice
            </Link>
          </div>
        )}

        <div className="space-y-5">
          {reviews.map((review) => {
            const isExpanded = expandedReview === review.id;

            return (
              <article
                key={review.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {review.problem_title}
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                      {review.language} ·{" "}
                      {new Date(review.created_at).toLocaleString()}
                    </p>
                  </div>

                  <span className="rounded-full bg-pink-500/10 px-3 py-1 text-sm text-pink-300">
                    AI Reviewed
                  </span>
                </div>

                <button
                  onClick={() =>
                    setExpandedReview(isExpanded ? null : review.id)
                  }
                  aria-expanded={isExpanded}
                  className="mt-5 rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
                >
                  {isExpanded ? "Hide Details" : "View Code & Feedback"}
                </button>

                {isExpanded && (
                  <div className="mt-5 space-y-5">
                    <section>
                      <h3 className="mb-2 font-semibold">Submitted Code</h3>
                      <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-slate-950 p-4 text-sm leading-6 text-green-300">
                        {review.submitted_code}
                      </pre>
                    </section>

                    <section>
                      <h3 className="mb-2 font-semibold">AI Feedback</h3>
                      <div className="whitespace-pre-wrap break-words rounded-xl bg-slate-950 p-4 text-sm leading-7 text-slate-300">
                        {review.feedback}
                      </div>
                    </section>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        <div className="mt-8">
          <Link
            href="/coding-practice"
            className="text-pink-400 hover:underline"
          >
            ← Continue Coding Practice
          </Link>
        </div>
      </div>
    </main>
  );
}

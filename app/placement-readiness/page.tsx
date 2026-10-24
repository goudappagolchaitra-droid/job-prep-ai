
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type MockInterview = {
  id: string;
  topic: string;
  difficulty: string;
  total_score: number;
  average_score: number;
  questions_completed: number;
  created_at: string;
};

type CodeReview = {
  id: string;
  problem_title: string;
  language: string;
  created_at: string;
};

export default function PlacementReadinessPage() {
  const router = useRouter();

  const [interviews, setInterviews] = useState<MockInterview[]>([]);
  const [reviews, setReviews] = useState<CodeReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProgress() {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/login");
        return;
      }

      const [interviewResult, reviewResult] = await Promise.all([
        supabase
          .from("mock_interviews")
          .select(
            "id, topic, difficulty, total_score, average_score, questions_completed, created_at"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("code_reviews")
          .select("id, problem_title, language, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (interviewResult.error || reviewResult.error) {
        setError(
          "Unable to load all your progress. Check that both database tables and their access policies are configured."
        );
        setLoading(false);
        return;
      }

      setInterviews((interviewResult.data ?? []) as MockInterview[]);
      setReviews((reviewResult.data ?? []) as CodeReview[]);
      setLoading(false);
    }

    loadProgress();
  }, [router]);

  const interviewCount = interviews.length;
  const reviewCount = reviews.length;

  const averageScore =
    interviewCount > 0
      ? interviews.reduce(
          (sum, interview) => sum + Number(interview.average_score || 0),
          0
        ) / interviewCount
      : 0;

  const bestScore =
    interviewCount > 0
      ? Math.max(...interviews.map((interview) => interview.total_score))
      : 0;

  const topicStats = Object.values(
    interviews.reduce<
      Record<string, { topic: string; total: number; count: number }>
    >((result, interview) => {
      const topic = interview.topic || "Other";

      if (!result[topic]) {
        result[topic] = { topic, total: 0, count: 0 };
      }

      result[topic].total += Number(interview.average_score || 0);
      result[topic].count += 1;

      return result;
    }, {})
  ).map((item) => ({
    ...item,
    average: item.total / item.count,
  }));

  const weakestTopic =
    topicStats.length > 0
      ? [...topicStats].sort((a, b) => a.average - b.average)[0]
      : null;

  const readinessLabel =
    interviewCount === 0 && reviewCount === 0
      ? "Not enough data yet"
      : interviewCount < 3 || reviewCount < 3
        ? "Building your foundation"
        : averageScore >= 8
          ? "Strong practice performance"
          : averageScore >= 6
            ? "Making progress"
            : "Keep practising";

  const recommendations: string[] = [];

  if (interviewCount < 3) {
    recommendations.push(
      "Complete at least three mock interviews to build a more useful performance baseline."
    );
  }

  if (reviewCount < 3) {
    recommendations.push(
      "Practise more coding problems and review the AI feedback on your solutions."
    );
  }

  if (weakestTopic && weakestTopic.average < 7) {
    recommendations.push(
      `Focus on ${weakestTopic.topic}: your average mock interview score for this topic is ${weakestTopic.average.toFixed(1)}/10.`
    );
  }

  if (interviewCount >= 3 && averageScore >= 8) {
    recommendations.push(
      "Challenge yourself with harder questions and practise explaining your solutions under time pressure."
    );
  }

  if (
    interviewCount >= 3 &&
    averageScore >= 7 &&
    (!weakestTopic || weakestTopic.average >= 7)
  ) {
    recommendations.push(
      "Keep practising consistently and revisit older questions to check that you can solve them independently."
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "Start with a mock interview and a coding problem to get your first progress measurements."
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm text-pink-400">JOBPREP AI</p>
            <h1 className="text-3xl font-bold sm:text-4xl">
              Placement Readiness
            </h1>
            <p className="mt-2 text-slate-400">
              Track your mock interviews, coding reviews, and areas to improve.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800"
          >
            Dashboard
          </Link>
        </header>

        {loading && (
          <p className="py-12 text-center text-slate-400">
            Loading your placement progress...
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

        {!loading && !error && (
          <>
            <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <p className="text-sm text-slate-400">
                Your current practice status
              </p>
              <h2 className="mt-2 text-2xl font-bold">{readinessLabel}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                This status reflects your activity and mock interview scores.
                It is a practice indicator, not a guarantee of placement
                readiness or a prediction of hiring outcomes.
              </p>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Mock Interviews"
                value={String(interviewCount)}
                description="Completed practice sessions"
              />
              <StatCard
                title="Average Score"
                value={
                  interviewCount > 0
                    ? `${averageScore.toFixed(1)}/10`
                    : "—"
                }
                description="Across saved interviews"
              />
              <StatCard
                title="Best Interview"
                value={interviewCount > 0 ? `${bestScore}/50` : "—"}
                description="Highest total score"
              />
              <StatCard
                title="Code Reviews"
                value={String(reviewCount)}
                description="Saved AI code reviews"
              />
            </section>

            <section className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
                <h2 className="text-xl font-semibold">
                  Topic-wise Performance
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Based on your saved mock interviews.
                </p>

                {topicStats.length === 0 ? (
                  <p className="mt-6 text-slate-400">
                    Complete a mock interview to see your topic performance.
                  </p>
                ) : (
                  <div className="mt-6 space-y-5">
                    {topicStats.map((item) => (
                      <div key={item.topic}>
                        <div className="mb-2 flex justify-between gap-3 text-sm">
                          <span>{item.topic}</span>
                          <span className="text-slate-400">
                            {item.average.toFixed(1)}/10
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-pink-500"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(0, (item.average / 10) * 100)
                              )}%`,
                            }}
                          />
                        </div>

                        <p className="mt-1 text-xs text-slate-500">
                          {item.count} interview
                          {item.count === 1 ? "" : "s"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
                <h2 className="text-xl font-semibold">
                  Your Next Steps
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Suggestions based on your recorded activity.
                </p>

                <ul className="mt-5 space-y-4">
                  {recommendations.map((recommendation, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pink-500/10 text-sm text-pink-300">
                        {index + 1}
                      </span>
                      <p className="text-sm leading-6 text-slate-300">
                        {recommendation}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
              <h2 className="text-xl font-semibold">Recent Activity</h2>

              {interviews.length === 0 && reviews.length === 0 ? (
                <p className="mt-4 text-slate-400">
                  Your activity will appear here after you complete a mock
                  interview or save an AI code review.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {[
                    ...interviews.map((item) => ({
                      id: `interview-${item.id}`,
                      title: `${item.topic} mock interview`,
                      detail: `${item.total_score}/50 · ${item.difficulty}`,
                      date: item.created_at,
                      kind: "Interview",
                    })),
                    ...reviews.map((item) => ({
                      id: `review-${item.id}`,
                      title: item.problem_title,
                      detail: `${item.language} · AI code review`,
                      date: item.created_at,
                      kind: "Code review",
                    })),
                  ]
                    .sort(
                      (a, b) =>
                        new Date(b.date).getTime() -
                        new Date(a.date).getTime()
                    )
                    .slice(0, 8)
                    .map((activity) => (
                      <div
                        key={activity.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-950 p-4"
                      >
                        <div>
                          <p className="font-medium">{activity.title}</p>
                          <p className="mt-1 text-sm text-slate-400">
                            {activity.detail}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-pink-300">
                            {activity.kind}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {new Date(activity.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </section>

            <section className="mt-8 grid gap-4 sm:grid-cols-3">
              <ActionLink
                href="/mock-interview"
                title="Start Mock Interview"
                description="Practise interview questions."
              />
              <ActionLink
                href="/coding-practice"
                title="Coding Practice"
                description="Solve programming problems."
              />
              <ActionLink
                href="/interview-history"
                title="Interview History"
                description="Review previous scores."
              />
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-3 text-3xl font-bold">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function ActionLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-pink-500"
    >
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
      <span className="mt-4 inline-block text-sm text-pink-400">
        Open →
      </span>
    </Link>
  );
}

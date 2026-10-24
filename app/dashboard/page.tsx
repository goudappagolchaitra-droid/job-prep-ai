
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

type ChallengeProgress = {
  challenge_date: string;
  is_completed: boolean;
};

type RoadmapProgress = {
  task_key: string;
  is_completed: boolean;
};

type NavigationItem = {
  label: string;
  href: string;
  icon: string;
  section: string;
};

const navigation: NavigationItem[] = [
  { label: "Overview", href: "/dashboard", icon: "◫", section: "WORKSPACE" },
  { label: "My Profile", href: "/profile", icon: "◎", section: "WORKSPACE" },
  { label: "Mock Interview", href: "/mock-interview", icon: "◉", section: "PREPARATION" },
  { label: "Interview History", href: "/interview-history", icon: "◷", section: "PREPARATION" },
  { label: "Coding Practice", href: "/coding-practice", icon: "</>", section: "PREPARATION" },
  { label: "Code Reviews", href: "/code-review-history", icon: "⌘", section: "PREPARATION" },
  { label: "Daily Challenge", href: "/daily-challenge", icon: "✳", section: "PREPARATION" },
  { label: "Study Planner", href: "/study-planner", icon: "▦", section: "LEARNING" },
  { label: "AI Study Plan", href: "/ai-study-plan", icon: "✧", section: "LEARNING" },
  { label: "Saved Plans", href: "/saved-study-plans", icon: "▤", section: "LEARNING" },
  { label: "Study Analytics", href: "/study-analytics", icon: "⌁", section: "LEARNING" },
  { label: "Placement Roadmap", href: "/placement-roadmap", icon: "↗", section: "LEARNING" },
  { label: "Performance", href: "/analytics", icon: "▥", section: "INSIGHTS" },
  { label: "Readiness", href: "/placement-readiness", icon: "◈", section: "INSIGHTS" },
];

function localDateString(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function utcDateString(date: Date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function calculateStreak(rows: ChallengeProgress[], today: string) {
  const completedDates = new Set(
    rows.filter((row) => row.is_completed).map((row) => row.challenge_date)
  );

  const date = new Date(`${today}T00:00:00.000Z`);

  if (!completedDates.has(today)) {
    date.setUTCDate(date.getUTCDate() - 1);

    if (!completedDates.has(utcDateString(date))) {
      return 0;
    }
  }

  let streak = 0;

  while (completedDates.has(utcDateString(date))) {
    streak++;
    date.setUTCDate(date.getUTCDate() - 1);
  }

  return streak;
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="mb-2 mt-6 px-3 text-[10px] font-bold tracking-[0.2em] text-slate-500">
      {children}
    </p>
  );
}

function Sidebar({
  email,
  onLogout,
  mobileOpen,
  onClose,
}: {
  email: string;
  onLogout: () => void;
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const sections = ["WORKSPACE", "PREPARATION", "LEARNING", "INSIGHTS"];

  return (
    <>
      {mobileOpen && (
        <button
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-white/[0.07] bg-[#0b1020] transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[76px] items-center gap-3 border-b border-white/[0.07] px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-lg font-black shadow-lg shadow-violet-900/30">
            J
          </div>

          <div>
            <p className="text-[15px] font-bold tracking-tight text-white">
              JobPrep<span className="text-violet-400"> AI</span>
            </p>
            <p className="mt-0.5 text-[10px] tracking-[0.16em] text-slate-500">
              CAREER WORKSPACE
            </p>
          </div>

          <button
            onClick={onClose}
            className="ml-auto rounded-lg px-2 py-1 text-slate-400 hover:bg-white/5 lg:hidden"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <div className="mx-4 mt-5 rounded-xl border border-violet-400/10 bg-gradient-to-br from-violet-500/10 to-indigo-500/5 p-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <span className="text-xs font-medium text-slate-300">
              Your preparation hub
            </span>
          </div>
          <p className="mt-2 text-[11px] leading-5 text-slate-500">
            Small daily steps. Strong career outcomes.
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4 pt-2">
          {sections.map((section) => (
            <div key={section}>
              <SectionLabel>{section}</SectionLabel>

              <div className="space-y-1">
                {navigation
                  .filter((item) => item.section === section)
                  .map((item) => {
                    const active = pathname === item.href;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-medium transition ${
                          active
                            ? "border border-violet-400/20 bg-violet-500/15 text-violet-200 shadow-sm"
                            : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
                        }`}
                      >
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm ${
                            active
                              ? "bg-violet-500/20 text-violet-300"
                              : "text-slate-500 group-hover:text-violet-300"
                          }`}
                        >
                          {item.icon}
                        </span>

                        {item.label}

                        {active && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-400" />
                        )}
                      </Link>
                    );
                  })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/[0.07] p-4">
          <div className="flex items-center gap-3 rounded-xl p-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-violet-400/20 bg-gradient-to-br from-violet-500/30 to-indigo-500/20 text-sm font-bold text-violet-200">
              {email ? email.charAt(0).toUpperCase() : "U"}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white">Your account</p>
              <p className="truncate text-[10px] text-slate-500">{email}</p>
            </div>

            <button
              onClick={onLogout}
              title="Log out"
              aria-label="Log out"
              className="rounded-lg p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-300"
            >
              ⇥
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function MetricCard({
  label,
  value,
  description,
  icon,
  accent,
  loading,
}: {
  label: string;
  value: string;
  description: string;
  icon: string;
  accent: string;
  loading?: boolean;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#11182a] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-white/[0.13]">
      <div
        className={`pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full opacity-[0.09] blur-2xl ${accent}`}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-400">{label}</p>

          <p className="mt-4 text-3xl font-semibold tracking-tight text-white">
            {loading ? (
              <span className="inline-block h-8 w-12 animate-pulse rounded-md bg-white/10" />
            ) : (
              value
            )}
          </p>

          <p className="mt-2 text-[11px] leading-5 text-slate-500">
            {description}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] text-lg ${accent}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function ActionCard({
  href,
  icon,
  title,
  description,
  color,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-[135px] flex-col rounded-2xl border border-white/[0.07] bg-[#11182a] p-5 transition duration-300 hover:-translate-y-1 hover:border-violet-400/25 hover:bg-[#151d32]"
    >
      <div className="flex items-center justify-between">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] text-lg ${color}`}
        >
          {icon}
        </span>
        <span className="text-slate-600 transition group-hover:translate-x-1 group-hover:text-violet-300">
          ↗
        </span>
      </div>

      <h3 className="mt-4 text-sm font-semibold text-slate-100">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
    </Link>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [todayLabel, setTodayLabel] = useState("");
  const [challengeLoading, setChallengeLoading] = useState(true);
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [challengeStreak, setChallengeStreak] = useState(0);
  const [challengeError, setChallengeError] = useState("");
  const [roadmapCompleted, setRoadmapCompleted] = useState<number | null>(null);
  const [roadmapTotal, setRoadmapTotal] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState<number | null>(null);

  // Calculate the displayed date in the browser after mounting.
  useEffect(() => {
    const formatter = new Intl.DateTimeFormat("en", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    setTodayLabel(formatter.format(new Date()));
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setChallengeLoading(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/login");
        return;
      }

      setEmail(user.email ?? "");

      const today = localDateString(new Date());

      const [
        { data: challengeRows, error: challengeQueryError },
        { data: roadmapRows, error: roadmapQueryError },
        { count: reviews, error: reviewQueryError },
      ] = await Promise.all([
        supabase
          .from("daily_challenge_progress")
          .select("challenge_date, is_completed")
          .eq("user_id", user.id)
          .order("challenge_date", { ascending: false }),

        supabase
          .from("roadmap_progress")
          .select("task_key, is_completed")
          .eq("user_id", user.id),

        supabase
          .from("code_reviews")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);

      if (challengeQueryError) {
        setChallengeError(
          "Your daily challenge progress could not be loaded."
        );
        setChallengeCompleted(false);
        setChallengeStreak(0);
      } else {
        const rows = (challengeRows ?? []) as ChallengeProgress[];
        const todayRow = rows.find((row) => row.challenge_date === today);

        setChallengeCompleted(Boolean(todayRow?.is_completed));
        setChallengeStreak(calculateStreak(rows, today));
        setChallengeError("");
      }

      if (!roadmapQueryError) {
        const tasks = (roadmapRows ?? []) as RoadmapProgress[];

        setRoadmapTotal(tasks.length);
        setRoadmapCompleted(
          tasks.filter((task) => task.is_completed).length
        );
      } else {
        setRoadmapTotal(null);
        setRoadmapCompleted(null);
      }

      if (!reviewQueryError) {
        setReviewCount(reviews ?? 0);
      } else {
        setReviewCount(null);
      }
    } catch {
      setChallengeError(
        "Something went wrong while loading your progress."
      );
    } finally {
      setLoading(false);
      setChallengeLoading(false);
    }
  }, [router, supabase]);

  // Load the signed-in user's dashboard data.
  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      window.alert(error.message);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  const roadmapPercent =
    roadmapTotal !== null &&
    roadmapTotal > 0 &&
    roadmapCompleted !== null
      ? Math.round((roadmapCompleted / roadmapTotal) * 100)
      : null;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080c18] text-sm text-slate-300">
        <div className="flex items-center gap-3">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-violet-400/30 border-t-violet-400" />
          Preparing your workspace...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080c18] text-white">
      <Sidebar
        email={email}
        onLogout={handleLogout}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="min-h-screen lg:pl-[260px]">
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-white/[0.06] bg-[#080c18]/90 px-4 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              className="rounded-xl border border-white/10 px-3 py-2 text-slate-300 hover:bg-white/5 lg:hidden"
            >
              ☰
            </button>

            <div>
              <p className="text-xs text-slate-500">
                Workspace / Overview
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden text-xs text-slate-500 sm:block">
              {todayLabel}
            </span>

            <Link
              href="/profile"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-sm font-bold text-violet-200 transition hover:border-violet-400/30"
              title="My profile"
            >
              {email ? email.charAt(0).toUpperCase() : "U"}
            </Link>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">
          <section className="relative overflow-hidden rounded-3xl border border-violet-400/15 bg-gradient-to-br from-[#171633] via-[#12162b] to-[#101a2c] p-6 sm:p-9">
            <div className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full bg-violet-500/15 blur-[90px]" />
            <div className="pointer-events-none absolute bottom-[-100px] right-[25%] h-48 w-48 rounded-full bg-blue-500/10 blur-[70px]" />

            <div className="relative z-10 flex flex-col justify-between gap-7 xl:flex-row xl:items-center">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/15 bg-violet-300/[0.07] px-3 py-1.5 text-[10px] font-semibold tracking-[0.13em] text-violet-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  YOUR CAREER WORKSPACE
                </div>

                <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-[42px]">
                  Turn your preparation
                  <br className="hidden sm:block" /> into{" "}
                  <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-blue-300 bg-clip-text text-transparent">
                    career progress.
                  </span>
                </h1>

                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">
                  Welcome back. Your interview practice, coding journey, and
                  placement roadmap are all in one place. Pick a goal and keep
                  moving forward.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    href="/mock-interview"
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-3 text-xs font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:bg-violet-400"
                  >
                    Start mock interview <span>↗</span>
                  </Link>

                  <Link
                    href="/placement-roadmap"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.08]"
                  >
                    View my roadmap <span>→</span>
                  </Link>
                </div>
              </div>

              <div className="relative w-full max-w-[270px] rounded-2xl border border-white/10 bg-black/15 p-5 backdrop-blur-sm xl:min-w-[250px]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">
                    Daily consistency
                  </span>
                  <span className="text-lg">✳</span>
                </div>

                <p className="mt-5 text-4xl font-semibold tracking-tight text-white">
                  {challengeLoading ? "—" : challengeStreak}
                  <span className="ml-2 text-sm font-medium text-slate-400">
                    day{challengeStreak === 1 ? "" : "s"}
                  </span>
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Current challenge streak
                </p>

                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-400 to-blue-400 transition-all"
                    style={{
                      width: challengeStreak
                        ? `${Math.min(challengeStreak * 10, 100)}%`
                        : "0%",
                    }}
                  />
                </div>

                <Link
                  href="/daily-challenge"
                  className="mt-4 flex items-center justify-between text-xs font-medium text-violet-200 hover:text-white"
                >
                  Continue daily challenge <span>→</span>
                </Link>
              </div>
            </div>
          </section>

          <section className="mt-8">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] text-violet-300">
                  YOUR OVERVIEW
                </p>
                <h2 className="mt-2 text-lg font-semibold tracking-tight">
                  Progress at a glance
                </h2>
              </div>

              <button
                onClick={() => void loadDashboard()}
                className="rounded-lg border border-white/[0.08] px-3 py-2 text-xs text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
              >
                ↻ Refresh
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Daily challenge"
                value={
                  challengeLoading
                    ? "—"
                    : challengeCompleted
                      ? "Done"
                      : "Open"
                }
                description={
                  challengeCompleted
                    ? "Today's challenge is complete"
                    : "Your next coding goal awaits"
                }
                icon="✳"
                accent="text-cyan-300 bg-cyan-400/10"
                loading={challengeLoading}
              />

              <MetricCard
                label="Current streak"
                value={challengeLoading ? "—" : `${challengeStreak} days`}
                description="Consecutive completed challenge days"
                icon="♨"
                accent="text-amber-300 bg-amber-400/10"
                loading={challengeLoading}
              />

              <MetricCard
                label="Roadmap tasks"
                value={
                  roadmapCompleted === null || roadmapTotal === null
                    ? "—"
                    : `${roadmapCompleted}/${roadmapTotal}`
                }
                description={
                  roadmapPercent === null
                    ? "Roadmap data unavailable or no tasks recorded"
                    : `${roadmapPercent}% of recorded tasks completed`
                }
                icon="↗"
                accent="text-violet-300 bg-violet-400/10"
              />

              <MetricCard
                label="Code reviews"
                value={reviewCount === null ? "—" : String(reviewCount)}
                description={
                  reviewCount === null
                    ? "Review history unavailable"
                    : "Saved AI code reviews"
                }
                icon="⌘"
                accent="text-emerald-300 bg-emerald-400/10"
              />
            </div>

            {challengeError && (
              <p
                role="status"
                className="mt-4 rounded-xl border border-amber-400/15 bg-amber-400/[0.05] p-3 text-xs text-amber-200"
              >
                {challengeError}
              </p>
            )}
          </section>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
            <section className="rounded-2xl border border-white/[0.07] bg-[#0e1525] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold tracking-[0.18em] text-violet-300">
                    YOUR TOOLKIT
                  </p>
                  <h2 className="mt-2 text-lg font-semibold">
                    Continue your preparation
                  </h2>
                </div>

                <span className="hidden rounded-lg border border-white/[0.08] px-3 py-2 text-[10px] text-slate-500 sm:inline-block">
                  QUICK ACCESS
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <ActionCard
                  href="/mock-interview"
                  icon="◉"
                  title="AI Mock Interview"
                  description="Practice interview questions in a focused session."
                  color="bg-violet-400/10 text-violet-300"
                />

                <ActionCard
                  href="/coding-practice"
                  icon="</>"
                  title="Coding Practice"
                  description="Sharpen problem-solving and DSA skills."
                  color="bg-cyan-400/10 text-cyan-300"
                />

                <ActionCard
                  href="/code-review-history"
                  icon="⌘"
                  title="AI Code Review"
                  description="Revisit your saved code feedback."
                  color="bg-emerald-400/10 text-emerald-300"
                />

                <ActionCard
                  href="/ai-study-plan"
                  icon="✧"
                  title="AI Study Plan"
                  description="Build a structured learning plan."
                  color="bg-fuchsia-400/10 text-fuchsia-300"
                />
              </div>
            </section>

            <section className="rounded-2xl border border-white/[0.07] bg-[#0e1525] p-5 sm:p-6">
              <p className="text-[10px] font-bold tracking-[0.18em] text-cyan-300">
                KEEP THE MOMENTUM
              </p>

              <h2 className="mt-2 text-lg font-semibold">Your next steps</h2>

              <p className="mt-2 text-xs leading-6 text-slate-500">
                Choose one action to move your preparation forward today.
              </p>

              <div className="mt-5 space-y-3">
                <Link
                  href="/daily-challenge"
                  className="flex items-center gap-3 rounded-xl border border-white/[0.07] p-3 transition hover:border-cyan-400/20 hover:bg-white/[0.03]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
                    {challengeCompleted ? "✓" : "✳"}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-medium text-slate-200">
                      {challengeCompleted
                        ? "Review today's challenge"
                        : "Complete today's challenge"}
                    </span>
                    <span className="mt-1 block text-[10px] text-slate-500">
                      {challengeCompleted
                        ? "Keep learning"
                        : "Build consistency"}
                    </span>
                  </span>

                  <span className="text-slate-600">→</span>
                </Link>

                <Link
                  href="/placement-roadmap"
                  className="flex items-center gap-3 rounded-xl border border-white/[0.07] p-3 transition hover:border-violet-400/20 hover:bg-white/[0.03]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-400/10 text-violet-300">
                    ↗
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-medium text-slate-200">
                      Update your roadmap
                    </span>
                    <span className="mt-1 block text-[10px] text-slate-500">
                      Track completed learning tasks
                    </span>
                  </span>

                  <span className="text-slate-600">→</span>
                </Link>

                <Link
                  href="/interview-history"
                  className="flex items-center gap-3 rounded-xl border border-white/[0.07] p-3 transition hover:border-emerald-400/20 hover:bg-white/[0.03]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300">
                    ◷
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-medium text-slate-200">
                      Review past interviews
                    </span>
                    <span className="mt-1 block text-[10px] text-slate-500">
                      Reflect on previous practice
                    </span>
                  </span>

                  <span className="text-slate-600">→</span>
                </Link>
              </div>

              <div className="mt-5 rounded-xl border border-violet-400/10 bg-gradient-to-br from-violet-500/[0.08] to-transparent p-4">
                <div className="flex items-center gap-2">
                  <span className="text-violet-300">✧</span>
                  <span className="text-xs font-semibold text-violet-200">
                    A little progress adds up
                  </span>
                </div>

                <p className="mt-2 text-[11px] leading-5 text-slate-400">
                  Focus on consistency. Finish one useful task before moving to
                  the next.
                </p>
              </div>
            </section>
          </div>

          <footer className="mt-8 flex flex-col gap-3 border-t border-white/[0.06] py-6 text-[10px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <p>JobPrep AI · Your personal placement workspace</p>

            <div className="flex flex-wrap gap-4">
              <Link href="/" className="transition hover:text-slate-300">
                Home
              </Link>

              <Link href="/profile" className="transition hover:text-slate-300">
                Profile
              </Link>

              <button
                onClick={handleLogout}
                className="transition hover:text-red-300"
              >
                Log out
              </button>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}

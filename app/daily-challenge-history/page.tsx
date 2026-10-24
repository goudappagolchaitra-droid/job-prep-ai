
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ChallengeRecord = {
  challenge_date: string;
  challenge_title: string;
  is_completed: boolean;
  completed_at: string | null;
};

type StatusFilter = "All" | "Completed" | "Pending";

function formatDate(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DailyChallengeHistoryPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [records, setRecords] = useState<ChallengeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("All");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">(
    "newest"
  );

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError("");

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

      const { data, error: queryError } = await supabase
        .from("daily_challenge_progress")
        .select(
          "challenge_date, challenge_title, is_completed, completed_at"
        )
        .eq("user_id", user.id)
        .order("challenge_date", { ascending: false });

      if (queryError) throw queryError;

      setRecords((data ?? []) as ChallengeRecord[]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load your challenge history."
      );
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const completedRecords = useMemo(
    () => records.filter((record) => record.is_completed),
    [records]
  );

  const pendingRecords = useMemo(
    () => records.filter((record) => !record.is_completed),
    [records]
  );

  const completionRate =
    records.length === 0
      ? 0
      : Math.round((completedRecords.length / records.length) * 100);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records
      .filter((record) => {
        const matchesSearch =
          !query || record.challenge_title.toLowerCase().includes(query);

        const matchesStatus =
          statusFilter === "All" ||
          (statusFilter === "Completed" && record.is_completed) ||
          (statusFilter === "Pending" && !record.is_completed);

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const comparison = a.challenge_date.localeCompare(b.challenge_date);
        return sortOrder === "newest" ? -comparison : comparison;
      });
  }, [records, search, statusFilter, sortOrder]);

  const recentRecords = useMemo(
    () => records.slice(0, 5),
    [records]
  );

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-cyan-400 hover:underline"
        >
          ← Back to Dashboard
        </Link>

        <header className="mb-8 mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
              Your coding journey
            </p>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
              Daily Challenge History
            </h1>
            <p className="mt-3 max-w-2xl text-slate-400">
              Track your coding consistency, review completed challenges,
              and keep building your problem-solving skills.
            </p>
          </div>

          <Link
            href="/daily-challenge"
            className="w-fit rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Today's Challenge →
          </Link>
        </header>

        {error && (
          <section
            role="alert"
            className="mb-6 rounded-xl border border-red-900 bg-red-950/40 p-5"
          >
            <h2 className="font-semibold text-red-300">
              Could not load challenge history
            </h2>
            <p className="mt-2 break-words text-sm text-red-200/80">
              {error}
            </p>
            <button
              type="button"
              onClick={() => void loadHistory()}
              className="mt-4 rounded-lg border border-red-800 px-4 py-2 text-sm hover:bg-red-900/40"
            >
              Try Again
            </button>
          </section>
        )}

        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Recorded Days"
            value={loading ? "..." : String(records.length)}
            subtitle="Saved challenge records"
            icon="📅"
          />
          <StatCard
            title="Completed"
            value={loading ? "..." : String(completedRecords.length)}
            subtitle="Challenges finished"
            icon="✓"
            valueClass="text-emerald-400"
          />
          <StatCard
            title="Pending"
            value={loading ? "..." : String(pendingRecords.length)}
            subtitle="Challenges not finished"
            icon="◷"
            valueClass="text-amber-400"
          />
          <StatCard
            title="Completion Rate"
            value={loading ? "..." : `${completionRate}%`}
            subtitle="Completed / recorded days"
            icon="↗"
            valueClass="text-cyan-400"
          />
        </section>

        {!loading && !error && records.length > 0 && (
          <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">
                  Overall consistency
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Your completed challenges compared with all recorded days.
                </p>
              </div>
              <span className="text-2xl font-bold text-cyan-300">
                {completionRate}%
              </span>
            </div>

            <div
              className="mt-5 h-3 overflow-hidden rounded-full bg-slate-800"
              role="progressbar"
              aria-label="Challenge completion rate"
              aria-valuenow={completionRate}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>

            <p className="mt-3 text-sm text-slate-400">
              You've completed {completedRecords.length} out of{" "}
              {records.length} recorded challenges.
            </p>
          </section>
        )}

        {!loading && !error && records.length > 0 && (
          <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Recent activity</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Your five most recent recorded challenge dates.
                </p>
              </div>
              <span className="rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-300">
                {recentRecords.filter((r) => r.is_completed).length} of{" "}
                {recentRecords.length} completed
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {recentRecords.map((record) => (
                <div
                  key={record.challenge_date}
                  className="flex items-center gap-3"
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm ${
                      record.is_completed
                        ? "bg-emerald-950 text-emerald-300"
                        : "bg-amber-950 text-amber-300"
                    }`}
                  >
                    {record.is_completed ? "✓" : "•"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {record.challenge_title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(record.challenge_date)}
                    </p>
                  </div>
                  <span
                    className={`text-xs ${
                      record.is_completed
                        ? "text-emerald-400"
                        : "text-amber-400"
                    }`}
                  >
                    {record.is_completed ? "Completed" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">All challenges</h2>
              <p className="mt-1 text-sm text-slate-400">
                {loading
                  ? "Loading records..."
                  : `Showing ${filteredRecords.length} of ${records.length} records`}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadHistory()}
              disabled={loading}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm transition hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Loading..." : "↻ Refresh"}
            </button>
          </div>

          {!loading && !error && records.length > 0 && (
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <label className="block">
                <span className="mb-2 block text-xs font-medium text-slate-400">
                  Search by challenge title
                </span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search challenges..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-500"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-medium text-slate-400">
                  Completion status
                </span>
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as StatusFilter)
                  }
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-cyan-500"
                >
                  <option value="All">All statuses</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-medium text-slate-400">
                  Sort by date
                </span>
                <select
                  value={sortOrder}
                  onChange={(event) =>
                    setSortOrder(event.target.value as "newest" | "oldest")
                  }
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-cyan-500"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </label>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <p className="animate-pulse">
                Loading your saved challenge history...
              </p>
            </div>
          ) : !error && records.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-700 p-8 text-center sm:p-12">
              <div className="text-4xl">🎯</div>
              <h3 className="mt-4 text-lg font-semibold">
                No challenge history yet
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
                Complete your first daily challenge to start tracking your
                coding progress here.
              </p>
              <Link
                href="/daily-challenge"
                className="mt-5 inline-block rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
              >
                Start Today's Challenge
              </Link>
            </div>
          ) : !error && filteredRecords.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-700 p-8 text-center">
              <h3 className="font-semibold">No matching challenges</h3>
              <p className="mt-2 text-sm text-slate-400">
                Try a different search or status filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("All");
                }}
                className="mt-4 text-sm font-semibold text-cyan-300 hover:text-cyan-200"
              >
                Clear filters
              </button>
            </div>
          ) : !error ? (
            <div className="mt-5 space-y-3">
              {filteredRecords.map((record) => (
                <article
                  key={record.challenge_date}
                  className="flex flex-col justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950 p-4 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        record.is_completed
                          ? "bg-emerald-950 text-emerald-300"
                          : "bg-amber-950 text-amber-300"
                      }`}
                    >
                      {record.is_completed ? "✓" : "◷"}
                    </div>
                    <div className="min-w-0">
                      <p className="break-words font-semibold">
                        {record.challenge_title}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        {formatDate(record.challenge_date)}
                      </p>
                      {record.is_completed && record.completed_at && (
                        <p className="mt-1 text-xs text-slate-500">
                          Completed on {formatDateTime(record.completed_at)}
                        </p>
                      )}
                    </div>
                  </div>

                  <span
                    className={`w-fit shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${
                      record.is_completed
                        ? "bg-emerald-950 text-emerald-300"
                        : "bg-amber-950 text-amber-300"
                    }`}
                  >
                    {record.is_completed ? "Completed ✓" : "Pending"}
                  </span>
                </article>
              ))}
            </div>
          ) : null}
        </section>

        <footer className="mt-8 flex flex-wrap gap-3 border-t border-slate-800 pt-6">
          <Link
            href="/daily-challenge"
            className="rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
          >
            Today's Challenge
          </Link>
          <Link
            href="/coding-practice"
            className="rounded-lg border border-slate-700 px-5 py-3 hover:bg-slate-900"
          >
            Coding Practice
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-700 px-5 py-3 hover:bg-slate-900"
          >
            Dashboard
          </Link>
        </footer>
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  valueClass = "text-white",
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-400">{title}</p>
        <span
          aria-hidden="true"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800"
        >
          {icon}
        </span>
      </div>
      <p className={`mt-4 text-3xl font-bold ${valueClass}`}>{value}</p>
      <p className="mt-2 text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}

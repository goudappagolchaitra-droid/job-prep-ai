
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type StudyTask = {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  task_date: string;
  completed: boolean;
  created_at: string;
};

const subjects = [
  "Java",
  "DSA",
  "DBMS",
  "Operating Systems",
  "Computer Networks",
  "Mock Interview",
  "Projects",
  "Other",
];

function getLocalDate() {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 10);
}

export default function StudyPlannerPage() {
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Java");
  const [taskDate, setTaskDate] = useState(getLocalDate);
  const [selectedDate, setSelectedDate] = useState(getLocalDate);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const supabase = createClient();

  async function loadTasks() {
    setLoading(true);
    setError("");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setError("Please sign in to use your study planner.");
      setTasks([]);
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("study_tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("task_date", selectedDate)
      .order("created_at", { ascending: true });

    if (fetchError) {
      setError(
        "Could not load tasks. Check that the study_tasks table and its policies exist."
      );
      setTasks([]);
    } else {
      setTasks((data ?? []) as StudyTask[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    async function fetchTasks() {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!active) return;

      if (authError || !user) {
        setError("Please sign in to use your study planner.");
        setTasks([]);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("study_tasks")
        .select("*")
        .eq("user_id", user.id)
        .eq("task_date", selectedDate)
        .order("created_at", { ascending: true });

      if (!active) return;

      if (fetchError) {
        setError(
          "Could not load tasks. Check the study_tasks table in Supabase."
        );
        setTasks([]);
      } else {
        setTasks((data ?? []) as StudyTask[]);
      }

      setLoading(false);
    }

    void fetchTasks();

    return () => {
      active = false;
    };
  }, [selectedDate, supabase]);

  async function addTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      setError("Please enter a task title.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setError("Please sign in before adding tasks.");
      setSaving(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("study_tasks")
      .insert({
        user_id: user.id,
        title: title.trim(),
        subject,
        task_date: taskDate,
      })
      .select("*")
      .single();

    if (insertError) {
      setError(insertError.message);
    } else {
      setTitle("");
      setMessage("Study task added successfully.");

      if (taskDate === selectedDate) {
        setTasks((previous) => [...previous, data as StudyTask]);
      }
    }

    setSaving(false);
  }

  async function toggleTask(task: StudyTask) {
    setError("");
    setMessage("");

    const newCompleted = !task.completed;

    const { error: updateError } = await supabase
      .from("study_tasks")
      .update({ completed: newCompleted })
      .eq("id", task.id);

    if (updateError) {
      setError("Could not update the task. Please try again.");
      return;
    }

    setTasks((previous) =>
      previous.map((item) =>
        item.id === task.id
          ? { ...item, completed: newCompleted }
          : item
      )
    );
  }

  async function deleteTask(taskId: string) {
    setError("");
    setMessage("");

    const { error: deleteError } = await supabase
      .from("study_tasks")
      .delete()
      .eq("id", taskId);

    if (deleteError) {
      setError("Could not delete the task. Please try again.");
      return;
    }

    setTasks((previous) => previous.filter((task) => task.id !== taskId));
    setMessage("Task deleted.");
  }

  const completedCount = tasks.filter((task) => task.completed).length;
  const progress =
    tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/dashboard"
              className="text-sm text-cyan-400 hover:underline"
            >
              ← Back to Dashboard
            </Link>

            <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
              Daily Study Planner
            </h1>

            <p className="mt-2 text-slate-400">
              Plan your preparation, complete tasks, and track your progress.
            </p>
          </div>
        </div>

        <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-4 text-xl font-semibold">Daily Progress</h2>

          <div className="mb-2 flex justify-between text-sm">
            <span className="text-slate-400">
              {completedCount} of {tasks.length} tasks completed
            </span>
            <span className="font-semibold text-cyan-400">{progress}%</span>
          </div>

          <div
            className="h-3 overflow-hidden rounded-full bg-slate-800"
            role="progressbar"
            aria-label="Daily task completion"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div
              className="h-full rounded-full bg-cyan-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-5 text-xl font-semibold">Add a Study Task</h2>

          <form onSubmit={addTask} className="space-y-4">
            <div>
              <label htmlFor="task-title" className="mb-2 block text-sm text-slate-300">
                Task title
              </label>
              <input
                id="task-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Solve 3 Java array problems"
                maxLength={200}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="task-subject" className="mb-2 block text-sm text-slate-300">
                  Subject
                </label>
                <select
                  id="task-subject"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3"
                >
                  {subjects.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="task-date" className="mb-2 block text-sm text-slate-300">
                  Task date
                </label>
                <input
                  id="task-date"
                  type="date"
                  value={taskDate}
                  onChange={(event) => setTaskDate(event.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {saving ? "Adding..." : "+ Add Task"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Your Study Tasks</h2>

            <input
              aria-label="Choose date to view tasks"
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            />
          </div>

          {error && (
            <p role="alert" className="mb-4 rounded-lg bg-red-950 p-3 text-red-300">
              {error}
            </p>
          )}

          {message && (
            <p role="status" className="mb-4 rounded-lg bg-emerald-950 p-3 text-emerald-300">
              {message}
            </p>
          )}

          {loading ? (
            <p className="py-8 text-center text-slate-400">Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-lg text-slate-300">No tasks for this date.</p>
              <p className="mt-2 text-sm text-slate-500">
                Add a task above to start your study plan.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4"
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => void toggleTask(task)}
                    aria-label={`Mark ${task.title} as ${
                      task.completed ? "incomplete" : "complete"
                    }`}
                    className="h-5 w-5 accent-cyan-400"
                  />

                  <div className="min-w-0 flex-1">
                    <p
                      className={`break-words font-medium ${
                        task.completed
                          ? "text-slate-500 line-through"
                          : "text-white"
                      }`}
                    >
                      {task.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {task.subject}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void deleteTask(task.id)}
                    className="rounded-lg border border-red-900 px-3 py-2 text-sm text-red-400 hover:bg-red-950"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

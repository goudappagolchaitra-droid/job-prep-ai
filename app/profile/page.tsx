
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

type ProfileForm = {
  fullName: string;
  college: string;
  degree: string;
  graduationYear: string;
  skills: string;
  careerGoal: string;
  preferredRole: string;
  githubUrl: string;
  linkedinUrl: string;
};

const emptyProfile: ProfileForm = {
  fullName: "",
  college: "",
  degree: "B.Tech Computer Science",
  graduationYear: "2028",
  skills: "",
  careerGoal: "Get a software engineering placement",
  preferredRole: "Software Engineer",
  githubUrl: "",
  linkedinUrl: "",
};

const inputClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/10";

const labelClass = "text-xs font-medium text-slate-300";

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <input
        className={inputClass}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        maxLength={type === "url" ? 500 : 200}
      />
    </label>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [email, setEmail] = useState("");
  const [form, setForm] = useState<ProfileForm>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const updateField = useCallback(
    (key: keyof ProfileForm, value: string) => {
      setForm((previous) => ({ ...previous, [key]: value }));
    },
    []
  );

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setError("");

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (!active) return;

        if (authError || !user) {
          router.replace("/login");
          return;
        }

        const metadata = user.user_metadata ?? {};

        setEmail(user.email ?? "");

        setForm({
          fullName: metadata.full_name ?? "",
          college: metadata.college ?? "",
          degree: metadata.degree ?? emptyProfile.degree,
          graduationYear:
            metadata.graduation_year ?? emptyProfile.graduationYear,
          skills: metadata.skills ?? "",
          careerGoal: metadata.career_goal ?? emptyProfile.careerGoal,
          preferredRole:
            metadata.preferred_role ?? emptyProfile.preferredRole,
          githubUrl: metadata.github_url ?? "",
          linkedinUrl: metadata.linkedin_url ?? "",
        });
      } catch {
        if (active) {
          setError("Unable to load your profile. Please refresh and try again.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, [router, supabase]);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const graduationYear = Number(form.graduationYear);

    if (
      !Number.isInteger(graduationYear) ||
      graduationYear < 2000 ||
      graduationYear > 2100
    ) {
      setError("Enter a valid graduation year.");
      setSaving(false);
      return;
    }

    for (const [label, value] of [
      ["GitHub", form.githubUrl],
      ["LinkedIn", form.linkedinUrl],
    ]) {
      if (value.trim()) {
        try {
          const url = new URL(value.trim());

          if (
            url.protocol !== "https:" &&
            url.protocol !== "http:"
          ) {
            throw new Error("Invalid URL");
          }
        } catch {
          setError(`Enter a valid ${label} profile URL.`);
          setSaving(false);
          return;
        }
      }
    }

    try {
      const { data, error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: form.fullName.trim(),
          college: form.college.trim(),
          degree: form.degree.trim(),
          graduation_year: String(graduationYear),
          skills: form.skills.trim(),
          career_goal: form.careerGoal.trim(),
          preferred_role: form.preferredRole.trim(),
          github_url: form.githubUrl.trim(),
          linkedin_url: form.linkedinUrl.trim(),
        },
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      if (!data.user) {
        setError("Your profile could not be verified. Please sign in again.");
        return;
      }

      setMessage("Your profile has been saved successfully.");
    } catch {
      setError("Something went wrong. Please try saving again.");
    } finally {
      setSaving(false);
    }
  }

  const initials =
    form.fullName.trim().charAt(0).toUpperCase() ||
    email.charAt(0).toUpperCase() ||
    "U";

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080c18] text-sm text-slate-300">
        <span className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-violet-400/30 border-t-violet-400" />
        Loading your profile...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080c18] text-white">
      <header className="sticky top-0 z-20 border-b border-white/[0.07] bg-[#080c18]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-4 sm:px-8">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-lg font-black">
              J
            </span>
            <span className="text-sm font-bold">
              JobPrep <span className="text-violet-400">AI</span>
            </span>
          </Link>

          <Link
            href="/dashboard"
            className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            ← Back to dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
        <section className="relative overflow-hidden rounded-3xl border border-violet-400/15 bg-gradient-to-br from-[#191633] via-[#11182b] to-[#101a2c] p-6 sm:p-9">
          <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full bg-violet-500/15 blur-[80px]" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-violet-300/20 bg-gradient-to-br from-violet-400/25 to-indigo-400/10 text-3xl font-bold text-violet-100">
              {initials}
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-[0.2em] text-violet-300">
                PERSONAL WORKSPACE
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                My Profile
              </h1>
              <p className="mt-2 break-all text-sm text-slate-400">
                {email}
              </p>
              <p className="mt-3 max-w-xl text-xs leading-6 text-slate-500">
                Keep your academic details, skills, and career goals up to date
                to organize your placement preparation.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <section className="rounded-2xl border border-white/[0.07] bg-[#0e1525] p-5 sm:p-8">
            <div className="mb-7">
              <p className="text-[10px] font-bold tracking-[0.18em] text-violet-300">
                PROFILE INFORMATION
              </p>
              <h2 className="mt-2 text-lg font-semibold">
                Personal and academic details
              </h2>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Update your information and save your changes.
              </p>
            </div>

            {message && (
              <div
                role="status"
                className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] p-4 text-sm text-emerald-300"
              >
                ✓ {message}
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-400/20 bg-red-400/[0.07] p-4 text-sm text-red-300"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-8">
              <div>
                <h3 className="mb-4 text-sm font-semibold text-white">
                  Personal information
                </h3>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Full name"
                    value={form.fullName}
                    onChange={(value) => updateField("fullName", value)}
                    placeholder="Enter your full name"
                    required
                  />

                  <label className="block">
                    <span className={labelClass}>Email address</span>
                    <input
                      className={`${inputClass} cursor-not-allowed opacity-70`}
                      type="email"
                      value={email}
                      readOnly
                      disabled
                    />
                    <span className="mt-1 block text-[10px] text-slate-600">
                      Your sign-in email cannot be changed here.
                    </span>
                  </label>
                </div>
              </div>

              <div className="border-t border-white/[0.07] pt-7">
                <h3 className="mb-4 text-sm font-semibold text-white">
                  Academic information
                </h3>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="College / University"
                    value={form.college}
                    onChange={(value) => updateField("college", value)}
                    placeholder="Enter your college"
                  />

                  <Field
                    label="Degree / Branch"
                    value={form.degree}
                    onChange={(value) => updateField("degree", value)}
                    placeholder="e.g. B.Tech Computer Science"
                  />

                  <Field
                    label="Graduation year"
                    value={form.graduationYear}
                    onChange={(value) =>
                      updateField("graduationYear", value)
                    }
                    placeholder="2028"
                    type="number"
                    required
                  />
                </div>
              </div>

              <div className="border-t border-white/[0.07] pt-7">
                <h3 className="mb-4 text-sm font-semibold text-white">
                  Skills and career goals
                </h3>

                <div className="space-y-5">
                  <label className="block">
                    <span className={labelClass}>Technical skills</span>
                    <textarea
                      className={`${inputClass} min-h-[100px] resize-y`}
                      value={form.skills}
                      onChange={(event) =>
                        updateField("skills", event.target.value)
                      }
                      placeholder="e.g. Java, DSA, SQL, React, Next.js"
                      maxLength={2000}
                    />
                    <span className="mt-1 block text-[10px] text-slate-600">
                      Separate skills with commas.
                    </span>
                  </label>

                  <Field
                    label="Career goal"
                    value={form.careerGoal}
                    onChange={(value) => updateField("careerGoal", value)}
                    placeholder="What do you want to achieve?"
                  />

                  <Field
                    label="Preferred job role"
                    value={form.preferredRole}
                    onChange={(value) =>
                      updateField("preferredRole", value)
                    }
                    placeholder="e.g. Software Engineer"
                  />
                </div>
              </div>

              <div className="border-t border-white/[0.07] pt-7">
                <h3 className="mb-4 text-sm font-semibold text-white">
                  Professional links
                </h3>

                <div className="space-y-5">
                  <Field
                    label="GitHub profile URL"
                    value={form.githubUrl}
                    onChange={(value) => updateField("githubUrl", value)}
                    placeholder="https://github.com/your-username"
                    type="url"
                  />

                  <Field
                    label="LinkedIn profile URL"
                    value={form.linkedinUrl}
                    onChange={(value) => updateField("linkedinUrl", value)}
                    placeholder="https://www.linkedin.com/in/your-profile"
                    type="url"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[10px] leading-5 text-slate-500">
                  Your profile is saved to your signed-in account.
                </p>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-6 py-3 text-xs font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Saving...
                    </>
                  ) : (
                    <>Save changes <span>→</span></>
                  )}
                </button>
              </div>
            </form>
          </section>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-white/[0.07] bg-[#0e1525] p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-400/10 text-lg text-violet-300">
                  ✧
                </span>
                <div>
                  <h3 className="text-sm font-semibold">Career focus</h3>
                  <p className="mt-1 text-[10px] text-slate-500">
                    Your current direction
                  </p>
                </div>
              </div>

              <p className="mt-5 text-sm font-medium text-slate-200">
                {form.preferredRole || "Add a preferred role"}
              </p>

              <p className="mt-2 text-xs leading-6 text-slate-500">
                {form.careerGoal ||
                  "Add your career goal to keep your ambitions visible."}
              </p>

              <Link
                href="/placement-roadmap"
                className="mt-5 flex items-center justify-between rounded-xl border border-white/[0.07] px-4 py-3 text-xs text-violet-200 transition hover:bg-white/[0.04]"
              >
                View placement roadmap <span>→</span>
              </Link>
            </section>

            <section className="rounded-2xl border border-white/[0.07] bg-[#0e1525] p-5">
              <h3 className="text-sm font-semibold">Profile checklist</h3>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Fill in these details to keep your profile useful.
              </p>

              <div className="mt-5 space-y-4">
                {[
                  ["Full name", Boolean(form.fullName.trim())],
                  ["College", Boolean(form.college.trim())],
                  ["Technical skills", Boolean(form.skills.trim())],
                  ["Career goal", Boolean(form.careerGoal.trim())],
                  ["GitHub or LinkedIn", Boolean(form.githubUrl.trim() || form.linkedinUrl.trim())],
                ].map(([label, complete]) => (
                  <div
                    key={String(label)}
                    className="flex items-center gap-3"
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                        complete
                          ? "bg-emerald-400/15 text-emerald-300"
                          : "border border-white/10 text-slate-600"
                      }`}
                    >
                      {complete ? "✓" : "•"}
                    </span>

                    <span
                      className={`text-xs ${
                        complete ? "text-slate-300" : "text-slate-500"
                      }`}
                    >
                      {String(label)}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <p className="px-2 text-[10px] leading-5 text-slate-600">
              Keep your profile links accurate. Only share information you are
              comfortable storing in your account.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}

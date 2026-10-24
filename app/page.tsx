import Link from "next/link";

const features = [
  {
    icon: "💻",
    title: "DSA Practice",
    description:
      "Practice coding problems by topic and difficulty while tracking your progress.",
  },
  {
    icon: "🧮",
    title: "Aptitude Tests",
    description:
      "Improve quantitative aptitude, logical reasoning, and verbal ability with timed tests.",
  },
  {
    icon: "📚",
    title: "Core CS",
    description:
      "Prepare DBMS, Operating Systems, Computer Networks, OOP, and SQL.",
  },
  {
    icon: "🤖",
    title: "Mock Interviews",
    description:
      "Practice technical interviews and receive intelligent feedback on your answers.",
  },
  {
    icon: "📄",
    title: "Resume Analyzer",
    description:
      "Analyze your resume and discover ways to improve your job-readiness.",
  },
  {
    icon: "🎯",
    title: "Study Roadmap",
    description:
      "Follow a personalized preparation roadmap based on your target role.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Navbar */}
      <nav className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-xl">
              🎓
            </div>

            <span className="text-xl font-bold">
              JobPrep <span className="text-indigo-600">AI</span>
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="#features"
              className="text-sm font-medium text-slate-600 hover:text-indigo-600"
            >
              Features
            </Link>

            <Link
              href="#roadmap"
              className="text-sm font-medium text-slate-600 hover:text-indigo-600"
            >
              Roadmap
            </Link>

            <Link
              href="#about"
              className="text-sm font-medium text-slate-600 hover:text-indigo-600"
            >
              About
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Login
            </Link>

            <Link
              href="/signup"
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
          <div>
            <div className="mb-6 inline-flex rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700">
              🚀 Your AI-powered job preparation partner
            </div>

            <h1 className="text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
              Prepare Smarter.
              <br />
              Get{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Job Ready.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Practice DSA, aptitude, core CS, interviews, and more in one
              place. Build your skills, track your progress, and prepare for
              your dream job.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="rounded-xl bg-indigo-600 px-7 py-3.5 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700"
              >
                Get Started →
              </Link>

              <Link
                href="#features"
                className="rounded-xl border border-slate-200 bg-white px-7 py-3.5 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Explore Features
              </Link>
            </div>

            <div className="mt-8 flex items-center gap-3 text-sm text-slate-500">
              <div className="flex -space-x-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-blue-200">
                  👨
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-purple-200">
                  👩
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-green-200">
                  👨
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-yellow-200">
                  👩
                </div>
              </div>

              <span>
                Join students preparing for their dream careers.
              </span>
            </div>
          </div>

          {/* Hero Dashboard Preview */}
          <div className="relative">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-indigo-100">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Your Progress</p>
                  <p className="text-3xl font-bold">68%</p>
                </div>

                <div className="flex h-16 w-16 items-center justify-center rounded-full border-8 border-indigo-100 text-sm font-bold text-indigo-600">
                  68%
                </div>
              </div>

              <div className="space-y-4">
                <Progress label="DSA" value={72} />
                <Progress label="Aptitude" value={81} />
                <Progress label="Core CS" value={63} />
                <Progress label="Resume" value={76} />
                <Progress label="Interview" value={61} />
              </div>

              <div className="mt-6 rounded-2xl bg-indigo-50 p-4">
                <p className="font-semibold text-indigo-900">
                  🎯 Today&apos;s Goal
                </p>
                <p className="mt-1 text-sm text-indigo-700">
                  Solve 3 DSA problems and complete one DBMS quiz.
                </p>
              </div>
            </div>

            <div className="absolute -right-5 -top-5 rounded-2xl bg-white p-4 shadow-xl">
              <p className="text-xs text-slate-500">Current Streak</p>
              <p className="text-xl font-bold">🔥 5 days</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700">
              What We Offer
            </span>

            <h2 className="mt-5 text-4xl font-bold tracking-tight">
              Everything You Need to Get Hired
            </h2>

            <p className="mt-4 text-lg text-slate-600">
              A complete platform to prepare, practice, and track your
              job-preparation journey.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section id="roadmap" className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <span className="rounded-full bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-700">
                Personalized Roadmap
              </span>

              <h2 className="mt-5 text-4xl font-bold">
                Know Exactly What to Learn Next
              </h2>

              <p className="mt-5 text-lg leading-8 text-slate-600">
                Tell us your target role, experience level, and available
                study time. JobPrep AI will help you organize your preparation
                journey.
              </p>

              <Link
                href="/signup"
                className="mt-8 inline-block rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
              >
                Build My Roadmap
              </Link>
            </div>

            <div className="rounded-3xl bg-slate-900 p-7 text-white shadow-2xl">
              <h3 className="text-xl font-bold">60-Day Full Stack Roadmap</h3>

              <div className="mt-6 space-y-5">
                <RoadmapItem
                  week="Week 1-2"
                  title="JavaScript Fundamentals"
                  completed
                />

                <RoadmapItem
                  week="Week 3-4"
                  title="React & Frontend"
                  completed
                />

                <RoadmapItem
                  week="Week 5-6"
                  title="Node.js & SQL"
                />

                <RoadmapItem
                  week="Week 7-8"
                  title="Projects & Mock Interviews"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="about" className="bg-indigo-600 px-6 py-20 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold md:text-5xl">
            Ready to Start Your Preparation?
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-indigo-100">
            Start building the skills you need for your next opportunity.
          </p>

          <Link
            href="/signup"
            className="mt-8 inline-block rounded-xl bg-white px-8 py-4 font-bold text-indigo-600 shadow-lg hover:bg-slate-50"
          >
            Start Preparing for Free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 sm:flex-row">
          <p className="font-semibold">
            JobPrep <span className="text-indigo-600">AI</span>
          </p>

          <p className="text-sm text-slate-500">
            © 2026 JobPrep AI. Built for aspiring professionals.
          </p>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-2xl">
        {icon}
      </div>

      <h3 className="mt-5 text-xl font-bold">{title}</h3>

      <p className="mt-3 leading-7 text-slate-600">{description}</p>
    </div>
  );
}

function Progress({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-semibold text-slate-500">{value}%</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-indigo-600"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function RoadmapItem({
  week,
  title,
  completed = false,
}: {
  week: string;
  title: string;
  completed?: boolean;
}) {
  return (
    <div className="flex items-center gap-4">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          completed ? "bg-green-500" : "bg-slate-700"
        }`}
      >
        {completed ? "✓" : "→"}
      </div>

      <div>
        <p className="text-xs text-slate-400">{week}</p>
        <p className="font-semibold">{title}</p>
      </div>
    </div>
  );
}
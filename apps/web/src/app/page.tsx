'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf9f7] via-[#f5f3f0] to-[#f0ede9]">
      {/* Navigation */}
      <nav className="bg-white/50 backdrop-blur-sm border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-xl font-bold bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8c] bg-clip-text text-transparent">
            MindPad AI
          </div>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm bg-gradient-to-r from-[#4b7cb3] to-[#5a8cc4] text-white px-4 py-2 rounded-lg hover:shadow-md transition-shadow"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <div className="inline-block mb-6 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
            <span className="text-sm font-medium text-blue-700">
              ✨ AI Work Journal
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-slate-900 leading-tight">
            Turn scattered thoughts{' '}
            <span className="bg-gradient-to-r from-[#4b7cb3] to-[#8b9dc3] bg-clip-text text-transparent">
              into a clear workday
            </span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            MindPad transforms brain dumps into priorities, focus blocks, and
            daily briefs. Get AI-powered insights to stay productive and
            intentional.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-3 bg-gradient-to-r from-[#4b7cb3] to-[#5a8cc4] text-white rounded-lg hover:shadow-lg transition-shadow font-medium"
            >
              Get Started Free
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-3 bg-white border border-slate-300 text-slate-900 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              View Dashboard
            </Link>
          </div>
        </div>

        {/* Product Preview Card */}
        <div className="mb-24 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden">
          <div className="p-8 border-b border-slate-200/50">
            <h3 className="font-semibold text-slate-900 mb-6">
              Your AI Morning Brief
            </h3>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  📌 Today's Top Priority
                </p>
                <p className="text-slate-700 mt-1">
                  Complete quarterly review and strategic planning
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-slate-600">
                    Completed Tasks
                  </p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">5</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-slate-600">
                    Today's Deadlines
                  </p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">2</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-slate-600">
                    Focus Block
                  </p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    90 min
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-24">
          <FeatureCard
            icon="🧠"
            title="Brain Dump"
            description="Capture messy thoughts without judgment. AI organizes them instantly."
          />
          <FeatureCard
            icon="📋"
            title="AI Daily Brief"
            description="Get prioritized tasks and actionable insights each morning."
          />
          <FeatureCard
            icon="⏱️"
            title="Focus Sessions"
            description="Pomodoro-style timers with AI-recommended tasks to focus on."
          />
          <FeatureCard
            icon="📊"
            title="Productivity Analytics"
            description="Track completion rates, focus time, and weekly progress."
          />
          <FeatureCard
            icon="🌙"
            title="Evening Review"
            description="Reflect on today's wins and set mindful intentions for tomorrow."
          />
          <FeatureCard
            icon="✨"
            title="Smart Prioritization"
            description="AI learns your patterns and helps you focus on what matters most."
          />
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-[#4b7cb3] to-[#5a8cc4] rounded-2xl p-12 text-center text-white shadow-lg">
          <h2 className="text-3xl font-bold mb-4">
            Ready to transform your workday?
          </h2>
          <p className="mb-8 text-lg opacity-90">
            Start organizing your thoughts into productivity with AI.
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </div>
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
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-slate-200/50 hover:border-slate-300 transition-colors group hover:shadow-md">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

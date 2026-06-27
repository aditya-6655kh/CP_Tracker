import { Code2, Flame, ListChecks, TrendingUp, Trophy } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const RANK_STOPS = [
  { rating: 800, color: "#808080" },
  { rating: 1200, color: "#008000" },
  { rating: 1500, color: "#03A89E" },
  { rating: 1800, color: "#6B90E8" },
  { rating: 2100, color: "#AA00AA" },
  { rating: 2487, color: "#FF8C00" },
];

function colorForRating(rating: number): string {
  for (let i = RANK_STOPS.length - 1; i >= 0; i--) {
    if (rating >= RANK_STOPS[i].rating) return RANK_STOPS[i].color;
  }
  return RANK_STOPS[0].color;
}

const RatingClimb: React.FC = () => {
  const [rating, setRating] = useState(800);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const start = 800;
    const end = 2487;
    const steps = 40;
    const stepDuration = 2200 / steps;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) {
      setRating(end);
      setDrawn(true);
      return;
    }

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const t = currentStep / steps;
      const eased = 1 - Math.pow(1 - t, 3);
      setRating(Math.round(start + (end - start) * eased));

      if (currentStep >= steps) {
        clearInterval(interval);
        setDrawn(true);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, []);

  const color = colorForRating(rating);
  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 280 90"
        className="w-72 mb-2 motion-reduce:transition-none"
      >
        <path
          d="M 4 80 C 40 78, 55 70, 75 60 S 110 35, 130 38 S 165 50, 185 30 S 220 5, 276 8"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          pathLength={1}
          style={{
            strokeDasharray: 1,
            strokeDashoffset: drawn ? 0 : 1,
            transition: "stroke-dashoffset 2.2s ease-out, stroke 0.3s linear",
          }}
        />
      </svg>
      <p
        className="font-mono text-5xl font-bold tabular-nums transition-colors duration-300"
        style={{ color }}
      >
        {rating}
      </p>
      <p className="font-mono text-xs text-slate-500 mt-1">
        rating, and climbing
      </p>
    </div>
  );
};

const LandingPage: React.FC = () => {
  const features = [
    {
      icon: TrendingUp,
      title: "Live ratings and rank",
      description:
        "Current and max rating, rank, and full contest history pulled straight from Codeforces.",
    },
    {
      icon: ListChecks,
      title: "Solved breakdown.",
      description:
        "Easy/Medium/Hard splits from Leetcode, plus unique problems solved on codeforces.",
    },
    {
      icon: Flame,
      title: "Streaks & activity",
      description:
        "A GitHub-style heatmap and streak counter, built from your real submission history.",
    },
    {
      icon: Code2,
      title: "Submission analytics",
      description:
        "Acceptance rate and a full verdict breakdown — WA, TLE, RE, and everything else.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <nav className="flex items-center justify-between px-6 lg:px-12 py-5 border-b border-[#2D2D3F]">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-indigo-400" />
          <span className="font-mono text-sm font-semibold text-white tracking-wide">
            CP Tracker
          </span>
        </div>
        <div className="flex items-center gap-5">
          <Link
            className="font-mono text-sm text-slate-400 hover:text-white transition-colors"
            to="/login"
          >
            Sign in
          </Link>
          <Link
            className="font-mono text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-500 transition-colors"
            to="/register"
          >
            Create account
          </Link>
        </div>
      </nav>

      {/* hero section */}
      <section className="px-6 lgg:px-12 py-20 lg:py-28 max-w-5xl mx-auto text-center">
        <p className="font-mono text-xs text-indigo-400 tracking-widest uppercase mb-5">
          For competetive programmers
        </p>
        <h1 className="font-mono text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-5">
          Track every rating point. <br /> Across every platform.
        </h1>
        <p className="font-mono text-sm sm:text-base text-slate-500 max-w-xl mx-auto mb-9">
          Codeforces and LeetCode stats, streak, and submission analytics -
          pulled live, in one dashboard you'll actually open.
        </p>

        <div className="flex items-center justify-center gap-4 mb-16">
          <Link
            to="/register"
            className="font-mono text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg transition-colors"
          >
            Create account
          </Link>
          <Link
            to="/login"
            className="font-mono text-sm text-slate-400 hover:text-white border border-[#2D2D3F] px-5 py-2.5 rounded-lg transition-colors"
          >
            Sign in
          </Link>
        </div>

        <RatingClimb />
      </section>

      {/* features */}
      <section className="px-6 lg:px-12 py-16 border-t border-[#2D2D3F]">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-mono text-sm font-semibold text-slate-300 mb-8 text-center">
            What it tracks
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-[#12121A] border border-[#2D2D3F] rounded-xl p-6"
              >
                <Icon className="w-5 h-5 text-indigo-400 mb-4" />
                <h3 className="font-mono text-sm font-semibold text-white mb-2">
                  {title}
                </h3>
                <p className="font-mono text-xs text-slate-500 leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="px-6 lg:px-12 py-20 border-t border-[#2D2D3F] text-center">
        <h2 className="font-mono text-xl sm:text-2xl font-semibold text-white mb-3">
          Stop checking five tabs.
        </h2>
        <p className="font-mono text-sm text-slate-500 mb-7">
          See your whole CP journey in one place.
        </p>
        <Link
          to="/register"
          className="font-mono text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg transition-colors inline-block"
        >
          Create account
        </Link>
      </section>
    </div>
  );
};

export default LandingPage;

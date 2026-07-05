import { PHASE_CONFIGS } from "../types";
import { BookOpen, CheckCircle, ShieldAlert, Zap } from "lucide-react";

export default function RoadmapManual() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 lg:p-8" id="roadmap-manual-container">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-800 tracking-tight">
            Roadmap Reference & Rules
          </h2>
          <p className="text-sm text-slate-500">
            Official guidelines for the 90-Day Sudarshan Kriya + Omega-3 Roadmap
          </p>
        </div>
      </div>

      {/* Interactive Tabs / Cards for Phases */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((phaseNum) => {
          const cfg = PHASE_CONFIGS[phaseNum];
          const colorClass =
            phaseNum === 1
              ? "border-teal-100 bg-teal-50/20 text-teal-800"
              : phaseNum === 2
              ? "border-amber-100 bg-amber-50/20 text-amber-800"
              : "border-rose-100 bg-rose-50/20 text-rose-800";

          return (
            <div
              key={phaseNum}
              className={`p-5 rounded-xl border ${colorClass} flex flex-col justify-between`}
              id={`phase-card-${phaseNum}`}
            >
              <div>
                <span className="text-xs font-bold uppercase tracking-wider opacity-75">
                  {cfg.days}
                </span>
                <h3 className="text-lg font-bold mt-1 mb-3">{cfg.title}</h3>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <strong className="block text-slate-700 font-medium">⏰ Wake-Up:</strong>
                    <span className="text-slate-600">{cfg.wakeUp}</span>
                  </div>
                  <div>
                    <strong className="block text-slate-700 font-medium">🌅 SKY Practice:</strong>
                    <p className="text-slate-600 leading-relaxed text-xs">{cfg.skyPractice}</p>
                  </div>
                  <div>
                    <strong className="block text-slate-700 font-medium">💊 Multivitamin (Breakfast):</strong>
                    <p className="text-slate-600 leading-relaxed text-xs">{cfg.multivitamin}</p>
                  </div>
                  {cfg.omega3Dinner && (
                    <div>
                      <strong className="block text-slate-700 font-medium">🥗 Omega-3 (Dinner):</strong>
                      <p className="text-slate-600 leading-relaxed text-xs">{cfg.omega3Dinner}</p>
                    </div>
                  )}
                  <div>
                    <strong className="block text-slate-700 font-medium">🧘 Evening Practice:</strong>
                    <p className="text-slate-600 leading-relaxed text-xs">{cfg.eveningPractice}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/40 text-xs text-slate-500">
                💤 Sleep Target: {cfg.sleepTarget}
              </div>
            </div>
          );
        })}
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
          <h4 className="flex items-center gap-2 font-semibold text-slate-800 mb-4 text-base">
            <Zap className="w-5 h-5 text-amber-500" />
            Key Rules & Best Practices
          </h4>
          <ul className="space-y-4 text-sm text-slate-600">
            <li className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">Never skip SKY:</strong> Even on tough study days, 25 minutes of morning SKY is non-negotiable. It directly boosts GABA and focus for your 8:00 AM start.
              </div>
            </li>
            <li className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">Choose Certified Brands:</strong> Look for IFOS 5-star certified brands with ≥500 mg EPA + ≥300 mg DHA per capsule. Take with fatty meals or breakfast.
              </div>
            </li>
            <li className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">Dinner Omega-3 Routine:</strong> Take your Omega-3 capsules with dinner. Shifting them to the night with a fat-inclusive meal boosts bio-absorption and supports restorative memory processing during sleep.
              </div>
            </li>
            <li className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">No Screens 30 min before sleep:</strong> This protects melatonin — which SKY already helps produce, leading to deep restorative sleep (7.5 hours target).
              </div>
            </li>
          </ul>
        </div>

        <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
          <h4 className="flex items-center gap-2 font-semibold text-slate-800 mb-4 text-base">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            Advanced & Exam-day Guidelines
          </h4>
          <div className="space-y-4 text-sm text-slate-600">
            <div className="border-l-4 border-emerald-500 pl-3">
              <strong className="block text-slate-800 text-xs uppercase tracking-wider font-semibold mb-1">
                Brahmi Integration (Phase 3 — Days 61–90)
              </strong>
              <p className="leading-relaxed">
                Add 300 mg Bacopa monnieri capsule once daily with breakfast from Day 61. It is clinically proven to improve memory retention, focus, and cognitive speed.
              </p>
            </div>

            <div className="border-l-4 border-amber-500 pl-3">
              <strong className="block text-slate-800 text-xs uppercase tracking-wider font-semibold mb-1">
                Morning of GATE Exam / D-Day
              </strong>
              <p className="leading-relaxed">
                Shorten morning SKY practice to 20 minutes. Take 1 g omega-3 with a light breakfast. **Skip Brahmi** that morning to maintain crisp, immediate responsiveness.
              </p>
            </div>

            <div className="border-l-4 border-indigo-500 pl-3">
              <strong className="block text-slate-800 text-xs uppercase tracking-wider font-semibold mb-1">
                The Study Block (8:00 AM → 7:00 PM)
              </strong>
              <p className="leading-relaxed">
                Do NOT disturb this block. All breathing exercises and nutritional supplements are scheduled strictly OUTSIDE of study hours to protect your pure, uninterrupted flow state.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

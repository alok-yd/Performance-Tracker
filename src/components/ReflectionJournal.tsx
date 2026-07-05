import { useState, useEffect } from "react";
import { Sparkles, Check, Heart, BookOpen, Clock, AlertTriangle, Calendar } from "lucide-react";
import { DailyLog } from "../types";

interface ReflectionJournalProps {
  currentLog: DailyLog;
  allLogs: DailyLog[];
  onSaveLog: (log: DailyLog) => void;
}

export default function ReflectionJournal({ currentLog, allLogs, onSaveLog }: ReflectionJournalProps) {
  const [journal, setJournal] = useState({
    whatWentWell: "",
    whatDistracted: "",
    whatToImprove: "",
    gratitude: ""
  });

  // Load existing log
  useEffect(() => {
    if (currentLog && currentLog.reflection) {
      setJournal({
        whatWentWell: currentLog.reflection.whatWentWell || "",
        whatDistracted: currentLog.reflection.whatDistracted || "",
        whatToImprove: currentLog.reflection.whatToImprove || "",
        gratitude: currentLog.reflection.gratitude || ""
      });
    } else {
      setJournal({
        whatWentWell: "",
        whatDistracted: "",
        whatToImprove: "",
        gratitude: ""
      });
    }
  }, [currentLog]);

  const handleFieldChange = (key: keyof typeof journal, val: string) => {
    setJournal((prev) => ({
      ...prev,
      [key]: val
    }));
  };

  const handleSave = () => {
    onSaveLog({
      ...currentLog,
      reflection: journal
    });
  };

  // Extract previous entries
  const pastReflections = allLogs
    .filter((l) => l.dayNumber < currentLog.dayNumber && l.reflection && (l.reflection.whatWentWell || l.reflection.gratitude))
    .sort((a, b) => b.dayNumber - a.dayNumber);

  return (
    <div className="space-y-6 animate-in fade-in duration-200" id="reflection-journal-view">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          🌙 Mindful Reflection & Gratitude Log
        </h2>
        <p className="text-xs text-slate-500">
          Reflecting on daily achievements, filtering distractions, and building atomic gratitude habits for long-term emotional resilience.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs Section */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Evening Reflection — Day {currentLog.dayNumber}
            </h3>

            <div className="space-y-4">
              {/* What went well */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  What went exceptionally well today?
                </label>
                <textarea
                  value={journal.whatWentWell}
                  onChange={(e) => handleFieldChange("whatWentWell", e.target.value)}
                  placeholder="E.g., Crushed Operating System scheduling algorithms study, kept focus during peak hours..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 h-20 resize-none focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              {/* What distracted */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  What distracted or slowed you down?
                </label>
                <textarea
                  value={journal.whatDistracted}
                  onChange={(e) => handleFieldChange("whatDistracted", e.target.value)}
                  placeholder="E.g., Spent 45 minutes scrolling social media in the afternoon, felt mid-day brain fog..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 h-20 resize-none focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              {/* What to improve */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                  What is your single key action point to improve tomorrow?
                </label>
                <textarea
                  value={journal.whatToImprove}
                  onChange={(e) => handleFieldChange("whatToImprove", e.target.value)}
                  placeholder="E.g., Leave mobile phone in the other room during 8 AM block, add 15 min Nadi Shodhana..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 h-20 resize-none focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              {/* Gratitude */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  What are you deeply grateful for today?
                </label>
                <textarea
                  value={journal.gratitude}
                  onChange={(e) => handleFieldChange("gratitude", e.target.value)}
                  placeholder="E.g., Healthy breakfast, access to top-grade GATE notes, quiet morning environment..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 h-20 resize-none focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Save Controls */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleSave}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                Commit Evening Journal
              </button>
            </div>
          </div>
        </div>

        {/* Right timeline section */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-55 rounded-2xl border border-slate-200 p-5 space-y-4 shadow-3xs max-h-[500px] overflow-y-auto bg-slate-50">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-600" />
              Journal Archives
            </h3>

            {pastReflections.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                No archived journal logs yet. Start saving reflections to build an educational feedback timeline.
              </p>
            ) : (
              <div className="space-y-4 relative pl-3 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {pastReflections.map((r) => (
                  <div key={r.dayNumber} className="relative space-y-1.5">
                    {/* Tiny connector dot */}
                    <div className="absolute -left-[13px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-white shadow-xs" />
                    
                    <span className="text-[10px] font-mono font-black text-indigo-600">Day {r.dayNumber} ({r.date})</span>
                    <div className="bg-white border border-slate-100 rounded-xl p-3 text-[11px] text-slate-600 leading-normal space-y-1">
                      {r.reflection?.gratitude && (
                        <p>❤️ <strong>Gratitude:</strong> {r.reflection.gratitude}</p>
                      )}
                      {r.reflection?.whatWentWell && (
                        <p>✨ <strong>Won:</strong> {r.reflection.whatWentWell}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

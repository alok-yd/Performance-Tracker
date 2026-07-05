import { useState, useEffect } from "react";
import { BookOpen, Star, HelpCircle, Check, Sparkles, TrendingUp, BookOpenCheck } from "lucide-react";
import { DailyLog, SubjectStudyLog } from "../types";

interface StudyHoursTrackerProps {
  currentLog: DailyLog;
  allLogs: DailyLog[];
  onSaveLog: (log: DailyLog) => void;
}

const SUBJECT_LIST = ["DSA", "OS", "DBMS", "CN", "Compiler", "Maths"];

export default function StudyHoursTracker({ currentLog, allLogs, onSaveLog }: StudyHoursTrackerProps) {
  // Initialize local subjects state from log, defaulting empty
  const [subjects, setSubjects] = useState<Record<string, SubjectStudyLog>>({});

  useEffect(() => {
    const existing = currentLog.subjects || [];
    const initialMap: Record<string, SubjectStudyLog> = {};
    
    SUBJECT_LIST.forEach((sub) => {
      const found = existing.find((s) => s.name === sub);
      if (found) {
        initialMap[sub] = found;
      } else {
        initialMap[sub] = {
          name: sub,
          hours: 0,
          problems: 0,
          revised: false,
          confidence: 3
        };
      }
    });
    setSubjects(initialMap);
  }, [currentLog]);

  const handleFieldChange = (subName: string, field: keyof SubjectStudyLog, value: any) => {
    setSubjects((prev) => ({
      ...prev,
      [subName]: {
        ...prev[subName],
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    const updatedSubjects = Object.values(subjects) as SubjectStudyLog[];
    
    // Auto-calculate deepStudy habit status
    const totalHours = updatedSubjects.reduce((acc, s) => acc + s.hours, 0);
    const deepStudyStatus = totalHours >= 11 ? "done" : "pending";

    onSaveLog({
      ...currentLog,
      subjects: updatedSubjects,
      deepStudy: deepStudyStatus
    });
  };

  // Calculate Weekly Report
  const calculateWeeklyReport = () => {
    // Get logs for the current week (determined by dayNumber)
    const currentDay = currentLog.dayNumber;
    const weekStartDay = Math.max(1, currentDay - (currentDay % 7 === 0 ? 6 : (currentDay % 7) - 1));
    const weekEndDay = Math.min(90, weekStartDay + 6);

    const weeklyLogs = allLogs.filter((l) => l.dayNumber >= weekStartDay && l.dayNumber <= weekEndDay);
    
    let totalWeeklyHours = 0;
    let totalWeeklyProblems = 0;
    const subjectStats: Record<string, { hours: number; confidenceSum: number; counts: number }> = {};
    const dayStats: Record<number, { hours: number; date: string }> = {};

    SUBJECT_LIST.forEach((sub) => {
      subjectStats[sub] = { hours: 0, confidenceSum: 0, counts: 0 };
    });

    weeklyLogs.forEach((l) => {
      let logHours = 0;
      const logSubs = l.subjects || [];
      logSubs.forEach((s) => {
        totalWeeklyHours += s.hours;
        totalWeeklyProblems += s.problems;
        logHours += s.hours;

        if (subjectStats[s.name]) {
          subjectStats[s.name].hours += s.hours;
          subjectStats[s.name].confidenceSum += s.confidence;
          subjectStats[s.name].counts += 1;
        }
      });
      dayStats[l.dayNumber] = { hours: logHours, date: l.date };
    });

    // Best / Weakest Subjects
    let bestSubject = "None";
    let highestConf = -1;
    let weakestSubject = "None";
    let lowestConf = 999;

    SUBJECT_LIST.forEach((sub) => {
      const stat = subjectStats[sub];
      if (stat.hours > 0) {
        const avgConf = stat.confidenceSum / stat.counts;
        if (avgConf > highestConf) {
          highestConf = avgConf;
          bestSubject = sub;
        }
        if (avgConf < lowestConf) {
          lowestConf = avgConf;
          weakestSubject = sub;
        }
      }
    });

    // Most productive day
    let bestDayNum = -1;
    let maxHours = -1;
    Object.entries(dayStats).forEach(([dayNumStr, data]) => {
      if (data.hours > maxHours) {
        maxHours = data.hours;
        bestDayNum = Number(dayNumStr);
      }
    });

    return {
      totalHours: totalWeeklyHours,
      totalProblems: totalWeeklyProblems,
      bestSubject,
      weakestSubject,
      bestDayNum,
      maxHours,
      weekStartDay,
      weekEndDay
    };
  };

  const report = calculateWeeklyReport();

  return (
    <div className="space-y-6 animate-in fade-in duration-200" id="study-tracker-tab">
      {/* Top Header info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            📚 GATE 2027 Study Hours Matrix
          </h2>
          <p className="text-xs text-slate-500">
            Log your focus slots for the 6 core exam pillars. Tally study depth, problem volume, and revision coverage.
          </p>
        </div>
        <span className="self-start text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full">
          Goal: 11 Hours Daily Study
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Input Section */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs">
            <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-1.5">
              <BookOpenCheck className="w-4 h-4 text-indigo-600" />
              Daily Study Input — Day {currentLog.dayNumber}
            </h3>

            <div className="space-y-4">
              {SUBJECT_LIST.map((subName) => {
                const sub = subjects[subName] || { name: subName, hours: 0, problems: 0, revised: false, confidence: 3 };
                return (
                  <div
                    key={subName}
                    className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
                  >
                    {/* Name */}
                    <div className="md:col-span-3 flex items-center gap-2.5">
                      <span className="p-1.5 bg-slate-200 text-slate-700 rounded-lg font-bold text-[10px] uppercase w-8 h-8 flex items-center justify-center shrink-0">
                        {subName.substring(0, 3)}
                      </span>
                      <span className="text-xs font-bold text-slate-700">{subName}</span>
                    </div>

                    {/* Hours */}
                    <div className="md:col-span-2">
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Hours</label>
                      <input
                        type="number"
                        min="0"
                        max="24"
                        step="0.5"
                        value={sub.hours || ""}
                        onChange={(e) => handleFieldChange(subName, "hours", e.target.value === "" ? 0 : parseFloat(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        placeholder="0.0"
                      />
                    </div>

                    {/* Problems Solved */}
                    <div className="md:col-span-2">
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">MCQs Solved</label>
                      <input
                        type="number"
                        min="0"
                        max="500"
                        value={sub.problems || ""}
                        onChange={(e) => handleFieldChange(subName, "problems", e.target.value === "" ? 0 : parseInt(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        placeholder="0"
                      />
                    </div>

                    {/* Revised */}
                    <div className="md:col-span-2 flex flex-col justify-center">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Revised</span>
                      <button
                        onClick={() => handleFieldChange(subName, "revised", !sub.revised)}
                        className={`py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                          sub.revised
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                        }`}
                      >
                        <Check className={`w-3.5 h-3.5 ${sub.revised ? "opacity-100" : "opacity-0"}`} />
                        <span>Rev</span>
                      </button>
                    </div>

                    {/* Confidence Stars */}
                    <div className="md:col-span-3">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Confidence</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleFieldChange(subName, "confidence", star)}
                            className="p-0.5 transition-transform hover:scale-110"
                          >
                            <Star
                              className={`w-4 h-4 ${
                                star <= sub.confidence ? "text-amber-400 fill-amber-400" : "text-slate-200"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Save Button */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-[10px] text-slate-400 leading-normal max-w-md">
                💡 Reaching an aggregate of <strong>11 total hours</strong> across subjects will automatically check-off the <strong>"Deep Study"</strong> habit for today.
              </p>
              <button
                onClick={handleSave}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Save Daily Study Metrics
              </button>
            </div>
          </div>
        </div>

        {/* Right Weekly Report Section */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-5 shadow-xs relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
            <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-3xl" />
            
            <div className="relative z-10 space-y-4">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">
                Week {Math.min(13, Math.ceil(currentLog.dayNumber / 7))} Performance Report
              </span>
              <h3 className="text-base font-black tracking-tight leading-tight flex items-center gap-1.5">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                Active Weekly Analytics
              </h3>
              <p className="text-[10px] text-slate-400 leading-normal">
                Based on logs tracked from day {report.weekStartDay} to {report.weekEndDay}.
              </p>

              {/* Big Stat Cards */}
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3">
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">Study Hours</span>
                  <span className="text-xl font-mono font-black text-indigo-300">{report.totalHours} hrs</span>
                </div>
                <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3">
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">MCQs Solved</span>
                  <span className="text-xl font-mono font-black text-teal-300">{report.totalProblems}</span>
                </div>
              </div>

              {/* Subject details */}
              <div className="space-y-2.5 pt-3 border-t border-slate-800/80">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Strongest Subject:</span>
                  <span className="font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-900/30">
                    {report.bestSubject}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Needs Attention:</span>
                  <span className="font-bold text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-900/30">
                    {report.weakestSubject}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Most Productive Day:</span>
                  <span className="font-mono font-bold text-indigo-300">
                    {report.bestDayNum > 0 ? `Day ${report.bestDayNum} (${report.maxHours}h)` : "No logs yet"}
                  </span>
                </div>
              </div>

              {/* Wisdom block */}
              <div className="pt-3 border-t border-slate-800/80 text-[10px] text-slate-400 leading-normal bg-slate-950/20 p-3 rounded-lg">
                🚀 <strong>AIR-1 Insight:</strong> Maintaining an balance across all subjects prevents GATE bottlenecks. Make sure compiler design and networks get at least 6 hours weekly.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { DailyLog, getPhaseForDay, HabitStatus } from "../types";
import { Check, X, Edit2, Search, Filter } from "lucide-react";
import { useState } from "react";

interface TrackerGridProps {
  logs: DailyLog[];
  onToggleHabit: (dayNumber: number, habitKey: keyof DailyLog) => void;
  onUpdateNotes: (dayNumber: number, notes: string) => void;
  onUpdateMetrics: (dayNumber: number, focusLevel: number, sleepQuality: number, score: number) => void;
  currentDay: number;
}

export default function TrackerGrid({
  logs,
  onToggleHabit,
  onUpdateNotes,
  onUpdateMetrics,
  currentDay
}: TrackerGridProps) {
  const [filterPhase, setFilterPhase] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingDay, setEditingDay] = useState<number | null>(null);
  
  // Local state for editing metrics/notes
  const [editNotes, setEditNotes] = useState("");
  const [editFocus, setEditFocus] = useState(3);
  const [editSleep, setEditSleep] = useState(3);
  const [editScore, setEditScore] = useState(0);

  const startEditing = (log: DailyLog) => {
    setEditingDay(log.dayNumber);
    setEditNotes(log.notes || "");
    setEditFocus(log.focusLevel || 3);
    setEditSleep(log.sleepQuality || 3);
    setEditScore(log.mockTestScore >= 0 ? log.mockTestScore : 0);
  };

  const saveEditing = (dayNumber: number) => {
    onUpdateNotes(dayNumber, editNotes);
    onUpdateMetrics(dayNumber, editFocus, editSleep, editScore);
    setEditingDay(null);
  };

  // Filter & Search logic
  const filteredLogs = logs.filter((log) => {
    const phase = getPhaseForDay(log.dayNumber);
    const matchesPhase = filterPhase === "all" || phase === filterPhase;
    const matchesSearch =
      log.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.date.includes(searchQuery) ||
      `day ${log.dayNumber}`.includes(searchQuery.toLowerCase());
    return matchesPhase && matchesSearch;
  });

  const getStatusBadge = (status: HabitStatus) => {
    switch (status) {
      case "done":
        return (
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm shadow-xs transition-all hover:scale-105">
            ✓
          </span>
        );
      case "missed":
        return (
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-rose-100 text-rose-800 font-bold text-sm shadow-xs transition-all hover:scale-105">
            ✗
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-400 font-medium text-xs transition-all hover:bg-slate-200">
            —
          </span>
        );
    }
  };

  // Map phase number to styling classes as instructed: "Phase 1 rows = teal, Phase 2 = amber, Phase 3 = coral"
  const getRowBgClass = (dayNumber: number) => {
    const phase = getPhaseForDay(dayNumber);
    const isCurrent = dayNumber === currentDay;
    
    let baseClass = "";
    if (phase === 1) {
      baseClass = "bg-teal-50/10 hover:bg-teal-50/25 border-l-4 border-l-teal-500";
    } else if (phase === 2) {
      baseClass = "bg-amber-50/10 hover:bg-amber-50/25 border-l-4 border-l-amber-500";
    } else {
      baseClass = "bg-rose-50/10 hover:bg-rose-50/25 border-l-4 border-l-rose-500";
    }

    if (isCurrent) {
      return `${baseClass} ring-2 ring-indigo-500 ring-offset-2 font-medium`;
    }
    return baseClass;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6" id="tracker-grid-container">
      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">90-Day Interactive Tracker</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Click any habit cell (SKY, Multivitamin, Omega-3, Stillness, Study etc.) to cycle status (Pending ➜ Done ➜ Missed).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Phase Filter Tabs */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setFilterPhase("all")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                filterPhase === "all" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              All Days
            </button>
            <button
              onClick={() => setFilterPhase(1)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                filterPhase === 1 ? "bg-teal-500 text-white shadow-xs" : "text-slate-500 hover:text-teal-600"
              }`}
            >
              Phase 1 (Teal)
            </button>
            <button
              onClick={() => setFilterPhase(2)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                filterPhase === 2 ? "bg-amber-500 text-white shadow-xs" : "text-slate-500 hover:text-amber-600"
              }`}
            >
              Phase 2 (Amber)
            </button>
            <button
              onClick={() => setFilterPhase(3)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                filterPhase === 3 ? "bg-rose-500 text-white shadow-xs" : "text-slate-500 hover:text-rose-600"
              }`}
            >
              Phase 3 (Coral)
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search notes or date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-44 md:w-56"
            />
          </div>
        </div>
      </div>

      {/* Spreadsheet Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 uppercase tracking-wider font-semibold">
              <th className="p-3 font-semibold text-center w-12">Day</th>
              <th className="p-3 font-semibold w-24">Date</th>
              <th className="p-3 font-semibold text-center w-24">Morning SKY</th>
              <th className="p-3 font-semibold text-center w-24">Multivitamin</th>
              <th className="p-3 font-semibold text-center w-24">Omega-3 Dinner</th>
              <th className="p-3 font-semibold text-center w-24">Evening SKY</th>
              <th className="p-3 font-semibold text-center w-24">Stillness</th>
              <th className="p-3 font-semibold text-center w-24">Deep Study</th>
              <th className="p-3 font-semibold text-center w-24">No-Mobile</th>
              <th className="p-3 font-semibold text-center w-24">Revision</th>
              <th className="p-3 font-semibold text-center w-16">Stats</th>
              <th className="p-3 font-semibold min-w-[150px]">Notes & Mock Scores</th>
              <th className="p-3 text-center w-16">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.map((log) => {
              const isCurrent = log.dayNumber === currentDay;
              const isEditing = editingDay === log.dayNumber;

              return (
                <tr
                  key={log.dayNumber}
                  className={`${getRowBgClass(log.dayNumber)} transition-all`}
                  id={`tracker-row-${log.dayNumber}`}
                >
                  {/* Day column */}
                  <td className="p-3 font-bold text-center text-slate-800">
                    {log.dayNumber}
                    {isCurrent && (
                      <span className="block text-[8px] bg-indigo-100 text-indigo-700 px-1 py-0.5 rounded-full mt-1">
                        TODAY
                      </span>
                    )}
                  </td>

                  {/* Date column */}
                  <td className="p-3 font-mono text-slate-500">
                    {log.date}
                  </td>

                  {/* Core Habit column 1 */}
                  <td
                    className="p-2 text-center cursor-pointer select-none"
                    onClick={() => onToggleHabit(log.dayNumber, "morningSky")}
                  >
                    {getStatusBadge(log.morningSky)}
                  </td>

                  {/* Core Habit column 2 */}
                  <td
                    className="p-2 text-center cursor-pointer select-none"
                    onClick={() => onToggleHabit(log.dayNumber, "multivitamin")}
                  >
                    {getStatusBadge(log.multivitamin)}
                  </td>

                  {/* Core Habit column 3 */}
                  <td
                    className="p-2 text-center cursor-pointer select-none"
                    onClick={() => onToggleHabit(log.dayNumber, "omega3Dinner")}
                  >
                    {getStatusBadge(log.omega3Dinner)}
                  </td>

                  {/* Core Habit column 4 */}
                  <td
                    className="p-2 text-center cursor-pointer select-none"
                    onClick={() => onToggleHabit(log.dayNumber, "eveningPractice")}
                  >
                    {getStatusBadge(log.eveningPractice)}
                  </td>

                  {/* Month-tracker columns */}
                  <td
                    className="p-2 text-center cursor-pointer select-none"
                    onClick={() => onToggleHabit(log.dayNumber, "stillnessSitting")}
                  >
                    {getStatusBadge(log.stillnessSitting)}
                  </td>

                  <td
                    className="p-2 text-center cursor-pointer select-none"
                    onClick={() => onToggleHabit(log.dayNumber, "deepStudy")}
                  >
                    {getStatusBadge(log.deepStudy)}
                  </td>

                  <td
                    className="p-2 text-center cursor-pointer select-none"
                    onClick={() => onToggleHabit(log.dayNumber, "noMobileHours")}
                  >
                    {getStatusBadge(log.noMobileHours)}
                  </td>

                  <td
                    className="p-2 text-center cursor-pointer select-none"
                    onClick={() => onToggleHabit(log.dayNumber, "revision")}
                  >
                    {getStatusBadge(log.revision)}
                  </td>

                  {/* Metrics status column */}
                  <td className="p-3 text-center">
                    <div className="flex flex-col gap-0.5 font-mono text-[10px] text-slate-500">
                      <span>🎯 F:{log.focusLevel}/5</span>
                      <span>💤 S:{log.sleepQuality}/5</span>
                    </div>
                  </td>

                  {/* Notes / Edit inputs column */}
                  <td className="p-3">
                    {isEditing ? (
                      <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200" id={`edit-panel-${log.dayNumber}`}>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] text-slate-500">Focus</label>
                            <select
                              value={editFocus}
                              onChange={(e) => setEditFocus(Number(e.target.value))}
                              className="w-full bg-white border border-slate-200 rounded p-1 text-[11px]"
                            >
                              {[1, 2, 3, 4, 5].map((n) => (
                                <option key={n} value={n}>{n}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500">Sleep</label>
                            <select
                              value={editSleep}
                              onChange={(e) => setEditSleep(Number(e.target.value))}
                              className="w-full bg-white border border-slate-200 rounded p-1 text-[11px]"
                            >
                              {[1, 2, 3, 4, 5].map((n) => (
                                <option key={n} value={n}>{n}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500">Mock Score</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={editScore}
                              onChange={(e) => setEditScore(Number(e.target.value))}
                              className="w-full bg-white border border-slate-200 rounded p-1 text-[11px]"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500">Notes</label>
                          <textarea
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="How focused did you feel? Mock score..."
                            className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-700 h-16 resize-none focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingDay(null)}
                            className="px-2.5 py-1 rounded bg-slate-200 hover:bg-slate-300 font-medium"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => saveEditing(log.dayNumber)}
                            className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {log.notes ? (
                          <p className="text-slate-700 max-w-[250px] leading-relaxed break-words font-sans">
                            {log.notes}
                          </p>
                        ) : (
                          <span className="text-slate-400 italic">No notes logged yet.</span>
                        )}
                        {log.mockTestScore >= 0 && (
                          <span className="inline-block px-1.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-100 rounded text-[9px] font-mono">
                            ✍️ Mock Score: {log.mockTestScore}%
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Editing action column */}
                  <td className="p-3 text-center">
                    {!isEditing && (
                      <button
                        onClick={() => startEditing(log)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100 transition-colors"
                        title="Edit logs & notes"
                        id={`edit-btn-${log.dayNumber}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={13} className="p-8 text-center text-slate-400 italic">
                  No tracking records found matching the filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

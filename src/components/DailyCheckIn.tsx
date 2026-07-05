import { DailyLog, getPhaseForDay, PHASE_CONFIGS } from "../types";
import {
  Calendar,
  CheckCircle,
  FileSpreadsheet,
  FileText,
  ListTodo,
  Sparkles,
  Zap,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Moon,
  Smile,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import {
  exportToGoogleSheets,
  syncToGoogleCalendar,
  createGoogleDocReport,
  createGoogleTasksList
} from "../workspace";
import { UserProfile } from "../types";

interface DailyCheckInProps {
  log: DailyLog;
  profile: UserProfile;
  allLogs: DailyLog[];
  onSaveLog: (log: DailyLog) => void;
  onUpdateDay: (dayNumber: number) => void;
  accessToken: string;
  onLogout: () => void;
}

export default function DailyCheckIn({
  log,
  profile,
  allLogs,
  onSaveLog,
  onUpdateDay,
  accessToken,
  onLogout
}: DailyCheckInProps) {
  const phaseNum = getPhaseForDay(log.dayNumber);
  const config = PHASE_CONFIGS[phaseNum];

  // Local state for actions loading
  const [isExportingSheets, setIsExportingSheets] = useState(false);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);
  const [isCreatingTasks, setIsCreatingTasks] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleToggleLocal = (key: keyof DailyLog) => {
    const currentVal = log[key];
    let nextVal: "done" | "missed" | "pending" = "done";
    if (currentVal === "done") nextVal = "missed";
    else if (currentVal === "missed") nextVal = "pending";

    onSaveLog({
      ...log,
      [key]: nextVal
    });
  };

  const handleMetricChange = (key: keyof DailyLog, val: any) => {
    onSaveLog({
      ...log,
      [key]: val
    });
  };

  // Google Workspace actions
  const handleExportSheets = async () => {
    if (accessToken === "guest_token") {
      setErrorMessage("Google Sheets export is only available when signed in with a Google account. Please log out and sign in with Google (preferably in a standalone tab) to use Google Workspace integrations.");
      return;
    }
    setIsExportingSheets(true);
    setStatusMessage("Connecting to Google Sheets and exporting...");
    setErrorMessage("");
    try {
      const url = await exportToGoogleSheets(accessToken, profile, allLogs);
      setStatusMessage(`Successfully exported! Open your spreadsheet: ${url}`);
      window.open(url, "_blank");
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to export sheets");
      setStatusMessage("");
    } finally {
      setIsExportingSheets(false);
    }
  };

  const handleSyncCalendar = async () => {
    if (accessToken === "guest_token") {
      setErrorMessage("Google Calendar sync is only available when signed in with a Google account. Please log out and sign in with Google (preferably in a standalone tab) to use Google Workspace integrations.");
      return;
    }
    setIsSyncingCalendar(true);
    setStatusMessage("Creating Google Calendar events for the upcoming week...");
    setErrorMessage("");
    try {
      await syncToGoogleCalendar(accessToken, log.dayNumber, profile.startDate);
      setStatusMessage("Successfully synced morning practices, study windows, and evening practices to Google Calendar for the next 7 days!");
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to sync calendar");
      setStatusMessage("");
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  const handleCreateDoc = async () => {
    if (accessToken === "guest_token") {
      setErrorMessage("Google Docs report generation is only available when signed in with a Google account. Please log out and sign in with Google (preferably in a standalone tab) to use Google Workspace integrations.");
      return;
    }
    setIsCreatingDoc(true);
    setStatusMessage("Creating a comprehensive Google Doc report of your 90 days...");
    setErrorMessage("");
    try {
      const url = await createGoogleDocReport(accessToken, profile, allLogs);
      setStatusMessage(`Document created! View your progress report: ${url}`);
      window.open(url, "_blank");
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to create Google Doc");
      setStatusMessage("");
    } finally {
      setIsCreatingDoc(false);
    }
  };

  const handleCreateTasks = async () => {
    if (accessToken === "guest_token") {
      setErrorMessage("Google Tasks creation is only available when signed in with a Google account. Please log out and sign in with Google (preferably in a standalone tab) to use Google Workspace integrations.");
      return;
    }
    setIsCreatingTasks(true);
    setStatusMessage(`Creating Google Tasks daily checklist for Day ${log.dayNumber}...`);
    setErrorMessage("");
    try {
      await createGoogleTasksList(accessToken, log.dayNumber);
      setStatusMessage(`Day ${log.dayNumber} custom daily tasks loaded successfully in your Google Tasks!`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to create Google Tasks");
      setStatusMessage("");
    } finally {
      setIsCreatingTasks(false);
    }
  };

  // Quick state calculators
  const skyDone = log.morningSky === "done";
  const multivitaminDone = log.multivitamin === "done";
  const omega3DinnerDone = log.omega3Dinner === "done";
  const eveningDone = log.eveningPractice === "done";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 lg:p-8" id="daily-checkin-wrapper">
      {/* Top Profile Bar */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
        <div>
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
            Co-pilot challenge
          </span>
          <h2 className="text-xl font-bold text-slate-800">
            Welcome, {profile.displayName || "Warrior"}
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            Email: {profile.email} | Start Date: {profile.startDate}
          </span>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-100 hover:bg-rose-50 text-rose-600 text-xs font-semibold transition-colors"
          id="logout-btn"
        >
          <LogOut className="w-3.5 h-3.5" />
          Log Out
        </button>
      </div>

      {/* Day Navigator */}
      <div className="flex items-center justify-between bg-slate-50/80 rounded-xl p-4 mb-6 border border-slate-100">
        <button
          onClick={() => onUpdateDay(Math.max(1, log.dayNumber - 1))}
          disabled={log.dayNumber === 1}
          className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          id="prev-day-btn"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="text-center">
          <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block">
            Currently Viewing
          </span>
          <span className="text-2xl font-black text-slate-800 tracking-tight">
            Day {log.dayNumber} / 90
          </span>
          <span className="block text-xs font-semibold text-slate-500 mt-0.5">
            {config.title} ({config.days})
          </span>
        </div>

        <button
          onClick={() => onUpdateDay(Math.min(90, log.dayNumber + 1))}
          disabled={log.dayNumber === 90}
          className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          id="next-day-btn"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Notification Banner */}
      {statusMessage && (
        <div className="p-3 mb-6 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-xs flex items-center gap-2" id="workspace-success-banner">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="leading-relaxed font-medium">{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 mb-6 bg-rose-50 text-rose-800 border border-rose-100 rounded-xl text-xs flex items-center gap-2" id="workspace-error-banner">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="leading-relaxed font-medium">{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Specific Phase instructions & Checklist */}
        <div className="lg:col-span-7 space-y-6">
          <div className="border border-slate-100 rounded-xl p-5 bg-white shadow-3xs">
            <h3 className="flex items-center gap-2 font-bold text-slate-800 mb-4 text-sm">
              <Zap className="w-4 h-4 text-amber-500" />
              Day {log.dayNumber} Specific Guidelines
            </h3>
            
            <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed">
              <div className="flex gap-2">
                <span className="font-semibold text-slate-800">⏰ Rise Target:</span>
                <span>{config.wakeUp}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-slate-800">🧘 Morning Kriya:</span>
                <span>{config.skyPractice}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-slate-800">🍳 Breakfast Tablet:</span>
                <span>{config.multivitamin}</span>
              </div>
              {config.omega3Dinner && (
                <div className="flex gap-2">
                  <span className="font-semibold text-slate-800">🍽️ Dinner Capsule:</span>
                  <span>{config.omega3Dinner}</span>
                </div>
              )}
              <div className="flex gap-2">
                <span className="font-semibold text-slate-800">📚 Focus Blocks:</span>
                <span>{config.studyWindow}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-slate-800">🌙 Evening Breath:</span>
                <span>{config.eveningPractice}</span>
              </div>
            </div>
          </div>

          {/* Interactive Checkbox List */}
          <div>
            <h3 className="font-bold text-slate-800 mb-4 text-sm flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Action Habit Toggles
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="toggles-grid">
              {/* SKY Practice */}
              <button
                onClick={() => handleToggleLocal("morningSky")}
                className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                  skyDone
                    ? "bg-emerald-50/60 border-emerald-100 hover:bg-emerald-50"
                    : "bg-white border-slate-100 hover:border-slate-200"
                }`}
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Routine 1</span>
                  <span className="text-xs font-bold text-slate-700">Morning SKY Practice</span>
                </div>
                <span className={`text-xs font-extrabold uppercase px-2 py-1 rounded-full ${
                  skyDone ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                }`}>
                  {log.morningSky.toUpperCase()}
                </span>
              </button>

              {/* Multivitamin with Breakfast */}
              <button
                onClick={() => handleToggleLocal("multivitamin")}
                className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                  multivitaminDone
                    ? "bg-emerald-50/60 border-emerald-100 hover:bg-emerald-50"
                    : "bg-white border-slate-100 hover:border-slate-200"
                }`}
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Nutrition - Breakfast</span>
                  <span className="text-xs font-bold text-slate-700">Multivitamin Tablet</span>
                </div>
                <span className={`text-xs font-extrabold uppercase px-2 py-1 rounded-full ${
                  multivitaminDone ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                }`}>
                  {(log.multivitamin || "pending").toUpperCase()}
                </span>
              </button>

              {/* Omega 3 with Dinner */}
              <button
                onClick={() => handleToggleLocal("omega3Dinner")}
                className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                  omega3DinnerDone
                    ? "bg-emerald-50/60 border-emerald-100 hover:bg-emerald-50"
                    : "bg-white border-slate-100 hover:border-slate-200"
                }`}
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Nutrition - Dinner</span>
                  <span className="text-xs font-bold text-slate-700">Omega-3 Fish Oil</span>
                </div>
                <span className={`text-xs font-extrabold uppercase px-2 py-1 rounded-full ${
                  omega3DinnerDone ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                }`}>
                  {(log.omega3Dinner || "pending").toUpperCase()}
                </span>
              </button>

              {/* Evening Practice */}
              <button
                onClick={() => handleToggleLocal("eveningPractice")}
                className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                  eveningDone
                    ? "bg-emerald-50/60 border-emerald-100 hover:bg-emerald-50"
                    : "bg-white border-slate-100 hover:border-slate-200"
                }`}
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Routine 2</span>
                  <span className="text-xs font-bold text-slate-700">Evening Breathing</span>
                </div>
                <span className={`text-xs font-extrabold uppercase px-2 py-1 rounded-full ${
                  eveningDone ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                }`}>
                  {log.eveningPractice.toUpperCase()}
                </span>
              </button>
            </div>
          </div>

          {/* Month tracker checklist column items */}
          <div>
            <h3 className="font-bold text-slate-800 mb-4 text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Month Tracker Additional Study Habits
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="additional-toggles-grid">
              {/* Stillness Sitting */}
              <button
                onClick={() => handleToggleLocal("stillnessSitting")}
                className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                  log.stillnessSitting === "done"
                    ? "bg-indigo-50/60 border-indigo-100"
                    : "bg-white border-slate-100 hover:border-slate-200"
                }`}
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Mind</span>
                  <span className="text-xs font-bold text-slate-700">Stillness Sitting</span>
                </div>
                <span className={`text-xs font-extrabold uppercase px-2 py-1 rounded-full ${
                  log.stillnessSitting === "done" ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-400"
                }`}>
                  {log.stillnessSitting.toUpperCase()}
                </span>
              </button>

              {/* Deep Study */}
              <button
                onClick={() => handleToggleLocal("deepStudy")}
                className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                  log.deepStudy === "done"
                    ? "bg-indigo-50/60 border-indigo-100"
                    : "bg-white border-slate-100 hover:border-slate-200"
                }`}
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Intellect</span>
                  <span className="text-xs font-bold text-slate-700">Deep Study (11 Hours)</span>
                </div>
                <span className={`text-xs font-extrabold uppercase px-2 py-1 rounded-full ${
                  log.deepStudy === "done" ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-400"
                }`}>
                  {log.deepStudy.toUpperCase()}
                </span>
              </button>

              {/* No Mobile Hours */}
              <button
                onClick={() => handleToggleLocal("noMobileHours")}
                className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                  log.noMobileHours === "done"
                    ? "bg-indigo-50/60 border-indigo-100"
                    : "bg-white border-slate-100 hover:border-slate-200"
                }`}
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Control</span>
                  <span className="text-xs font-bold text-slate-700">No-Mobile Hours</span>
                </div>
                <span className={`text-xs font-extrabold uppercase px-2 py-1 rounded-full ${
                  log.noMobileHours === "done" ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-400"
                }`}>
                  {log.noMobileHours.toUpperCase()}
                </span>
              </button>

              {/* Revision */}
              <button
                onClick={() => handleToggleLocal("revision")}
                className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                  log.revision === "done"
                    ? "bg-indigo-50/60 border-indigo-100"
                    : "bg-white border-slate-100 hover:border-slate-200"
                }`}
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Recall</span>
                  <span className="text-xs font-bold text-slate-700">Revision Session</span>
                </div>
                <span className={`text-xs font-extrabold uppercase px-2 py-1 rounded-full ${
                  log.revision === "done" ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-400"
                }`}>
                  {log.revision.toUpperCase()}
                </span>
              </button>

              {/* Physical Exercise */}
              <button
                onClick={() => handleToggleLocal("exercise" as any)}
                className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                  (log as any).exercise === "done"
                    ? "bg-indigo-50/60 border-indigo-100"
                    : "bg-white border-slate-100 hover:border-slate-200"
                }`}
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Oxygenate</span>
                  <span className="text-xs font-bold text-slate-700">Exercise Workout</span>
                </div>
                <span className={`text-xs font-extrabold uppercase px-2 py-1 rounded-full ${
                  (log as any).exercise === "done" ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-400"
                }`}>
                  {((log as any).exercise || "pending").toUpperCase()}
                </span>
              </button>

              {/* Sleep over 7 hours */}
              <button
                onClick={() => handleToggleLocal("sleepOver7" as any)}
                className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                  (log as any).sleepOver7 === "done"
                    ? "bg-indigo-50/60 border-indigo-100"
                    : "bg-white border-slate-100 hover:border-slate-200"
                }`}
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Rejuvenate</span>
                  <span className="text-xs font-bold text-slate-700">Sleep &gt; 7 hrs</span>
                </div>
                <span className={`text-xs font-extrabold uppercase px-2 py-1 rounded-full ${
                  (log as any).sleepOver7 === "done" ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-400"
                }`}>
                  {((log as any).sleepOver7 || "pending").toUpperCase()}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Ratings & Inputs & Google integrations */}
        <div className="lg:col-span-5 space-y-6">
          {/* Mental Metrics Card */}
          <div className="border border-slate-100 rounded-xl p-5 bg-slate-50">
            <h3 className="font-bold text-slate-800 mb-4 text-xs uppercase tracking-wider flex items-center gap-1">
              🧠 Cognitive & Performance Metrics
            </h3>

            <div className="space-y-4">
              {/* Focus Level */}
              <div>
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  Daily Focus Rating (1-5)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={log.focusLevel || 3}
                    onChange={(e) => handleMetricChange("focusLevel", Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <span className="text-xs font-mono font-bold text-indigo-600 w-4">
                    {log.focusLevel || 3}
                  </span>
                </div>
              </div>

              {/* Sleep Quality */}
              <div>
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-1.5">
                  <Moon className="w-3.5 h-3.5 text-blue-500" />
                  Sleep Quality Rating (1-5)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={log.sleepQuality || 3}
                    onChange={(e) => handleMetricChange("sleepQuality", Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                  <span className="text-xs font-mono font-bold text-blue-600 w-4">
                    {log.sleepQuality || 3}
                  </span>
                </div>
              </div>

              {/* Mood */}
              <div>
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-1.5">
                  <Smile className="w-3.5 h-3.5 text-emerald-500" />
                  Mood Status (1-5)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={log.mood || 3}
                    onChange={(e) => handleMetricChange("mood", Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                  <span className="text-xs font-mono font-bold text-emerald-600 w-4">
                    {log.mood || 3}
                  </span>
                </div>
              </div>

              {/* Mock Test Score */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ✍️ Mock Test Score of the Day (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={log.mockTestScore >= 0 ? log.mockTestScore : ""}
                  onChange={(e) =>
                    handleMetricChange(
                      "mockTestScore",
                      e.target.value === "" ? -1 : Number(e.target.value)
                    )
                  }
                  placeholder="Enter percentage e.g., 75 (leave blank if none)"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ✍️ Today's Journal & Notes
                </label>
                <textarea
                  value={log.notes || ""}
                  onChange={(e) => handleMetricChange("notes", e.target.value)}
                  placeholder="How focused did you feel? Sleep notes..."
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 h-20 resize-none focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Google Workspace Integrations */}
          <div className="border border-indigo-100 rounded-xl p-5 bg-indigo-50/25">
            <h3 className="font-bold text-indigo-900 mb-3 text-xs uppercase tracking-wider flex items-center gap-1.5">
              🚀 Connected Workspace Integrations
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Export to Sheets */}
              <button
                onClick={handleExportSheets}
                disabled={isExportingSheets}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/25 text-slate-700 hover:text-emerald-700 text-center transition-all disabled:opacity-50"
                id="export-sheets-btn"
              >
                <FileSpreadsheet className="w-5 h-5 text-emerald-600 mb-1" />
                <span className="text-[10px] font-bold">Google Sheets</span>
                <span className="text-[8px] text-slate-400">Export Full 90 Days</span>
              </button>

              {/* Sync Calendar */}
              <button
                onClick={handleSyncCalendar}
                disabled={isSyncingCalendar}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50/25 text-slate-700 hover:text-amber-700 text-center transition-all disabled:opacity-50"
                id="sync-calendar-btn"
              >
                <Calendar className="w-5 h-5 text-amber-600 mb-1" />
                <span className="text-[10px] font-bold">Google Calendar</span>
                <span className="text-[8px] text-slate-400">Sync 7-Day Slots</span>
              </button>

              {/* Google Tasks Daily checklist */}
              <button
                onClick={handleCreateTasks}
                disabled={isCreatingTasks}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/25 text-slate-700 hover:text-indigo-700 text-center transition-all disabled:opacity-50"
                id="sync-tasks-btn"
              >
                <ListTodo className="w-5 h-5 text-indigo-600 mb-1" />
                <span className="text-[10px] font-bold">Google Tasks</span>
                <span className="text-[8px] text-slate-400">Load Daily Checklist</span>
              </button>

              {/* Progress Report */}
              <button
                onClick={handleCreateDoc}
                disabled={isCreatingDoc}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/25 text-slate-700 hover:text-blue-700 text-center transition-all disabled:opacity-50"
                id="export-docs-btn"
              >
                <FileText className="w-5 h-5 text-blue-600 mb-1" />
                <span className="text-[10px] font-bold">Google Docs</span>
                <span className="text-[8px] text-slate-400">Compile Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

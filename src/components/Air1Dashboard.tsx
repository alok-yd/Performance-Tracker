import { useState } from "react";
import { Award, Brain, Calendar, Flame, Sparkles, Smile, BookOpen, Clock, Activity, ShieldCheck, HeartPulse } from "lucide-react";
import { DailyLog, getPhaseForDay } from "../types";

interface Air1DashboardProps {
  logs: DailyLog[];
  currentDay: number;
}

export default function Air1Dashboard({ logs, currentDay }: Air1DashboardProps) {
  const [hoveredChartIndex, setHoveredChartIndex] = useState<number | null>(null);
  const [showBrainBreakdown, setShowBrainBreakdown] = useState(false);

  // 1. GATE Countdown (Assume Exam date is approx 1st weekend of February 2027)
  const gateDate = new Date("2027-02-06");
  const today = new Date();
  const diffTime = gateDate.getTime() - today.getTime();
  const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  // 2. Filter logs with actual data (where some habits are logged or notes written)
  const loggedLogs = logs.filter(l => l.wakeUpTime !== "" || l.notes !== "" || l.morningSky !== "pending" || l.multivitamin !== "pending" || l.omega3Dinner !== "pending");
  const totalLoggedDays = Math.max(1, loggedLogs.length);

  // Helper: Calculate daily habit score (0 - 100)
  const getHabitScore = (log: DailyLog) => {
    let score = 0;
    const items = [
      log.morningSky === "done",
      log.multivitamin === "done",
      log.omega3Dinner === "done",
      log.deepStudy === "done",
      log.eveningPractice === "done",
      (log as any).exercise === "done",
      (log as any).sleepOver7 === "done",
      log.stillnessSitting === "done",
      log.revision === "done",
      log.noMobileHours === "done"
    ];
    const completed = items.filter(Boolean).length;
    return Math.round((completed / items.length) * 100);
  };

  // 3. Streak Calculations
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // We sort logs ascending to calculate chronological streak
  const sortedLogs = [...logs].sort((a, b) => a.dayNumber - b.dayNumber);

  sortedLogs.forEach((log) => {
    // A day is a "success" if habit score is >= 50%
    const score = getHabitScore(log);
    const isSuccess = score >= 50;

    if (isSuccess) {
      tempStreak += 1;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else {
      // If day is past currentDay and still pending, don't break current streak yet
      if (log.dayNumber <= currentDay) {
        tempStreak = 0;
      }
    }
  });

  // Calculate current active streak ending at currentDay
  let activeStreak = 0;
  for (let d = currentDay; d >= 1; d--) {
    const log = sortedLogs.find(l => l.dayNumber === d);
    if (log && getHabitScore(log) >= 50) {
      activeStreak += 1;
    } else {
      break;
    }
  }
  currentStreak = activeStreak;

  // 4. Brain Health Score Calculation (Out of 100)
  // Formula: Sleep Quality (20%) + Meditation (20%) + Nutrition (20%) + Study Hours (20%) + Exercise (20%)
  const latestLog = logs.find(l => l.dayNumber === currentDay) || logs[0];
  
  const getBrainScoreDetails = (log: DailyLog) => {
    if (!log) {
      return {
        sleep: 12,
        meditation: 0,
        nutrition: 0,
        study: 0,
        exercise: 0,
        studyHours: 0,
        total: 12
      };
    }
    
    const sleep = (log.sleepQuality || 3) * 4; // Max 20
    const meditation = (log.meditationSessions && log.meditationSessions.length > 0) ? 20 : (log.eveningPractice === "done" ? 12 : 0);
    const nutrition = (log.multivitamin === "done" ? 10 : 0) + (log.omega3Dinner === "done" ? 10 : 0);
    
    // Study hours part
    let studyHours = 0;
    if (log.subjects) {
      studyHours = log.subjects.reduce((sum, s) => sum + s.hours, 0);
    } else if (log.deepStudy === "done") {
      studyHours = 11;
    }
    const study = Math.min(20, Math.round((studyHours / 11) * 20));

    // Exercise part
    const exercise = ((log as any).exercise === "done") ? 20 : 0;

    return {
      sleep,
      meditation,
      nutrition,
      study,
      exercise,
      studyHours,
      total: sleep + meditation + nutrition + study + exercise
    };
  };

  const brainScoreDetails = getBrainScoreDetails(latestLog);
  const currentBrainScore = brainScoreDetails.total;

  // 5. Cognitive Mood Correlations
  // Let's compute actual stats from all logs
  const sleepScores = loggedLogs.map(l => l.sleepQuality || 3);
  const focusScores = loggedLogs.map(l => l.focusLevel || 3);
  
  // Avg focus when sleep >= 4
  const highSleepLogs = loggedLogs.filter(l => (l.sleepQuality || 3) >= 4);
  const lowSleepLogs = loggedLogs.filter(l => (l.sleepQuality || 3) < 4);
  const avgFocusHighSleep = highSleepLogs.length > 0 
    ? (highSleepLogs.reduce((sum, l) => sum + (l.focusLevel || 3), 0) / highSleepLogs.length).toFixed(1)
    : "0.0";
  const avgFocusLowSleep = lowSleepLogs.length > 0 
    ? (lowSleepLogs.reduce((sum, l) => sum + (l.focusLevel || 3), 0) / lowSleepLogs.length).toFixed(1)
    : "0.0";

  // Focus when Kriya is completed vs missed
  const kriyaDoneLogs = loggedLogs.filter(l => l.morningSky === "done");
  const kriyaPendingLogs = loggedLogs.filter(l => l.morningSky !== "done");
  const avgFocusKriyaDone = kriyaDoneLogs.length > 0
    ? (kriyaDoneLogs.reduce((sum, l) => sum + (l.focusLevel || 3), 0) / kriyaDoneLogs.length).toFixed(1)
    : "0.0";
  const avgFocusKriyaPending = kriyaPendingLogs.length > 0
    ? (kriyaPendingLogs.reduce((sum, l) => sum + (l.focusLevel || 3), 0) / kriyaPendingLogs.length).toFixed(1)
    : "0.0";

  // 6. Achievement System Badges
  const badges = [
    {
      id: "sky-start",
      title: "Sudarshan Pioneer",
      description: "Log your first morning Sudarshan Kriya",
      icon: "🧘",
      unlocked: logs.some(l => l.morningSky === "done")
    },
    {
      id: "nutrition",
      title: "Neuro-Armor",
      description: "Log Multivitamin & Fish Oil simultaneously",
      icon: "💊",
      unlocked: logs.some(l => l.multivitamin === "done" && l.omega3Dinner === "done")
    },
    {
      id: "deep-study",
      title: "Focus Titan",
      description: "Log an 11-Hour focused deep study block",
      icon: "⚡",
      unlocked: logs.some(l => {
        const h = l.subjects?.reduce((sum, s) => sum + s.hours, 0) || 0;
        return h >= 11 || l.deepStudy === "done";
      })
    },
    {
      id: "calm-mind",
      title: "Zen Scholar",
      description: "Complete a custom sound meditation session",
      icon: "🌊",
      unlocked: logs.some(l => l.meditationSessions && l.meditationSessions.length > 0)
    },
    {
      id: "streak-badge",
      title: "Iron Will",
      description: "Maintain a 5-day streak of perfect habits",
      icon: "🔥",
      unlocked: longestStreak >= 5
    },
    {
      id: "halfway",
      title: "Phase 1 Conqueror",
      description: "Successfully log progress for 30 days",
      icon: "🏆",
      unlocked: loggedLogs.length >= 30
    }
  ];

  // 7. Get last 14 days for SVG Charts
  const chartDays = sortedLogs.slice(Math.max(0, currentDay - 14), currentDay);
  const chartData = chartDays.map((log) => {
    let studyHours = 0;
    if (log.subjects) {
      studyHours = log.subjects.reduce((sum, s) => sum + s.hours, 0);
    } else if (log.deepStudy === "done") {
      studyHours = 11;
    }
    return {
      day: log.dayNumber,
      studyHours,
      habitScore: getHabitScore(log),
      sleepQuality: log.sleepQuality || 3,
      mood: log.mood || 3
    };
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200" id="air1-dashboard-view">
      {/* 1. AIR-1 Target Header Block */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 border border-slate-800 shadow-lg">
        {/* Animated ambient mesh */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white px-2.5 py-1 rounded-md">
                MISSION CRITICAL
              </span>
              <span className="text-xs font-bold text-indigo-400">GATE 2027 AIR-1 ROADMAP</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight font-display">
              90-Day Peak Performance Cockpit
            </h2>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              Tracking cognitive variables, physical health, and study depth. You are training like a mental athlete to achieve the ultimate score.
            </p>
          </div>

          {/* Large Countdown Clock */}
          <div className="flex items-center gap-4 bg-slate-900/50 border border-slate-800 p-4 rounded-2xl shrink-0">
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">GATE 2027 Countdown</span>
              <span className="text-2xl font-black font-mono tracking-tight text-emerald-400">{diffDays}</span>
              <span className="text-[10px] text-slate-400 font-bold ml-1">Days Left</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Bento Grid Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="bento-stats-grid">
        {/* Streak Block */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center justify-between shadow-2xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Current Streak</span>
            <span className="text-3xl font-black font-mono text-slate-900">{currentStreak}</span>
            <span className="text-[10px] font-semibold text-slate-500 block">Consecutive Days</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl">
            <Flame className="w-6 h-6 fill-rose-500" />
          </div>
        </div>

        {/* Longest Streak Block */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center justify-between shadow-2xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Longest Streak</span>
            <span className="text-3xl font-black font-mono text-slate-900">{longestStreak}</span>
            <span className="text-[10px] font-semibold text-emerald-600 block">Record Holder</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Brain Health Score */}
        <div 
          onClick={() => setShowBrainBreakdown(!showBrainBreakdown)}
          className={`bg-white border border-slate-100 rounded-2xl p-5 flex flex-col justify-between shadow-2xs cursor-pointer select-none hover:border-indigo-300 hover:shadow-xs transition-all duration-200 ${showBrainBreakdown ? 'md:col-span-2 md:row-span-2' : ''}`}
        >
          <div className="flex items-center justify-between w-full">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Cognitive Brain Score</span>
              <span className="text-3xl font-black font-mono text-indigo-600">
                {currentBrainScore} <span className="text-xs text-slate-400">/100</span>
              </span>
              <span className="text-[9px] font-semibold text-indigo-500 block">
                {showBrainBreakdown ? "Click to collapse breakdown" : "Click to view 5-pillar breakdown"}
              </span>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl shrink-0">
              <Brain className="w-6 h-6" />
            </div>
          </div>

          {showBrainBreakdown && (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 text-[11px] animate-in slide-in-from-top-2 duration-200">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">5-Pillar Score Breakdown</p>
              
              <div className="space-y-1">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-semibold">💤 Sleep Quality (max 20)</span>
                  <span className="font-mono font-bold text-slate-800">{brainScoreDetails.sleep} pts</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full transition-all duration-300" style={{ width: `${(brainScoreDetails.sleep / 20) * 100}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-semibold">🧘 Meditation & Kriya (max 20)</span>
                  <span className="font-mono font-bold text-slate-800">{brainScoreDetails.meditation} pts</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-teal-500 h-full rounded-full transition-all duration-300" style={{ width: `${(brainScoreDetails.meditation / 20) * 100}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-semibold">💊 Nutrition & Supplements (max 20)</span>
                  <span className="font-mono font-bold text-slate-800">{brainScoreDetails.nutrition} pts</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full transition-all duration-300" style={{ width: `${(brainScoreDetails.nutrition / 20) * 100}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-semibold">📚 Study hours (max 20, target 11h)</span>
                  <span className="font-mono font-bold text-slate-800">{brainScoreDetails.study} pts <span className="text-[9px] text-slate-400">({brainScoreDetails.studyHours}h)</span></span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full transition-all duration-300" style={{ width: `${(brainScoreDetails.study / 20) * 100}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-semibold">🏃 Physical Exercise (max 20)</span>
                  <span className="font-mono font-bold text-slate-800">{brainScoreDetails.exercise} pts</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${(brainScoreDetails.exercise / 20) * 100}%` }} />
                </div>
              </div>

              <p className="text-[9px] text-center text-indigo-500 italic font-semibold mt-1">
                Optimized variables for peak exam day cognition!
              </p>
            </div>
          )}
        </div>

        {/* Active Completion Rate */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center justify-between shadow-2xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Success Rate</span>
            <span className="text-3xl font-black font-mono text-slate-900">
              {loggedLogs.length > 0 
                ? Math.round((loggedLogs.filter(l => getHabitScore(l) >= 50).length / loggedLogs.length) * 100)
                : 0}%
            </span>
            <span className="text-[10px] font-semibold text-teal-600 block">Days &gt;50% Habits</span>
          </div>
          <div className="p-3 bg-teal-50 text-teal-500 rounded-2xl">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="charts-container">
        {/* Chart 1: Study Hours vs Habit Score (SVG) */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-2xs">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-indigo-600" />
            Study hours & Habit score (Last {Math.max(1, chartData.length)} Days)
          </h3>

          {chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-slate-400 italic">
              Seeding logs or waiting for daily logs to generate progress trends.
            </div>
          ) : (
            <div className="relative pt-4">
              {/* Custom SVG Line Chart */}
              <svg viewBox="0 0 500 200" className="w-full h-48 overflow-visible">
                {/* Grid Lines */}
                <line x1="40" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="40" y1="70" x2="480" y2="70" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="40" y1="120" x2="480" y2="120" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="40" y1="170" x2="480" y2="170" stroke="#f8fafc" strokeWidth="1.5" />

                {/* Left Y-Axis Label (Study Hours Max 14) */}
                <text x="15" y="24" className="text-[8px] font-mono font-bold text-slate-400" fill="currentColor">14h</text>
                <text x="15" y="95" className="text-[8px] font-mono font-bold text-slate-400" fill="currentColor">7h</text>
                <text x="15" y="174" className="text-[8px] font-mono font-bold text-slate-400" fill="currentColor">0h</text>

                {/* Right Y-Axis Label (Habit Score Max 100) */}
                <text x="485" y="24" className="text-[8px] font-mono font-bold text-indigo-400" fill="currentColor">100%</text>
                <text x="485" y="95" className="text-[8px] font-mono font-bold text-indigo-400" fill="currentColor">50%</text>
                <text x="485" y="174" className="text-[8px] font-mono font-bold text-indigo-400" fill="currentColor">0%</text>

                {/* X-Axis labels & columns */}
                {chartData.map((d, idx) => {
                  const x = 40 + (440 / (chartData.length - 1 || 1)) * idx;
                  const studyY = 170 - (d.studyHours / 14) * 150;
                  const habitY = 170 - (d.habitScore / 100) * 150;

                  return (
                    <g key={d.day}>
                      {/* Hoverable indicator bar */}
                      <rect
                        x={x - 12}
                        y="10"
                        width="24"
                        height="165"
                        fill="transparent"
                        className="cursor-pointer hover:fill-indigo-50/10 transition-colors"
                        onMouseEnter={() => setHoveredChartIndex(idx)}
                        onMouseLeave={() => setHoveredChartIndex(null)}
                      />
                      
                      {/* Vertical grid line */}
                      <line x1={x} y1="20" x2={x} y2="170" stroke="#f8fafc" strokeDasharray="2" />
                      
                      {/* X label */}
                      <text x={x} y="185" className="text-[8px] font-mono font-bold text-slate-400 text-center" textAnchor="middle" fill="currentColor">
                        D{d.day}
                      </text>

                      {/* Line points */}
                      <circle cx={x} cy={studyY} r="3" fill="#10b981" />
                      <circle cx={x} cy={habitY} r="3" fill="#6366f1" />
                    </g>
                  );
                })}

                {/* Draw lines */}
                {chartData.length > 1 && (() => {
                  let studyPoints = "";
                  let habitPoints = "";
                  chartData.forEach((d, idx) => {
                    const x = 40 + (440 / (chartData.length - 1)) * idx;
                    const studyY = 170 - (d.studyHours / 14) * 150;
                    const habitY = 170 - (d.habitScore / 100) * 150;
                    studyPoints += `${x},${studyY} `;
                    habitPoints += `${x},${habitY} `;
                  });
                  return (
                    <>
                      <polyline points={studyPoints} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
                      <polyline points={habitPoints} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
                    </>
                  );
                })()}
              </svg>

              {/* Tooltip Overlay */}
              {hoveredChartIndex !== null && chartData[hoveredChartIndex] && (
                <div className="absolute top-0 left-12 bg-slate-900 text-white p-3 rounded-xl shadow-md border border-slate-800 text-[10px] space-y-1 z-20">
                  <p className="font-bold">Day {chartData[hoveredChartIndex].day}</p>
                  <p className="text-emerald-400">Study Depth: <span className="font-bold">{chartData[hoveredChartIndex].studyHours} hrs</span></p>
                  <p className="text-indigo-400">Habit Score: <span className="font-bold">{chartData[hoveredChartIndex].habitScore}%</span></p>
                </div>
              )}

              {/* Chart Legend */}
              <div className="flex items-center justify-center gap-6 mt-2 text-[10px] font-bold text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1 bg-emerald-500 rounded-full" />
                  <span>Study Depth (Hours)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1 bg-indigo-500 rounded-full" />
                  <span>Overall Habit Score (%)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chart 2: Mood & Sleep Quality Tracking (SVG) */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-2xs">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Smile className="w-4 h-4 text-emerald-600" />
            Sleep quality & Cognitive mood index
          </h3>

          {chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-slate-400 italic">
              Seeding logs or waiting for daily logs to generate mood trends.
            </div>
          ) : (
            <div className="relative pt-4">
              {/* Custom SVG Bar Chart */}
              <svg viewBox="0 0 500 200" className="w-full h-48 overflow-visible">
                {/* Grid Lines */}
                <line x1="40" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="40" y1="95" x2="480" y2="95" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="40" y1="170" x2="480" y2="170" stroke="#f8fafc" strokeWidth="1.5" />

                {/* Y-Axis Label (Ratings 1 to 5) */}
                <text x="15" y="24" className="text-[8px] font-mono font-bold text-slate-400" fill="currentColor">5.0</text>
                <text x="15" y="99" className="text-[8px] font-mono font-bold text-slate-400" fill="currentColor">2.5</text>
                <text x="15" y="174" className="text-[8px] font-mono font-bold text-slate-400" fill="currentColor">1.0</text>

                {/* Bars */}
                {chartData.map((d, idx) => {
                  const x = 40 + (440 / (chartData.length || 1)) * idx;
                  const barWidth = Math.max(4, 380 / (chartData.length * 2.5 || 1));
                  
                  // Map scale 1-5 to SVG height (0-150)
                  const sleepHeight = ((d.sleepQuality - 1) / 4) * 150;
                  const moodHeight = ((d.mood - 1) / 4) * 150;

                  return (
                    <g key={d.day}>
                      {/* Sleep Bar */}
                      <rect
                        x={x}
                        y={170 - sleepHeight}
                        width={barWidth}
                        height={sleepHeight}
                        fill="#3b82f6"
                        rx="1"
                        className="opacity-85"
                      />
                      {/* Mood Bar */}
                      <rect
                        x={x + barWidth + 2}
                        y={170 - moodHeight}
                        width={barWidth}
                        height={moodHeight}
                        fill="#10b981"
                        rx="1"
                        className="opacity-85"
                      />
                      {/* X label */}
                      <text x={x + barWidth} y="185" className="text-[8px] font-mono font-bold text-slate-400" textAnchor="middle" fill="currentColor">
                        D{d.day}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Chart Legend */}
              <div className="flex items-center justify-center gap-6 mt-2 text-[10px] font-bold text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-blue-500 rounded-md" />
                  <span>Sleep Rating (1-5)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-emerald-500 rounded-md" />
                  <span>Mood Rating (1-5)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Cognitive Correlations & Insights Block */}
      <div className="bg-indigo-50/40 border border-indigo-100 rounded-3xl p-6 shadow-2xs">
        <h3 className="font-bold text-indigo-900 text-xs uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <HeartPulse className="w-4 h-4 text-indigo-600 animate-pulse" />
          Active Cognitive Correlations & Insights
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-1.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase block">Sleep & Focus Connection</span>
            <p className="text-xs text-slate-700 leading-relaxed">
              When sleep quality is high (<strong>&ge;4/5</strong>), your average study focus rating is <strong className="text-indigo-600">{avgFocusHighSleep} / 5</strong>. 
              On days with lower sleep quality (&lt;4/5), it scales to <strong className="text-slate-500">{avgFocusLowSleep} / 5</strong>.
            </p>
            <span className="text-[9px] font-bold text-indigo-500 block">💡 Protect your melatonin by cutting screens 30 mins before sleep.</span>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-1.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase block">Kriya & Study Flow Coefficient</span>
            <p className="text-xs text-slate-700 leading-relaxed">
              When morning **Sudarshan Kriya** is ticked, study focus levels reach <strong className="text-emerald-600">{avgFocusKriyaDone} / 5</strong>, 
              compared to <strong className="text-slate-500">{avgFocusKriyaPending} / 5</strong> on pending/missed days.
            </p>
            <span className="text-[9px] font-bold text-emerald-600 block">💡 SKY increases alpha-wave amplitude, which directly boosts learning retention.</span>
          </div>
        </div>
      </div>

      {/* 5. Achievements Badge Room */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-2xs">
        <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-amber-500" />
          Badges & Achievements Earned
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-between gap-2.5 transition-all ${
                badge.unlocked
                  ? "bg-slate-50/50 border-slate-100 text-slate-800"
                  : "bg-slate-50/10 border-slate-100/60 text-slate-300 opacity-60"
              }`}
            >
              <div className="text-3xl filter saturate-[0.85]">{badge.unlocked ? badge.icon : "🔒"}</div>
              <div>
                <h4 className="text-[11px] font-bold leading-tight">{badge.title}</h4>
                <p className="text-[8px] text-slate-400 mt-0.5 leading-normal">{badge.description}</p>
              </div>
              <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                badge.unlocked ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-100 text-slate-400"
              }`}>
                {badge.unlocked ? "Unlocked" : "Locked"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

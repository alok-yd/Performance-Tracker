import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import {
  initAuth,
  googleSignIn,
  logout,
  getUserProfile,
  createUserProfile,
  getUserLogs,
  saveDailyLog,
  updateUserProfile
} from "./firebase";
import { DailyLog, UserProfile, getPhaseForDay } from "./types";
import DailyCheckIn from "./components/DailyCheckIn";
import TrackerGrid from "./components/TrackerGrid";
import WeeklySummary from "./components/WeeklySummary";
import RoadmapManual from "./components/RoadmapManual";
import CoachChat from "./components/CoachChat";
import Air1Dashboard from "./components/Air1Dashboard";
import MeditationTimer from "./components/MeditationTimer";
import StudyHoursTracker from "./components/StudyHoursTracker";
import ReflectionJournal from "./components/ReflectionJournal";
import {
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  Award,
  BookOpen,
  MessageSquare,
  Sparkles,
  Loader2,
  Brain,
  Zap,
  Check,
  CircleAlert,
  Flame,
  Clock,
  Heart
} from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [currentViewDay, setCurrentViewDay] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<"dashboard" | "checkin" | "grid" | "weekly" | "manual" | "coach" | "meditation" | "study" | "journal">("dashboard");
  const [authChecking, setAuthChecking] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [seedingLogs, setSeedingLogs] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Authenticate user on mount
  useEffect(() => {
    // Check if previously logged in as guest
    const isGuest = localStorage.getItem("kriya_is_guest") === "true";
    if (isGuest) {
      handleGuestLogin();
      setAuthChecking(false);
      return;
    }

    const unsubscribe = initAuth(
      async (firebaseUser, token) => {
        setUser(firebaseUser);
        setAccessToken(token);
        await loadUserData(firebaseUser.uid, firebaseUser.email || "", firebaseUser.displayName || "User");
        setAuthChecking(false);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setProfile(null);
        setLogs([]);
        setAuthChecking(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Handle Login
  const handleLogin = async () => {
    setAuthChecking(true);
    setLoginError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        await loadUserData(result.user.uid, result.user.email || "", result.user.displayName || "User");
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      let userFriendlyMsg = err.message || String(err);
      if (userFriendlyMsg.includes("popup-closed-by-user") || userFriendlyMsg.includes("popup_closed_by_user")) {
        userFriendlyMsg = "Google Sign-In popup was closed before completion. This usually occurs inside embedded iframes due to browser popup block policies or third-party cookie restrictions.";
      }
      setLoginError(userFriendlyMsg);
    } finally {
      setAuthChecking(false);
    }
  };

  // Handle Guest Login
  const handleGuestLogin = () => {
    const guestUid = "guest-user-90day";
    const guestEmail = "guest@example.com";
    const guestDisplayName = "Guest Practitioner";
    
    const guestUser = {
      uid: guestUid,
      email: guestEmail,
      displayName: guestDisplayName,
    } as any;

    setUser(guestUser);
    setAccessToken("guest_token");
    localStorage.setItem("kriya_is_guest", "true");

    // Load guest profile from localStorage or create new
    let savedProfile = localStorage.getItem("kriya_guest_profile");
    let guestProfile: UserProfile;
    if (savedProfile) {
      guestProfile = JSON.parse(savedProfile);
    } else {
      guestProfile = {
        uid: guestUid,
        email: guestEmail,
        displayName: guestDisplayName,
        currentDay: 1,
        startDate: new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString()
      };
      localStorage.setItem("kriya_guest_profile", JSON.stringify(guestProfile));
    }
    setProfile(guestProfile);
    setCurrentViewDay(guestProfile.currentDay || 1);

    // Load guest logs from localStorage or create seeded
    let savedLogs = localStorage.getItem("kriya_guest_logs");
    let guestLogs: DailyLog[] = [];
    if (savedLogs) {
      guestLogs = JSON.parse(savedLogs).map((log: any) => ({
        ...log,
        multivitamin: log.multivitamin || log.omega3Dose1 || "pending",
        omega3Dinner: log.omega3Dinner || log.omega3Dose2 || "pending"
      }));
    } else {
      const baseDate = new Date(guestProfile.startDate);
      for (let day = 1; day <= 90; day++) {
        const targetDate = new Date(baseDate);
        targetDate.setDate(baseDate.getDate() + (day - 1));
        const dateStr = targetDate.toISOString().split("T")[0];

        guestLogs.push({
          dayNumber: day,
          date: dateStr,
          wakeUpTime: "",
          morningSky: "pending",
          multivitamin: "pending",
          omega3Dinner: "pending",
          eveningPractice: "pending",
          stillnessSitting: "pending",
          deepStudy: "pending",
          noMobileHours: "pending",
          revision: "pending",
          focusLevel: 3,
          sleepQuality: 3,
          mood: 3,
          mockTestScore: -1,
          notes: ""
        });
      }
      localStorage.setItem("kriya_guest_logs", JSON.stringify(guestLogs));
    }
    setLogs(guestLogs);
  };

  // Handle Logout
  const handleLogout = async () => {
    localStorage.removeItem("kriya_is_guest");
    if (user?.uid === "guest-user-90day") {
      setUser(null);
      setAccessToken(null);
      setProfile(null);
      setLogs([]);
      return;
    }
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Helper: Load Profile and Logs from Firestore
  const loadUserData = async (uid: string, email: string, displayName: string) => {
    setLoadingLogs(true);
    try {
      let userProfile = await getUserProfile(uid);
      if (!userProfile) {
        userProfile = await createUserProfile(uid, email, displayName);
      }
      setProfile(userProfile);
      setCurrentViewDay(userProfile.currentDay || 1);

      // Fetch existing logs
      let userLogs = await getUserLogs(uid);
      
      // If no logs, seed 90 days of logs automatically in parallel
      if (userLogs.length === 0) {
        setSeedingLogs(true);
        const seededLogs: DailyLog[] = [];
        const baseDate = new Date(userProfile.startDate);

        for (let day = 1; day <= 90; day++) {
          const targetDate = new Date(baseDate);
          targetDate.setDate(baseDate.getDate() + (day - 1));
          const dateStr = targetDate.toISOString().split("T")[0];

          seededLogs.push({
            dayNumber: day,
            date: dateStr,
            wakeUpTime: "",
            morningSky: "pending",
            multivitamin: "pending",
            omega3Dinner: "pending",
            eveningPractice: "pending",
            stillnessSitting: "pending",
            deepStudy: "pending",
            noMobileHours: "pending",
            revision: "pending",
            focusLevel: 3,
            sleepQuality: 3,
            mood: 3,
            mockTestScore: -1,
            notes: ""
          });
        }

        // Parallel seed in Firestore to be extremely fast and efficient
        await Promise.all(seededLogs.map((log) => saveDailyLog(uid, log)));
        userLogs = seededLogs;
        setSeedingLogs(false);
      } else {
        // Map legacy logs to ensure new properties are populated
        userLogs = userLogs.map((log) => ({
          ...log,
          multivitamin: log.multivitamin || (log as any).omega3Dose1 || "pending",
          omega3Dinner: log.omega3Dinner || (log as any).omega3Dose2 || "pending"
        }));
      }

      setLogs(userLogs);
    } catch (err) {
      console.error("Error loading user data:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Save specific daily log (Updates Firestore + React State)
  const handleSaveLog = async (updatedLog: DailyLog) => {
    if (!user) return;
    const updatedLogs = logs.map((l) => (l.dayNumber === updatedLog.dayNumber ? updatedLog : l));
    setLogs(updatedLogs);

    if (user.uid === "guest-user-90day") {
      localStorage.setItem("kriya_guest_logs", JSON.stringify(updatedLogs));
      return;
    }

    try {
      await saveDailyLog(user.uid, updatedLog);
    } catch (err) {
      console.error("Error saving log to Firestore:", err);
    }
  };

  // Update viewing/active day in profile
  const handleUpdateActiveDay = async (dayNumber: number) => {
    if (!user || !profile) return;
    setCurrentViewDay(dayNumber);
    const updatedProfile = {
      ...profile,
      currentDay: dayNumber
    };
    setProfile(updatedProfile);

    if (user.uid === "guest-user-90day") {
      localStorage.setItem("kriya_guest_profile", JSON.stringify(updatedProfile));
      return;
    }

    try {
      await updateUserProfile(user.uid, { currentDay: dayNumber });
    } catch (err) {
      console.error("Error updating active day:", err);
    }
  };

  // Toggle habit cell helper for grid
  const handleToggleHabitGrid = async (dayNumber: number, habitKey: keyof DailyLog) => {
    const targetLog = logs.find((l) => l.dayNumber === dayNumber);
    if (!targetLog) return;

    const currentStatus = targetLog[habitKey] as "done" | "missed" | "pending";
    let nextStatus: "done" | "missed" | "pending" = "done";
    if (currentStatus === "done") nextStatus = "missed";
    else if (currentStatus === "missed") nextStatus = "pending";

    const updatedLog = {
      ...targetLog,
      [habitKey]: nextStatus
    };

    await handleSaveLog(updatedLog);
  };

  // Save notes inline from grid
  const handleUpdateNotesGrid = async (dayNumber: number, newNotes: string) => {
    const targetLog = logs.find((l) => l.dayNumber === dayNumber);
    if (!targetLog) return;

    const updatedLog = {
      ...targetLog,
      notes: newNotes
    };

    await handleSaveLog(updatedLog);
  };

  // Save metrics inline from grid
  const handleUpdateMetricsGrid = async (
    dayNumber: number,
    focus: number,
    sleep: number,
    score: number
  ) => {
    const targetLog = logs.find((l) => l.dayNumber === dayNumber);
    if (!targetLog) return;

    const updatedLog = {
      ...targetLog,
      focusLevel: focus,
      sleepQuality: sleep,
      mockTestScore: score
    };

    await handleSaveLog(updatedLog);
  };

  // Calculate current progress statistics
  const loggedDaysCount = logs.length;
  const completedSkyCount = logs.filter((l) => l.morningSky === "done").length;
  const currentWeek = Math.min(13, Math.ceil(currentViewDay / 7));

  // Loading Screens
  if (authChecking || seedingLogs) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6" id="app-loading-container">
        <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-xs flex flex-col items-center max-w-sm text-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
          <h2 className="text-sm font-bold text-slate-800">
            {seedingLogs ? "Seeding 90-Day Tracker Layout..." : "Synchronizing Authentication Cabin..."}
          </h2>
          <p className="text-xs text-slate-500 mt-2">
            {seedingLogs
              ? "Mapping all 90 calendar tracking slots to your account profile in Firestore. This ensures perfect real-time offline-first sync."
              : "Checking secure cookies and verifying workspace access scopes..."}
          </p>
        </div>
      </div>
    );
  }

  // Signed Out Landing View
  if (!user || !profile || !accessToken) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6" id="logged-out-view">
        <div className="max-w-4xl w-full bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left panel info */}
          <div className="lg:col-span-7 p-8 lg:p-12 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-8">
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl font-black text-xs uppercase font-display tracking-widest">
                  Roadmap
                </span>
                <span className="text-xs font-bold font-mono text-slate-400">90-Day System</span>
              </div>

              <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight font-display mb-4">
                90-Day Kriya & Omega-3 Tracker
              </h1>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                Supercharge your cognitive capability, sleep, and memory retention. Track daily morning Sudarshan Kriya (SKY), optimize Omega-3 dosing phases, and protect your 11-hour focused study blocks. Fully integrated with your personal Google Workspace calendar, spreadsheet planner, and checklists.
              </p>

              {/* Key Highlights */}
              <div className="space-y-4 mb-8">
                <div className="flex gap-3">
                  <div className="p-1 bg-teal-50 text-teal-600 rounded-lg shrink-0 h-7 w-7 flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Sudarshan Kriya Habits</h4>
                    <p className="text-[11px] text-slate-500">Ramp from 25 min foundation (Phase 1) up to peak advanced visualisations.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="p-1 bg-amber-50 text-amber-600 rounded-lg shrink-0 h-7 w-7 flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Omega-3 Dosing Phasing</h4>
                    <p className="text-[11px] text-slate-500">Ensure optimal brain EPA/DHA supplements along with memory boosters like Brahmi.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="p-1 bg-indigo-50 text-indigo-600 rounded-lg shrink-0 h-7 w-7 flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Workspace Connected</h4>
                    <p className="text-[11px] text-slate-500">Export progress to Sheets, calendar blocking slots, and Google Doc progress reports.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Sign-In options & popup block warnings */}
            <div className="space-y-4">
              {window.self !== window.top && !loginError && (
                <div className="p-4 bg-amber-50/75 border border-amber-200 text-amber-800 rounded-xl text-xs leading-relaxed space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <Zap className="w-4 h-4 shrink-0 text-amber-600 animate-pulse" />
                    <span>Embedded Preview Active (Iframe Mode)</span>
                  </div>
                  <p>
                    Browsers block sign-in popups inside embedded previews. To sign in with your Google account and sync with Google Workspace, click <strong>"Open in New Window"</strong>. Alternatively, you can use <strong>"Continue as Guest"</strong> below to start immediately!
                  </p>
                </div>
              )}

              {loginError && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs leading-relaxed space-y-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CircleAlert className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>Popup Blocker / Cookie Security Warning</span>
                  </div>
                  <p>{loginError}</p>
                  <p className="font-medium text-[11px] text-rose-700">
                    💡 <strong>Solution:</strong> Click the <strong>"Open in New Window"</strong> button below to open the application in a standalone tab. Google Sign-In will connect flawlessly there! Alternatively, choose <strong>"Continue as Guest (Local Mode)"</strong> to bypass login completely.
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleLogin}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold text-xs transition-all shadow-xs"
                  id="gsi-login-btn"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.47-.4-.73-.97-.84-1.59s-.04-1.28.15-1.89z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                  Sign In with Google
                </button>

                <a
                  href={window.location.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-xs transition-all border border-indigo-150"
                >
                  <Zap className="w-4 h-4 text-indigo-600" />
                  Open in New Window
                </a>
              </div>

              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <span className="text-[10px] text-slate-400 font-medium">
                  Have issues signing in with Google?
                </span>
                <button
                  onClick={handleGuestLogin}
                  className="inline-flex items-center justify-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-700 bg-teal-50/50 hover:bg-teal-50 px-3.5 py-2 rounded-lg transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
                  Continue as Guest (Local Mode)
                </button>
              </div>
            </div>
          </div>

          {/* Right decoration banner */}
          <div className="lg:col-span-5 bg-slate-900 text-white p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-l border-slate-800">
            <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-3xl" />
            
            <div className="relative z-10 space-y-6">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">
                Scientific Roadmap Specifications
              </span>
              
              <div className="border border-slate-800/60 rounded-xl p-4 bg-slate-950/40">
                <span className="text-[9px] font-bold uppercase text-teal-400 block mb-1">
                  Phase 1 (Days 1-30)
                </span>
                <span className="text-xs block font-bold">Foundation & Rhythm</span>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Wake-up 5:30 AM. 25-30 min SKY foundation. Omega-3 1g with fatty breakfast.
                </p>
              </div>

              <div className="border border-slate-800/60 rounded-xl p-4 bg-slate-950/40">
                <span className="text-[9px] font-bold uppercase text-amber-400 block mb-1">
                  Phase 2 (Days 31-60)
                </span>
                <span className="text-xs block font-bold">Deepening Capacity</span>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Wake-up 5:15 AM. Full 40-45 min SKY + meditation. 2g/day total Omega-3. Evening Yoga Nidra.
                </p>
              </div>

              <div className="border border-slate-800/60 rounded-xl p-4 bg-slate-950/40">
                <span className="text-[9px] font-bold uppercase text-rose-400 block mb-1">
                  Phase 3 (Days 61-90)
                </span>
                <span className="text-xs block font-bold">Peak Cognitive Flow</span>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Wake-up 5:00 AM. Advanced 50 min SKY + visualization. Add 300 mg Brahmi memory boost.
                </p>
              </div>
            </div>

            <div className="relative z-10 pt-8 border-t border-slate-800/80 text-[10px] text-slate-400">
              ⚡ Secure authentication provided via Google Firebase Identity Engine.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loaded Active Log
  const currentLog = logs.find((l) => l.dayNumber === currentViewDay) || {
    dayNumber: currentViewDay,
    date: new Date().toISOString().split("T")[0],
    wakeUpTime: "",
    morningSky: "pending" as const,
    omega3Dose1: "pending" as const,
    omega3Dose2: "pending" as const,
    eveningPractice: "pending" as const,
    stillnessSitting: "pending" as const,
    deepStudy: "pending" as const,
    noMobileHours: "pending" as const,
    revision: "pending" as const,
    focusLevel: 3,
    sleepQuality: 3,
    mood: 3,
    mockTestScore: -1,
    notes: ""
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" id="app-workspace-view">
      {/* Top Banner Header */}
      <header className="bg-slate-900 text-white py-4 px-6 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="p-1 bg-emerald-500 rounded-lg text-white font-black text-xs px-2 py-1">
              SKY
            </span>
            <div>
              <h1 className="text-base font-black tracking-tight font-display">
                90-Day Sudarshan Kriya + Omega-3 Roadmap
              </h1>
              <p className="text-[10px] text-slate-400">
                Dynamically tracking progress for cognitive elite routines
              </p>
            </div>
          </div>

          {/* Mini Statistics Bar */}
          <div className="flex items-center gap-6 text-xs text-slate-300">
            <div>
              <span className="text-slate-500 font-mono text-[9px] block uppercase">Current Progress</span>
              <span className="font-bold text-white">Day {currentViewDay} of 90</span>
            </div>
            <div>
              <span className="text-slate-500 font-mono text-[9px] block uppercase">Kriya Completion</span>
              <span className="font-bold text-teal-400">{completedSkyCount} / {loggedDaysCount} ticks</span>
            </div>
            <div>
              <span className="text-slate-500 font-mono text-[9px] block uppercase">Active Period</span>
              <span className="font-bold text-amber-400">Week {currentWeek} (Phase {getPhaseForDay(currentViewDay)})</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Navigation Sidebar */}
        <nav className="lg:col-span-3 space-y-2">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full text-left p-3.5 rounded-xl flex items-center gap-3 transition-all text-xs font-semibold ${
              activeTab === "dashboard"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-100"
            }`}
          >
            <Brain className="w-4 h-4 text-indigo-500" />
            🏆 AIR-1 Dashboard
          </button>

          <button
            onClick={() => setActiveTab("checkin")}
            className={`w-full text-left p-3.5 rounded-xl flex items-center gap-3 transition-all text-xs font-semibold ${
              activeTab === "checkin"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-100"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Daily Check-In
          </button>

          <button
            onClick={() => setActiveTab("meditation")}
            className={`w-full text-left p-3.5 rounded-xl flex items-center gap-3 transition-all text-xs font-semibold ${
              activeTab === "meditation"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-100"
            }`}
          >
            <Sparkles className="w-4 h-4 text-teal-500 animate-pulse" />
            🧘 Meditation Timer
          </button>

          <button
            onClick={() => setActiveTab("study")}
            className={`w-full text-left p-3.5 rounded-xl flex items-center gap-3 transition-all text-xs font-semibold ${
              activeTab === "study"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-100"
            }`}
          >
            <Clock className="w-4 h-4 text-amber-500" />
            📚 Study Hours Matrix
          </button>

          <button
            onClick={() => setActiveTab("journal")}
            className={`w-full text-left p-3.5 rounded-xl flex items-center gap-3 transition-all text-xs font-semibold ${
              activeTab === "journal"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-100"
            }`}
          >
            <Heart className="w-4 h-4 text-rose-500" />
            🌙 Reflection Journal
          </button>

          <button
            onClick={() => setActiveTab("grid")}
            className={`w-full text-left p-3.5 rounded-xl flex items-center gap-3 transition-all text-xs font-semibold ${
              activeTab === "grid"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-100"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-500" />
            90-Day Tracker Grid
          </button>

          <button
            onClick={() => setActiveTab("weekly")}
            className={`w-full text-left p-3.5 rounded-xl flex items-center gap-3 transition-all text-xs font-semibold ${
              activeTab === "weekly"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-100"
            }`}
          >
            <Award className="w-4 h-4 text-amber-500" />
            Weekly Progress Stats
          </button>

          <button
            onClick={() => setActiveTab("manual")}
            className={`w-full text-left p-3.5 rounded-xl flex items-center gap-3 transition-all text-xs font-semibold ${
              activeTab === "manual"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-100"
            }`}
          >
            <BookOpen className="w-4 h-4 text-blue-500" />
            Roadmap Manual & Rules
          </button>

          <button
            onClick={() => setActiveTab("coach")}
            className={`w-full text-left p-3.5 rounded-xl flex items-center gap-3 transition-all text-xs font-semibold ${
              activeTab === "coach"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-100"
            }`}
          >
            <MessageSquare className="w-4 h-4 text-purple-500" />
            AI Coach Console
          </button>

          {/* Helpful tips panel in sidebar */}
          <div className="bg-slate-900 text-slate-400 p-4 rounded-xl text-[10px] space-y-2 leading-relaxed border border-slate-800">
            <span className="font-bold text-white uppercase tracking-wider block text-[8px]">
              Daily Routine Wisdom
            </span>
            <p>
              "Never skip SKY. 25 minutes of morning SKY directly boosts GABA, calming anxiety levels and creating an impenetrable flow state for your exam preparation."
            </p>
          </div>
        </nav>

        {/* Right Side: Tab Workspace */}
        <section className="lg:col-span-9 space-y-6">
          {activeTab === "dashboard" && (
            <Air1Dashboard logs={logs} currentDay={currentViewDay} />
          )}

          {activeTab === "checkin" && (
            <DailyCheckIn
              log={currentLog}
              profile={profile}
              allLogs={logs}
              onSaveLog={handleSaveLog}
              onUpdateDay={handleUpdateActiveDay}
              accessToken={accessToken}
              onLogout={handleLogout}
            />
          )}

          {activeTab === "meditation" && (
            <MeditationTimer
              currentLog={currentLog}
              onSaveLog={handleSaveLog}
            />
          )}

          {activeTab === "study" && (
            <StudyHoursTracker
              currentLog={currentLog}
              allLogs={logs}
              onSaveLog={handleSaveLog}
            />
          )}

          {activeTab === "journal" && (
            <ReflectionJournal
              currentLog={currentLog}
              allLogs={logs}
              onSaveLog={handleSaveLog}
            />
          )}

          {activeTab === "grid" && (
            <TrackerGrid
              logs={logs}
              onToggleHabit={handleToggleHabitGrid}
              onUpdateNotes={handleUpdateNotesGrid}
              onUpdateMetrics={handleUpdateMetricsGrid}
              currentDay={currentViewDay}
            />
          )}

          {activeTab === "weekly" && <WeeklySummary logs={logs} />}

          {activeTab === "manual" && <RoadmapManual />}

          {activeTab === "coach" && <CoachChat logs={logs} profile={profile} />}
        </section>
      </main>

      {/* Clean elegant footer */}
      <footer className="bg-white border-t border-slate-100 py-6 px-4 mt-auto">
        <div className="max-w-7xl mx-auto text-center text-[10px] text-slate-400 font-mono">
          90-Day Sudarshan Kriya (SKY) + Omega-3 Habit Roadmap & Tracker Platform. Made with absolute focus.
        </div>
      </footer>
    </div>
  );
}

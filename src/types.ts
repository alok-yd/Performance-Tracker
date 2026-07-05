export type HabitStatus = "done" | "missed" | "pending";

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  currentDay: number; // 1 to 90
  startDate: string; // ISO string
  createdAt: string; // ISO string
}

export interface MeditationSession {
  duration: number; // minutes
  techniques: string[]; // "Sudarshan Kriya" | "Breath Meditation" | "Mantra Meditation"
  notes: string;
  timestamp: string;
}

export interface SubjectStudyLog {
  name: string; // e.g., "DSA", "OS", "DBMS", "CN", "Compiler", "Maths"
  hours: number;
  problems: number;
  revised: boolean;
  confidence: number; // 1 to 5 stars
}

export interface ReflectionJournal {
  whatWentWell: string;
  whatDistracted: string;
  whatToImprove: string;
  gratitude: string;
}

export interface DailyLog {
  dayNumber: number; // 1 to 90
  date: string; // YYYY-MM-DD
  wakeUpTime: string; // e.g. "05:30"
  morningSky: HabitStatus;
  multivitamin: HabitStatus;
  omega3Dinner: HabitStatus;
  eveningPractice: HabitStatus;
  // Month-tracker additional study habits
  stillnessSitting: HabitStatus;
  deepStudy: HabitStatus;
  noMobileHours: HabitStatus;
  revision: HabitStatus;
  // Focus & Health logs
  focusLevel: number; // 1 to 5
  sleepQuality: number; // 1 to 5
  mood: number; // 1 to 5
  mockTestScore: number; // e.g., 0-100 or -1 if not taken
  notes: string;
  // Upgrades for 90-Day Peak Performance Dashboard
  exercise?: HabitStatus;
  sleepOver7?: HabitStatus;
  meditationSessions?: MeditationSession[];
  subjects?: SubjectStudyLog[];
  reflection?: ReflectionJournal;
}

export interface PhaseDetails {
  title: string;
  days: string;
  wakeUp: string;
  skyPractice: string;
  rest: string;
  multivitamin: string;
  studyWindow: string;
  omega3Dinner: string;
  eveningPractice: string;
  sleepTarget: string;
  notes: string[];
}

export const PHASE_CONFIGS: Record<number, PhaseDetails> = {
  1: {
    title: "Phase 1 — Foundation",
    days: "Days 1–30",
    wakeUp: "5:30 AM",
    skyPractice: "25–30 min (Ujjayi → Bhastrika → So Hum → SKY cycles. Follow Art of Living guide or YouTube)",
    rest: "Savasana 10 min (mandatory)",
    multivitamin: "1 multivitamin tablet daily with breakfast. Sustains micro-nutrient balance.",
    studyWindow: "8:00 AM → 7:00 PM (Do NOT disturb this block)",
    omega3Dinner: "Week 1–2: 1 g EPA+DHA | Week 3–4: 2 g EPA+DHA. Take with dinner containing healthy fats.",
    eveningPractice: "7:15 PM — 15 min Nadi Shodhana (alternate nostril breathing). Calms study fatigue.",
    sleepTarget: "10:00 PM (7.5 hrs sleep)",
    notes: [
      "Choose IFOS 5-star certified Omega-3. Look for ≥500 mg EPA + ≥300 mg DHA per capsule.",
      "Even on tough study days — 25 min SKY in the morning is non-negotiable. It directly boosts GABA & focus for your 8 AM start.",
      "Always take your multivitamin with breakfast. Take your Omega-3 capsules strictly with dinner to enhance absorption and promote evening brain health."
    ]
  },
  2: {
    title: "Phase 2 — Deepening",
    days: "Days 31–60",
    wakeUp: "5:15 AM",
    skyPractice: "40–45 min (Full SKY + 3 rounds of each breath rhythm + 10 min meditation)",
    rest: "Savasana 10 min",
    multivitamin: "1 multivitamin tablet daily with breakfast.",
    studyWindow: "8:00 AM → 7:00 PM (Do NOT disturb this block)",
    omega3Dinner: "2 g EPA+DHA with dinner (IFOS-certified brand).",
    eveningPractice: "7:15 PM — 20 min Yoga Nidra (memory consolidation) + Nadi Shodhana.",
    sleepTarget: "10:00 PM (7.5 hrs sleep)",
    notes: [
      "Keep practicing consistently. Daily morning practice creates a massive compounding advantage for mental clarity.",
      "No screens 30 minutes before sleep. This protects melatonin — which SKY already helps produce, leading to deep restorative sleep."
    ]
  },
  3: {
    title: "Phase 3 — Peak",
    days: "Days 61–90",
    wakeUp: "5:00 AM",
    skyPractice: "45–50 min (Full advanced SKY + 15 min visualization: imagine acing GATE)",
    rest: "Savasana 10 min",
    multivitamin: "1 multivitamin tablet with breakfast + Brahmi (Bacopa monnieri) 300 mg.",
    studyWindow: "8:00 AM → 7:00 PM (Do NOT disturb this block)",
    omega3Dinner: "2 g EPA+DHA with dinner. Essential for recovery.",
    eveningPractice: "7:15 PM — 20 min Yoga Nidra (critical for recall before exam) + 10 min pranayama.",
    sleepTarget: "10:00 PM (7.5 hrs sleep)",
    notes: [
      "Brahmi: Take 300 mg Bacopa monnieri capsule once daily with breakfast from Day 61. Clinically proven to improve memory & learning speed.",
      "Exam-day SKY: Morning of GATE exam: shorter SKY (20 min). Take 1 g omega-3 with dinner the night before."
    ]
  }
};

export function getPhaseForDay(day: number): 1 | 2 | 3 {
  if (day <= 30) return 1;
  if (day <= 60) return 2;
  return 3;
}

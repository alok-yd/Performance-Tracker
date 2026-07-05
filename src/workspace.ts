import { DailyLog, UserProfile, PHASE_CONFIGS, getPhaseForDay } from "./types";

/**
 * Creates a beautiful Google Spreadsheet populated with the user's 90-day logs.
 */
export async function exportToGoogleSheets(
  accessToken: string,
  profile: UserProfile,
  logs: DailyLog[]
): Promise<string> {
  const confirmExport = window.confirm(
    "Export to Google Sheets: This will create a new Spreadsheet named '90-Day Kriya + Omega-3 Tracker' in your Google Drive and write your current logs. Proceed?"
  );
  if (!confirmExport) {
    throw new Error("Export cancelled by user");
  }

  // 1. Create the Spreadsheet
  const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      properties: {
        title: `90-Day Kriya + Omega-3 Tracker (${profile.displayName || "User"})`
      }
    })
  });

  if (!createRes.ok) {
    const err = await createRes.json();
    throw new Error(err.error?.message || "Failed to create Google Spreadsheet");
  }

  const spreadsheet = await createRes.json();
  const spreadsheetId = spreadsheet.spreadsheetId;
  const url = spreadsheet.spreadsheetUrl;

  // 2. Prepare the data matrix
  const headers = [
    "Day",
    "Date",
    "Phase",
    "Morning SKY (before 8 AM)",
    "Multivitamin Tablet (Breakfast)",
    "Omega-3 Fish Oil (Dinner)",
    "Evening Practice (after 7 PM)",
    "Stillness Sitting",
    "Deep Study",
    "No-Mobile Hours",
    "Revision",
    "Focus (1-5)",
    "Sleep Quality (1-5)",
    "Mood (1-5)",
    "Mock Test Score",
    "Notes / Observations"
  ];

  const rows = logs.map((log) => {
    const phaseNum = getPhaseForDay(log.dayNumber);
    const phaseStr = `Phase ${phaseNum}`;
    return [
      `Day ${log.dayNumber}`,
      log.date,
      phaseStr,
      (log.morningSky || "pending").toUpperCase(),
      (log.multivitamin || "pending").toUpperCase(),
      (log.omega3Dinner || "pending").toUpperCase(),
      (log.eveningPractice || "pending").toUpperCase(),
      (log.stillnessSitting || "pending").toUpperCase(),
      (log.deepStudy || "pending").toUpperCase(),
      (log.noMobileHours || "pending").toUpperCase(),
      (log.revision || "pending").toUpperCase(),
      log.focusLevel || "",
      log.sleepQuality || "",
      log.mood || "",
      log.mockTestScore >= 0 ? log.mockTestScore : "",
      log.notes || ""
    ];
  });

  const values = [headers, ...rows];

  // 3. Write data to sheet
  const writeRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:P100?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        values
      })
    }
  );

  if (!writeRes.ok) {
    const err = await writeRes.json();
    throw new Error(err.error?.message || "Failed to populate Spreadsheet data");
  }

  return url;
}

/**
 * Creates Google Calendar events for the upcoming week based on the roadmap phase.
 */
export async function syncToGoogleCalendar(
  accessToken: string,
  startDay: number,
  startDateStr: string
): Promise<void> {
  const confirmCal = window.confirm(
    `Add Calendar Events: This will add daily events (Morning Kriya, 11-hour Study Windows, and Evening Practices) for the next 7 days (Days ${startDay} to ${startDay + 6}) to your primary Google Calendar. Proceed?`
  );
  if (!confirmCal) {
    throw new Error("Calendar sync cancelled by user");
  }

  const baseDate = new Date(startDateStr);

  for (let i = 0; i < 7; i++) {
    const targetDay = startDay + i;
    if (targetDay > 90) break;

    const phaseNum = getPhaseForDay(targetDay);
    const config = PHASE_CONFIGS[phaseNum];

    // Compute calendar date
    const eventDate = new Date(baseDate);
    eventDate.setDate(baseDate.getDate() + (targetDay - 1));
    const dateISO = eventDate.toISOString().split("T")[0]; // YYYY-MM-DD

    // Set times depending on phase
    const skyTime = phaseNum === 1 ? "05:30" : phaseNum === 2 ? "05:15" : "05:00";
    const skyEnd = phaseNum === 1 ? "06:30" : phaseNum === 2 ? "06:15" : "06:00";

    const events = [
      {
        summary: `🌅 SKY Practice & Wake-up (Day ${targetDay})`,
        description: `Roadmap instruction:\n${config.skyPractice}\n\nRest after SKY:\n${config.rest}`,
        start: { dateTime: `${dateISO}T${skyTime}:00`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
        end: { dateTime: `${dateISO}T${skyEnd}:00`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
      },
      {
        summary: `📚 STUDY WINDOW (Day ${targetDay})`,
        description: "DO NOT DISTURB block. Keep fully focused on your preparation.",
        start: { dateTime: `${dateISO}T08:00:00`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
        end: { dateTime: `${dateISO}T19:00:00`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
        colorId: "5" // Yellow / amber for study window
      },
      {
        summary: `🧘 Evening Practice (Day ${targetDay})`,
        description: `Roadmap instruction:\n${config.eveningPractice}`,
        start: { dateTime: `${dateISO}T19:15:00`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
        end: { dateTime: `${dateISO}T19:45:00`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
        colorId: "2" // Greenish / teal for breathing practices
      }
    ];

    for (const ev of events) {
      await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(ev)
      });
    }
  }
}

/**
 * Creates a Google Doc summary report of the user's progress.
 */
export async function createGoogleDocReport(
  accessToken: string,
  profile: UserProfile,
  logs: DailyLog[]
): Promise<string> {
  const confirmDoc = window.confirm(
    "Export Progress Report to Google Docs: This will compile a full summary document of your completed habits, notes, and performance stats. Proceed?"
  );
  if (!confirmDoc) {
    throw new Error("Document creation cancelled by user");
  }

  // 1. Create the Doc
  const createRes = await fetch("https://docs.googleapis.com/v1/documents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title: `90-Day Kriya & Omega-3 Roadmap Report - ${profile.displayName || "User"}`
    })
  });

  if (!createRes.ok) {
    const err = await createRes.json();
    throw new Error(err.error?.message || "Failed to create Google Doc");
  }

  const document = await createRes.json();
  const documentId = document.documentId;
  const docUrl = `https://docs.google.com/document/d/${documentId}/edit`;

  // 2. Compute summaries
  const totalDaysLogged = logs.length;
  const skyDone = logs.filter((l) => l.morningSky === "done").length;
  const multivitaminDone = logs.filter((l) => l.multivitamin === "done").length;
  const omegaDinnerDone = logs.filter((l) => l.omega3Dinner === "done").length;
  const eveningDone = logs.filter((l) => l.eveningPractice === "done").length;

  const avgFocus = logs.filter((l) => l.focusLevel > 0).reduce((acc, curr) => acc + curr.focusLevel, 0) / (logs.filter((l) => l.focusLevel > 0).length || 1);
  const avgSleep = logs.filter((l) => l.sleepQuality > 0).reduce((acc, curr) => acc + curr.sleepQuality, 0) / (logs.filter((l) => l.sleepQuality > 0).length || 1);

  // Compile full notes
  const notesText = logs
    .filter((l) => l.notes)
    .map((l) => `Day ${l.dayNumber} (${l.date}): ${l.notes}`)
    .join("\n\n");

  const reportBody = `
=========================================
90-DAY KRIYA + OMEGA-3 TRACKER REPORT
=========================================
Generated on: ${new Date().toLocaleDateString()}
User: ${profile.displayName || "User"} (${profile.email})
Current Challenge Day: Day ${profile.currentDay} / 90

STATISTICS OVERVIEW:
-------------------
Total Days Tracked: ${totalDaysLogged} days
Morning SKY Practice: ${skyDone} / ${totalDaysLogged} days completed
Multivitamin (Breakfast): ${multivitaminDone} / ${totalDaysLogged} days completed
Omega-3 Capsules (Dinner): ${omegaDinnerDone} / ${totalDaysLogged} days completed
Evening Practice: ${eveningDone} / ${totalDaysLogged} days completed

COGNITIVE METRICS:
-----------------
Average Focus Rating: ${avgFocus.toFixed(1)} / 5
Average Sleep Quality: ${avgSleep.toFixed(1)} / 5

USER CHRONICLE / DAILY NOTES:
----------------------------
${notesText || "No notes logged yet."}

=========================================
Keep breathing, keep studying, keep rising!
=========================================
  `;

  // Write content to Google Doc using BatchUpdate
  const writeRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            text: reportBody,
            location: { index: 1 }
          }
        }
      ]
    })
  });

  if (!writeRes.ok) {
    const err = await writeRes.json();
    throw new Error(err.error?.message || "Failed to write content to Google Doc");
  }

  return docUrl;
}

/**
 * Creates a beautiful Google Task checklist for the user's daily tracker.
 */
export async function createGoogleTasksList(
  accessToken: string,
  dayNumber: number
): Promise<void> {
  const confirmTasks = window.confirm(
    `Create Daily Checklist: This will create a new Task List named '90-Day Challenge - Day ${dayNumber}' in Google Tasks containing your specific roadmap checklist items. Proceed?`
  );
  if (!confirmTasks) {
    throw new Error("Task creation cancelled by user");
  }

  // 1. Create a tasklist
  const listRes = await fetch("https://tasks.googleapis.com/tasks/v1/users/@default/tasklists", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title: `90-Day Challenge - Day ${dayNumber}`
    })
  });

  if (!listRes.ok) {
    const err = await listRes.json();
    throw new Error(err.error?.message || "Failed to create Google Task List");
  }

  const tasklist = await listRes.json();
  const tasklistId = tasklist.id;

  // 2. Create individual tasks corresponding to the specific day's roadmap
  const phaseNum = getPhaseForDay(dayNumber);
  const config = PHASE_CONFIGS[phaseNum];

  const tasks = [
    { title: `⏰ Wake up early - Target ${config.wakeUp}` },
    { title: `🌅 Morning SKY Practice (${config.skyPractice})` },
    { title: `🍳 Take Multivitamin Tablet with Breakfast (${config.multivitamin})` },
    { title: "📚 Enter 11-Hour STUDY WINDOW (8:00 AM → 7:00 PM)" },
    { title: `🍽️ Take Omega-3 Capsules with Dinner (${config.omega3Dinner})` },
    { title: `🧘 Evening Practice after 7 PM (${config.eveningPractice})` },
    { title: "📵 No screens 30 minutes before sleep (10:00 PM Target)" }
  ];

  for (const t of tasks) {
    await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${tasklistId}/tasks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(t)
    });
  }
}

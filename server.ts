import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini client on backend
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Route: Standard Gemini 3.5 Chat for daily tips & quick coaching (AI Coach 2.0)
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { message, history, logs, profile } = req.body;
      const formattedHistory = (history || []).map((h: any) => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.text || h.message }]
      }));

      let dataContext = "";
      if (logs && logs.length > 0) {
        const kriyaCount = logs.filter((l: any) => l.morningSky === "done").length;
        const multiCount = logs.filter((l: any) => l.multivitamin === "done").length;
        const omegaCount = logs.filter((l: any) => l.omega3Dinner === "done").length;
        const studyLogs = logs.filter((l: any) => l.subjects && l.subjects.length > 0);
        
        let studyStats = "";
        if (studyLogs.length > 0) {
          const subjectHours: Record<string, number> = {};
          const subjectConfidence: Record<string, { sum: number; count: number }> = {};
          studyLogs.forEach((l: any) => {
            (l.subjects || []).forEach((s: any) => {
              subjectHours[s.name] = (subjectHours[s.name] || 0) + (s.hours || 0);
              if (!subjectConfidence[s.name]) subjectConfidence[s.name] = { sum: 0, count: 0 };
              subjectConfidence[s.name].sum += (s.confidence || 3);
              subjectConfidence[s.name].count += 1;
            });
          });
          studyStats = Object.entries(subjectHours)
            .map(([sub, hrs]) => {
              const conf = subjectConfidence[sub];
              const avgConf = conf ? (conf.sum / conf.count).toFixed(1) : "3.0";
              return `- ${sub}: ${hrs} hours total, avg confidence ${avgConf} stars`;
            })
            .join("\n");
        }

        const latestLog = logs.find((l: any) => l.dayNumber === (profile?.currentDay || 1)) || logs[logs.length - 1] || {};
        dataContext = `\n\n[STUDENT TRACKING STATS - AI COACH 2.0 CONTEXT]
Current Day: Day ${profile?.currentDay || 1} of 90
Sudarshan Kriya Completed: ${kriyaCount} / ${logs.length} days
Multivitamin Logged: ${multiCount} / ${logs.length} days
Omega-3 Logged: ${omegaCount} / ${logs.length} days
Latest Day Focus Level: ${latestLog.focusLevel || 3}/5, Sleep Quality: ${latestLog.sleepQuality || 3}/5, Mood: ${latestLog.mood || 3}/5
Latest Journal Entry: "${latestLog.notes || ""}"
Subject Study Breakdown:
${studyStats || "No subject studies logged yet."}`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [...formattedHistory, { role: "user", parts: [{ text: message }] }],
        config: {
          systemInstruction: "You are a warm, wise, and helpful Coach for the 90-Day Sudarshan Kriya (SKY) + Omega-3 Roadmap. Your goal is to help users maintain their study window, build daily habits, and optimize focus. Be concise, practical, and highly encouraging. Use the following dynamic student context to give highly customized advice, citing specific subject confidences or habit gaps: " + dataContext,
        }
      });
      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini Chat Error:", error);
      res.status(500).json({ error: error.message || "An error occurred with Gemini" });
    }
  });

  // API Route: Deep thinking coach using gemini-3.1-pro-preview with HIGH thinking level (AI Coach 2.0)
  app.post("/api/gemini/deep-coach", async (req, res) => {
    try {
      const { message, history, logs, profile } = req.body;
      const formattedHistory = (history || []).map((h: any) => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.text || h.message }]
      }));

      let dataContext = "";
      if (logs && logs.length > 0) {
        const kriyaCount = logs.filter((l: any) => l.morningSky === "done").length;
        const multiCount = logs.filter((l: any) => l.multivitamin === "done").length;
        const omegaCount = logs.filter((l: any) => l.omega3Dinner === "done").length;
        const studyLogs = logs.filter((l: any) => l.subjects && l.subjects.length > 0);
        
        let studyStats = "";
        if (studyLogs.length > 0) {
          const subjectHours: Record<string, number> = {};
          const subjectConfidence: Record<string, { sum: number; count: number }> = {};
          studyLogs.forEach((l: any) => {
            (l.subjects || []).forEach((s: any) => {
              subjectHours[s.name] = (subjectHours[s.name] || 0) + (s.hours || 0);
              if (!subjectConfidence[s.name]) subjectConfidence[s.name] = { sum: 0, count: 0 };
              subjectConfidence[s.name].sum += (s.confidence || 3);
              subjectConfidence[s.name].count += 1;
            });
          });
          studyStats = Object.entries(subjectHours)
            .map(([sub, hrs]) => {
              const conf = subjectConfidence[sub];
              const avgConf = conf ? (conf.sum / conf.count).toFixed(1) : "3.0";
              return `- ${sub}: ${hrs} hours total, avg confidence ${avgConf} stars`;
            })
            .join("\n");
        }

        const latestLog = logs.find((l: any) => l.dayNumber === (profile?.currentDay || 1)) || logs[logs.length - 1] || {};
        dataContext = `\n\n[STUDENT TRACKING STATS - AI COACH 2.0 CONTEXT]
Current Day: Day ${profile?.currentDay || 1} of 90
Sudarshan Kriya Completed: ${kriyaCount} / ${logs.length} days
Multivitamin Logged: ${multiCount} / ${logs.length} days
Omega-3 Logged: ${omegaCount} / ${logs.length} days
Latest Day Focus Level: ${latestLog.focusLevel || 3}/5, Sleep Quality: ${latestLog.sleepQuality || 3}/5, Mood: ${latestLog.mood || 3}/5
Latest Journal Entry: "${latestLog.notes || ""}"
Subject Study Breakdown:
${studyStats || "No subject studies logged yet."}`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [...formattedHistory, { role: "user", parts: [{ text: message }] }],
        config: {
          systemInstruction: "You are a High-Thinking AI Executive Coach for the 90-Day GATE AIR-1 Roadmap. You specialize in analyzing cognitive routines, circadian planning, habit formation, study endurance, and holistic wellness (incorporating Sudarshan Kriya and Omega-3). Analyze the user's dilemma with rigorous scientific reasoning, extreme thoroughness, and practical schedules. Always refer to their actual logs and performance statistics below, pointing out correlations (e.g. how many morning Kriyas are completed, or which subjects have low confidence stars): " + dataContext,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH
          }
        }
      });
      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini Deep Coach Error:", error);
      res.status(500).json({ error: error.message || "An error occurred with Gemini Deep Coach" });
    }
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

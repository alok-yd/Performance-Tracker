import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize2, Minimize2, Check, Sparkles, Award } from "lucide-react";
import { DailyLog } from "../types";

interface MeditationTimerProps {
  currentLog: DailyLog;
  onSaveLog: (log: DailyLog) => void;
}

export default function MeditationTimer({ currentLog, onSaveLog }: MeditationTimerProps) {
  const [timeLeft, setTimeLeft] = useState(1200); // Default 20 mins (1200 seconds)
  const [duration, setDuration] = useState(1200); // Saved start duration
  const [customMinutes, setCustomMinutes] = useState("20");
  const [isRunning, setIsRunning] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedSound, setSelectedSound] = useState<"silence" | "rain" | "forest" | "om">("silence");
  const [soundVolume, setSoundVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);

  // Post meditation logging state
  const [showLogModal, setShowLogModal] = useState(false);
  const [techniques, setTechniques] = useState({
    kriya: false,
    breath: false,
    mantra: false
  });
  const [notes, setNotes] = useState("");

  // Refs for Web Audio synthesizer
  const audioContextRef = useRef<AudioContext | null>(null);
  const ambientNodeRef = useRef<AudioNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Web Audio
  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  // Synthesize Bell
  const playGoldenBell = () => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      
      // Multi-harmonic bell synth
      const frequencies = [220, 330, 440, 543, 650, 770, 1100];
      const gains = [1.0, 0.6, 0.4, 0.3, 0.25, 0.2, 0.1];

      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const amp = ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);
        
        // Bell decay curve
        amp.gain.setValueAtTime(gains[idx] * 0.3, now);
        amp.gain.exponentialRampToValueAtTime(0.0001, now + 8); // Long 8s decay

        osc.connect(amp);
        amp.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 8.5);
      });
    } catch (err) {
      console.error("Failed to play bell:", err);
    }
  };

  // Synthesize Om Sound
  const startOmNode = (ctx: AudioContext): AudioNode => {
    const carrier = ctx.createOscillator();
    const modulator = ctx.createOscillator();
    const modGain = ctx.createGain();
    const mainGain = ctx.createGain();

    // 136.1 Hz Om Cosmic Frequency
    carrier.frequency.setValueAtTime(136.1, ctx.currentTime);
    carrier.type = "sawtooth";

    // Modulator for warm chorus effect
    modulator.frequency.setValueAtTime(6.0, ctx.currentTime);
    modGain.gain.setValueAtTime(1.5, ctx.currentTime);

    // Filter to make it a deep, soothing hum
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(150, ctx.currentTime);

    modulator.connect(modGain);
    modGain.connect(carrier.frequency);
    carrier.connect(filter);
    filter.connect(mainGain);

    carrier.start();
    modulator.start();

    // Store references for cleanup
    (mainGain as any).stopNode = () => {
      carrier.stop();
      modulator.stop();
    };

    return mainGain;
  };

  // Synthesize Rain Sound
  const startRainNode = (ctx: AudioContext): AudioNode => {
    // Generate 2 seconds of White Noise
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter for roaring ambient rain
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    filter.Q.setValueAtTime(1.2, ctx.currentTime);

    // Warm base low filter
    const lowFilter = ctx.createBiquadFilter();
    lowFilter.type = "lowpass";
    lowFilter.frequency.setValueAtTime(400, ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(lowFilter);

    whiteNoise.start();

    (lowFilter as any).stopNode = () => {
      whiteNoise.stop();
    };

    return lowFilter;
  };

  // Synthesize Forest Sound (Wind + Birds)
  const startForestNode = (ctx: AudioContext): AudioNode => {
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    // Slow wind filter sweep
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(300, ctx.currentTime);

    // Dynamic sweep interval
    let sweepDir = 1;
    let freq = 300;
    const sweepInterval = setInterval(() => {
      if (!audioContextRef.current || audioContextRef.current.state === "suspended") return;
      freq += sweepDir * 8;
      if (freq > 450) sweepDir = -1;
      if (freq < 200) sweepDir = 1;
      try {
        filter.frequency.setValueAtTime(freq, ctx.currentTime);
      } catch {}
    }, 100);

    noise.connect(filter);
    noise.start();

    (filter as any).stopNode = () => {
      noise.stop();
      clearInterval(sweepInterval);
    };

    return filter;
  };

  // Update sound state
  useEffect(() => {
    if (isRunning && selectedSound !== "silence") {
      try {
        const ctx = getAudioContext();
        
        // Stop current sound
        if (ambientNodeRef.current) {
          try { (ambientNodeRef.current as any).stopNode?.(); } catch {}
          ambientNodeRef.current.disconnect();
          ambientNodeRef.current = null;
        }

        // Setup output gain node
        if (!gainNodeRef.current) {
          gainNodeRef.current = ctx.createGain();
          gainNodeRef.current.connect(ctx.destination);
        }
        gainNodeRef.current.gain.setValueAtTime(isMuted ? 0 : soundVolume * 0.15, ctx.currentTime);

        // Start new synthesizer node
        let node: AudioNode | null = null;
        if (selectedSound === "om") {
          node = startOmNode(ctx);
        } else if (selectedSound === "rain") {
          node = startRainNode(ctx);
        } else if (selectedSound === "forest") {
          node = startForestNode(ctx);
        }

        if (node) {
          node.connect(gainNodeRef.current);
          ambientNodeRef.current = node;
        }
      } catch (err) {
        console.error("Failed to start sound synthesis:", err);
      }
    } else {
      // Pause or silence
      if (ambientNodeRef.current) {
        try { (ambientNodeRef.current as any).stopNode?.(); } catch {}
        ambientNodeRef.current.disconnect();
        ambientNodeRef.current = null;
      }
    }

    return () => {
      if (ambientNodeRef.current) {
        try { (ambientNodeRef.current as any).stopNode?.(); } catch {}
        ambientNodeRef.current.disconnect();
        ambientNodeRef.current = null;
      }
    };
  }, [selectedSound, isRunning, isMuted]);

  // Adjust volume
  useEffect(() => {
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setValueAtTime(isMuted ? 0 : soundVolume * 0.15, audioContextRef.current.currentTime);
    }
  }, [soundVolume, isMuted]);

  // Handle Timer ticking
  useEffect(() => {
    if (isRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            playGoldenBell();
            setShowLogModal(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isRunning]);

  const togglePlay = () => {
    getAudioContext(); // Resume/start ctx
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(duration);
  };

  const setPreset = (mins: number) => {
    setIsRunning(false);
    const secs = mins * 60;
    setDuration(secs);
    setTimeLeft(secs);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseFloat(customMinutes);
    if (!isNaN(mins) && mins > 0) {
      setPreset(mins);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Log session to DailyLog
  const handleSaveSession = () => {
    const minutesCompleted = Math.round((duration - timeLeft) / 60);
    if (minutesCompleted <= 0) {
      setShowLogModal(false);
      return;
    }

    // Prepare session payload
    const newSession = {
      duration: minutesCompleted,
      techniques: Object.entries(techniques)
        .filter(([_, checked]) => checked)
        .map(([name]) => {
          if (name === "kriya") return "Sudarshan Kriya";
          if (name === "breath") return "Breath Meditation";
          return "Mantra Meditation";
        }),
      notes: notes,
      timestamp: new Date().toISOString()
    };

    const currentSessions = currentLog.meditationSessions || [];
    const updatedSessions = [...currentSessions, newSession];

    // Auto-complete morningSky or eveningPractice if they checked corresponding techniques
    let updateProps: Partial<DailyLog> = {
      meditationSessions: updatedSessions
    };

    if (techniques.kriya) {
      updateProps.morningSky = "done";
    }
    if (techniques.breath || techniques.mantra) {
      updateProps.eveningPractice = "done";
    }

    onSaveLog({
      ...currentLog,
      ...updateProps
    });

    // Reset logging modal
    setShowLogModal(false);
    setNotes("");
    setTechniques({ kriya: false, breath: false, mantra: false });
    setTimeLeft(duration);
  };

  return (
    <div className={`space-y-6 ${isFullScreen ? "fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-center items-center p-8 transition-all" : ""}`} id="meditation-timer-tab">
      {/* Top Banner */}
      {!isFullScreen && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              🧘 Daily Meditation & Breath Haven
            </h2>
            <p className="text-xs text-slate-500">
              Calm study fatigue, trigger melatonin production, and enhance focus through sound-guided intervals.
            </p>
          </div>
          <button
            onClick={() => setIsFullScreen(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-all border border-slate-200"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Full Screen
          </button>
        </div>
      )}

      {/* Main Timer Display */}
      <div className={`w-full max-w-2xl mx-auto rounded-3xl border flex flex-col items-center p-8 relative overflow-hidden transition-all ${
        isFullScreen 
          ? "bg-slate-900/60 border-slate-800 shadow-2xl text-white" 
          : "bg-white border-slate-100 shadow-xs text-slate-800"
      }`}>
        {/* Subtle breathing ripple backdrops */}
        {isRunning && (
          <div className="absolute inset-0 flex items-center justify-center -z-10 pointer-events-none">
            <div className="w-64 h-64 rounded-full bg-indigo-500/5 animate-ping absolute" />
            <div className="w-80 h-80 rounded-full bg-indigo-500/3 animate-pulse absolute" />
          </div>
        )}

        {isFullScreen && (
          <button
            onClick={() => setIsFullScreen(false)}
            className="absolute top-6 right-6 p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        )}

        {/* Presets Row */}
        {!isRunning && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6 w-full max-w-md">
            {[5, 10, 15, 20, 30].map((mins) => (
              <button
                key={mins}
                onClick={() => setPreset(mins)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  duration === mins * 60
                    ? "bg-indigo-600 text-white shadow-xs"
                    : isFullScreen
                    ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        )}

        {/* Breathing Prompt Text */}
        <div className="text-center mb-6 h-8 flex items-center justify-center">
          {isRunning ? (
            <span className="text-xs font-bold tracking-widest text-indigo-400 uppercase animate-pulse">
              {timeLeft % 10 < 5 ? "✨ Breathe In Slowly..." : "💨 Exhale Soothingly..."}
            </span>
          ) : (
            <span className={`text-xs font-bold uppercase tracking-wider ${isFullScreen ? "text-slate-400" : "text-slate-400"}`}>
              Select duration and prepare your posture
            </span>
          )}
        </div>

        {/* Circular Display */}
        <div className="relative flex items-center justify-center mb-8">
          <svg className="w-64 h-64 transform -rotate-90">
            {/* Base Circle */}
            <circle
              cx="128"
              cy="128"
              r="116"
              className={isFullScreen ? "stroke-slate-800" : "stroke-slate-100"}
              strokeWidth="6"
              fill="transparent"
            />
            {/* Active Arc */}
            <circle
              cx="128"
              cy="128"
              r="116"
              className="stroke-indigo-600"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 116}
              strokeDashoffset={2 * Math.PI * 116 * (1 - timeLeft / duration)}
              strokeLinecap="round"
            />
          </svg>

          {/* Clock Text */}
          <div className="absolute flex flex-col items-center">
            <span className="text-5xl font-black font-mono tracking-tight leading-none">
              {formatTime(timeLeft)}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isFullScreen ? "text-slate-400" : "text-slate-400"}`}>
              {isRunning ? "Active Session" : "Ready"}
            </span>
          </div>
        </div>

        {/* Audio Controls */}
        <div className="flex flex-col items-center gap-4 mb-8 w-full max-w-sm">
          {/* Sounds Selection */}
          <div className="grid grid-cols-4 gap-1.5 w-full bg-slate-150/40 p-1 rounded-xl border border-slate-200/40">
            {["silence", "rain", "forest", "om"].map((sound) => (
              <button
                key={sound}
                onClick={() => setSelectedSound(sound as any)}
                className={`py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                  selectedSound === sound
                    ? "bg-slate-900 text-white shadow-xs"
                    : isFullScreen
                    ? "text-slate-400 hover:text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {sound}
              </button>
            ))}
          </div>

          {/* Volume Slider */}
          {selectedSound !== "silence" && (
            <div className="flex items-center gap-2.5 w-full px-2">
              <button onClick={() => setIsMuted(!isMuted)} className={isFullScreen ? "text-slate-400" : "text-slate-500"}>
                {isMuted || soundVolume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={soundVolume}
                onChange={(e) => {
                  setSoundVolume(parseFloat(e.target.value));
                  setIsMuted(false);
                }}
                className="flex-1 accent-slate-800"
              />
              <span className="text-[9px] font-mono font-bold w-6 text-right">
                {Math.round(soundVolume * 100)}%
              </span>
            </div>
          )}
        </div>

        {/* Main Controls Row */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={resetTimer}
            className={`p-3.5 rounded-full transition-all border ${
              isFullScreen
                ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
                : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-500"
            }`}
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={togglePlay}
            className="p-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-all transform hover:scale-105 active:scale-95"
          >
            {isRunning ? <Pause className="w-7 h-7 fill-white" /> : <Play className="w-7 h-7 fill-white" />}
          </button>

          {/* Log Trigger if they want to stop early and save */}
          <button
            onClick={() => setShowLogModal(true)}
            className={`p-3.5 rounded-full transition-all border ${
              isFullScreen
                ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
                : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-500"
            }`}
            title="Log current session progress"
          >
            <Check className="w-5 h-5" />
          </button>
        </div>

        {/* Custom Input Form (Visible when not running) */}
        {!isRunning && !isFullScreen && (
          <form onSubmit={handleCustomSubmit} className="mt-8 flex items-center gap-2 border-t border-slate-100 pt-6 w-full max-w-xs">
            <label className="text-[10px] font-bold uppercase text-slate-400 whitespace-nowrap">
              Custom Minutes:
            </label>
            <input
              type="text"
              pattern="[0-9]*"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-center font-bold text-slate-700"
            />
            <button
              type="submit"
              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors"
            >
              Set
            </button>
          </form>
        )}
      </div>

      {/* Log Post Meditation Session Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl max-w-md w-full p-6 text-slate-800 relative space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="text-center">
              <span className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-full mb-3">
                <Award className="w-6 h-6" />
              </span>
              <h3 className="font-bold text-slate-900 text-lg">Log Your Meditation Progress</h3>
              <p className="text-xs text-slate-400 mt-1">
                You meditated for {Math.round((duration - timeLeft) / 60)} minutes today. Add details to keep your streaks perfect.
              </p>
            </div>

            {/* Techniques checkboxes */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
                Technique Practiced
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: "kriya", name: "Sudarshan Kriya (Morning SKY)", icon: "🧘" },
                  { id: "breath", name: "Anapanasati Breath Meditation", icon: "💨" },
                  { id: "mantra", name: "So Hum Mantra Meditation", icon: "🕉️" }
                ].map((tech) => (
                  <button
                    key={tech.id}
                    onClick={() => setTechniques({ ...techniques, [tech.id]: !techniques[tech.id as keyof typeof techniques] })}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      techniques[tech.id as keyof typeof techniques]
                        ? "bg-indigo-50/60 border-indigo-200 text-indigo-900"
                        : "bg-white border-slate-100 hover:border-slate-200 text-slate-600"
                    }`}
                  >
                    <span className="text-xs font-semibold flex items-center gap-2">
                      <span>{tech.icon}</span>
                      {tech.name}
                    </span>
                    <span className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                      techniques[tech.id as keyof typeof techniques]
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : "border-slate-300"
                    }`}>
                      {techniques[tech.id as keyof typeof techniques] && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
                Session Experience / Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Felt incredibly calm, mind stopped racing, breathing stabilized..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 h-20 resize-none focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all"
              >
                Cancel / Skip
              </button>
              <button
                onClick={handleSaveSession}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Log Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

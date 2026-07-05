import { useState, useRef, useEffect } from "react";
import { Send, Brain, Sparkles, MessageSquare, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "coach";
  text: string;
  isThinking?: boolean;
}

const SUGGESTED_QUESTIONS = [
  "Why is morning SKY non-negotiable for my study focus?",
  "Tell me about the scientific benefits of Omega-3 EPA/DHA.",
  "How does Brahmi help my memory retention in Phase 3?",
  "My sleep quality is poor, how can I fix it with my schedule?"
];

import { DailyLog } from "../types";

interface CoachChatProps {
  logs: DailyLog[];
  profile: any;
}

export default function CoachChat({ logs, profile }: CoachChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "coach",
      text: "Hello! I am your 90-Day Habits Coach (AI Coach 2.0 Active 🚀). I have synchronized with your study hours, confidence stars, and habit ticks. I can help you stay committed to your morning Sudarshan Kriya, optimize your Omega-3 dosing, or map out your 11-hour study block. Ask me for some personalized insights about your weak subjects or habit patterns!"
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isDeepThinkingMode, setIsDeepThinkingMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg = textToSend;
    setInputText("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setIsLoading(true);

    try {
      const endpoint = isDeepThinkingMode ? "/api/gemini/deep-coach" : "/api/gemini/chat";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: userMsg,
          history: messages.map((m) => ({
            role: m.role === "user" ? "user" : "model",
            text: m.text
          })),
          logs,
          profile
        })
      });

      if (!response.ok) {
        throw new Error("Failed to fetch coaching advice");
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "coach", text: data.text, isThinking: isDeepThinkingMode }
      ]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "coach",
          text: `Apologies, I encountered an issue accessing my cognitive core: ${err.message || "Unknown issue"}`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col h-[520px]" id="coach-chat-container">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Roadmap Coach Console</h3>
            <p className="text-[10px] text-slate-400">Ask about Kriya techniques, focus tips, or nutrition</p>
          </div>
        </div>

        {/* Thinking Engine Toggle */}
        <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-1 border border-slate-200">
          <button
            onClick={() => setIsDeepThinkingMode(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              !isDeepThinkingMode
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-500 hover:text-indigo-600"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Flash Coach
          </button>
          <button
            onClick={() => setIsDeepThinkingMode(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isDeepThinkingMode
                ? "bg-purple-600 text-white shadow-xs animate-pulse"
                : "text-slate-500 hover:text-purple-600"
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            Deep Thinking
          </button>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" id="coach-message-stream">
        {messages.map((m, idx) => {
          const isUser = m.role === "user";
          return (
            <div
              key={idx}
              className={`flex ${isUser ? "justify-end" : "justify-start"} items-start gap-2.5`}
            >
              {!isUser && (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                  m.isThinking ? "bg-purple-100 text-purple-700 border border-purple-200" : "bg-indigo-100 text-indigo-700"
                }`}>
                  {m.isThinking ? "🧠" : "🧘"}
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed ${
                  isUser
                    ? "bg-slate-800 text-white rounded-tr-none"
                    : m.isThinking
                    ? "bg-purple-50/50 text-slate-800 border border-purple-100 rounded-tl-none font-sans shadow-2xs"
                    : "bg-slate-50 text-slate-800 rounded-tl-none font-sans"
                }`}
              >
                {m.isThinking && (
                  <span className="block text-[8px] font-bold uppercase tracking-wider text-purple-600 mb-1.5">
                    ⚡ High Thinking Reasoning output:
                  </span>
                )}
                <div className="whitespace-pre-line">{m.text}</div>
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex justify-start items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-100 text-slate-500 text-xs rounded-2xl px-4 py-3 italic">
              {isDeepThinkingMode
                ? "Activating High Thinking executive neural networks (this might take a few seconds)..."
                : "Standard Flash model retrieving coaching guidelines..."}
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length === 1 && (
        <div className="p-3 border-t border-slate-50 flex flex-wrap gap-2 justify-center">
          {SUGGESTED_QUESTIONS.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(q)}
              className="px-3 py-1.5 rounded-full border border-slate-100 text-[10px] text-slate-600 hover:border-indigo-200 hover:text-indigo-600 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input controls */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputText);
        }}
        className="p-4 border-t border-slate-100 flex gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            isDeepThinkingMode
              ? "Ask a complex routine scheduling query (HIGH thinking mode enabled)..."
              : "Ask me anything about your 90-day challenge..."
          }
          className="flex-1 bg-slate-50 rounded-xl px-4 py-2.5 text-xs text-slate-700 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white"
        />
        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 transition-colors"
          id="chat-send-btn"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

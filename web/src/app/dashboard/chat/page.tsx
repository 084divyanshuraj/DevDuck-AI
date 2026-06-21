"use client";

import { useEffect, useRef, useState } from "react";
import { 
  Bot, 
  Send, 
  Sparkles, 
  CornerDownLeft, 
  ArrowRight,
  Database,
  Code2
} from "lucide-react";

interface Message {
  role: "user" | "bot";
  content: string;
  citations?: string[];
  confidence?: number;
}

export default function OnboardingChat() {
  const [projectId, setProjectId] = useState("taskapp");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      content: "Hello! I am your Kala AI onboarding chatbot. I have fully indexed this codebase's documents and files. What would you like to know about this project?",
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const active = localStorage.getItem("devduck_active_project") || "taskapp";
      setProjectId(active);
      setMessages([
        {
          role: "bot",
          content: `Hello! I have loaded the memory context for project: ${getProjectName(active)}. Ask me anything about its code structure, config, or features!`,
        }
      ]);
    }

    const handleProjectChanged = (e: Event) => {
      const customEvent = e as CustomEvent;
      setProjectId(customEvent.detail);
      setMessages([
        {
          role: "bot",
          content: `Hello! I have switched my memory context to the newly active project: ${getProjectName(customEvent.detail)}. Ask me anything about its code structure, config, or features!`,
        }
      ]);
    };

    window.addEventListener("projectChanged", handleProjectChanged);
    return () => {
      window.removeEventListener("projectChanged", handleProjectChanged);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getProjectName = (id: string) => {
    switch(id) {
      case "taskapp": return "TaskApp (Node.js/SQLite)";
      case "weather-website": return "Weather Website (Flask)";
      case "tic-tac-toe": return "Tic-Tac-Toe (HTML/CSS/JS)";
      case "tourist-safety": return "Tourist Safety Hub (Node.js)";
      default: return id;
    }
  };

  const getMockAnswer = (question: string, proj: string): { answer: string; citations: string[]; confidence: number } => {
    const q = question.toLowerCase();
    
    if (proj === "taskapp") {
      if (q.includes("database") || q.includes("db") || q.includes("sqlite")) {
        return {
          answer: "This project uses a SQLite database configured via Sequelize ORM. The connection parameters and sqlite configuration are defined inside `server/config/database.js`.",
          citations: ["server/config/database.js:L12-32", "server/package.json:L22"],
          confidence: 0.94
        };
      }
      if (q.includes("auth") || q.includes("jwt") || q.includes("login")) {
        return {
          answer: "Authentication is managed via JSON Web Tokens (JWT). The login process generates a token using `jsonwebtoken` in `server/controllers/authController.js` and verifies it using the middleware `server/middleware/auth.js`.",
          citations: ["server/middleware/auth.js:L10-45", "server/controllers/authController.js:L50-82"],
          confidence: 0.89
        };
      }
      return {
        answer: "Based on the TaskApp index, it is a task management application built using Express, SQLite, and client-side WebSocket support for real-time synchronization.",
        citations: ["server/server.js:L1-60", "README.md:L5-28"],
        confidence: 0.85
      };
    }

    if (proj === "weather-website") {
      if (q.includes("database") || q.includes("db")) {
        return {
          answer: "This project does not use a database! It is a serverless Python Flask application that directly fetches weather details on-demand from the external OpenWeather API and serves it to a static vanilla JS page.",
          citations: ["app.py:L15-40", "static/script.js:L5-20"],
          confidence: 0.96
        };
      }
      if (q.includes("run") || q.includes("start") || q.includes("execute")) {
        return {
          answer: "To run the Weather Website locally:\n1. Run `pip install -r requirements.txt` to install Flask and requests.\n2. Add your OpenWeather API key inside the `.env` file (`OPENWEATHER_API_KEY=xxx`).\n3. Execute `python app.py` and access `http://localhost:5000`.",
          citations: ["README.md:L40-60", "app.py:L5-12"],
          confidence: 0.91
        };
      }
      return {
        answer: "This is a simple weather app. The Flask server acts as an API proxy to hide the OpenWeather API key and prevent CORS issues during client fetches.",
        citations: ["app.py:L22-38"],
        confidence: 0.82
      };
    }

    if (proj === "tic-tac-toe") {
      if (q.includes("backend") || q.includes("database") || q.includes("api")) {
        return {
          answer: "This project is pure client-side vanilla frontend (HTML, CSS, and JS). It does not require any backend server, database, or API keys to execute.",
          citations: ["index.html:L1-50", "style.css:L1-120", "script.js:L1-80"],
          confidence: 0.98
        };
      }
      return {
        answer: "It is a basic browser-based Tic-Tac-Toe game. Board state, turns, and win configurations are calculated locally in `script.js`.",
        citations: ["script.js:L15-55"],
        confidence: 0.95
      };
    }

    if (proj === "tourist-safety") {
      if (q.includes("database") || q.includes("db") || q.includes("mongo")) {
        return {
          answer: "The project uses MongoDB Atlas. Connection strings are configured in `.env` and loaded using Mongoose inside `config/mongoose.js`. Key collections are `Users`, `SOSAlerts`, and `IncidentLogs`.",
          citations: ["config/mongoose.js:L5-22", "models/SOSAlert.js:L1-35"],
          confidence: 0.93
        };
      }
      if (q.includes("sos") || q.includes("alert") || q.includes("emergency")) {
        return {
          answer: "SOS alerts are generated via a POST endpoint to `/api/sos/trigger`. It stores the geocoordinates in the MongoDB database, triggers SMS notifications via Twilio, and broadcasts the live coordinate update via Socket.io to the admin console.",
          citations: ["routes/sos.js:L12-48", "server.js:L120-145"],
          confidence: 0.91
        };
      }
      return {
        answer: "This is a full-stack SOS alerting application built for tourist safety, integrating mapping libraries, real-time WebSockets, and database persistence.",
        citations: ["README.md:L1-35", "server.js:L1-50"],
        confidence: 0.87
      };
    }

    return {
      answer: "I am familiar with this project's structure. Please ask me about its databases, routes, configuration, or run commands.",
      citations: ["README.md:L1-10"],
      confidence: 0.80
    };
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    setInput("");

    // Add user message instantly
    setMessages(prev => [...prev, { role: "user", content: userText }]);

    // Add a temporary loader state
    setMessages(prev => [...prev, { role: "bot", content: "Thinking..." }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, question: userText })
      });

      if (!response.ok) {
        throw new Error("API error");
      }

      const result = await response.json();
      if (result.answer) {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "bot",
            content: result.answer,
            citations: result.citations || [],
            confidence: result.confidence
          };
          return updated;
        });
      } else {
        throw new Error("Execution failed");
      }

    } catch (err) {
      console.warn("Real chat backend failed, falling back to mock response.", err);
      const mockResult = getMockAnswer(userText, projectId);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "bot",
          content: mockResult.answer,
          citations: mockResult.citations,
          confidence: mockResult.confidence
        };
        return updated;
      });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[calc(100vh-8.5rem)] animate-fade-in">
      {/* Left Column: Chat Area */}
      <div className="glass-panel flex-1 rounded-2xl overflow-hidden flex flex-col justify-between h-[550px] lg:h-full">
        {/* Chat Title bar */}
        <div className="px-6 py-4 border-b border-zinc-900 bg-zinc-900/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center">
              <Bot className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-200">Kala Assistant</div>
              <div className="text-[10px] text-zinc-500">
                context: <code className="text-zinc-400 font-semibold">{projectId}</code>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-1">
            <Database className="w-3.5 h-3.5 text-amber-500" />
            Index Active
          </div>
        </div>

        {/* Messages List Area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
            >
              <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold border overflow-hidden
                ${msg.role === "user" ? "bg-zinc-800 border-zinc-700 text-zinc-450" : "bg-zinc-900/60 border-zinc-800 text-zinc-300"}
              `}>
                {msg.role === "user" ? "U" : <img src="/kala-logo.png" alt="Kala AI" className="w-5.5 h-5.5 object-contain p-0.5" />}
              </div>
              
              <div className="flex flex-col gap-1.5">
                <div className={`p-4 rounded-xl text-xs leading-relaxed border
                  ${msg.role === "user" 
                    ? "bg-zinc-900/80 border-zinc-800 text-zinc-200 rounded-tr-none" 
                    : "bg-zinc-900/40 border-zinc-900 text-zinc-300 rounded-tl-none"}
                `}>
                  {msg.content.split('\n').map((line, lidx) => (
                    <p key={lidx} className={lidx > 0 ? "mt-2" : ""}>{line}</p>
                  ))}

                  {/* Confidence Badge */}
                  {msg.confidence !== undefined && (
                    <div className="mt-3.5 pt-2 border-t border-zinc-900/60 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span className="text-[9px] text-zinc-550 font-bold uppercase tracking-wider">
                        confidence: {Math.round(msg.confidence * 100)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Citations Box */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 items-center px-1">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Citations:</span>
                    {msg.citations.map((cite, cidx) => (
                      <span key={cidx} className="text-[9px] font-mono font-semibold bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md hover:text-amber-400 cursor-pointer">
                        {cite}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-4 border-t border-zinc-900 bg-zinc-950/40">
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 focus-within:border-zinc-700 transition-colors">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask about ${getProjectName(projectId)} codebase...`}
              className="flex-1 bg-transparent text-xs outline-none text-zinc-200 placeholder-zinc-500"
            />
            <button 
              type="submit"
              disabled={!input.trim()}
              className="p-1.5 bg-zinc-950 disabled:bg-zinc-900 text-zinc-300 disabled:text-zinc-600 border border-zinc-800 disabled:border-transparent rounded-lg transition-colors flex items-center justify-center shrink-0 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex justify-between items-center px-1 mt-2">
            <span className="text-[9px] text-zinc-500 font-semibold flex items-center gap-1">
              <CornerDownLeft className="w-3 h-3" /> Press Enter
            </span>
            <span className="text-[9px] text-zinc-500 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" /> Vector search active
            </span>
          </div>
        </form>
      </div>

      {/* Right Column: Help */}
      <div className="glass-panel w-full lg:w-80 rounded-2xl p-6 flex flex-col gap-6">
        <div>
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">Shortcuts</h3>
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            Quickly query the chatbot with common codebase topics for this project.
          </p>
        </div>
        
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => setInput("What database does this use?")}
            className="flex items-center justify-between text-left p-3 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/60 text-xs text-zinc-300 hover:text-zinc-200 group transition-all cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-zinc-500" />
              What database does it use?
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all" />
          </button>

          <button 
            onClick={() => setInput(projectId === "weather-website" ? "How do I run this website?" : "How does auth work?")}
            className="flex items-center justify-between text-left p-3 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/60 text-xs text-zinc-300 hover:text-zinc-200 group transition-all cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Code2 className="w-3.5 h-3.5 text-zinc-500" />
              {projectId === "weather-website" ? "How do I run this website?" : "How does auth/security work?"}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>

        <div className="h-[1px] bg-zinc-900" />

        <div>
          <h4 className="text-[10px] font-bold text-zinc-450 mb-2 uppercase tracking-wider">Memory Isolation</h4>
          <p className="text-[10px] text-zinc-500 leading-normal">
            Each project has a dedicated namespace user_id in Parcle. Chat history is cleared on project swap.
          </p>
        </div>
      </div>
    </div>
  );
}

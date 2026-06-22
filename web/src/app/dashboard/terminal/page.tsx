"use client";

import { useState, useRef, useEffect } from "react";
import { Terminal, Play, Square, ChevronRight, AlertTriangle, Lightbulb } from "lucide-react";

const PROJECTS: Record<string, string> = {
  taskapp: "TaskApp — Full Stack Task Manager",
  "weather-website": "Simple Weather Website",
  "tic-tac-toe": "Tic-Tac-Toe",
  "tourist-safety": "Tourist Safety Hub (SIH 2025)",
  "task_bar111_": "task_bar111",
  "student-placement-predictor": "Student Placement Predictor",
};

type Line = { type: "stdout" | "stderr" | "info"; text: string };

export default function SmartTerminalPage() {
  const [projectId, setProjectId] = useState("taskapp");
  const [command, setCommand] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [running, setRunning] = useState(false);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [fixSection, setFixSection] = useState<string>("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Use a ref to track fix accumulation state synchronously inside the stream loop
  const inFixRef = useRef(false);
  const fixAccRef = useRef("");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines, fixSection]);

  // Listen for project changes from sidebar
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      if (e.detail) setProjectId(e.detail);
    };
    window.addEventListener("projectChanged", handler as EventListener);
    return () => window.removeEventListener("projectChanged", handler as EventListener);
  }, []);

  const runCommand = async () => {
    if (!command.trim() || running) return;

    setLines([{ type: "info", text: `🦆 DevDuck is watching: ${command}` }]);
    setExitCode(null);
    setFixSection("");
    inFixRef.current = false;
    fixAccRef.current = "";
    setRunning(true);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, command: command.trim() }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        setLines((l) => [...l, { type: "stderr", text: "Failed to start command." }]);
        setRunning(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          try {
            const { type, text } = JSON.parse(part.slice(6));

            if (type === "exit") {
              const code = parseInt(text, 10);
              setExitCode(code);
              if (code === 0) {
                setLines((l) => [...l, { type: "info", text: "✅ Command completed successfully." }]);
              }
            } else if (type === "error") {
              setLines((l) => [...l, { type: "stderr", text: `Error: ${text}` }]);
            } else {
              // Check for fix section start
              if (text.includes("💡 Here's the fix:")) {
                inFixRef.current = true;
                fixAccRef.current = "";
                setLines((l) => [...l, { type: "info", text: "🦆 DevDuck intercepted a crash! Fetching fix from Parcle memory..." }]);
                // Extract anything after the marker on the same chunk
                const afterMarker = text.split("💡 Here's the fix:")[1] ?? "";
                if (afterMarker.trim()) {
                  fixAccRef.current += afterMarker;
                  setFixSection(fixAccRef.current);
                }
              } else if (text.includes("📥 This crash")) {
                inFixRef.current = false;
                setLines((l) => [...l, { type: "info", text: "📥 Crash saved to project memory." }]);
              } else if (inFixRef.current) {
                // Accumulate fix text — skip separator lines
                if (!text.includes("────")) {
                  fixAccRef.current += text;
                  setFixSection(fixAccRef.current);
                }
              } else if (!text.includes("🦆 DevDuck") && !text.includes("────")) {
                // Normal terminal output
                setLines((l) => [...l, { type: type as "stdout" | "stderr", text }]);
              }
            }
          } catch {}
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        setLines((l) => [...l, { type: "stderr", text: `Connection error: ${e.message}` }]);
      }
    }

    setRunning(false);
  };

  const stopCommand = () => {
    abortRef.current?.abort();
    setRunning(false);
    setLines((l) => [...l, { type: "info", text: "⛔ Command stopped." }]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) runCommand();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700">
            <Terminal className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-zinc-100">Smart Terminal</h1>
            <p className="text-sm text-zinc-400">Run commands with AI crash detection powered by Parcle memory</p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
          <div className="flex gap-3 flex-wrap">
            <div className="flex flex-col gap-1 min-w-[200px]">
              <label className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Project</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                disabled={running}
                className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500 disabled:opacity-50"
              >
                {Object.entries(PROJECTS).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1 flex-1 min-w-[260px]">
              <label className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Command</label>
              <div className="flex gap-2">
                <div className="flex items-center gap-2 flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 focus-within:border-amber-500">
                  <ChevronRight className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="npm run build"
                    disabled={running}
                    className="bg-transparent text-zinc-200 text-sm flex-1 focus:outline-none placeholder:text-zinc-600 font-mono"
                  />
                </div>
                {running ? (
                  <button
                    onClick={stopCommand}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Square className="w-3.5 h-3.5" /> Stop
                  </button>
                ) : (
                  <button
                    onClick={runCommand}
                    disabled={!command.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Play className="w-3.5 h-3.5" /> Run
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Terminal output */}
        {lines.length > 0 && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800 bg-zinc-900">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="text-xs text-zinc-500 ml-2 font-mono">{command}</span>
              {exitCode !== null && (
                <span className={`ml-auto text-xs font-mono px-2 py-0.5 rounded ${exitCode === 0 ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"}`}>
                  exit {exitCode}
                </span>
              )}
            </div>
            <div className="p-4 font-mono text-sm space-y-0.5 max-h-80 overflow-y-auto">
              {lines.map((line, i) => (
                <div
                  key={i}
                  className={
                    line.type === "stderr"
                      ? "text-red-400"
                      : line.type === "info"
                      ? "text-amber-400"
                      : "text-zinc-300"
                  }
                >
                  {line.text}
                </div>
              ))}
              {running && (
                <div className="text-zinc-500 animate-pulse">▌</div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>
        )}

        {/* AI Fix card */}
        {fixSection && (
          <div className="bg-zinc-900 border border-amber-500/30 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-500/20 bg-amber-500/5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-400">Crash detected</span>
              <Lightbulb className="w-4 h-4 text-amber-300 ml-auto" />
              <span className="text-xs text-amber-300">AI fix from Parcle memory</span>
            </div>
            <div className="p-4 font-mono text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
              {fixSection}
            </div>
          </div>
        )}

        {/* Empty state */}
        {lines.length === 0 && (
          <div className="text-center py-16 text-zinc-600">
            <Terminal className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Enter a command above and hit Run</p>
            <p className="text-xs mt-1 opacity-60">If it crashes, DevDuck will intercept it and fetch a fix from project memory</p>
          </div>
        )}

      </div>
    </div>
  );
}

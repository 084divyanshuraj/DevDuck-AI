"use client";

import { useEffect, useState } from "react";
import { 
  Bug, 
  Terminal, 
  ChevronRight, 
  Clipboard, 
  Check, 
  AlertOctagon,
  AlertTriangle,
  Info,
  Sparkles
} from "lucide-react";

interface DebugResult {
  title: string;
  severity: "CRITICAL" | "ERROR" | "WARNING" | "INFO";
  confidence: number;
  rootCause: string;
  suggestedFix: string;
}

export default function ZeroSyncDebugger() {
  const [projectId, setProjectId] = useState("taskapp");
  const [bugInput, setBugInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DebugResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const active = localStorage.getItem("devduck_active_project") || "taskapp";
      setProjectId(active);
    }

    const handleProjectChanged = (e: Event) => {
      const customEvent = e as CustomEvent;
      setProjectId(customEvent.detail);
      setResult(null);
    };

    window.addEventListener("projectChanged", handleProjectChanged);
    return () => {
      window.removeEventListener("projectChanged", handleProjectChanged);
    };
  }, []);

  const getMockDiagnosis = (bug: string): DebugResult => {
    const b = bug.toLowerCase();
    
    if (b.includes("500") || b.includes("jwt") || b.includes("login")) {
      return {
        title: "500 Login Error",
        severity: "CRITICAL",
        confidence: 0.94,
        rootCause: "JWT_SECRET environment variable is not defined in the server runtime configurations, causing JWT token creation to fail and crash the auth route.",
        suggestedFix: "# Add the JWT_SECRET to your environment configuration\n# Open your local .env file and add:\n\nJWT_SECRET=your_jwt_signing_secret_key_here\n\n# Restart your development server afterwards."
      };
    }

    if (b.includes("timeout") || b.includes("db") || b.includes("user table")) {
      return {
        title: "Database Timeout on Query",
        severity: "WARNING",
        confidence: 0.87,
        rootCause: "The query filter on the users table searches by the email column, which currently lacks a database index. This triggers a sequential scan over all rows, causing queries to time out under heavy concurrency.",
        suggestedFix: "-- Execute this migration command on your SQL console:\n\nCREATE INDEX idx_users_email ON users(email);\n\n-- Verify the index is applied:\n-- EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';"
      };
    }

    if (b.includes("404") || b.includes("profile") || b.includes("router")) {
      return {
        title: "404 Page Not Found on Profile",
        severity: "ERROR",
        confidence: 0.90,
        rootCause: "The layout link directs user actions to '/profile', but the React router configuration file has mapped the profile component to '/user-profile'. This mismatch causes the page router to fail.",
        suggestedFix: "// Open your route definition configuration (e.g. app-router configs) and update:\n\n- Route path: '/user-profile'\n+ Route path: '/profile'\n\n// Or update your navigation links to redirect to /user-profile."
      };
    }

    return {
      title: "Unknown Configuration Mismatch",
      severity: "INFO",
      confidence: 0.72,
      rootCause: "Could not find a direct semantic match in past incident records. This error looks like a new runtime config regression.",
      suggestedFix: "# Double check your configuration files and runtime environment variable keys.\n# Ensure all project dependencies are fully installed by running:\n\nnpm install"
    };
  };

  const handleAnalyze = () => {
    if (!bugInput.trim()) return;
    setIsAnalyzing(true);
    setResult(null);

    setTimeout(() => {
      const diagnosis = getMockDiagnosis(bugInput);
      setResult(diagnosis);
      setIsAnalyzing(false);
    }, 1100);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSeverityStyles = (sev: string) => {
    switch (sev) {
      case "CRITICAL":
        return { text: "text-rose-400", bg: "bg-zinc-900", border: "border-rose-500/10", icon: AlertOctagon };
      case "ERROR":
        return { text: "text-amber-500", bg: "bg-zinc-900", border: "border-amber-500/10", icon: AlertOctagon };
      case "WARNING":
        return { text: "text-yellow-500", bg: "bg-zinc-900", border: "border-yellow-500/10", icon: AlertTriangle };
      default:
        return { text: "text-zinc-300", bg: "bg-zinc-900", border: "border-zinc-800", icon: Info };
    }
  };

  const SeverityIcon = result ? getSeverityStyles(result.severity).icon : Info;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-bold text-white mb-2 flex items-center gap-3 tracking-tight">
          <Bug className="w-5.5 h-5.5 text-zinc-400" /> Zero-Sync Debugger
        </h1>
        <p className="text-zinc-400 text-xs max-w-xl">
          Search the vector database of historical bug records. Describe the error log to retrieve suggested fixes instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form Column */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-zinc-300">Describe Current Incident / Paste Error Log</label>
            <textarea 
              value={bugInput}
              onChange={(e) => setBugInput(e.target.value)}
              placeholder="Example: Users are getting a 500 Internal Server Error when clicking the login submit button..."
              className="w-full min-h-[150px] text-xs bg-zinc-950 border border-zinc-800 focus:border-zinc-700 rounded-xl p-4 text-zinc-200 placeholder-zinc-500 outline-none leading-relaxed resize-none transition-colors"
            />
          </div>

          <div className="flex items-center justify-between">
            {/* Quick Templates */}
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Templates:</span>
              <button 
                onClick={() => setBugInput("Users getting login 500 error")}
                className="text-[9px] font-semibold bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-300 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                500 Login Error
              </button>
              <button 
                onClick={() => setBugInput("Application database query times out")}
                className="text-[9px] font-semibold bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-300 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                Query Timeout
              </button>
            </div>

            <button 
              onClick={handleAnalyze}
              disabled={!bugInput.trim() || isAnalyzing}
              className="flex items-center gap-1.5 px-4.5 py-2.5 bg-amber-600 disabled:bg-zinc-900 hover:bg-amber-500 text-white disabled:text-zinc-500 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              {isAnalyzing ? "Analyzing..." : "Analyze Incident"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Info Column */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-zinc-400" /> Diagnosis Info
            </h3>
            <p className="text-[11px] text-zinc-500 leading-relaxed mb-6">
              When an issue is run through the analyzer, we pull identical or similar root causes that were resolved in past commits.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
              <div className="text-[10px] leading-relaxed text-zinc-400">
                <span className="font-semibold text-zinc-300">Severity evaluation</span>: Muted flat badges represent severity status.
              </div>
            </div>
            <div className="flex gap-2">
              <span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
              <div className="text-[10px] leading-relaxed text-zinc-400">
                <span className="font-semibold text-zinc-300">Confidence scale</span>: AI ranks similarity against historical records.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Output Section */}
      {result && (
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-6 animate-slide-up">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-900 pb-5 gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 border
                  ${getSeverityStyles(result.severity).bg} ${getSeverityStyles(result.severity).text} ${getSeverityStyles(result.severity).border}
                `}>
                  <SeverityIcon className="w-3 h-3" />
                  {result.severity}
                </span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Match: {Math.round(result.confidence * 100)}%
                </span>
              </div>
              <h2 className="text-base font-bold text-white">Similar Historical Issue: {result.title}</h2>
            </div>
          </div>

          {/* Root cause */}
          <div className="flex flex-col gap-2">
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Root Cause Analysis</h3>
            <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-900/30 border border-zinc-900 rounded-xl p-4">
              {result.rootCause}
            </p>
          </div>

          {/* Code Fix */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Suggested Fix</h3>
              <button 
                onClick={() => copyToClipboard(result.suggestedFix)}
                className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-amber-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Clipboard className="w-3.5 h-3.5" /> Copy Code
                  </>
                )}
              </button>
            </div>
            
            <div className="relative rounded-xl overflow-hidden border border-zinc-900 font-mono text-xs text-zinc-300 bg-zinc-950 p-5 leading-relaxed">
              <pre className="overflow-x-auto whitespace-pre">{result.suggestedFix}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

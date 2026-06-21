"use client";

import { useEffect, useState } from "react";
import { 
  GitPullRequest, 
  Terminal, 
  ChevronRight, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2,
  Database
} from "lucide-react";

interface ReviewResult {
  decision: "APPROVED" | "BLOCKED";
  reason: string;
}

export default function PRReviewer() {
  const [projectId, setProjectId] = useState("taskapp");
  const [diffInput, setDiffInput] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const active = localStorage.getItem("devduck_active_project") || "taskapp";
      setProjectId(active);
    }

    const handleProjectChanged = (e: Event) => {
      const customEvent = e as CustomEvent;
      setProjectId(customEvent.detail);
      setResult(null);
      setIsSynced(false);
      setIsSyncing(false);
    };

    window.addEventListener("projectChanged", handleProjectChanged);
    return () => {
      window.removeEventListener("projectChanged", handleProjectChanged);
    };
  }, []);

  const getMockReview = (diff: string): ReviewResult => {
    const d = diff.toLowerCase();
    
    if (d.includes("jwt") || d.includes("secret") || d.includes("remove")) {
      return {
        decision: "BLOCKED",
        reason: "🚨 BLOCKED: Code change re-introduces a critical configuration bug resolved previously in commit #7f3b01 (JWT Secret Configuration). You are removing or renaming the JWT_SECRET verification key, which will cause authentication to throw 500 errors on the client login endpoints."
      };
    }

    if (d.includes("await") || d.includes("async") || d.includes("delete")) {
      return {
        decision: "BLOCKED",
        reason: "🚨 BLOCKED: Code change introduces a potential performance bottleneck resolved previously in commit #d4c8f2 (Database Timeout Index). Removing the await keyword on db queries will cause asynchronous threads to return pending promises, failing table queries."
      };
    }

    return {
      decision: "APPROVED",
      reason: "✅ APPROVED: The code changes look safe and conform to repository historical benchmarks. No matching regression incidents or structural flaws found in Parcle memory database. Let's merge!"
    };
  };

  const handleReview = () => {
    if (!diffInput.trim()) return;
    setIsReviewing(true);
    setResult(null);
    setIsSynced(false);

    setTimeout(() => {
      const review = getMockReview(diffInput);
      setResult(review);
      setIsReviewing(false);
    }, 1100);
  };

  const handleSyncMemory = () => {
    if (!result) return;
    setIsSyncing(true);

    setTimeout(() => {
      setIsSyncing(false);
      setIsSynced(true);
    }, 800);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-white mb-2 flex items-center gap-3 tracking-tight">
          <GitPullRequest className="w-5.5 h-5.5 text-zinc-400" /> PR Reviewer Bot
        </h1>
        <p className="text-zinc-400 text-xs max-w-xl">
          Paste a Pull Request `.diff` or code snippet. Kala AI will review the code lines against the project's historical bug database.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Editor Input */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-zinc-300">Paste Code Diff (.diff / .patch format)</label>
            <textarea 
              value={diffInput}
              onChange={(e) => setDiffInput(e.target.value)}
              placeholder="Example:\n@@ -12,4 +12,4 @@\n- const user = await db.query('SELECT * FROM users');\n+ const user = db.query('SELECT * FROM users');"
              className="w-full min-h-[150px] text-xs bg-zinc-950 border border-zinc-800 focus:border-zinc-700 rounded-xl p-4 text-zinc-200 placeholder-zinc-500 outline-none leading-relaxed font-mono resize-none transition-colors"
            />
          </div>

          <div className="flex items-center justify-between">
            {/* Quick Templates */}
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Templates:</span>
              <button 
                onClick={() => setDiffInput("@@ -10,3 +10,3 @@\n- app.use(jwtMiddleware(process.env.JWT_SECRET));\n+ app.use(jwtMiddleware('dev-secret-only'));")}
                className="text-[9px] font-semibold bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-300 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                Insecure JWT config
              </button>
              <button 
                onClick={() => setDiffInput("@@ -22,2 +22,2 @@\n- const result = await User.findOne({ email });\n+ const result = User.findOne({ email });")}
                className="text-[9px] font-semibold bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-300 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                Remove await tag
              </button>
            </div>

            <button 
              onClick={handleReview}
              disabled={!diffInput.trim() || isReviewing}
              className="flex items-center gap-1.5 px-4.5 py-2.5 bg-amber-600 disabled:bg-zinc-900 hover:bg-amber-500 text-white disabled:text-zinc-500 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              {isReviewing ? "Reviewing..." : "Review Code Diff"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Ingestion info */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-zinc-400" /> Review Policy
            </h3>
            <p className="text-[11px] text-zinc-500 leading-relaxed mb-6">
              Our policy audits code submissions using Parcle Vector Memory indices containing full histories of resolved production logs.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex gap-2.5">
              <ShieldCheck className="w-4.5 h-4.5 text-zinc-500 shrink-0" />
              <div className="text-[10px] leading-relaxed text-zinc-400">
                <span className="font-semibold text-zinc-300">Continuous checkouts</span>: Integrates with GitHub Action hooks to scan branches on commit push.
              </div>
            </div>
            <div className="flex gap-2.5">
              <ShieldAlert className="w-4.5 h-4.5 text-zinc-500 shrink-0" />
              <div className="text-[10px] leading-relaxed text-zinc-400">
                <span className="font-semibold text-zinc-300">Strict blocks</span>: Blocks PR merge options when a regression signature matches.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Outcome Panel */}
      {result && (
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-6 animate-slide-up">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-5">
            <div>
              <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Outcome</div>
              <h2 className="text-sm font-bold text-white flex items-center gap-3">
                Review Decision: 
                <span className={`px-2.5 py-0.5 rounded text-xs font-extrabold border
                  ${result.decision === "APPROVED" ? "bg-zinc-900 text-amber-400 border-amber-500/10" : "bg-zinc-900 text-rose-400 border-rose-500/10"}
                `}>
                  {result.decision}
                </span>
              </h2>
            </div>

            {/* Sync to Parcle Button */}
            <button 
              onClick={handleSyncMemory}
              disabled={isSyncing || isSynced}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border
                ${isSynced 
                  ? "bg-zinc-900 text-zinc-500 border-zinc-800 cursor-default" 
                  : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800 cursor-pointer"}
              `}
            >
              <Database className="w-3.5 h-3.5" />
              {isSyncing ? "Syncing..." : isSynced ? "Synced!" : "Sync Review"}
            </button>
          </div>

          {/* Analysis description */}
          <div className="flex flex-col gap-2">
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Kala AI Feedback</h3>
            <div className={`p-4 rounded-xl border text-xs leading-relaxed font-mono bg-zinc-900/40 border-zinc-900 text-zinc-300`}>
              {result.reason}
            </div>
          </div>
          
          {isSynced && (
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-500" />
              Review log successfully synced and stored inside active namespace memory.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

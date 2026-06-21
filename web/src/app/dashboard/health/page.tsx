"use client";

import { useEffect, useState } from "react";
import { 
  FileCode, 
  Sparkles, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  FolderPlus, 
  ArrowRight,
  Clipboard,
  Check,
  Zap
} from "lucide-react";

interface HealthResult {
  score: number;
  docScore: number;
  structScore: number;
  maintScore: number;
  emptyFolders: string[];
  deadFiles: string[];
  missingSections: string[];
  improvedReadme: string;
}

export default function RepoHealth() {
  const [projectId, setProjectId] = useState("taskapp");
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [result, setResult] = useState<HealthResult | null>(null);
  const [readmeShowing, setReadmeShowing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const active = localStorage.getItem("devduck_active_project") || "taskapp";
      setProjectId(active);
    }

    const handleProjectChanged = (e: Event) => {
      const customEvent = e as CustomEvent;
      setProjectId(customEvent.detail);
      setHasScanned(false);
      setResult(null);
      setReadmeShowing(false);
    };

    window.addEventListener("projectChanged", handleProjectChanged);
    return () => {
      window.removeEventListener("projectChanged", handleProjectChanged);
    };
  }, []);

  const getMockHealth = (proj: string): HealthResult => {
    switch (proj) {
      case "taskapp":
        return {
          score: 92,
          docScore: 80,
          structScore: 100,
          maintScore: 95,
          emptyFolders: [],
          deadFiles: ["server/test_backup.js"],
          missingSections: ["Deployment", "Contributing"],
          improvedReadme: "# TaskApp — Full Stack Task Manager\n\nNode.js/Express + SQLite task management app with JWT auth and WebSocket live sync.\n\n## Installation\n1. Run `npm install` to install local dependencies.\n2. Configure your environment keys in `.env`.\n3. Spin up local database migrations.\n\n## Deployment\nFor production hosting, PM2 is configured to balance workloads:\n```bash\nnpm install -g pm2\npm2 start server/server.js --name \"task-app\"\n```\nDocker files are located in `/docker` for containerized setups.\n\n## Contributing\nWe enforce standard code structures:\n- Run `npm run lint` before committing.\n- Format code structures through Prettier configurations."
        };
      case "weather-website":
        return {
          score: 78,
          docScore: 60,
          structScore: 85,
          maintScore: 90,
          emptyFolders: ["tests/mocks", "static/assets/unused"],
          deadFiles: ["static/test-env-setup.js"],
          missingSections: ["Installation", "Usage", "License"],
          improvedReadme: "# Simple Weather Website\n\nPython/Flask backend + vanilla JS frontend, pulls live weather from OpenWeather API.\n\n## Installation\n1. Clone the project repository.\n2. Install package dependencies:\n```bash\npip install -r requirements.txt\n```\n3. Configure `OPENWEATHER_API_KEY` in `.env`.\n\n## Usage\nTo launch the Flask weather server on local development port 5000:\n```bash\npython app.py\n```\n\n## License\nThis project is licensed under the MIT License."
        };
      case "tic-tac-toe":
        return {
          score: 100,
          docScore: 100,
          structScore: 100,
          maintScore: 100,
          emptyFolders: [],
          deadFiles: [],
          missingSections: [],
          improvedReadme: "# Tic-Tac-Toe\n\nVanilla HTML/CSS/JS browser game, no backend.\n\n## Features\n- Grid interactive state selection\n- Pure CSS responsive styling\n- Dynamic turn toggling and victory assessments calculated client-side."
        };
      case "tourist-safety":
      default:
        return {
          score: 84,
          docScore: 70,
          structScore: 90,
          maintScore: 92,
          emptyFolders: ["server/logs/archive"],
          deadFiles: ["models/mockSOS.js"],
          missingSections: ["Deployment", "Features"],
          improvedReadme: "# Tourist Safety Hub (SIH 2025)\n\nNode.js/Express app for tourist safety — SOS alerts, live tracking, admin dashboard.\n\n## Features\n- Geographic coordinates mapping\n- Incident logging persistence\n- Admin live WebSocket console dashboard\n\n## Deployment\nConfigure MongoDB Atlas keys and Twilio credentials inside your environment parameters, then launch via:\n```bash\nnpm run start\n```"
        };
    }
  };

  const handleScan = () => {
    setIsScanning(true);
    setHasScanned(false);
    setResult(null);

    setTimeout(() => {
      const data = getMockHealth(projectId);
      setResult(data);
      setHasScanned(true);
      setIsScanning(false);
    }, 1100);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white mb-2 flex items-center gap-3 tracking-tight">
            <FileCode className="w-5.5 h-5.5 text-zinc-400" /> Repo Health & README Audit
          </h1>
          <p className="text-zinc-400 text-xs max-w-xl">
            Scan your project's folders for structural issues and inspect your README file for missing sections.
          </p>
        </div>
        <button 
          onClick={handleScan}
          disabled={isScanning}
          className="flex items-center gap-2 px-4.5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
        >
          <Activity className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
          {isScanning ? "Scanning..." : "Scan Repository"}
        </button>
      </div>

      {/* Main Scan Results display */}
      {result && hasScanned && (
        <div className="flex flex-col gap-6 animate-slide-up">
          {/* Score gauges */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Overall Score */}
            <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center">
              <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Overall Score</div>
              <div className="relative flex items-center justify-center">
                <span className="text-4xl font-extrabold text-white">{result.score}</span>
                <span className="text-zinc-500 font-semibold text-xs absolute -right-3 -bottom-1">%</span>
              </div>
              <div className="text-[9px] font-semibold text-amber-400 mt-4 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Scan Complete
              </div>
            </div>

            {/* Sub Scores */}
            <div className="glass-panel p-6 rounded-2xl md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Doc score */}
              <div className="flex flex-col justify-between">
                <div>
                  <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Documentation</div>
                  <div className="text-xl font-extrabold text-white">{result.docScore}%</div>
                </div>
                <div className="text-[10px] text-zinc-500 leading-normal mt-4">
                  {result.missingSections.length > 0 
                    ? `Missing ${result.missingSections.length} key sections in README.`
                    : "All mandatory sections present in README!"}
                </div>
              </div>

              {/* Structure score */}
              <div className="flex flex-col justify-between border-t sm:border-t-0 sm:border-l border-zinc-900 pt-4 sm:pt-0 sm:pl-6">
                <div>
                  <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Structure</div>
                  <div className="text-xl font-extrabold text-white">{result.structScore}%</div>
                </div>
                <div className="text-[10px] text-zinc-500 leading-normal mt-4">
                  {result.emptyFolders.length > 0 
                    ? `Found ${result.emptyFolders.length} empty directory structures.`
                    : "No empty directories detected in scans."}
                </div>
              </div>

              {/* Maintainability */}
              <div className="flex flex-col justify-between border-t sm:border-t-0 sm:border-l border-zinc-900 pt-4 sm:pt-0 sm:pl-6">
                <div>
                  <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Maintainability</div>
                  <div className="text-xl font-extrabold text-white">{result.maintScore}%</div>
                </div>
                <div className="text-[10px] text-zinc-500 leading-normal mt-4">
                  {result.deadFiles.length > 0 
                    ? `Identified ${result.deadFiles.length} dead/unused script file.`
                    : "No dead scripts/backups detected."}
                </div>
              </div>
            </div>
          </div>

          {/* Audit findings checklists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Folder issues */}
            <div className="glass-panel p-6 rounded-2xl">
              <h2 className="text-xs font-bold text-white mb-4 flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-zinc-400" /> Structure Audit Listings
              </h2>

              <div className="flex flex-col gap-3">
                {result.emptyFolders.length === 0 && result.deadFiles.length === 0 ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 text-zinc-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-zinc-500" />
                    <span className="text-xs font-semibold">Perfect structure hygiene. No issues detected.</span>
                  </div>
                ) : (
                  <>
                    {result.emptyFolders.map((folder, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-zinc-900 bg-zinc-900/30">
                        <div className="flex items-center gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-zinc-500" />
                          <span className="text-xs font-semibold text-zinc-300">Empty directory: <code className="text-zinc-400 font-mono">{folder}</code></span>
                        </div>
                        <span className="text-[9px] font-bold bg-zinc-900 text-zinc-500 px-2 py-0.5 rounded border border-zinc-800">Warning</span>
                      </div>
                    ))}
                    {result.deadFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-zinc-900 bg-zinc-900/30">
                        <div className="flex items-center gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-zinc-500" />
                          <span className="text-xs font-semibold text-zinc-300">Unused/Dead script: <code className="text-zinc-400 font-mono">{file}</code></span>
                        </div>
                        <span className="text-[9px] font-bold bg-zinc-900 text-zinc-500 px-2 py-0.5 rounded border border-zinc-800">Dead Code</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Doc issues */}
            <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between gap-6">
              <div>
                <h2 className="text-xs font-bold text-white mb-4 flex items-center gap-2">
                  <FileCode className="w-4.5 h-4.5 text-zinc-400" /> README documentation audit
                </h2>

                <div className="flex flex-col gap-3">
                  {result.missingSections.length === 0 ? (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 text-zinc-400">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-zinc-500" />
                      <span className="text-xs font-semibold">Perfect documentation score. All sections look rich!</span>
                    </div>
                  ) : (
                    result.missingSections.map((section, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-zinc-900 bg-zinc-900/30">
                        <div className="flex items-center gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-zinc-550" />
                          <span className="text-xs font-semibold text-zinc-300">Missing documentation: <code className="text-zinc-400 font-mono">{section}</code> section</span>
                        </div>
                        <span className="text-[9px] font-bold bg-zinc-900 text-zinc-500 px-2 py-0.5 rounded border border-zinc-800">Missing</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {result.missingSections.length > 0 && (
                <button 
                  onClick={() => setReadmeShowing(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-200 transition-all cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-amber-400" /> Auto-Generate README_improved.md
                </button>
              )}
            </div>
          </div>

          {/* Generated README Display */}
          {readmeShowing && (
            <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4 animate-slide-up">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                <div>
                  <h3 className="text-xs font-bold text-white">Generated Document: README_improved.md</h3>
                  <p className="text-[9px] text-zinc-500">Intelligently filled based on actual files and directories</p>
                </div>

                <button 
                  onClick={() => copyToClipboard(result.improvedReadme)}
                  className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-amber-500" /> Copied!
                    </>
                  ) : (
                    <>
                      <Clipboard className="w-4 h-4" /> Copy Markdown
                    </>
                  )}
                </button>
              </div>

              <div className="bg-zinc-950 rounded-xl border border-zinc-900 p-5 font-mono text-xs text-zinc-300 max-h-[250px] overflow-y-auto leading-relaxed">
                <pre className="whitespace-pre-wrap">{result.improvedReadme}</pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

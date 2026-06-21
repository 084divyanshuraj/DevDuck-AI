"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Terminal, 
  ChevronRight, 
  ShieldCheck, 
  FileCode, 
  GitPullRequest, 
  Activity, 
  AlertTriangle,
  Bot,
  Bug,
  FileText,
  Plus,
  FolderOpen
} from "lucide-react";

export default function DashboardOverview() {
  const [projectId, setProjectId] = useState("taskapp");
  
  const defaultDetails = {
    taskapp: {
      name: "TaskApp — Full Stack Task Manager",
      description: "Node.js/Express + SQLite task management app with JWT auth and WebSocket live sync",
      healthScore: 92,
      totalBugs: 14,
      prStatus: "APPROVED",
      lastSync: "2 hours ago",
      details: "Database index applied successfully. Environment config validated."
    },
    "weather-website": {
      name: "Simple Weather Website",
      description: "Python/Flask backend + vanilla JS frontend, pulls live weather from OpenWeather API",
      healthScore: 78,
      totalBugs: 4,
      prStatus: "BLOCKED",
      lastSync: "1 day ago",
      details: "Deployment documentation missing in README. Code scan revealed 2 empty directories."
    },
    "tic-tac-toe": {
      name: "Tic-Tac-Toe",
      description: "Vanilla HTML/CSS/JS browser game, no backend",
      healthScore: 100,
      totalBugs: 0,
      prStatus: "APPROVED",
      lastSync: "3 days ago",
      details: "Perfect code hygiene. Zero bugs in memory database."
    },
    "tourist-safety": {
      name: "Tourist Safety Hub (SIH 2025)",
      description: "Node.js/Express app for tourist safety — SOS alerts, live tracking, admin dashboard",
      healthScore: 84,
      totalBugs: 9,
      prStatus: "APPROVED",
      lastSync: "4 hours ago",
      details: "Memory synchronized with 9 resolved production incidents."
    }
  };

  const [projectDetails, setProjectDetails] = useState<Record<string, any>>(defaultDetails);

  const loadProjectDetails = () => {
    const stored = localStorage.getItem("devduck_project_details");
    let details = stored ? JSON.parse(stored) : { ...defaultDetails };

    // Self-heal details for projects present in devduck_projects but missing from devduck_project_details
    const storedProjects = localStorage.getItem("devduck_projects");
    if (storedProjects) {
      try {
        const projectsList = JSON.parse(storedProjects);
        let updated = false;
        for (const p of projectsList) {
          if (p.id && !details[p.id]) {
            details[p.id] = {
              name: p.name,
              description: p.description || "Repository registered in the system.",
              healthScore: 90,
              totalBugs: 0,
              prStatus: "APPROVED",
              lastSync: "Synced via backend",
              details: "Repository configuration loaded from projects.json."
            };
            updated = true;
          }
        }
        if (updated) {
          localStorage.setItem("devduck_project_details", JSON.stringify(details));
        }
      } catch (e) {
        console.error("Error healing project details:", e);
      }
    }

    setProjectDetails(details);
  };

  useEffect(() => {
    loadProjectDetails();
    if (typeof window !== "undefined") {
      const active = localStorage.getItem("devduck_active_project") || "taskapp";
      setProjectId(active);
    }

    const handleProjectChanged = (e: Event) => {
      const customEvent = e as CustomEvent;
      setProjectId(customEvent.detail);
    };

    window.addEventListener("projectChanged", handleProjectChanged);
    window.addEventListener("projectsUpdated", loadProjectDetails);

    return () => {
      window.removeEventListener("projectChanged", handleProjectChanged);
      window.removeEventListener("projectsUpdated", loadProjectDetails);
    };
  }, []);

  const project = projectDetails[projectId] || projectDetails.taskapp || defaultDetails.taskapp;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Workspace Overview
          </span>
          <h1 className="text-xl font-bold text-white mb-1.5 tracking-tight">
            {project.name}
          </h1>
          <p className="text-zinc-400 text-xs max-w-xl">
            {project.description}
          </p>
        </div>
        <div className="flex flex-col gap-1 items-end bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-2 shrink-0">
          <span className="text-[9px] uppercase font-bold text-zinc-500">Parcle Last Sync</span>
          <span className="text-xs font-semibold text-zinc-300">{project.lastSync}</span>
        </div>
      </div>

      {/* Grid of Key stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stat 1: Health Score */}
        <div className="glass-panel p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Repository Health</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border
              ${project.healthScore >= 90 ? "bg-zinc-900 text-amber-400 border-amber-500/10" : 
                project.healthScore >= 80 ? "bg-zinc-900 text-zinc-300 border-zinc-800" : 
                "bg-zinc-900 text-amber-500 border-amber-500/10"}
            `}>
              {project.healthScore >= 90 ? "Optimal" : project.healthScore >= 80 ? "Good" : "Needs Review"}
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-white">{project.healthScore}</span>
            <span className="text-zinc-500 font-semibold text-xs">/100</span>
          </div>
          <div className="w-full bg-zinc-950 h-1.5 rounded-full mt-4 overflow-hidden border border-zinc-800">
            <div 
              className={`h-full rounded-full transition-all duration-500 
                ${project.healthScore >= 90 ? "bg-amber-600" : 
                  project.healthScore >= 80 ? "bg-zinc-500" : 
                  "bg-amber-500"}`}
              style={{ width: `${project.healthScore}%` }}
            />
          </div>
        </div>

        {/* Stat 2: Solved Bugs */}
        <div className="glass-panel p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Bugs in Memory</span>
            <Bug className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-white">{project.totalBugs}</span>
            <span className="text-zinc-500 font-medium text-[10px] ml-1">resolved logs</span>
          </div>
          <div className="text-[9px] text-zinc-500 font-medium mt-4">
            Cross-referenced on pull request commits.
          </div>
        </div>

        {/* Stat 3: PR review status */}
        <div className="glass-panel p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Last Review Decision</span>
            <GitPullRequest className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-base font-extrabold px-2.5 py-1 rounded-lg border
              ${project.prStatus === "APPROVED" ? "bg-zinc-900 text-amber-400 border-amber-500/10" : 
                project.prStatus === "BLOCKED" ? "bg-zinc-900 text-rose-450 border-rose-500/10" : 
                "bg-zinc-900 text-zinc-400 border-zinc-800"}
            `}>
              {project.prStatus}
            </span>
          </div>
          <div className="text-[9px] text-zinc-500 font-medium mt-4">
            Checked against vector repositories.
          </div>
        </div>

        {/* Stat 4: Memory Ingest size */}
        <div className="glass-panel p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Ingested Files</span>
            <FileText className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-white">42</span>
            <span className="text-zinc-500 font-medium text-[10px] ml-1">source files</span>
          </div>
          <div className="text-[9px] text-zinc-500 font-medium mt-4">
            Binaries and .env configuration ignored.
          </div>
        </div>
      </div>

      {/* Main Section layout: Recent Activity and Sync Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent memory activity */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2">
          <h2 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
            <Activity className="w-4.5 h-4.5 text-zinc-400" /> Codebase Sync Activity
          </h2>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-zinc-900/30 border border-zinc-900">
              <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 text-zinc-400">
                <ShieldCheck className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-zinc-200">Status Verified</span>
                  <span className="text-[10px] text-zinc-500">2 hours ago</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {project.details}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-zinc-900/30 border border-zinc-900">
              <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 text-zinc-400">
                <Bug className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-zinc-200">Incident Scan Complete</span>
                  <span className="text-[10px] text-zinc-500">4 hours ago</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Query resolved against record <code className="text-zinc-300 bg-zinc-800 px-1 py-0.5 rounded border border-zinc-850">"500 Login Error"</code>. Fixed parameters applied.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-zinc-900/30 border border-zinc-900">
              <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 text-zinc-400">
                <GitPullRequest className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-zinc-200">Commit Audit Completed</span>
                  <span className="text-[10px] text-zinc-500">Yesterday</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Repository scan checkout on diff file <code className="text-zinc-300 bg-zinc-800 px-1 py-0.5 rounded border border-zinc-850">sample_pr.diff</code>. Status: Approved.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Ingestion Status */}
        <div className="flex flex-col gap-6">
          {/* Vector Database Card */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                <Terminal className="w-4.5 h-4.5 text-zinc-400" /> Vector Database
              </h2>
              <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                Kala AI processes and updates files dynamically using vectors. The indexed code database matches semantics with zero sync delay.
              </p>

              <div className="flex flex-col gap-2 text-xs text-zinc-300">
                <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-800/80 bg-zinc-900/30">
                  <span className="text-zinc-450 font-medium">Memory Engine</span>
                  <span className="font-semibold text-amber-500">Parcle DB</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-800/80 bg-zinc-900/30">
                  <span className="text-zinc-450 font-medium">Active Namespace</span>
                  <span className="font-mono text-zinc-300 font-semibold">{projectId}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 text-xs flex gap-2.5">
              <AlertTriangle className="w-4.5 h-4.5 text-amber-500 shrink-0" />
              <div>
                <div className="font-bold text-[9px] uppercase tracking-wider text-zinc-400 mb-0.5">Parcle Vector Memory</div>
                <p className="text-[10px] text-zinc-500 leading-normal">
                  To sync fresh files with indexes, run Choice #6 in the CLI script.
                </p>
              </div>
            </div>
          </div>

          {/* Register New Project Card */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <FolderOpen className="w-4.5 h-4.5 text-zinc-400" /> Register Repository
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                Deploy a new code memory namespace context from your browser. This instantly indexes your project structure and enables onboarding chat and PR checks.
              </p>
            </div>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent("openAddProjectModal"))}
              className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-bold text-amber-500 hover:text-amber-400 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Project Context
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { 
  LayoutDashboard, 
  Bot, 
  Bug, 
  FileCode, 
  GitPullRequest, 
  ChevronRight,
  Database,
  User,
  Settings,
  Circle,
  Menu,
  X
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [activeProject, setActiveProject] = useState("taskapp");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const projects = [
    { id: "taskapp", name: "TaskApp (Node.js/SQLite)" },
    { id: "weather-website", name: "Weather Website (Flask)" },
    { id: "tic-tac-toe", name: "Tic-Tac-Toe (HTML/CSS/JS)" },
    { id: "tourist-safety", name: "Tourist Safety Hub (Node.js)" }
  ];

  const menuItems = [
    { name: "Overview", path: "/dashboard", icon: LayoutDashboard },
    { name: "Onboarding Chat", path: "/dashboard/chat", icon: Bot },
    { name: "Zero-Sync Debugger", path: "/dashboard/debugger", icon: Bug },
    { name: "Repo Health & Docs", path: "/dashboard/health", icon: FileCode },
    { name: "PR Reviewer Bot", path: "/dashboard/reviewer", icon: GitPullRequest },
  ];

  return (
    <div className="min-h-screen bg-transparent flex flex-col md:flex-row relative">
      {/* MOBILE HEADER */}
      <header className="flex md:hidden items-center justify-between px-6 py-4 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md z-30 w-full fixed top-0 left-0">
        <Link href="/" className="flex items-center">
          <div className="w-24 h-12 relative overflow-hidden transition-all duration-300 flex items-center justify-center">
            <img src="/kala-logo.png" alt="Kala AI Logo" className="w-full h-full object-contain" />
          </div>
        </Link>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-zinc-400 hover:text-white transition-colors"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* SIDEBAR FOR DESKTOP */}
      <aside className={`w-full md:w-64 border-r border-zinc-900 bg-zinc-950/30 backdrop-blur-md flex-col justify-between z-20 transition-all duration-300 md:flex
        ${mobileMenuOpen ? 'flex fixed inset-y-0 left-0 w-72 pt-20 border-r border-zinc-800' : 'hidden md:sticky md:top-0 md:h-screen md:pt-0'}
      `}>
        <div className="px-6 py-6 flex flex-col gap-6">
          {/* Logo */}
          <Link href="/" className="hidden md:flex justify-start -ml-4">
            <div className="w-32 h-16 relative overflow-hidden transition-all duration-300 flex items-center justify-center">
              <img src="/kala-logo.png" alt="Kala AI Logo" className="w-full h-full object-contain" />
            </div>
          </Link>

          {/* Project Context */}
          <div className="flex flex-col gap-2 mt-4 md:mt-0">
            <label className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 flex items-center gap-1">
              <Database className="w-3 h-3 text-amber-500" /> Active Context
            </label>
            <div className="relative">
              <select 
                value={activeProject}
                onChange={(e) => {
                  setActiveProject(e.target.value);
                  const event = new CustomEvent("projectChanged", { detail: e.target.value });
                  window.dispatchEvent(event);
                }}
                className="w-full text-xs font-semibold bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 rounded-xl px-3 py-2 text-zinc-200 outline-none cursor-pointer transition-colors appearance-none"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-zinc-950 text-zinc-400 font-semibold">{p.name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-550">
                <ChevronRight className="w-3.5 h-3.5 rotate-90" />
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex flex-col gap-1 mt-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 group
                    ${isActive 
                      ? "bg-amber-500/10 text-amber-500 border border-amber-500/10" 
                      : "text-zinc-450 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent"}
                  `}
                >
                  <Icon className={`w-3.5 h-3.5 transition-colors ${isActive ? "text-amber-500" : "text-zinc-500 group-hover:text-zinc-400"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile */}
        <div className="px-6 py-5 border-t border-zinc-900/60 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-6.5 h-6.5 rounded-full bg-zinc-900/60 border border-zinc-800 flex items-center justify-center text-zinc-400 font-bold text-xs">
                <User className="w-3 h-3" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-zinc-300">Admin Portal</div>
                <div className="text-[8px] text-zinc-550 flex items-center gap-1.5">
                  <Circle className="w-1.5 h-1.5 fill-amber-500 text-amber-500" /> Parcle Connected
                </div>
              </div>
            </div>
            <button className="text-zinc-500 hover:text-zinc-400 transition-colors">
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 pt-16 md:pt-0">
        <main className="p-6 md:p-8 max-w-7xl mx-auto w-full flex-1 flex flex-col gap-6">
          {children}
        </main>
      </div>
    </div>
  );
}

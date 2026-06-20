"use client";

import Link from "next/link";
import { 
  Terminal, 
  Bot, 
  Bug, 
  FileCode, 
  GitPullRequest, 
  ChevronRight
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-between">
      {/* HEADER NAVBAR */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <Link href="/" className="group">
          <div className="w-36 h-20 relative overflow-hidden transition-all duration-300 flex items-center justify-center">
            <img src="/kala-logo.png" alt="Kala AI" className="w-full h-full object-contain" />
          </div>
        </Link>
        
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard" 
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 hover:text-white transition-all duration-300"
          >
            Sign In
          </Link>
          <Link 
            href="/dashboard" 
            className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition-all duration-300"
          >
            Open Console <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 flex flex-col justify-center py-12 z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-6 leading-tight">
            Codebase Intelligence for Teams.
          </h1>

          <p className="text-sm md:text-base text-zinc-400 mb-8 leading-relaxed max-w-xl mx-auto">
            Give every project in your team a private, persistent memory. Onboard developers in seconds, diagnose errors using past fixes, and review PR regressions.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link 
              href="/dashboard" 
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition-all duration-300"
            >
              Get Started Free 
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link 
              href="/dashboard" 
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 rounded-xl text-xs font-semibold border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white transition-all duration-300"
            >
              <Terminal className="w-3.5 h-3.5 text-amber-400" /> Run CLI Menu
            </Link>
          </div>
        </div>

        {/* CORE MODULES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto w-full mb-16">
          {/* Card 1: Onboarding */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between group hover:border-zinc-700 transition-all duration-300">
            <div>
              <div className="p-2.5 w-fit bg-zinc-900 rounded-xl border border-zinc-800/60 text-amber-400 mb-5">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white mb-2">Onboarding Chat</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Let new developers ask natural-language questions about any project and get instant, cited answers directly from the code.
              </p>
            </div>
            <Link href="/dashboard/chat" className="mt-6 flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors">
              Open Chatbot <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 2: Debugger */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between group hover:border-zinc-700 transition-all duration-300">
            <div>
              <div className="p-2.5 w-fit bg-zinc-900 rounded-xl border border-zinc-800/60 text-amber-400 mb-5">
                <Bug className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white mb-2">Zero-Sync Debugger</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Describe a current bug or paste a console stack trace to cross-reference similar past bugs, their root causes, and verified fixes.
              </p>
            </div>
            <Link href="/dashboard/debugger" className="mt-6 flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors">
              Start Debugging <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 3: README Cleanup */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between group hover:border-zinc-700 transition-all duration-300">
            <div>
              <div className="p-2.5 w-fit bg-zinc-900 rounded-xl border border-zinc-800/60 text-amber-400 mb-5">
                <FileCode className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white mb-2">README Cleanup Bot</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Scan repository structure for unused folders, dead files, and audit README.md files to automatically generate missing sections.
              </p>
            </div>
            <Link href="/dashboard/health" className="mt-6 flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors">
              Run Repository Scan <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 4: PR Reviewer */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between group hover:border-zinc-700 transition-all duration-300">
            <div>
              <div className="p-2.5 w-fit bg-zinc-900 rounded-xl border border-zinc-800/60 text-amber-400 mb-5">
                <GitPullRequest className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white mb-2">PR Reviewer</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Intercept code diffs during code submission, review against past bug memory, and block changes that re-introduce regression bugs.
              </p>
            </div>
            <Link href="/dashboard/reviewer" className="mt-6 flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors">
              Review Code Diff <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 border-t border-zinc-900 text-center text-[11px] text-zinc-500 z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>&copy; {new Date().getFullYear()} Kala AI. All Rights Reserved.</div>
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="hover:text-zinc-300 transition-colors">Console</Link>
          <a href="https://github.com/Parcle-AI/parcle-memory" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors">Parcle Memory Engine</a>
        </div>
      </footer>
    </div>
  );
}

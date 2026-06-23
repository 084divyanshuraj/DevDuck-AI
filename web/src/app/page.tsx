"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  GithubAuthProvider, 
  signInWithPopup, 
  sendPasswordResetEmail,
  updateProfile
} from "firebase/auth";
import { auth } from "./lib/firebase";
import { 
  Terminal as TerminalIcon, 
  Bot, 
  Bug, 
  FileCode, 
  GitPullRequest, 
  ChevronRight,
  X,
  Copy,
  Check,
  ArrowRight,
  Lock,
  Sparkles,
  Database,
  Building,
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
  User
} from "lucide-react";

const MENU_TEXT = `==================================================
  🦆 DevDuck AI
==================================================

What would you like to do?

  1. Onboard onto a project (ask questions)
  2. Debug a bug (search past fixes)
  3. Check repo health (README / structure)
  4. Review a PR diff

  5. ➕ Add a new project

  (Adding a new project? Run: python devduck.py --setup)

  0. Exit

Pick an option: `;

const SETUP_MENU_TEXT = `==================================================
  🦆 DevDuck AI (Setup Mode)
==================================================

What would you like to do?

  1. Onboard onto a project (ask questions)
  2. Debug a bug (search past fixes)
  3. Check repo health (README / structure)
  4. Review a PR diff

  5. ➕ Add a new project

  6. Sync bug history into memory (run before #2 / #4)
  7. Ingest/re-ingest ALL projects' source code into memory

  0. Exit

Pick an option: `;

export default function LandingPage() {
  // Modal states
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  // Password Recovery Toggle
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetSent, setIsResetSent] = useState(false);
  const [resetError, setResetError] = useState("");

  // Sign In states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [signInError, setSignInError] = useState("");
  const [isSignInSubmitting, setIsSignInSubmitting] = useState(false);

  // Sign Up states
  const [fullName, setFullName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [signUpError, setSignUpError] = useState("");
  const [isSignUpSubmitting, setIsSignUpSubmitting] = useState(false);



  // Terminal simulator states
  const [terminalTab, setTerminalTab] = useState<"cli" | "install">("cli");
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    "devduck-cli$ python devduck.py",
    "",
    ...MENU_TEXT.split("\n")
  ]);
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalMode, setTerminalMode] = useState<"shell" | "menu" | "setup" | "bot_chat" | "bot_debug" | "bot_add_name" | "bot_add_path" | "press_enter">("menu");
  const [showSetup, setShowSetup] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isTerminalOpen) {
      terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalHistory, isTerminalOpen]);

  // Social Login handler
  const handleSocialLogin = async (platform: "google" | "github") => {
    setIsSignInSubmitting(true);
    setIsSignUpSubmitting(true);
    setSignInError("");
    setSignUpError("");
    // MOCK AUTH FOR HACKATHON DEMO
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 800);
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setSignInError("Please enter your email and password.");
      return;
    }
    setIsSignInSubmitting(true);
    setSignInError("");
    // MOCK AUTH FOR HACKATHON DEMO
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 800);
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !signUpEmail || !signUpPassword || !workspaceName) {
      setSignUpError("Please fill out all fields.");
      return;
    }
    if (!agreeTerms) {
      setSignUpError("You must agree to the Terms of Service & Privacy Policy.");
      return;
    }
    setIsSignUpSubmitting(true);
    setSignUpError("");
    // MOCK AUTH FOR HACKATHON DEMO
    localStorage.setItem(`devduck_workspace_mock_demo_user`, workspaceName);
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 800);
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setResetError("Please enter your email address.");
      return;
    }
    setResetError("");
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setIsResetSent(true);
    } catch (err: any) {
      console.error(err);
      setResetError(err.message || "Failed to send password recovery email.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput.trim();
    setTerminalInput("");
    
    if (!cmd && terminalMode !== "press_enter") return;

    if (terminalMode !== "press_enter") {
      setTerminalHistory(prev => [...prev, `devduck-cli$ ${cmd}`]);
    }

    if (terminalMode === "shell") {
      if (cmd === "python devduck.py") {
        setTerminalMode("menu");
        setShowSetup(false);
        setTerminalHistory(prev => [
          ...prev,
          "",
          ...MENU_TEXT.split("\n")
        ]);
      } else if (cmd === "python devduck.py --setup") {
        setTerminalMode("setup");
        setShowSetup(true);
        setTerminalHistory(prev => [
          ...prev,
          "",
          ...SETUP_MENU_TEXT.split("\n")
        ]);
      } else if (cmd === "clear") {
        setTerminalHistory([]);
      } else if (cmd === "help") {
        setTerminalHistory(prev => [
          ...prev,
          "Available commands:",
          "  python devduck.py          - Run main CLI menu",
          "  python devduck.py --setup  - Run CLI menu with setup tasks unlocked",
          "  clear                      - Clear the screen buffer",
          "  help                       - Show this guide",
          ""
        ]);
      } else if (cmd) {
        setTerminalHistory(prev => [
          ...prev,
          `command not found: ${cmd}`,
          ""
        ]);
      }
    } else if (terminalMode === "menu" || terminalMode === "setup") {
      if (cmd === "0") {
        setTerminalMode("shell");
        setTerminalHistory(prev => [
          ...prev,
          "Goodbye!",
          ""
        ]);
      } else if (cmd === "1") {
        setTerminalMode("bot_chat");
        setTerminalHistory(prev => [
          ...prev,
          "→ Launching Parcle-Test/chat.py ...",
          "",
          "[DevDuck AI Assistant] Hello! I've loaded the Parcle context.",
          "Ask me anything about your project's files (or type 'exit' to return to menu):",
          ""
        ]);
      } else if (cmd === "2") {
        setTerminalMode("bot_debug");
        setTerminalHistory(prev => [
          ...prev,
          "→ Launching zero-sync-debugger/debug_search.py ...",
          "",
          "[Zero-Sync Debugger] Paste your stacktrace or describe the bug (or type 'exit' to return):",
          ""
        ]);
      } else if (cmd === "3") {
        setTerminalHistory(prev => [
          ...prev,
          "→ Launching readme-cleanup-bot/report_generator.py ...",
          "[README Cleanup Bot] Scanning repository structure...",
          "  ✔ Checked 42 source files in workspace.",
          "  ✔ Found 2 empty directories: temp_logs, build_cache.",
          "  ✔ Audit README.md: Optimal (92/100).",
          "  ✔ Missing section detected: 'Deployment Instructions'.",
          "  ✔ Auto-generated missing instructions section using Parcle memory.",
          "  ✔ Saved report to readme-cleanup-bot/report.txt.",
          "← Returned from readme-cleanup-bot/report_generator.py",
          "",
          "[Press Enter to return to menu]"
        ]);
        setTerminalMode("press_enter");
      } else if (cmd === "4") {
        setTerminalHistory(prev => [
          ...prev,
          "→ Launching pr-reviewer-bot/reviewer.py ...",
          "[PR Reviewer Bot] Intercepting PR diff 'sample_pr.diff'...",
          "  ✔ Auditing changes against vector bug database...",
          "  ✔ Decision: APPROVED (Perfect code hygiene. Zero bugs re-introduced).",
          "← Returned from pr-reviewer-bot/reviewer.py",
          "",
          "[Press Enter to return to menu]"
        ]);
        setTerminalMode("press_enter");
      } else if (cmd === "5") {
        setTerminalMode("bot_add_name");
        setTerminalHistory(prev => [
          ...prev,
          "→ Launching Parcle-Test/add_project.py ...",
          "Enter new project name (or type 'exit' to return):"
        ]);
      } else if (terminalMode === "setup" && cmd === "6") {
        setTerminalHistory(prev => [
          ...prev,
          "→ Launching zero-sync-debugger/ingest_bugs.py ...",
          "[Ingest Bugs] Loading raw bug files...",
          "  - Ingested 14 SQLite/Express bug patterns.",
          "  - Ingested 9 SIH-25 tourist safety incidents.",
          "  - Memory database updated successfully!",
          "← Returned from zero-sync-debugger/ingest_bugs.py",
          "",
          "[Press Enter to return to menu]"
        ]);
        setTerminalMode("press_enter");
      } else if (terminalMode === "setup" && cmd === "7") {
        setTerminalHistory(prev => [
          ...prev,
          "→ Launching Parcle-Test/ingest_all_projects.py ...",
          "[Ingestion Engine] Indexing workspace source files...",
          "  - Processing: TaskApp (42 files) ... Done",
          "  - Processing: Weather Website (4 files) ... Done",
          "  - Processing: Tic-Tac-Toe (3 files) ... Done",
          "  - Processing: Tourist Safety (31 files) ... Done",
          "  ✔ Ingestion complete. Vector namespaces synchronized.",
          "← Returned from Parcle-Test/ingest_all_projects.py",
          "",
          "[Press Enter to return to menu]"
        ]);
        setTerminalMode("press_enter");
      } else {
        setTerminalHistory(prev => [
          ...prev,
          "Invalid choice, try again.",
          "",
          ...(showSetup ? SETUP_MENU_TEXT : MENU_TEXT).split("\n")
        ]);
      }
    } else if (terminalMode === "bot_chat") {
      if (cmd.toLowerCase() === "exit") {
        setTerminalMode(showSetup ? "setup" : "menu");
        setTerminalHistory(prev => [
          ...prev,
          "Returned to main menu.",
          "",
          ...(showSetup ? SETUP_MENU_TEXT : MENU_TEXT).split("\n")
        ]);
      } else {
        const q = cmd.toLowerCase();
        let answer = "Based on the project index, it is built with Node.js and Express. Try asking about 'database' or 'auth'.";
        if (q.includes("db") || q.includes("database") || q.includes("sqlite")) {
          answer = "This project uses a SQLite database configured via Sequelize ORM in 'server/config/database.js'.";
        } else if (q.includes("auth") || q.includes("jwt") || q.includes("login")) {
          answer = "Authentication is managed via JWT in 'server/middleware/auth.js' and 'authController.js'.";
        }
        setTerminalHistory(prev => [
          ...prev,
          `DevDuck AI: ${answer}`,
          "",
          "[DevDuck AI Assistant] Enter a question (or type 'exit' to return):",
          ""
        ]);
      }
    } else if (terminalMode === "bot_debug") {
      if (cmd.toLowerCase() === "exit") {
        setTerminalMode(showSetup ? "setup" : "menu");
        setTerminalHistory(prev => [
          ...prev,
          "Returned to main menu.",
          "",
          ...(showSetup ? SETUP_MENU_TEXT : MENU_TEXT).split("\n")
        ]);
      } else {
        setTerminalHistory(prev => [
          ...prev,
          "Analyzing incident...",
          "  ✔ Severity: ERROR",
          "  ✔ Confidence: 94%",
          "  ✔ Root Cause: Environment config variable JWT_SECRET is undefined in the server runtime.",
          "  ✔ Suggested Fix: Add 'JWT_SECRET=your_signing_secret_key' to your local .env file.",
          "",
          "[Zero-Sync Debugger] Paste your stacktrace or describe the bug (or type 'exit' to return):",
          ""
        ]);
      }
    } else if (terminalMode === "bot_add_name") {
      if (cmd.toLowerCase() === "exit") {
        setTerminalMode(showSetup ? "setup" : "menu");
        setTerminalHistory(prev => [
          ...prev,
          "Returned to main menu.",
          "",
          ...(showSetup ? SETUP_MENU_TEXT : MENU_TEXT).split("\n")
        ]);
      } else {
        setNewProjectName(cmd);
        setTerminalMode("bot_add_path");
        setTerminalHistory(prev => [
          ...prev,
          `Project Name: ${cmd}`,
          "Enter local directory path, zip file path, or GitHub repository URL (or type 'exit' to return):"
        ]);
      }
    } else if (terminalMode === "bot_add_path") {
      if (cmd.toLowerCase() === "exit") {
        setTerminalMode(showSetup ? "setup" : "menu");
        setTerminalHistory(prev => [
          ...prev,
          "Returned to main menu.",
          "",
          ...(showSetup ? SETUP_MENU_TEXT : MENU_TEXT).split("\n")
        ]);
      } else {
        setTerminalHistory(prev => [
          ...prev,
          `Ingesting project from ${cmd}...`,
          "  - Parsing files...",
          "  - Segmenting code blocks...",
          "  - Indexing vectors in Parcle database...",
          `  ✔ Project '${newProjectName}' registered and synchronized successfully!`,
          "← Returned from Parcle-Test/add_project.py",
          "",
          "[Press Enter to return to menu]"
        ]);
        setTerminalMode("press_enter");
      }
    } else if (terminalMode === "press_enter") {
      setTerminalMode(showSetup ? "setup" : "menu");
      setTerminalHistory(prev => [
        ...prev,
        "",
        ...(showSetup ? SETUP_MENU_TEXT : MENU_TEXT).split("\n")
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col justify-between relative">
      {/* HEADER NAVBAR */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <Link href="/" className="group">
          <div className="w-36 h-20 relative overflow-hidden transition-all duration-300 flex items-center justify-center">
            <span className="text-2xl font-bold text-amber-400 tracking-tight">DevDuck AI</span>
          </div>
        </Link>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              setIsSignInOpen(true);
              setIsForgotPassword(false);
              setIsResetSent(false);
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 hover:text-white transition-all duration-300 cursor-pointer"
          >
            Sign In
          </button>
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
            <button 
              onClick={() => setIsSignUpOpen(true)}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition-all duration-300 cursor-pointer"
            >
              Get Started Free 
              <ChevronRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsTerminalOpen(true)}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 rounded-xl text-xs font-semibold border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white transition-all duration-300 cursor-pointer"
            >
              <TerminalIcon className="w-3.5 h-3.5 text-amber-400" /> Run CLI Menu
            </button>
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
        <div>&copy; {new Date().getFullYear()} DevDuck AI. All Rights Reserved.</div>
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="hover:text-zinc-300 transition-colors">Console</Link>
          <a href="https://github.com/Parcle-AI/parcle-memory" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors">Parcle Memory Engine</a>
        </div>
      </footer>

      {/* SIGN IN MODAL */}
      {isSignInOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div 
            onClick={() => setIsSignInOpen(false)} 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-backdrop-fade"
          />
          <div className="glass-panel w-full max-w-md p-6 sm:p-8 rounded-2xl relative z-10 animate-modal-enter shadow-2xl border border-zinc-850">
            <button 
              onClick={() => setIsSignInOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {!isForgotPassword ? (
              <>
                <div className="flex flex-col items-center mb-8">
                  <div className="mb-3 flex items-center justify-center gap-2">
                    <span className="text-3xl font-black tracking-tight text-gradient-gold">DevDuck AI</span>
                  </div>
                  <h2 className="text-xs font-semibold text-zinc-350 tracking-wider uppercase">Welcome Back</h2>
                  <p className="text-zinc-500 text-[10px] mt-1 font-medium tracking-wide text-center">Securely manage your developer index & codebase bots</p>
                </div>

                {/* Social Login buttons */}
                <div className="flex flex-col gap-2 mb-4">
                  <button 
                    type="button" 
                    onClick={() => handleSocialLogin("google")}
                    disabled={isSignInSubmitting}
                    className="w-full py-3 rounded-xl border border-zinc-800/80 bg-zinc-950 hover:bg-zinc-900/40 hover:border-amber-500/30 text-zinc-200 hover:text-white font-semibold text-xs transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 shadow-inner group"
                  >
                    <svg className="w-4 h-4 transition-transform group-hover:scale-105" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.65 1.42 7.54l3.83 2.97C6.18 7.36 8.87 5.04 12 5.04z" />
                      <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.42 3.58v2.97h3.91c2.28-2.1 3.54-5.19 3.54-8.7z" />
                      <path fill="#FBBC05" d="M5.25 14.54c-.24-.72-.37-1.49-.37-2.27s.13-1.55.37-2.27L1.42 7.54C.52 9.33 0 11.24 0 13.27s.52 3.94 1.42 5.73l3.83-2.97z" />
                      <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.91-2.97c-1.09.73-2.48 1.17-4.05 1.17-3.13 0-5.82-2.32-6.75-5.47L1.42 15.73C3.37 19.62 7.35 23 12 23z" />
                    </svg>
                    Continue with Google
                  </button>
                </div>

                {/* Divider */}
                <div className="flex items-center my-4">
                  <div className="flex-grow h-[1px] bg-zinc-900" />
                  <span className="px-3 text-[9px] font-bold text-zinc-650 uppercase tracking-widest">or email credentials</span>
                  <div className="flex-grow h-[1px] bg-zinc-900" />
                </div>

                <form onSubmit={handleSignInSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Email Address</label>
                    <div className="relative flex items-center">
                      <Mail className="w-4 h-4 text-zinc-550 absolute left-4 pointer-events-none" />
                      <input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        autoComplete="off"
                        className="premium-input w-full bg-zinc-950/60 border border-zinc-800/80 rounded-xl pl-11 pr-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:border-amber-600 outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Password</label>
                      <button 
                        type="button" 
                        onClick={() => setIsForgotPassword(true)}
                        className="text-[10px] font-bold text-amber-500 hover:text-amber-400 transition-colors cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative flex items-center">
                      <Lock className="w-4 h-4 text-zinc-550 absolute left-4 pointer-events-none" />
                      <input 
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="premium-input w-full bg-zinc-950/60 border border-zinc-800/80 rounded-xl pl-11 pr-11 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:border-amber-600 outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/60 transition-all cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center gap-2 mt-1">
                    <input 
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 accent-amber-500 rounded border-zinc-800 bg-zinc-950 cursor-pointer"
                    />
                    <label htmlFor="rememberMe" className="text-[10px] text-zinc-400 select-none cursor-pointer">
                      Remember this device
                    </label>
                  </div>

                  {signInError && (
                    <div className="text-xs text-rose-500 font-semibold">{signInError}</div>
                  )}

                  <button 
                    type="submit"
                    disabled={isSignInSubmitting}
                    className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:from-zinc-800 disabled:to-zinc-850 disabled:opacity-50 text-white font-bold text-xs transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-amber-900/10"
                  >
                    {isSignInSubmitting ? (
                      <>
                        <div className="spinner-gradient w-4 h-4 animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <span>Continue to Console</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-5 border-t border-zinc-900/60 text-center text-xs text-zinc-500">
                  Don't have an account?{" "}
                  <button 
                    onClick={() => {
                      setIsSignInOpen(false);
                      setIsSignUpOpen(true);
                    }}
                    className="text-amber-500 hover:text-amber-400 font-bold cursor-pointer"
                  >
                    Sign up
                  </button>
                </div>
              </>
            ) : (
              /* Forgot Password Screen */
              <>
                <div className="flex flex-col items-center mb-6">
                  <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 text-amber-500 mb-4">
                    <Mail className="w-6 h-6" />
                  </div>
                  <h2 className="text-lg font-bold text-white tracking-tight">Reset Password</h2>
                  <p className="text-zinc-500 text-xs mt-1 text-center max-w-[280px]">
                    We'll email you a recovery link to securely reset your console password.
                  </p>
                </div>

                {!isResetSent ? (
                  <form onSubmit={handleResetPasswordSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Email Address</label>
                      <div className="relative flex items-center">
                        <Mail className="w-4 h-4 text-zinc-550 absolute left-4 pointer-events-none" />
                        <input 
                          type="email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          placeholder="name@company.com"
                          className="premium-input w-full bg-zinc-950/60 border border-zinc-800/80 rounded-xl pl-11 pr-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:border-amber-600 outline-none"
                          required
                        />
                      </div>
                    </div>

                    {resetError && (
                      <div className="text-xs text-rose-500 font-semibold">{resetError}</div>
                    )}

                    <button 
                      type="submit"
                      className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-amber-900/10"
                    >
                      Send Password Recovery Link
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <div className="p-4 rounded-xl border border-emerald-500/10 bg-emerald-950/10 text-emerald-400 text-xs flex flex-col gap-2 mb-2 items-center text-center">
                    <Check className="w-6 h-6 text-emerald-400" />
                    <div>
                      <span className="font-bold block mb-0.5">Recovery Email Sent!</span>
                      Check your inbox at <span className="underline font-semibold">{resetEmail}</span> for further instructions.
                    </div>
                  </div>
                )}

                <button 
                  onClick={() => setIsForgotPassword(false)}
                  className="w-full mt-4 text-center text-xs font-bold text-zinc-400 hover:text-zinc-300 transition-colors cursor-pointer"
                >
                  ← Back to Login
                </button>
              </>
            )}

            <div className="mt-6 text-center text-zinc-650 text-[10px] font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 border-t border-zinc-900/60 pt-5">
              <Lock className="w-3.5 h-3.5" /> Secured by Parcle Enterprise
            </div>
          </div>
        </div>
      )}

      {/* SIGN UP / GET STARTED MODAL */}
      {isSignUpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div 
            onClick={() => setIsSignUpOpen(false)} 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-backdrop-fade"
          />
          <div className="glass-panel w-full max-w-md p-6 sm:p-8 rounded-2xl relative z-10 animate-modal-enter shadow-2xl border border-zinc-850">
            <button 
              onClick={() => setIsSignUpOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex flex-col items-center mb-6">
              <div className="mb-3 flex items-center justify-center">
                <span className="text-3xl font-black tracking-tight text-gradient-gold">DevDuck AI</span>
              </div>
              <h2 className="text-xs font-semibold text-zinc-350 tracking-wider uppercase">Deploy Workspace</h2>
              <p className="text-zinc-500 text-[10px] mt-1 font-medium tracking-wide text-center">Initialize a secure codebase index and developer bots</p>
            </div>

            {/* Social Logins */}
            <div className="flex flex-col gap-2 mb-4">
              <button 
                type="button" 
                onClick={() => handleSocialLogin("google")}
                disabled={isSignUpSubmitting}
                className="w-full py-3 rounded-xl border border-zinc-800/80 bg-zinc-950 hover:bg-zinc-900/40 hover:border-amber-500/30 text-zinc-200 hover:text-white font-semibold text-xs transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 shadow-inner group"
              >
                <svg className="w-4 h-4 transition-transform group-hover:scale-105" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.65 1.42 7.54l3.83 2.97C6.18 7.36 8.87 5.04 12 5.04z" />
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.42 3.58v2.97h3.91c2.28-2.1 3.54-5.19 3.54-8.7z" />
                  <path fill="#FBBC05" d="M5.25 14.54c-.24-.72-.37-1.49-.37-2.27s.13-1.55.37-2.27L1.42 7.54C.52 9.33 0 11.24 0 13.27s.52 3.94 1.42 5.73l3.83-2.97z" />
                  <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.91-2.97c-1.09.73-2.48 1.17-4.05 1.17-3.13 0-5.82-2.32-6.75-5.47L1.42 15.73C3.37 19.62 7.35 23 12 23z" />
                </svg>
                Sign up with Google
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center my-4">
              <div className="flex-grow h-[1px] bg-zinc-900" />
              <span className="px-3 text-[9px] font-bold text-zinc-650 uppercase tracking-widest">or register email</span>
              <div className="flex-grow h-[1px] bg-zinc-900" />
            </div>
            
            <form onSubmit={handleSignUpSubmit} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Full Name</label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-zinc-550 absolute left-4 pointer-events-none" />
                  <input 
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Rivera"
                    autoComplete="off"
                    className="premium-input w-full bg-zinc-950/60 border border-zinc-800/80 rounded-xl pl-11 pr-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:border-amber-600 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Workspace / Team Name</label>
                <div className="relative flex items-center">
                  <Building className="w-4 h-4 text-zinc-550 absolute left-4 pointer-events-none" />
                  <input 
                    type="text"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="my-cool-project"
                    autoComplete="off"
                    className="premium-input w-full bg-zinc-950/60 border border-zinc-800/80 rounded-xl pl-11 pr-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:border-amber-600 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Work Email</label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-zinc-550 absolute left-4 pointer-events-none" />
                  <input 
                    type="email"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="alex@company.com"
                    autoComplete="off"
                    className="premium-input w-full bg-zinc-950/60 border border-zinc-800/80 rounded-xl pl-11 pr-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:border-amber-600 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Password</label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-zinc-550 absolute left-4 pointer-events-none" />
                  <input 
                    type={showSignUpPassword ? "text" : "password"}
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                    className="premium-input w-full bg-zinc-950/60 border border-zinc-800/80 rounded-xl pl-11 pr-11 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:border-amber-600 outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                    className="absolute right-4 p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/60 transition-all cursor-pointer"
                  >
                    {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2 mt-1">
                <input 
                  type="checkbox"
                  id="agreeTerms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-3.5 h-3.5 mt-0.5 accent-amber-500 rounded border-zinc-800 bg-zinc-950 cursor-pointer"
                />
                <label htmlFor="agreeTerms" className="text-[10px] text-zinc-450 leading-relaxed select-none cursor-pointer">
                  I agree to the{" "}
                  <a href="#" className="text-amber-500 hover:text-amber-400 font-semibold underline">Terms of Service</a>{" "}
                  and{" "}
                  <a href="#" className="text-amber-500 hover:text-amber-400 font-semibold underline">Privacy Policy</a>.
                </label>
              </div>

              {signUpError && (
                <div className="text-xs text-rose-500 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  {signUpError}
                </div>
              )}

              <button 
                type="submit"
                disabled={isSignUpSubmitting}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:from-zinc-800 disabled:to-zinc-850 disabled:opacity-50 text-white font-bold text-xs transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-amber-900/10"
              >
                {isSignUpSubmitting ? (
                  <>
                    <div className="spinner-gradient w-4 h-4 animate-spin" />
                    <span>Creating workspace...</span>
                  </>
                ) : (
                  <>
                    <span>Deploy Workspace Now</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-zinc-900/60 text-center text-xs text-zinc-500">
              Already have an account?{" "}
              <button 
                onClick={() => {
                  setIsSignUpOpen(false);
                  setIsSignInOpen(true);
                }}
                className="text-amber-500 hover:text-amber-400 font-bold cursor-pointer"
              >
                Log in
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TERMINAL / CLI MODAL */}
      {isTerminalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div 
            onClick={() => setIsTerminalOpen(false)} 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="glass-panel w-full max-w-3xl rounded-2xl relative z-10 animate-fade-in shadow-2xl border border-zinc-850 flex flex-col overflow-hidden h-[80vh] sm:h-[550px]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900 bg-zinc-900/30">
              <div className="flex items-center gap-2.5">
                <TerminalIcon className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-zinc-250">DevDuck AI Console Terminal</span>
              </div>
              <button 
                onClick={() => setIsTerminalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-zinc-900/60 bg-zinc-950/20 px-6 py-2 gap-4">
              <button 
                onClick={() => setTerminalTab("cli")}
                className={`text-[10px] font-bold uppercase tracking-wider pb-1 transition-all cursor-pointer ${
                  terminalTab === "cli" 
                    ? "text-amber-500 border-b-2 border-amber-500" 
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Interactive CLI Simulator
              </button>
              <button 
                onClick={() => setTerminalTab("install")}
                className={`text-[10px] font-bold uppercase tracking-wider pb-1 transition-all cursor-pointer ${
                  terminalTab === "install" 
                    ? "text-amber-500 border-b-2 border-amber-500" 
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Local Setup Guide
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 flex flex-col bg-black/95 p-4 sm:p-6 overflow-hidden">
              {terminalTab === "cli" ? (
                <>
                  {/* CLI Simulator */}
                  <div className="flex-1 overflow-y-auto font-mono text-[11px] leading-relaxed text-zinc-300 flex flex-col gap-1 pr-2 scrollbar-thin">
                    {terminalHistory.map((line, index) => (
                      <div 
                        key={index} 
                        className={`whitespace-pre-wrap ${
                          line.startsWith("devduck-cli$") 
                            ? "text-zinc-500 font-bold" 
                            : line.includes("⚠️") || line.includes("Failed")
                            ? "text-rose-400 font-semibold"
                            : line.startsWith("DevDuck AI:") || line.includes("✔")
                            ? "text-amber-500 font-semibold"
                            : "text-zinc-350"
                        }`}
                      >
                        {line}
                      </div>
                    ))}
                    <div ref={terminalEndRef} />
                  </div>

                  {/* CLI Form */}
                  <form onSubmit={handleTerminalSubmit} className="mt-4 pt-4 border-t border-zinc-900/80 flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-zinc-500">devduck-cli$</span>
                    <input 
                      type="text"
                      value={terminalInput}
                      onChange={(e) => setTerminalInput(e.target.value)}
                      placeholder={
                        terminalMode === "press_enter" 
                          ? "Press Enter to continue..." 
                          : terminalMode === "bot_chat" 
                          ? "Ask a question, or type 'exit'..." 
                          : terminalMode === "bot_debug" 
                          ? "Describe the error, or type 'exit'..."
                          : "Enter choice (1-5, 0)..."
                      }
                      className="flex-1 bg-transparent font-mono text-[11px] text-zinc-200 outline-none placeholder-zinc-700"
                      autoFocus
                    />
                    <button 
                      type="submit" 
                      className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded text-[10px] font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      Send
                    </button>
                  </form>
                </>
              ) : (
                /* Setup Guide */
                <div className="flex-grow overflow-y-auto text-xs text-zinc-400 flex flex-col gap-5 leading-relaxed pr-2">
                  <div>
                    <h3 className="font-bold text-sm text-white mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" /> Run DevDuck CLI Locally
                    </h3>
                    <p className="text-[11px] text-zinc-500">
                      Take DevDuck AI's vector memory and automation bots directly to your terminal. Make sure you have python (3.9+) installed.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Execution Commands</span>
                      <button 
                        onClick={() => copyToClipboard(`git clone https://github.com/084divyanshuraj/DevDuck-AI.git\ncd DevDuck-AI\npip install -r requirements.txt\npython devduck.py`)}
                        className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                      >
                        {copiedCode ? (
                          <>
                            <Check className="w-3 h-3 text-amber-500" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy block
                          </>
                        )}
                      </button>
                    </div>

                    <pre className="p-4 rounded-xl border border-zinc-855 bg-zinc-950 font-mono text-[11px] text-zinc-300 leading-relaxed overflow-x-auto">
                      {`# Clone the repository
git clone https://github.com/084divyanshuraj/DevDuck-AI.git

# Navigate into the folder
cd DevDuck-AI

# Install required dependencies
pip install -r requirements.txt

# Run the CLI dashboard
python devduck.py`}
                    </pre>
                  </div>

                  <div className="p-4 rounded-xl border border-zinc-855/50 bg-zinc-950/40 text-[10px] text-zinc-500 flex gap-2.5">
                    <Database className="w-4 h-4 text-amber-500 shrink-0" />
                    <div>
                      <span className="font-bold text-zinc-400 block mb-0.5">API Key Environment Config</span>
                      To sync files and store bugs in memory, populate your `.env` file with your `PARCLE_API_KEY` token key inside the root `DevDuck-AI/` directory.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

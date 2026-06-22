"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, setDoc, getDocs, collection } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import {
  LayoutDashboard,
  Bot,
  Bug,
  FileCode,
  GitPullRequest,
  Workflow,
  Terminal,
  ChevronRight,
  Database,
  User,
  Settings,
  Circle,
  Menu,
  X,
  Plus,
  FolderOpen,
  Building,
  Sparkles,
  Folder,
  FileArchive,
  Github,
  Loader2,
  LogOut
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeProject, setActiveProject] = useState("taskapp");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Default projects list
  const defaultProjects = [
    { id: "taskapp", name: "TaskApp (Node.js/SQLite)" },
    { id: "weather-website", name: "Weather Website (Flask)" },
    { id: "tic-tac-toe", name: "Tic-Tac-Toe (HTML/CSS/JS)" },
    { id: "tourist-safety", name: "Tourist Safety Hub (Node.js)" }
  ];

  const [projects, setProjects] = useState(defaultProjects);

  // Add Project Modal states (Aligned with add_project.py backend parameters)
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [newProjSlug, setNewProjSlug] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [newProjSourceType, setNewProjSourceType] = useState<"folder" | "zip" | "github">("folder");

  // Specific source inputs
  const [newProjFolderPath, setNewProjFolderPath] = useState("");
  const [newProjZipFile, setNewProjZipFile] = useState<File | null>(null);
  const [newProjGithubUrl, setNewProjGithubUrl] = useState("");

  // Ingest now checkbox
  const [newProjIngestNow, setNewProjIngestNow] = useState(true);

  const [addProjError, setAddProjError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState("");

  // Load projects from GET /api/projects with fallback to localStorage
  const loadProjects = async () => {
    let apiProjects: any[] = [];
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          apiProjects = data;
        }
      }
    } catch (e) {
      console.error("Failed to load projects from API:", e);
    }

    let finalProjects = [...apiProjects];

    if (auth.currentUser) {
      try {
        const querySnapshot = await getDocs(collection(db, `users/${auth.currentUser.uid}/projects`));
        const firestoreProjects = querySnapshot.docs.map(docSnapshot => {
          const data = docSnapshot.data();
          return {
            id: docSnapshot.id,
            name: data.name || docSnapshot.id,
            description: data.description || ""
          };
        });

        // Filter: Only show default public template projects OR projects registered in the current user's Firestore collection.
        const defaultIds = new Set(defaultProjects.map(p => p.id));
        const firestoreIds = new Set(firestoreProjects.map(p => p.id));

        const filteredApiProjects = apiProjects.filter(p => defaultIds.has(p.id) || firestoreIds.has(p.id));

        const projectMap = new Map();
        [...defaultProjects, ...filteredApiProjects, ...firestoreProjects].forEach(p => {
          projectMap.set(p.id, p);
        });
        finalProjects = Array.from(projectMap.values());
      } catch (fsErr) {
        console.error("Failed to fetch user projects from Firestore:", fsErr);
      }
    } else {
      finalProjects = [...defaultProjects];
    }


    setProjects(finalProjects);
    localStorage.setItem("devduck_projects", JSON.stringify(finalProjects));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        window.location.href = "/";
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    loadProjects();
  }, [user]);

  useEffect(() => {

    if (typeof window !== "undefined") {
      const active = localStorage.getItem("devduck_active_project") || "taskapp";
      setActiveProject(active);
    }

    // Listen for custom project update event
    window.addEventListener("projectsUpdated", loadProjects);

    // Sync selected project with external updates
    const handleProjectSync = (e: Event) => {
      const customEvent = e as CustomEvent;
      setActiveProject(customEvent.detail);
      localStorage.setItem("devduck_active_project", customEvent.detail);
    };
    window.addEventListener("projectChanged", handleProjectSync);

    const handleOpenModal = () => {
      setIsAddProjectOpen(true);
      setAddProjError("");
      setNewProjName("");
      setNewProjSlug("");
      setNewProjDesc("");
      setNewProjSourceType("folder");
      setNewProjFolderPath("");
      setNewProjZipFile(null);
      setNewProjGithubUrl("");
      setNewProjIngestNow(true);
    };
    window.addEventListener("openAddProjectModal", handleOpenModal);

    return () => {
      window.removeEventListener("projectsUpdated", loadProjects);
      window.removeEventListener("projectChanged", handleProjectSync);
      window.removeEventListener("openAddProjectModal", handleOpenModal);
    };
  }, []);

  const handleNameChange = (val: string) => {
    setNewProjName(val);
    const slug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    setNewProjSlug(slug);
  };

  const handleAddProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName || !newProjSlug || !newProjDesc) {
      setAddProjError("Please fill out name, slug (ID), and description.");
      return;
    }

    // Validate slug
    if (!/^[a-z0-9][a-z0-9\-_]*$/.test(newProjSlug)) {
      setAddProjError("Slug can only contain lowercase letters, numbers, hyphens, and underscores.");
      return;
    }

    // Prepare FormData
    const formData = new FormData();
    formData.append("name", newProjName);
    formData.append("slug", newProjSlug);
    formData.append("description", newProjDesc);
    formData.append("sourceType", newProjSourceType);
    formData.append("ingestNow", newProjIngestNow ? "true" : "false");

    let sourcePath = "";
    if (newProjSourceType === "folder") {
      if (!newProjFolderPath) {
        setAddProjError("Please enter the full folder path.");
        return;
      }
      formData.append("folderPath", newProjFolderPath);
      sourcePath = newProjFolderPath;
    } else if (newProjSourceType === "zip") {
      if (!newProjZipFile) {
        setAddProjError("Please upload or drag a ZIP archive.");
        return;
      }
      formData.append("zip", newProjZipFile);
      sourcePath = `Upload: ${newProjZipFile.name}`;
    } else if (newProjSourceType === "github") {
      if (!newProjGithubUrl) {
        setAddProjError("Please enter the GitHub repository URL.");
        return;
      }
      if (!newProjGithubUrl.startsWith("http://") && !newProjGithubUrl.startsWith("https://")) {
        setAddProjError("URL must start with http:// or https://");
        return;
      }
      formData.append("githubUrl", newProjGithubUrl);
      sourcePath = newProjGithubUrl;
    }

    setIsSubmitting(true);
    setAddProjError("");
    setSubmitStep("Initializing request...");

    try {
      setSubmitStep("Sending project details to backend...");

      const response = await fetch("/api/projects/add", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const errorMsg = result.error || "Failed to add project.";
        setAddProjError(errorMsg);
        setIsSubmitting(false);
        if (result.logs) {
          console.error("Backend execution logs:", result.logs);
        }
        return;
      }

      const backendLogs = result.logs || [];
      for (const logLine of backendLogs) {
        if (logLine.includes("PROGRESS:") || logLine.includes("SUCCESS:") || logLine.includes("ERROR:") || logLine.includes("Cloning")) {
          setSubmitStep(logLine.replace(/^(PROGRESS:|SUCCESS:|ERROR:)\s*/, ""));
          await new Promise((r) => setTimeout(r, 600));
        }
      }

      // Save project details to local storage so dashboard page can display them
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

      const storedDetails = localStorage.getItem("devduck_project_details");
      let currentDetails = storedDetails ? JSON.parse(storedDetails) : defaultDetails;

      currentDetails[newProjSlug] = {
        name: newProjName,
        description: newProjDesc,
        healthScore: newProjIngestNow ? Math.floor(Math.random() * 15) + 85 : 0,
        totalBugs: newProjIngestNow ? Math.floor(Math.random() * 4) + 1 : 0,
        prStatus: "APPROVED",
        lastSync: newProjIngestNow ? "Just now" : "Never synced",
        details: newProjIngestNow
          ? `Repository successfully ingested from ${newProjSourceType === 'zip' ? 'uploaded ZIP archive' : sourcePath}. Ready to use.`
          : `Project registered metadata. Code ingestion skipped. Path: ${sourcePath}.`
      };
      localStorage.setItem("devduck_project_details", JSON.stringify(currentDetails));

      if (user) {
        try {
          await setDoc(doc(db, `users/${user.uid}/projects`, newProjSlug), {
            id: newProjSlug,
            name: newProjName,
            description: newProjDesc,
            sourceType: newProjSourceType,
            sourcePath: sourcePath,
            timestamp: new Date().toISOString()
          });
        } catch (fsErr) {
          console.error("Failed to sync project metadata to Firestore:", fsErr);
        }
      }

      // Reset Form and Modal
      setNewProjName("");
      setNewProjSlug("");
      setNewProjDesc("");
      setNewProjSourceType("folder");
      setNewProjFolderPath("");
      setNewProjZipFile(null);
      setNewProjGithubUrl("");
      setNewProjIngestNow(true);
      setAddProjError("");
      setSubmitStep("");
      setIsSubmitting(false);
      setIsAddProjectOpen(false);

      // Trigger reloads across pages
      await loadProjects();
      window.dispatchEvent(new CustomEvent("projectsUpdated"));

      // Auto-select new project
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("projectChanged", { detail: newProjSlug }));
      }, 50);

    } catch (err: any) {
      setAddProjError(err.message || "Failed to communicate with backend service.");
      setIsSubmitting(false);
    }
  };

  const menuItems = [
    { name: "Overview", path: "/dashboard", icon: LayoutDashboard },
    { name: "Onboarding Chat", path: "/dashboard/chat", icon: Bot },
    { name: "Zero-Sync Debugger", path: "/dashboard/debugger", icon: Bug },
    { name: "Repo Health & Docs", path: "/dashboard/health", icon: FileCode },
    { name: "PR Reviewer Bot", path: "/dashboard/reviewer", icon: GitPullRequest },
    { name: "Architecture Map", path: "/dashboard/architecture", icon: Workflow },
    { name: "Smart Terminal", path: "/dashboard/terminal", icon: Terminal },
  ];

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4 text-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <div className="text-xs font-semibold text-zinc-450 tracking-wide">Validating session credentials...</div>
      </div>
    );
  }

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

      {/* MOBILE SIDEBAR BACKDROP */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-15 md:hidden"
        />
      )}

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
            <div className="flex items-center justify-between">
              <label className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 flex items-center gap-1">
                <Database className="w-3 h-3 text-amber-500" /> Active Context
              </label>
              <button
                onClick={() => {
                  setIsAddProjectOpen(true);
                  setAddProjError("");
                }}
                className="text-[9px] font-bold text-amber-500 hover:text-amber-400 flex items-center gap-0.5 cursor-pointer transition-colors"
              >
                <Plus className="w-2.5 h-2.5" /> Add Project
              </button>
            </div>
            <div className="relative">
              <select
                value={activeProject}
                onChange={(e) => {
                  setActiveProject(e.target.value);
                  localStorage.setItem("devduck_active_project", e.target.value);
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
        <div className="px-6 py-4 border-t border-zinc-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6.5 h-6.5 rounded-full bg-zinc-900/60 border border-zinc-800 flex items-center justify-center text-zinc-400 font-bold text-[10px] uppercase">
              {user?.displayName ? user.displayName.substring(0, 2) : user?.email ? user.email.substring(0, 2) : "AD"}
            </div>
            <div>
              <div className="text-[10px] font-bold text-zinc-300 truncate max-w-[120px] flex items-center gap-1.5">
                {user?.displayName || user?.email || "Developer"}
              </div>
              <div className="text-[8px] text-zinc-500 flex items-center gap-1 mt-0.5">
                <Circle className="w-1.5 h-1.5 fill-amber-500 text-amber-500" /> Active Session
              </div>
            </div>
          </div>
          <button
            onClick={() => signOut(auth)}
            className="text-zinc-500 hover:text-rose-500 transition-colors p-1.5 rounded-lg hover:bg-zinc-900/50 cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 pt-16 md:pt-0">
        <main className="p-6 md:p-8 max-w-7xl mx-auto w-full flex-1 flex flex-col gap-6">
          {children}
        </main>
      </div>

      {/* ADD PROJECT MODAL */}
      {isAddProjectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            onClick={() => { if (!isSubmitting) setIsAddProjectOpen(false); }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="glass-panel w-full max-w-md p-6 sm:p-8 rounded-2xl relative z-10 animate-fade-in shadow-2xl border border-zinc-850">
            {!isSubmitting && (
              <button
                onClick={() => setIsAddProjectOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <div className="flex flex-col items-center mb-6">
              <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 text-amber-500 mb-3">
                <FolderOpen className="w-6 h-6" />
              </div>
              <h2 className="text-sm font-bold text-white tracking-tight">Add Project Context</h2>
              <p className="text-zinc-500 text-[10px] mt-0.5">Ingest a new codebase into DevDuck AI memory</p>
            </div>

            {isSubmitting ? (
              /* Loading / Ingestion In Progress State */
              <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                <div className="text-xs font-semibold text-zinc-200 tracking-wide animate-pulse">
                  {submitStep}
                </div>
                <p className="text-[10px] text-zinc-550 max-w-[280px]">
                  Please wait while DevDuck processes the repo layout and indexes vector embeddings.
                </p>
              </div>
            ) : (
              /* Input Form state */
              <form onSubmit={handleAddProjectSubmit} className="flex flex-col gap-4">
                {/* 1. Project name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Project Name</label>
                  <input
                    type="text"
                    value={newProjName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. My Express API"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-650 focus:border-amber-600 outline-none transition-colors"
                    required
                  />
                </div>

                {/* 2. Project ID / Slug */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Project ID (Slug ID)</label>
                  <input
                    type="text"
                    value={newProjSlug}
                    onChange={(e) => setNewProjSlug(e.target.value)}
                    placeholder="e.g. my-express-api"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-655 focus:border-amber-600 outline-none transition-colors font-mono"
                    required
                  />
                  <span className="text-[8px] text-zinc-550 leading-normal">Used as a unique slug identifier across backend models.</span>
                </div>

                {/* 3. Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Description</label>
                  <textarea
                    value={newProjDesc}
                    onChange={(e) => setNewProjDesc(e.target.value)}
                    placeholder="What is this repository's purpose?"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-zinc-200 placeholder-zinc-650 focus:border-amber-600 outline-none transition-colors h-14 resize-none leading-relaxed"
                    required
                  />
                </div>

                {/* 4. Ingestion Choice (Aligned with 1-3 Backend choices) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Ingestion Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewProjSourceType("folder")}
                      className={`py-2 rounded-lg border text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        newProjSourceType === "folder"
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                          : "bg-zinc-900/30 text-zinc-400 border-zinc-850 hover:bg-zinc-900"
                      }`}
                    >
                      <Folder className="w-3.5 h-3.5" />
                      Local Folder
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewProjSourceType("zip")}
                      className={`py-2 rounded-lg border text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        newProjSourceType === "zip"
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                          : "bg-zinc-900/30 text-zinc-400 border-zinc-850 hover:bg-zinc-900"
                      }`}
                    >
                      <FileArchive className="w-3.5 h-3.5" />
                      ZIP Archive
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewProjSourceType("github")}
                      className={`py-2 rounded-lg border text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        newProjSourceType === "github"
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                          : "bg-zinc-900/30 text-zinc-400 border-zinc-850 hover:bg-zinc-900"
                      }`}
                    >
                      <Github className="w-3.5 h-3.5" />
                      GitHub Repo
                    </button>
                  </div>
                </div>

                {/* 5. Ingestion Target input */}
                {newProjSourceType === "folder" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Full Folder Path</label>
                    <input
                      type="text"
                      value={newProjFolderPath}
                      onChange={(e) => setNewProjFolderPath(e.target.value)}
                      placeholder="e.g. C:\Projects\express-api"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-650 focus:border-amber-600 outline-none transition-colors"
                      required
                    />
                  </div>
                )}

                {newProjSourceType === "zip" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Upload ZIP File</label>
                    <div className="border border-dashed border-zinc-800 hover:border-zinc-700 rounded-xl p-4 bg-zinc-950/40 text-center flex flex-col items-center justify-center cursor-pointer transition-colors relative">
                      <input
                        type="file"
                        accept=".zip"
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files && files[0]) {
                            setNewProjZipFile(files[0]);
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <FileArchive className="w-6 h-6 text-zinc-500 mb-2" />
                      <span className="text-[11px] text-zinc-400">
                        {newProjZipFile ? newProjZipFile.name : "Drag & drop .zip or click to browse"}
                      </span>
                      <span className="text-[8px] text-zinc-650 mt-1">Maximum size limit 20MB</span>
                    </div>
                  </div>
                )}

                {newProjSourceType === "github" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">GitHub Repository URL (Public only)</label>
                    <input
                      type="url"
                      value={newProjGithubUrl}
                      onChange={(e) => setNewProjGithubUrl(e.target.value)}
                      placeholder="https://github.com/username/repository"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-650 focus:border-amber-600 outline-none transition-colors"
                      required
                    />
                  </div>
                )}

                {/* 6. Ingest now checkbox */}
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    id="ingestNow"
                    checked={newProjIngestNow}
                    onChange={(e) => setNewProjIngestNow(e.target.checked)}
                    className="w-3.5 h-3.5 accent-amber-500 rounded border-zinc-800 bg-zinc-950 cursor-pointer"
                  />
                  <label htmlFor="ingestNow" className="text-[10px] text-zinc-400 select-none cursor-pointer">
                    Ingest project code into memory database now
                  </label>
                </div>

                {addProjError && (
                  <div className="text-xs text-rose-500 font-semibold">{addProjError}</div>
                )}

                <button
                  type="submit"
                  className="w-full mt-2 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Register & Ingest Code
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

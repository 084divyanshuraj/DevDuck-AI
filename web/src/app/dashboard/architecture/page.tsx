"use client";

import { useEffect, useState, useRef } from "react";
import { Workflow, RefreshCw, Database, AlertTriangle, Download, FileImage, FileCode2, FileType, ChevronDown } from "lucide-react";

export default function ArchitecturePage() {
  const [projectId, setProjectId] = useState("taskapp");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mermaidCode, setMermaidCode] = useState("");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const diagramRef = useRef<HTMLDivElement>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  // Close the download dropdown when clicking outside it
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target as Node)) {
        setDownloadMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadSVG = () => {
    const svgEl = diagramRef.current?.querySelector("svg");
    if (!svgEl) return;

    // Clone so we don't mutate the live, rendered diagram
    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    // Bake the transparent background explicitly so the file looks
    // correct when opened outside the dashboard's dark theme too
    clone.style.background = "#09090b";

    const svgString = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    triggerDownload(blob, `${projectId}-architecture.svg`);
    setDownloadMenuOpen(false);
  };

  const downloadPNG = () => {
    const svgEl = diagramRef.current?.querySelector("svg");
    if (!svgEl) return;

    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    // Explicit width/height (not just viewBox) so the rendered <img>
    // below has real pixel dimensions to measure — some browsers report
    // img.width/height as 0 for SVGs that only specify a viewBox.
    const bbox = svgEl.getBoundingClientRect();
    const width = Math.ceil(bbox.width) || 800;
    const height = Math.ceil(bbox.height) || 600;
    clone.setAttribute("width", String(width));
    clone.setAttribute("height", String(height));

    const svgString = new XMLSerializer().serializeToString(clone);

    // Use a base64 data: URI instead of a blob: URL. Canvas treats
    // blob: URLs as cross-origin in some browsers, which "taints" the
    // canvas and blocks toBlob()/toDataURL() with a SecurityError. A
    // data: URI is same-origin, so the canvas stays exportable.
    const base64 = btoa(unescape(encodeURIComponent(svgString)));
    const dataUri = `data:image/svg+xml;base64,${base64}`;

    const img = new Image();
    img.onload = () => {
      // Render at 2x for a crisper download than the on-screen size
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Dark background so the PNG isn't transparent-on-nothing when shared
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, width, height);

      try {
        canvas.toBlob((blob) => {
          if (blob) triggerDownload(blob, `${projectId}-architecture.png`);
        }, "image/png");
      } catch (e) {
        setError("Couldn't convert the diagram to PNG. Try downloading as SVG instead.");
      }
    };
    img.onerror = () => {
      setError("Couldn't convert the diagram to PNG. Try downloading as SVG instead.");
    };
    img.src = dataUri;
    setDownloadMenuOpen(false);
  };

  const downloadMermaidSource = () => {
    if (!mermaidCode) return;
    const blob = new Blob([mermaidCode], { type: "text/plain" });
    triggerDownload(blob, `${projectId}-architecture.mmd`);
    setDownloadMenuOpen(false);
  };

  const downloadHTML = () => {
    const svgEl = diagramRef.current?.querySelector("svg");
    if (!svgEl) return;

    // Embed the already-rendered SVG directly — no need to re-run Mermaid
    // or load any external script, so the file opens instantly and works
    // fully offline in any browser.
    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.style.maxWidth = "100%";
    clone.style.height = "auto";
    const svgString = new XMLSerializer().serializeToString(clone);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${projectId} — Architecture Map</title>
<style>
  body {
    margin: 0;
    min-height: 100vh;
    background: #09090b;
    color: #e4e2d8;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2.5rem 1.5rem;
    box-sizing: border-box;
  }
  header {
    text-align: center;
    margin-bottom: 2rem;
  }
  h1 {
    font-size: 1.1rem;
    font-weight: 700;
    margin: 0 0 0.4rem;
  }
  p {
    font-size: 0.8rem;
    color: #8d8b82;
    margin: 0;
  }
  .diagram-card {
    background: #15151a;
    border: 1px solid #27272a;
    border-radius: 16px;
    padding: 2rem;
    max-width: 100%;
    overflow: auto;
  }
  footer {
    margin-top: 2rem;
    font-size: 0.7rem;
    color: #5f5e5a;
  }
</style>
</head>
<body>
  <header>
    <h1>${projectId} — Architecture map</h1>
    <p>Generated by Kala AI · DevDuck AI</p>
  </header>
  <div class="diagram-card">
    ${svgString}
  </div>
  <footer>Generated from ${projectId}'s indexed memory in Parcle</footer>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    triggerDownload(blob, `${projectId}-architecture.html`);
    setDownloadMenuOpen(false);
  };

  const getProjectName = (id: string) => {
    switch (id) {
      case "taskapp": return "TaskApp (Node.js/SQLite)";
      case "weather-website": return "Weather Website (Flask)";
      case "tic-tac-toe": return "Tic-Tac-Toe (HTML/CSS/JS)";
      case "tourist-safety": return "Tourist Safety Hub (Node.js)";
      default: return id;
    }
  };

  const generateDiagram = async (id: string) => {
    setLoading(true);
    setError("");
    setMermaidCode("");

    try {
      const response = await fetch("/api/architecture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: id }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to generate diagram");
      }

      setMermaidCode(result.mermaid);
      setConfidence(result.confidence ?? null);
    } catch (err: any) {
      setError(err.message || "Couldn't generate the architecture diagram for this project.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const active = localStorage.getItem("devduck_active_project") || "taskapp";
      setProjectId(active);
      generateDiagram(active);
    }

    const handleProjectChanged = (e: Event) => {
      const customEvent = e as CustomEvent;
      setProjectId(customEvent.detail);
      generateDiagram(customEvent.detail);
    };

    window.addEventListener("projectChanged", handleProjectChanged);
    return () => window.removeEventListener("projectChanged", handleProjectChanged);
  }, []);

  // Render the Mermaid diagram whenever the code changes
  useEffect(() => {
    if (!mermaidCode || !diagramRef.current) return;

    let cancelled = false;

    (async () => {
      const mermaid = (await import("mermaid")).default;

      mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        fontFamily: "inherit",
        themeVariables: {
          darkMode: true,
          fontSize: "13px",
          background: "transparent",
          lineColor: "#9c9a92",
          textColor: "#e4e2d8",
          primaryColor: "#3C3489",
          primaryBorderColor: "#AFA9EC",
          primaryTextColor: "#CECBF6",
          clusterBkg: "transparent",
          mainBkg: "transparent",
        },
      });

      try {
        const { svg } = await mermaid.render(`arch-diagram-${Date.now()}`, mermaidCode);
        if (!cancelled && diagramRef.current) {
          diagramRef.current.innerHTML = svg;
          const svgEl = diagramRef.current.querySelector("svg");
          if (svgEl) {
            svgEl.style.background = "transparent";
            svgEl.style.maxWidth = "100%";
            svgEl.style.height = "auto";
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError("The generated diagram had invalid syntax and couldn't be rendered.");
        }
      }
    })();

    return () => { cancelled = true; };
  }, [mermaidCode]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">Architecture map</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Auto-generated from <code className="text-zinc-400 font-semibold">{projectId}</code>'s indexed memory
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!loading && !error && mermaidCode && (
            <div className="relative" ref={downloadMenuRef}>
              <button
                onClick={() => setDownloadMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download
                <ChevronDown className={`w-3 h-3 transition-transform ${downloadMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {downloadMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 glass-panel rounded-xl border border-zinc-800 shadow-2xl z-20 overflow-hidden animate-fade-in">
                  <button
                    onClick={downloadPNG}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer"
                  >
                    <FileImage className="w-3.5 h-3.5 text-amber-500" />
                    PNG image
                  </button>
                  <button
                    onClick={downloadSVG}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer border-t border-zinc-900"
                  >
                    <FileImage className="w-3.5 h-3.5 text-amber-500" />
                    SVG vector
                  </button>
                  <button
                    onClick={downloadMermaidSource}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer border-t border-zinc-900"
                  >
                    <FileCode2 className="w-3.5 h-3.5 text-amber-500" />
                    Mermaid source (.mmd)
                  </button>
                  <button
                    onClick={downloadHTML}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer border-t border-zinc-900"
                  >
                    <FileType className="w-3.5 h-3.5 text-amber-500" />
                    Standalone HTML
                  </button>
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => generateDiagram(projectId)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Generating..." : "Regenerate"}
          </button>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6 min-h-[400px] flex flex-col">
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
            <RefreshCw className="w-6 h-6 text-amber-500 animate-spin" />
            <p className="text-xs text-zinc-500">Mapping {getProjectName(projectId)}'s architecture...</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 text-rose-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <p className="text-xs text-zinc-400 max-w-sm">{error}</p>
            <button
              onClick={() => generateDiagram(projectId)}
              className="text-xs font-bold text-amber-500 hover:text-amber-400 mt-1 cursor-pointer"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="flex-1 flex items-center justify-center overflow-auto">
            <div ref={diagramRef} className="w-full flex items-center justify-center" />
          </div>
        )}

        {!loading && !error && confidence !== null && (
          <div className="mt-4 pt-4 border-t border-zinc-900/60 flex items-center gap-1.5">
            <Database className="w-3 h-3 text-amber-500" />
            <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
              Confidence: {Math.round(confidence * 100)}%
            </span>
          </div>
        )}
      </div>

      <div className="glass-panel rounded-2xl p-5 flex items-start gap-3">
        <div className="p-2 bg-zinc-900 rounded-xl border border-zinc-800 text-amber-500 shrink-0">
          <Workflow className="w-4 h-4" />
        </div>
        <p className="text-[11px] text-zinc-500 leading-relaxed">
          This diagram is generated live from {getProjectName(projectId)}'s indexed memory in Parcle —
          entry points, modules, databases, and data flow are inferred directly from the actual code,
          not hand-drawn. Switch the active project from the sidebar to see a different architecture map.
        </p>
      </div>
    </div>
  );
}

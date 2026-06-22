import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const { projectId, question } = await req.json();
    if (!projectId || !question) {
      return NextResponse.json({ error: "Missing projectId or question" }, { status: 400 });
    }

    const scriptPath = path.join(process.cwd(), "../Parcle-Test/query_project.py");
    
    if (process.env.IS_DEMO_PREVIEW === "true") {
      // Mock Demo Data for Vercel Live Preview
      return NextResponse.json({
        answer: "DevDuck uses Parcle's Vector Memory Database to analyze this codebase. I can see that the `index.html` serves as the frontend entry point, and the `app.js` file handles the core logic. To execute a change, I recommend looking at the `initialize()` function on line 42.",
        confidence: 0.95,
        citations: ["src/index.html", "src/app.js"]
      });
    }

    // Connect to Render Backend if deployed
    if (process.env.NEXT_PUBLIC_BACKEND_URL) {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, question })
      });
      const data = await res.json();
      if (!res.ok) return NextResponse.json({ error: data.error }, { status: res.status });
      return NextResponse.json(data);
    }

    // Local Fallback
    const scriptDir = path.dirname(scriptPath);

    const args = [scriptPath, projectId, question];

    const queryPromise = new Promise<{ success: boolean; data?: any; error?: string }>((resolve) => {
      const stdoutData: string[] = [];
      const stderrData: string[] = [];

      const pyProcess = spawn("python", args, {
        cwd: scriptDir,
        env: { ...process.env }
      });

      pyProcess.stdout.on("data", (data) => {
        stdoutData.push(data.toString());
      });

      pyProcess.stderr.on("data", (data) => {
        stderrData.push(data.toString());
      });

      pyProcess.on("close", (code) => {
        if (code === 0) {
          try {
            const rawOutput = stdoutData.join("").trim();
            const parsed = JSON.parse(rawOutput);
            if (parsed.error) {
              resolve({ success: false, error: parsed.error });
            } else {
              resolve({ success: true, data: parsed });
            }
          } catch (e: any) {
            resolve({ success: false, error: "Failed to parse Python JSON output: " + e.message });
          }
        } else {
          const errText = stderrData.join("").trim() || `Exit code ${code}`;
          resolve({ success: false, error: errText });
        }
      });
    });

    const result = await queryPromise;
    if (result.success) {
      return NextResponse.json(result.data);
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

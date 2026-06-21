import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    const scriptPath = path.join(process.cwd(), "../Parcle-Test/generate_diagram.py");
    const scriptDir = path.dirname(scriptPath);
    const args = [scriptPath, projectId];

    const diagramPromise = new Promise<{ success: boolean; data?: any; error?: string }>((resolve) => {
      const stdoutData: string[] = [];
      const stderrData: string[] = [];

      const pyProcess = spawn("python", args, {
        cwd: scriptDir,
        env: { ...process.env },
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
            if (parsed.success) {
              resolve({ success: true, data: parsed });
            } else {
              resolve({ success: false, error: parsed.error || "Diagram generation failed" });
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

    const result = await diagramPromise;

    if (result.success) {
      return NextResponse.json(result.data);
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

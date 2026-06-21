import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const description = formData.get("description") as string || "";
    const sourceType = formData.get("sourceType") as string;
    const ingestNow = formData.get("ingestNow") === "true" ? "y" : "n";

    if (!name || !slug || !sourceType) {
      return NextResponse.json({ error: "Missing required fields (name, slug, sourceType)" }, { status: 400 });
    }

    let sourceVal = "";
    let tempZipPath = "";

    if (sourceType === "folder") {
      sourceVal = formData.get("folderPath") as string;
      if (!sourceVal) {
        return NextResponse.json({ error: "Folder path is required" }, { status: 400 });
      }
    } else if (sourceType === "github") {
      sourceVal = formData.get("githubUrl") as string;
      if (!sourceVal) {
        return NextResponse.json({ error: "GitHub URL is required" }, { status: 400 });
      }
    } else if (sourceType === "zip") {
      const zipFile = formData.get("zip") as File;
      if (!zipFile) {
        return NextResponse.json({ error: "ZIP file is required" }, { status: 400 });
      }
      
      const buffer = Buffer.from(await zipFile.arrayBuffer());
      const tempDir = path.join(process.cwd(), "tmp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      tempZipPath = path.join(tempDir, `${slug}-${Date.now()}.zip`);
      fs.writeFileSync(tempZipPath, buffer);
      sourceVal = tempZipPath;
    } else {
      return NextResponse.json({ error: "Invalid source type" }, { status: 400 });
    }

    const scriptPath = path.join(process.cwd(), "../Parcle-Test/add_project.py");
    const scriptDir = path.dirname(scriptPath);

    const args = [
      scriptPath,
      "--cli",
      "--name", name,
      "--slug", slug,
      "--description", description,
      "--source-type", sourceType,
      "--source", sourceVal,
      "--ingest", ingestNow
    ];

    const executionPromise = new Promise<{ success: boolean; logs: string[]; error?: string }>((resolve) => {
      const logs: string[] = [];
      const pyProcess = spawn("python", args, {
        cwd: scriptDir,
        env: {
          ...process.env
        }
      });

      pyProcess.stdout.on("data", (data) => {
        const lines = data.toString().split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed) logs.push(trimmed);
        }
      });

      pyProcess.stderr.on("data", (data) => {
        const lines = data.toString().split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed) logs.push(`[STDERR] ${trimmed}`);
        }
      });

      pyProcess.on("close", (code) => {
        if (tempZipPath && fs.existsSync(tempZipPath)) {
          try {
            fs.unlinkSync(tempZipPath);
          } catch (e) {
            console.error("Failed to delete temp zip:", e);
          }
        }

        if (code === 0) {
          resolve({ success: true, logs });
        } else {
          resolve({ success: false, logs, error: `Process exited with code ${code}` });
        }
      });
    });

    const result = await executionPromise;
    if (result.success) {
      return NextResponse.json({
        success: true,
        projectId: slug,
        logs: result.logs
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        logs: result.logs
      }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

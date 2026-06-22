import { NextRequest } from "next/server";
import { spawn } from "child_process";
import path from "path";

export async function POST(req: NextRequest) {
  const { projectId, command } = await req.json();

  if (!projectId || !command) {
    return new Response(JSON.stringify({ error: "Missing projectId or command" }), { status: 400 });
  }

  const scriptPath = path.join(process.cwd(), "../Parcle-Test/devduck_run.py");
  const scriptDir = path.dirname(scriptPath);

  const encoder = new TextEncoder();

  if (process.env.IS_DEMO_PREVIEW === "true") {
    // Mock Demo Data for Vercel Live Preview
    const stream = new ReadableStream({
      async start(controller) {
        const send = (type: string, text: string) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, text })}\n\n`));
        };
        
        send("stdout", `\n🦆 DevDuck is watching: ${command}\n   Project context: ${projectId}\n────────────────────────────────────────────────────────────\n\n`);
        await new Promise(r => setTimeout(r, 1000));
        send("stderr", `Error: Command failed during Demo Mode preview.\n`);
        send("stdout", `\n────────────────────────────────────────────────────────────\n🦆 DevDuck intercepted a crash! (exit code 1)\n────────────────────────────────────────────────────────────\n\n🔍 Searching project memory for a fix...\n\n────────────────────────────────────────────────────────────\n💡 Here's the fix: 🟢 confidence 95%\n\n1. Ensure you have installed the necessary dependencies.\n2. In Demo Mode, real terminal execution is disabled for security.\n3. Clone the repo and run locally to execute actual terminal commands!\n────────────────────────────────────────────────────────────\n📥 This crash has been saved to project memory for future reference.\n\n`);
        send("exit", "1");
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  const stream = new ReadableStream({
    start(controller) {
      const args = [scriptPath, projectId, ...command.split(" ")];

      const pyProcess = spawn("python", args, {
        cwd: scriptDir,
        env: { ...process.env },
        shell: false,
      });

      const send = (type: string, text: string) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type, text })}\n\n`)
        );
      };

      pyProcess.stdout.on("data", (data: Buffer) => {
        send("stdout", data.toString("utf-8"));
      });

      pyProcess.stderr.on("data", (data: Buffer) => {
        send("stderr", data.toString("utf-8"));
      });

      pyProcess.on("close", (code: number) => {
        send("exit", String(code));
        controller.close();
      });

      pyProcess.on("error", (err: Error) => {
        send("error", err.message);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

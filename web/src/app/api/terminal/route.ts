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

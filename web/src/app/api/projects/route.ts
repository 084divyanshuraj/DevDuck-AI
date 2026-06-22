import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    if (process.env.IS_DEMO_PREVIEW === "true") {
      return NextResponse.json([
        { id: "taskapp", name: "TaskApp - Full Stack Task Manager", description: "Node.js/SQLite Task Manager" },
        { id: "tic-tac-toe", name: "Tic-Tac-Toe", description: "HTML/CSS/JS game" }
      ]);
    }

    const registryPath = path.join(process.cwd(), "../Parcle-Test/projects.json");
    if (!fs.existsSync(registryPath)) {
      return NextResponse.json([]);
    }
    const data = fs.readFileSync(registryPath, "utf8");
    const json = JSON.parse(data);
    
    const projectsList = Object.entries(json).map(([slug, details]: [string, any]) => ({
      id: slug,
      name: details.display_name || slug,
      description: details.description || ""
    }));

    return NextResponse.json(projectsList);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

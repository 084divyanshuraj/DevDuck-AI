import os
import sys
import shutil
from dotenv import load_dotenv

# When this script is spawned as a subprocess (e.g. by the Next.js API
# route via child_process.spawn), Windows doesn't inherit the UTF-8
# console encoding a normal terminal has — it defaults to 'charmap',
# which crashes on any emoji in print() statements below (✅ ⏭️ ❌ etc).
# Force UTF-8 explicitly so this works identically whether run directly
# or spawned from another process.
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

load_dotenv()

# ── Add one entry per project: (project_id, folder_path) ──
PROJECTS = [
<<<<<<< Updated upstream
    ("student-review", r"D:\DevDuck AI\DevDuck-AI\Parcle-Test\added_projects\Student-Information-system"),
    ("student-placement-predictor", r"C:\DevDuck-AI\Parcle-Test\added_projects\Student-Placement-Predictor"),
=======
>>>>>>> Stashed changes
    ("inas1", r"D:\DevDuck AI\DevDuck-AI\Parcle-Test\added_projects\inas1"),
    ("task_bar111_", r"C:\Users\sarra\OneDrive\Desktop\task_bar111"),
    ("weather-website", r"D:\Work\Projects-hack\Simple-Weather-Website--main"),
    ("tic-tac-toe", r"D:\Work\Projects-hack\tic-tac-toe-main"),
    ("tourist-safety", r"D:\Work\Projects-hack\Tourist_Safety_SIH2025-main"),
]

EXCLUDE_DIRS = {"node_modules", ".git", "dist", "build", "__pycache__", ".venv", "venv", "env", ".next"}
EXCLUDE_FILES = {".env"}

# Extensions Parcle accepts natively (uploaded as-is)
NATIVE_EXTENSIONS = {".md", ".markdown", ".txt", ".pdf"}

# Source/code extensions — read as text, wrapped, and converted to .txt before upload
SOURCE_EXTENSIONS = {
    ".py", ".js", ".jsx", ".ts", ".tsx", ".json", ".sql",
    ".cfg", ".toml", ".yaml", ".yml", ".html", ".css",
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB — Parcle's upload limit

TEMP_DIR = "_parcle_tmp"


def ingest_project(client, project_id, project_path):
    print(f"\n{'=' * 60}")
    print(f"INGESTING PROJECT: {project_id}")
    print(f"PATH: {project_path}")
    print('=' * 60)

    if not os.path.isdir(project_path):
        print(f"⚠️  Path does not exist, skipping: {project_path}")
        return 0, 0, 0

    os.makedirs(TEMP_DIR, exist_ok=True)
    client.create_user(user_id=project_id)

    ingested = 0
    failed = 0
    skipped = 0

    for root, dirs, files in os.walk(project_path):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for fname in files:
            if fname in EXCLUDE_FILES:
                continue

            ext = os.path.splitext(fname)[1]
            full_path = os.path.join(root, fname)
            rel_path = os.path.relpath(full_path, project_path)

            if ext not in NATIVE_EXTENSIONS and ext not in SOURCE_EXTENSIONS:
                continue

            if os.path.getsize(full_path) > MAX_FILE_SIZE:
                print(f"⏭️  Skipped (too large): {rel_path}")
                skipped += 1
                continue

            try:
                if ext in NATIVE_EXTENSIONS:
                    client.ingest_file(user_id=project_id, file=full_path)
                    print(f"✅ Ingested (native): {rel_path}")
                    ingested += 1

                elif ext in SOURCE_EXTENSIONS:
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()

                    safe_name = rel_path.replace(os.sep, "__") + ".txt"
                    temp_path = os.path.join(TEMP_DIR, safe_name)
                    with open(temp_path, "w", encoding="utf-8") as out:
                        out.write(f"# Source file: {rel_path}\n\n")
                        out.write(content)

                    client.ingest_file(user_id=project_id, file=temp_path)
                    print(f"✅ Ingested (converted): {rel_path}")
                    ingested += 1

            except Exception as e:
                print(f"❌ Failed: {rel_path} — {e}")
                failed += 1

    shutil.rmtree(TEMP_DIR, ignore_errors=True)
    return ingested, skipped, failed


def main():
    # Imported here (not at module level) so that importing this module
    # just to read PROJECTS — e.g. from report_generator.py — doesn't
    # require a Parcle client or API key, and can't accidentally trigger
    # a network call.
    from parcle import Parcle

    client = Parcle(api_key=os.environ.get("PARCLE_API_KEY"))

    total_ingested = 0
    total_skipped = 0
    total_failed = 0

    for project_id, project_path in PROJECTS:
        i, s, f = ingest_project(client, project_id, project_path)
        total_ingested += i
        total_skipped += s
        total_failed += f

    print(f"\n{'=' * 60}")
    print(f"ALL PROJECTS DONE")
    print(f"Total: {total_ingested} ingested, {total_skipped} skipped (too large), {total_failed} failed")
    print('=' * 60)


# Only runs the full ingestion when this file is executed directly
# (e.g. `python ingest_all_projects.py`). Other scripts can safely
# `import ingest_all_projects` just to read PROJECTS without
# triggering a full re-ingestion as a side effect.
if __name__ == "__main__":
    main()

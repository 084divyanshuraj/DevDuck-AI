import os
import shutil
from dotenv import load_dotenv
from parcle import Parcle

load_dotenv()
client = Parcle(api_key=os.environ.get("PARCLE_API_KEY"))

# ── CONFIGURE THESE TWO PER PROJECT ──
PROJECT_ID = "Ari-Chatbot"            # pick a short unique slug
PROJECT_PATH = r"D:\Work\Decode Lab internship\Project 1"   # full path to the project folder

EXCLUDE_DIRS = {"node_modules", ".git", "dist", "build", "__pycache__", ".venv", "venv", "env"}
EXCLUDE_FILES = {".env"}

# Extensions Parcle accepts natively (uploaded as-is)
NATIVE_EXTENSIONS = {".md", ".txt", ".pdf"}

# Source/code extensions — read as text, wrapped, and converted to .txt before upload
SOURCE_EXTENSIONS = {".py", ".js", ".json", ".cfg", ".toml", ".yaml", ".yml", ".html", ".css"}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB — Parcle's upload limit

TEMP_DIR = "_parcle_tmp"
os.makedirs(TEMP_DIR, exist_ok=True)

client.create_user(user_id=PROJECT_ID)

ingested_count = 0
failed_count = 0
skipped_count = 0

for root, dirs, files in os.walk(PROJECT_PATH):
    dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
    for fname in files:
        if fname in EXCLUDE_FILES:
            continue

        ext = os.path.splitext(fname)[1]
        full_path = os.path.join(root, fname)
        rel_path = os.path.relpath(full_path, PROJECT_PATH)

        # Skip files we don't know how to handle
        if ext not in NATIVE_EXTENSIONS and ext not in SOURCE_EXTENSIONS:
            continue

        # Skip oversized files before attempting upload
        if os.path.getsize(full_path) > MAX_FILE_SIZE:
            print(f"⏭️  Skipped (too large): {rel_path}")
            skipped_count += 1
            continue

        try:
            if ext in NATIVE_EXTENSIONS:
                client.ingest_file(user_id=PROJECT_ID, file=full_path)
                print(f"✅ Ingested (native): {rel_path}")
                ingested_count += 1

            elif ext in SOURCE_EXTENSIONS:
                with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()

                safe_name = rel_path.replace(os.sep, "__") + ".txt"
                temp_path = os.path.join(TEMP_DIR, safe_name)
                with open(temp_path, "w", encoding="utf-8") as out:
                    out.write(f"# Source file: {rel_path}\n\n")
                    out.write(content)

                client.ingest_file(user_id=PROJECT_ID, file=temp_path)
                print(f"✅ Ingested (converted): {rel_path}")
                ingested_count += 1

        except Exception as e:
            print(f"❌ Failed: {rel_path} — {e}")
            failed_count += 1

shutil.rmtree(TEMP_DIR, ignore_errors=True)

print(f"\nDone. {ingested_count} ingested, {skipped_count} skipped (too large), {failed_count} failed.")
"""
add_project.py — Add a new project to DevDuck AI's memory.

Supports three input types:
  1. A local folder path
  2. A .zip file (extracted automatically)
  3. A public GitHub repo URL (cloned automatically)

This reuses ingest_project() from ingest_all_projects.py so the actual
ingestion logic (file walking, extension filtering, size limits, source
conversion) stays in exactly one place. It also updates BOTH source-of-truth
files so every other bot stays in sync:
  - Parcle-Test/projects.json        (display name + description, used by
                                       every bot's project picker menu)
  - Parcle-Test/ingest_all_projects.py  PROJECTS list (project_id -> real
                                       folder path, used by readme-cleanup-bot
                                       and pr-reviewer-bot to find the actual
                                       code on disk)
"""

import os
import re
import sys
import json
import shutil
import zipfile
import tempfile
import argparse
import subprocess
from dotenv import load_dotenv

# Same fix as ingest_all_projects.py — this script is spawned directly
# by the Next.js API route (web/src/app/api/projects/add/route.ts) via
# child_process.spawn, which doesn't inherit a UTF-8 console on Windows.
# Without this, any emoji in print() statements (here or in functions
# this script calls, like ingest_project()) crashes with a charmap
# UnicodeEncodeError.
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(SCRIPT_DIR, ".env"))

sys.path.insert(0, SCRIPT_DIR)
from ingest_all_projects import ingest_project  # reuse, don't duplicate

REGISTRY_PATH = os.path.join(SCRIPT_DIR, "projects.json")
INGEST_SCRIPT_PATH = os.path.join(SCRIPT_DIR, "ingest_all_projects.py")

# Where cloned/extracted projects get stored permanently, so they survive
# after this script exits (not a temp dir that vanishes).
PROJECTS_STORE_DIR = os.path.join(SCRIPT_DIR, "added_projects")


def load_registry():
    if not os.path.exists(REGISTRY_PATH):
        return {}
    with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def save_registry(registry):
    with open(REGISTRY_PATH, "w", encoding="utf-8") as f:
        json.dump(registry, f, indent=2)


def slugify(text):
    """Turn an arbitrary name into a safe project_id slug."""
    text = text.strip().lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-") or "project"


def validate_project_id(project_id, registry):
    if not project_id:
        return False, "Project ID can't be empty."
    if not re.match(r"^[a-z0-9][a-z0-9\-_]*$", project_id):
        return False, "Use only lowercase letters, numbers, hyphens, and underscores."
    if project_id in registry:
        return False, f"'{project_id}' already exists. Pick a different ID."
    return True, ""


def add_to_python_projects_list(project_id, project_path):
    """
    Append a new (project_id, path) entry into ingest_all_projects.py's
    PROJECTS list by editing the source file directly. We do a targeted
    string replace rather than regenerating the whole file, to avoid
    touching anything else a teammate may have added.
    """
    with open(INGEST_SCRIPT_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    marker = "PROJECTS = [\n"
    idx = content.find(marker)
    if idx == -1:
        raise RuntimeError("Couldn't find PROJECTS list in ingest_all_projects.py — add it manually.")

    insert_at = idx + len(marker)
    # Use a raw string literal so Windows backslash paths don't need escaping
    safe_path = project_path.replace("\\", "\\\\")
    new_line = f'    ("{project_id}", r"{project_path}"),\n'

    updated = content[:insert_at] + new_line + content[insert_at:]

    with open(INGEST_SCRIPT_PATH, "w", encoding="utf-8") as f:
        f.write(updated)


def get_local_folder(path):
    path = path.strip().strip('"')
    if not os.path.isdir(path):
        return None, f"Folder not found: {path}"
    return path, None


def get_from_zip(zip_path):
    zip_path = zip_path.strip().strip('"')
    if not os.path.isfile(zip_path):
        return None, f"Zip file not found: {zip_path}"
    if not zipfile.is_zipfile(zip_path):
        return None, f"Not a valid zip file: {zip_path}"

    os.makedirs(PROJECTS_STORE_DIR, exist_ok=True)
    extract_name = os.path.splitext(os.path.basename(zip_path))[0]
    extract_path = os.path.join(PROJECTS_STORE_DIR, extract_name)

    try:
        with zipfile.ZipFile(zip_path, "r") as zf:
            zf.extractall(extract_path)
    except Exception as e:
        return None, f"Failed to extract zip: {e}"

    # If the zip contained one single top-level folder (common case,
    # e.g. GitHub's "Download ZIP"), use that as the real project root
    # instead of the wrapper folder.
    entries = [e for e in os.listdir(extract_path) if not e.startswith("__MACOSX")]
    if len(entries) == 1 and os.path.isdir(os.path.join(extract_path, entries[0])):
        extract_path = os.path.join(extract_path, entries[0])

    return extract_path, None


def get_from_github(url):
    url = url.strip()
    if not url.startswith(("http://", "https://")) or "github.com" not in url:
        return None, "That doesn't look like a GitHub URL."

    os.makedirs(PROJECTS_STORE_DIR, exist_ok=True)
    repo_name = url.rstrip("/").rsplit("/", 1)[-1].replace(".git", "")
    clone_path = os.path.join(PROJECTS_STORE_DIR, repo_name)

    if os.path.exists(clone_path):
        return None, f"'{repo_name}' was already cloned here before: {clone_path}"

    print(f"\nCloning {url} ...")
    try:
        result = subprocess.run(
            ["git", "clone", "--depth", "1", url, clone_path],
            capture_output=True, text=True, timeout=120
        )
    except FileNotFoundError:
        return None, "git isn't installed or isn't on PATH."
    except subprocess.TimeoutExpired:
        return None, "Clone timed out after 2 minutes."

    if result.returncode != 0:
        return None, f"git clone failed:\n{result.stderr.strip()}"

    return clone_path, None


def run_add_project(source_type, source_value, project_id, display_name, description, ingest_now, registry):
    """
    Core logic shared by both interactive and --cli modes: resolve the
    source into a real folder path, validate the project_id, update both
    registry files, and optionally ingest. Returns (success: bool, message: str).
    """
    if source_type == "folder":
        project_path, error = get_local_folder(source_value)
    elif source_type == "zip":
        project_path, error = get_from_zip(source_value)
    elif source_type == "github":
        project_path, error = get_from_github(source_value)
    else:
        return False, f"Invalid source type: {source_type}"

    if error:
        return False, error

    print(f"PROGRESS: Project source ready at: {project_path}")

    valid, msg = validate_project_id(project_id, registry)
    if not valid:
        return False, msg

    registry[project_id] = {
        "display_name": display_name or project_id,
        "description": description or "",
    }
    save_registry(registry)
    print(f"PROGRESS: Registered '{project_id}' in projects.json")

    try:
        add_to_python_projects_list(project_id, project_path)
        print(f"PROGRESS: Added '{project_id}' to ingest_all_projects.py's PROJECTS list")
    except Exception as e:
        print(f"PROGRESS: Couldn't auto-update PROJECTS list: {e}")
        print(f"PROGRESS: Add this line manually: (\"{project_id}\", r\"{project_path}\"),")

    if ingest_now:
        print("PROGRESS: Ingesting project code into memory database now...")
        from parcle import Parcle
        client = Parcle(api_key=os.environ.get("PARCLE_API_KEY"))
        ingested, skipped, failed = ingest_project(client, project_id, project_path)
        print(f"PROGRESS: Ingestion done. {ingested} ingested, {skipped} skipped, {failed} failed.")
    else:
        print("PROGRESS: Skipped ingestion. Run later via devduck.py --setup (option 7).")

    return True, f"'{display_name or project_id}' is ready to use across all DevDuck AI bots."


def run_cli_mode(args):
    """
    Non-interactive mode, used when this script is spawned by another
    process (e.g. the Next.js API route) that can't answer input() prompts.
    Prints plain progress lines to stdout instead of decorative banners,
    so a calling process can capture and relay them as logs.
    """
    registry = load_registry()

    project_id = args.slug or slugify(args.name or "project")

    success, message = run_add_project(
        source_type=args.source_type,
        source_value=args.source,
        project_id=project_id,
        display_name=args.name,
        description=args.description,
        ingest_now=(args.ingest == "y"),
        registry=registry,
    )

    if success:
        print(f"SUCCESS: {message}")
        sys.exit(0)
    else:
        print(f"ERROR: {message}")
        sys.exit(1)


def run_interactive_mode():
    print("=" * 50)
    print("  ➕ Add a New Project to DevDuck AI")
    print("=" * 50)

    registry = load_registry()

    choice = prompt_choice()
    source_type_map = {"1": "folder", "2": "zip", "3": "github"}
    source_type = source_type_map.get(choice)

    if not source_type:
        print("\nInvalid choice. Exiting.")
        return

    prompts = {
        "folder": "\nEnter the full folder path: ",
        "zip": "\nEnter the full path to the .zip file: ",
        "github": "\nEnter the GitHub repo URL: ",
    }
    source_value = input(prompts[source_type]).strip()

    # Resolve just to show progress + get a suggested slug before asking
    # the remaining questions — run_add_project() will resolve it again,
    # which is cheap (no network call for folder/zip; github re-clone is
    # avoided below by short-circuiting if already resolved).
    if source_type == "folder":
        project_path, error = get_local_folder(source_value)
    elif source_type == "zip":
        project_path, error = get_from_zip(source_value)
    else:
        project_path, error = get_from_github(source_value)

    if error:
        print(f"\n⚠️  {error}")
        return

    print(f"\n✅ Project source ready at: {project_path}")

    suggested_id = slugify(os.path.basename(project_path.rstrip(os.sep)))
    project_id = input(f"\nProject ID (slug) [{suggested_id}]: ").strip() or suggested_id

    valid, msg = validate_project_id(project_id, registry)
    if not valid:
        print(f"\n⚠️  {msg}")
        return

    display_name = input("Display name (shown in menus): ").strip() or project_id
    description = input("Short description (optional): ").strip()

    registry[project_id] = {"display_name": display_name, "description": description}
    save_registry(registry)
    print(f"\n✅ Added '{project_id}' to projects.json")

    try:
        add_to_python_projects_list(project_id, project_path)
        print(f"✅ Added '{project_id}' to ingest_all_projects.py's PROJECTS list")
    except Exception as e:
        print(f"⚠️  Couldn't auto-update PROJECTS list: {e}")
        print(f"   Add this line manually: (\"{project_id}\", r\"{project_path}\"),")

    run_now = input("\nIngest this project's code into memory now? (y/n): ").strip().lower()
    if run_now == "y":
        from parcle import Parcle
        client = Parcle(api_key=os.environ.get("PARCLE_API_KEY"))
        ingested, skipped, failed = ingest_project(client, project_id, project_path)
        print(f"\nDone. {ingested} ingested, {skipped} skipped, {failed} failed.")
    else:
        print(f"\nSkipped. Run this later: python devduck.py --setup (option 7)")

    print(f"\n🎉 '{display_name}' is ready to use across all DevDuck AI bots.")


def main():
    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument("--cli", action="store_true")
    parser.add_argument("--name")
    parser.add_argument("--slug")
    parser.add_argument("--description", default="")
    parser.add_argument("--source-type", dest="source_type", choices=["folder", "zip", "github"])
    parser.add_argument("--source")
    parser.add_argument("--ingest", default="y", choices=["y", "n"])

    args, _unknown = parser.parse_known_args()

    if args.cli:
        if not args.name or not args.source_type or not args.source:
            print("ERROR: --cli mode requires --name, --source-type, and --source")
            sys.exit(1)
        run_cli_mode(args)
    else:
        run_interactive_mode()


if __name__ == "__main__":
    main()

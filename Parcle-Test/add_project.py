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
import subprocess
from dotenv import load_dotenv

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


def prompt_choice():
    print("\nHow do you want to add this project?")
    print("  1. Local folder path")
    print("  2. Zip file")
    print("  3. GitHub repo URL (public only)")
    return input("\nPick an option (1-3): ").strip()


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Add a new project to DevDuck AI's memory.")
    parser.add_argument("--cli", action="store_true", help="Run in non-interactive CLI mode")
    parser.add_argument("--name", help="Display name of the project")
    parser.add_argument("--slug", help="Project ID (slug) to register")
    parser.add_argument("--description", default="", help="Short description of the project")
    parser.add_argument("--source-type", choices=["folder", "zip", "github"], help="Source type")
    parser.add_argument("--source", help="Path or URL of the source")
    parser.add_argument("--ingest", choices=["y", "n"], default="n", help="Ingest project code now? (y/n)")
    
    args = parser.parse_args()

    registry = load_registry()

    if args.cli:
        # Non-interactive CLI mode
        if not args.name or not args.source_type or not args.source:
            print("ERROR: --name, --source-type, and --source are required in --cli mode.")
            sys.exit(1)

        project_id = args.slug or slugify(args.name)
        valid, msg = validate_project_id(project_id, registry)
        if not valid:
            print(f"ERROR: {msg}")
            sys.exit(1)

        display_name = args.name
        description = args.description
        source_type = args.source_type
        raw_source = args.source

        if source_type == "folder":
            project_path, error = get_local_folder(raw_source)
        elif source_type == "zip":
            project_path, error = get_from_zip(raw_source)
        elif source_type == "github":
            project_path, error = get_from_github(raw_source)
        else:
            error = "Invalid source type"

        if error:
            print(f"ERROR: {error}")
            sys.exit(1)

        print(f"PROGRESS: Project source ready at: {project_path}")

        # Update the registry
        registry[project_id] = {
            "display_name": display_name,
            "description": description,
        }
        save_registry(registry)
        print(f"PROGRESS: Registered '{project_id}' in projects.json")

        # Update ingest_all_projects.py's PROJECTS list
        try:
            add_to_python_projects_list(project_id, project_path)
            print(f"PROGRESS: Added '{project_id}' to ingest_all_projects.py's PROJECTS list")
        except Exception as e:
            print(f"ERROR: Couldn't auto-update PROJECTS list: {e}")
            sys.exit(1)

        # Ingest now
        if args.ingest == "y":
            print("PROGRESS: Ingesting project code into memory database now...")
            try:
                from parcle import Parcle
                client = Parcle(api_key=os.environ.get("PARCLE_API_KEY"))
                ingested, skipped, failed = ingest_project(client, project_id, project_path)
                print(f"PROGRESS: Ingested {ingested} files, skipped {skipped}, failed {failed}.")
            except Exception as e:
                print(f"ERROR: Ingestion failed: {e}")
                sys.exit(1)
        else:
            print("PROGRESS: Ingestion skipped as requested.")

        print(f"SUCCESS: {project_id}")
        return

    # Interactive mode (fallback)
    print("=" * 50)
    print("  ➕ Add a New Project to DevDuck AI")
    print("=" * 50)

    choice = prompt_choice()

    if choice == "1":
        raw = input("\nEnter the full folder path: ").strip()
        project_path, error = get_local_folder(raw)
    elif choice == "2":
        raw = input("\nEnter the full path to the .zip file: ").strip()
        project_path, error = get_from_zip(raw)
    elif choice == "3":
        raw = input("\nEnter the GitHub repo URL: ").strip()
        project_path, error = get_from_github(raw)
    else:
        print("\nInvalid choice. Exiting.")
        return

    if error:
        print(f"\n⚠️  {error}")
        return

    print(f"\n✅ Project source ready at: {project_path}")

    # Suggest a slug from the folder name, but let the user confirm/override
    suggested_id = slugify(os.path.basename(project_path.rstrip(os.sep)))
    project_id = input(f"\nProject ID (slug) [{suggested_id}]: ").strip() or suggested_id

    valid, msg = validate_project_id(project_id, registry)
    if not valid:
        print(f"\n⚠️  {msg}")
        return

    display_name = input("Display name (shown in menus): ").strip() or project_id
    description = input("Short description (optional): ").strip()

    # Update the registry (used by every bot's project picker)
    registry[project_id] = {
        "display_name": display_name,
        "description": description,
    }
    save_registry(registry)
    print(f"\n✅ Added '{project_id}' to projects.json")

    # Update ingest_all_projects.py's PROJECTS list (used by README Cleanup
    # Bot and PR Reviewer to locate the real source on disk)
    try:
        add_to_python_projects_list(project_id, project_path)
        print(f"✅ Added '{project_id}' to ingest_all_projects.py's PROJECTS list")
    except Exception as e:
        print(f"⚠️  Couldn't auto-update PROJECTS list: {e}")
        print(f"   Add this line manually: (\"{project_id}\", r\"{project_path}\"),")

    # Ingest now
    run_now = input("\nIngest this project's code into memory now? (y/n): ").strip().lower()
    if run_now == "y":
        from parcle import Parcle
        client = Parcle(api_key=os.environ.get("PARCLE_API_KEY"))
        ingested, skipped, failed = ingest_project(client, project_id, project_path)
        print(f"\nDone. {ingested} ingested, {skipped} skipped, {failed} failed.")
    else:
        print(f"\nSkipped. Run this later: python devduck.py --setup (option 6)")

    print(f"\n🎉 '{display_name}' is ready to use across all DevDuck AI bots.")


if __name__ == "__main__":
    main()

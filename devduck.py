import os
import sys
import subprocess
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Every bot expects PARCLE_API_KEY in its environment, but only
# Parcle-Test/.env actually has it on disk. Load it once here and pass
# it explicitly to every subprocess below, so it doesn't matter which
# folder a bot's own load_dotenv() looks in.
load_dotenv(os.path.join(BASE_DIR, "Parcle-Test", ".env"))
PARCLE_API_KEY = os.environ.get("PARCLE_API_KEY")

if not PARCLE_API_KEY:
    print("⚠️  PARCLE_API_KEY not found in Parcle-Test\\.env — bots will fail until this is set.")

# Each entry: (menu label, folder relative to repo root, script filename)
BOTS = {
    "1": ("Onboard onto a project (ask questions)", "Parcle-Test", "chat.py"),
    "2": ("Debug a bug (search past fixes)", "zero-sync-debugger", "debug_search.py"),
    "3": ("Check repo health (README / structure)", "readme-cleanup-bot", "report_generator.py"),
    "4": ("Review a PR diff", "pr-reviewer-bot", "reviewer.py"),
}

SETUP_ACTIONS = {
    "5": ("Sync bug history into memory (run before #2 / #4 for best results)", "zero-sync-debugger", "ingest_bugs.py"),
    "6": ("Ingest/re-ingest project source code into memory", "Parcle-Test", "ingest_all_projects.py"),
}


def print_menu(show_setup=False):
    print("\n" + "=" * 50)
    print("  🦆 DevDuck AI")
    print("=" * 50)
    print("\nWhat would you like to do?\n")
    for key, (label, _, _) in BOTS.items():
        print(f"  {key}. {label}")

    if show_setup:
        print()
        for key, (label, _, _) in SETUP_ACTIONS.items():
            print(f"  {key}. {label}")

    print("\n  0. Exit\n")


def run_script(folder, script):
    """
    Launch a bot as its own subprocess, with its working directory
    set to its own folder. This keeps every bot's relative-path logic
    behaving exactly as it does when run manually, and avoids any
    risk of one bot's sys.path/import side effects leaking into another.
    """
    script_dir = os.path.join(BASE_DIR, folder)
    script_path = os.path.join(script_dir, script)

    if not os.path.exists(script_path):
        print(f"\n⚠️  Couldn't find {script_path}. Skipping.\n")
        return

    print(f"\n→ Launching {folder}/{script} ...\n")
    try:
        # Explicitly pass PARCLE_API_KEY into the subprocess's environment,
        # since each bot's own .env lookup may not find it from a different folder.
        env = os.environ.copy()
        if PARCLE_API_KEY:
            env["PARCLE_API_KEY"] = PARCLE_API_KEY

        # cwd=script_dir makes this behave identically to manually
        # cd-ing into the folder and running `python script.py`
        subprocess.run([sys.executable, script], cwd=script_dir, env=env)
    except Exception as e:
        print(f"\n⚠️  Failed to launch {script}: {e}\n")

    print(f"\n← Returned from {folder}/{script}\n")


def main():
    show_setup = "--setup" in sys.argv

    while True:
        print_menu(show_setup=show_setup)
        if not show_setup:
            print("  (Adding a new project? Run: python devduck.py --setup)\n")

        choice = input("Pick an option: ").strip()

        if choice == "0":
            print("Goodbye!")
            break

        entry = BOTS.get(choice) or SETUP_ACTIONS.get(choice)
        if not entry:
            print("\nInvalid choice, try again.\n")
            continue

        _, folder, script = entry
        run_script(folder, script)


if __name__ == "__main__":
    main()

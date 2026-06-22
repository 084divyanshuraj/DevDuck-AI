"""
devduck_run.py — DevDuck Smart Terminal Wrapper

Usage:
    python devduck_run.py <project_id> <command> [args...]

Examples:
    python devduck_run.py taskapp npm run build
    python devduck_run.py weather-website python app.py
    python devduck_run.py tourist-safety npm start

How it works:
    1. Runs your command as a subprocess, streaming output live so it
       looks completely native in the terminal.
    2. If the command exits with a non-zero code (a crash), it captures
       the stderr output.
    3. Sends that error to Parcle's memory for this project and asks for
       the most relevant fix based on past bugs and the project's code.
    4. Ingests the error back into the project's memory so future crashes
       of the same type get even better answers.
    5. Prints the fix right in the terminal — no copy-pasting required.
"""

import os
import sys
import json
import tempfile
import subprocess
import threading
from dotenv import load_dotenv

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(SCRIPT_DIR, ".env"))

# Emoji-safe stdout for Windows consoles
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

try:
    from parcle import Parcle
except ImportError:
    print("⚠️  The 'parcle' package isn't installed. Run: pip install parcle")
    sys.exit(1)

API_KEY = os.environ.get("PARCLE_API_KEY")
if not API_KEY:
    print("⚠️  PARCLE_API_KEY not found in .env")
    sys.exit(1)


DIVIDER = "─" * 60

FIX_PROMPT_TEMPLATE = """\
A developer just ran a command in their terminal and it crashed \
with the following error output:

--- ERROR OUTPUT ---
{error_output}
--- END ERROR ---

Based on this project's code, past bug history, and any similar \
issues stored in memory:

1. Identify the most likely root cause of this error.
2. Provide a clear, step-by-step fix the developer can apply \
RIGHT NOW in their terminal.
3. If this looks like a known recurring bug, say so and cite \
the past fix.

Be concise and actionable — this is appearing directly in their \
terminal, not a chat UI. No markdown headers. \
Use plain numbered steps.
"""


def stream_process(process, stderr_lines):
    """
    Read stdout and stderr from the subprocess simultaneously,
    streaming stdout live to the user's terminal while collecting
    stderr for later analysis.

    Running in two threads avoids deadlocks that happen when both
    pipes fill up and block each other waiting for a reader.
    """
    def read_stdout():
        for line in iter(process.stdout.readline, b""):
            sys.stdout.buffer.write(line)
            sys.stdout.buffer.flush()

    def read_stderr():
        for line in iter(process.stderr.readline, b""):
            decoded = line.decode("utf-8", errors="replace")
            stderr_lines.append(decoded)
            sys.stderr.write(decoded)
            sys.stderr.flush()

    t1 = threading.Thread(target=read_stdout, daemon=True)
    t2 = threading.Thread(target=read_stderr, daemon=True)
    t1.start()
    t2.start()
    t1.join()
    t2.join()


def get_fix_from_parcle(client, project_id, error_output):
    """Search Parcle memory for this error and return a suggested fix."""
    query = FIX_PROMPT_TEMPLATE.format(error_output=error_output[:3000])
    try:
        result = client.search(user_id=project_id, query=query)
        answer = getattr(result, "answer", None)
        confidence = getattr(result, "confidence", 0.0)
        return answer, confidence
    except Exception as e:
        return None, 0.0


def ingest_error_into_memory(client, project_id, command_str, error_output, fix):
    """
    Store this crash + its fix back into the project's Parcle memory
    so future similar errors get even better answers.
    """
    memory_entry = {
        "type": "terminal_crash_log",
        "command": command_str,
        "error": error_output[:2000],
        "fix": fix or "No fix found at time of ingestion.",
    }
    try:
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".json", delete=False, encoding="utf-8"
        ) as tmp:
            json.dump(memory_entry, tmp)
            tmp_path = tmp.name

        client.ingest_file(user_id=project_id, file=tmp_path)
        os.remove(tmp_path)
        return True
    except Exception:
        return False


def main():
    if len(sys.argv) < 3:
        print("Usage: python devduck_run.py <project_id> <command> [args...]")
        print("Example: python devduck_run.py taskapp npm run build")
        sys.exit(1)

    project_id = sys.argv[1]
    command_parts = sys.argv[2:]
    command_str = " ".join(command_parts)

    print(f"\n🦆 DevDuck is watching: {command_str}")
    print(f"   Project context: {project_id}")
    print(DIVIDER + "\n")

    # Run the command, streaming output live
    stderr_lines = []
    try:
        process = subprocess.Popen(
            command_parts,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=os.getcwd(),
            shell=(os.name == "nt"),  # needed on Windows for built-in commands
        )
        stream_process(process, stderr_lines)
        exit_code = process.wait()
    except FileNotFoundError:
        print(f"\n⚠️  Command not found: '{command_parts[0]}'")
        print("   Check the command is installed and on your PATH.")
        sys.exit(1)

    # Command succeeded — nothing to do
    if exit_code == 0:
        print(f"\n{DIVIDER}")
        print("✅ Command completed successfully. No issues detected.")
        print(DIVIDER)
        sys.exit(0)

    # Command crashed — intercept and get a fix
    error_output = "".join(stderr_lines).strip()

    print(f"\n{DIVIDER}")
    print(f"🦆 DevDuck intercepted a crash! (exit code {exit_code})")
    print(DIVIDER)

    if not error_output:
        print("\n⚠️  No stderr output captured — the error may have gone to stdout.")
        print("   Try re-running with output redirection if you need a fix suggestion.\n")
        sys.exit(exit_code)

    print("\n🔍 Searching project memory for a fix...\n")

    client = Parcle(api_key=API_KEY)
    fix, confidence = get_fix_from_parcle(client, project_id, error_output)

    print(DIVIDER)
    if fix:
        conf_tag = "🟢" if confidence >= 0.85 else ("🟡" if confidence >= 0.6 else "🔴")
        print(f"💡 Here's the fix: {conf_tag} confidence {int(confidence * 100)}%\n")
        print(fix)
    else:
        print("❌ Couldn't find a relevant fix in this project's memory.")
        print("   Try ingesting more project files with: python devduck.py --setup (option 7)")
    print(DIVIDER)

    # Ingest the crash + fix back into memory for next time
    stored = ingest_error_into_memory(client, project_id, command_str, error_output, fix)
    if stored:
        print("📥 This crash has been saved to project memory for future reference.\n")

    sys.exit(exit_code)


if __name__ == "__main__":
    main()

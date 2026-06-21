"""
generate_diagram.py — Generate a Mermaid.js architecture flowchart for a project.

CLI usage:
    python generate_diagram.py <project_id>

Outputs JSON to stdout (matching query_project.py's pattern):
    {"success": true, "mermaid": "graph TD\n...", "confidence": 0.92}
    {"success": false, "error": "..."}

Designed to be called directly by a teammate's future Next.js API route
the same way query_project.py is — spawned as a subprocess, output
parsed as JSON.
"""

import os
import re
import sys
import json
from dotenv import load_dotenv

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(SCRIPT_DIR, ".env"))

# Same fix as the other scripts in this folder — required when spawned
# as a subprocess on Windows, since print() with non-ASCII chars would
# otherwise crash with a charmap UnicodeEncodeError.
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

try:
    from parcle import Parcle
except ImportError:
    print(json.dumps({"success": False, "error": "The 'parcle' package isn't installed. Run: pip install parcle"}))
    sys.exit(1)

API_KEY = os.environ.get("PARCLE_API_KEY")
if not API_KEY:
    print(json.dumps({"success": False, "error": "PARCLE_API_KEY not found in .env"}))
    sys.exit(1)


DIAGRAM_PROMPT = """\
Analyze this project's architecture and generate a Mermaid.js flowchart \
diagram showing how its major parts connect.

Specifically identify and include, where applicable:
- Entry point(s) (e.g. the main server file, index.html, app.py)
- Major modules/layers (e.g. routes, controllers, models, frontend components)
- Databases or external storage (e.g. SQLite, MongoDB, file-based storage)
- External services/APIs the project calls (e.g. third-party APIs)
- Direction of data flow between these parts (use arrows to show this)

STRICT OUTPUT RULES — follow exactly:
1. Respond with ONLY valid Mermaid flowchart syntax, starting with \
"graph TD" or "flowchart TD".
2. Do NOT wrap the output in markdown code fences (no ```mermaid, no ```).
3. Do NOT include any explanation, preamble, or text before or after the diagram.
4. Use short, simple node labels (a few words each) — avoid special \
characters like parentheses, colons, or quotes inside node labels, \
since they can break Mermaid's parser.
5. Keep it to a reasonable size — focus on the most important \
8-15 nodes, not every single file.
6. If the project structure is unclear or there isn't enough \
information to build a meaningful diagram, respond with exactly: \
NOT_ENOUGH_INFO
"""


def extract_mermaid(raw_text):
    """
    Defensively clean up the model's response: strip markdown code
    fences if present despite instructions, strip leading/trailing
    whitespace, and validate it starts with a recognized Mermaid
    diagram type keyword.
    """
    text = raw_text.strip()

    # Strip markdown code fences if the model added them anyway
    fence_match = re.match(r"^```(?:mermaid)?\s*\n(.*?)\n```$", text, re.DOTALL)
    if fence_match:
        text = fence_match.group(1).strip()

    valid_starts = ("graph ", "flowchart ")
    if not text.startswith(valid_starts):
        return None

    return text


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Usage: python generate_diagram.py <project_id>"}))
        sys.exit(1)

    project_id = sys.argv[1]

    try:
        client = Parcle(api_key=API_KEY)
        result = client.search(user_id=project_id, query=DIAGRAM_PROMPT)
        raw_answer = getattr(result, "answer", "") or ""
        confidence = getattr(result, "confidence", 0.0)

        if raw_answer.strip() == "NOT_ENOUGH_INFO":
            print(json.dumps({
                "success": False,
                "error": "Not enough information in this project's memory to generate a meaningful diagram."
            }))
            sys.exit(1)

        mermaid_code = extract_mermaid(raw_answer)

        if not mermaid_code:
            print(json.dumps({
                "success": False,
                "error": "Model response wasn't valid Mermaid syntax.",
                "raw_response": raw_answer[:500]  # truncated for debugging, not shown to end users
            }))
            sys.exit(1)

        print(json.dumps({
            "success": True,
            "mermaid": mermaid_code,
            "confidence": confidence
        }))

    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()

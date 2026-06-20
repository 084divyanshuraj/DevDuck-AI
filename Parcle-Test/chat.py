import os
import sys
import json
from dotenv import load_dotenv

load_dotenv()

try:
    from parcle import Parcle
except ImportError:
    print("⚠️  The 'parcle' package isn't installed. Run: pip install parcle")
    sys.exit(1)

API_KEY = os.environ.get("PARCLE_API_KEY")
if not API_KEY:
    print("⚠️  PARCLE_API_KEY not found. Make sure it's set in your .env file.")
    sys.exit(1)

REGISTRY_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "projects.json")


def load_registry():
    """Load the local project registry (project_id -> display name/description)."""
    if not os.path.exists(REGISTRY_PATH):
        print(f"⚠️  No projects.json found at {REGISTRY_PATH}.")
        print("    Create one to enable the project menu, or see ingest_all_projects.py.")
        return {}
    try:
        with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        print(f"⚠️  projects.json is malformed: {e}")
        return {}


def choose_project(registry):
    """Show a numbered menu of known projects and let the user pick one."""
    if not registry:
        # Fall back to manual entry if no registry is available
        return input("Enter a project_id manually: ").strip()

    project_ids = list(registry.keys())

    print("\nAvailable projects:")
    for i, pid in enumerate(project_ids, start=1):
        info = registry[pid]
        print(f"  {i}. {info.get('display_name', pid)}")
        if info.get("description"):
            print(f"     {info['description']}")

    print(f"  {len(project_ids) + 1}. (Enter a project_id manually)")

    while True:
        choice = input("\nPick a project number: ").strip()
        if choice.isdigit():
            idx = int(choice)
            if 1 <= idx <= len(project_ids):
                return project_ids[idx - 1]
            if idx == len(project_ids) + 1:
                return input("Enter project_id: ").strip()
        print("Please enter a valid number from the list.")


def build_context_query(history, new_question, max_turns=4):
    """
    Parcle's search() doesn't take a chat history natively, so we fold
    recent turns into the query text itself to give it conversational context.
    Only the last `max_turns` exchanges are included to keep queries focused.
    """
    if not history:
        return new_question

    recent = history[-max_turns:]
    context_lines = []
    for turn in recent:
        context_lines.append(f"Previous question: {turn['question']}")
        context_lines.append(f"Previous answer: {turn['answer']}")

    context_block = "\n".join(context_lines)
    return (
        f"Conversation so far:\n{context_block}\n\n"
        f"New question (answer this one, using the above only for context): {new_question}"
    )


def main():
    client = Parcle(api_key=API_KEY)
    registry = load_registry()

    print("=" * 60)
    print("  Onboarding Assistant")
    print("=" * 60)

    project_id = choose_project(registry)
    if not project_id:
        print("No project selected. Exiting.")
        return

    display_name = registry.get(project_id, {}).get("display_name", project_id)
    print(f"\n✅ Connected to: {display_name}")
    print("Ask anything about this project.")
    print("Type 'exit' to quit, 'switch' to see the project menu, or 'switch <number/name>' to jump directly.\n")

    history = []

    while True:
        try:
            question = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nGoodbye!")
            break

        if not question:
            continue

        if question.lower() in ("exit", "quit"):
            print("Goodbye!")
            break

        lower_q = question.lower()
        if lower_q == "switch" or lower_q.startswith("switch "):
            remainder = question[len("switch"):].strip()
            project_ids = list(registry.keys())

            new_project_id = None

            if remainder:
                # "switch 2" — pick by menu number
                if remainder.isdigit() and 1 <= int(remainder) <= len(project_ids):
                    new_project_id = project_ids[int(remainder) - 1]
                # "switch taskapp" — pick by exact project_id
                elif remainder in registry:
                    new_project_id = remainder
                # "switch Tic Tac Toe" — loose match against display names
                else:
                    for pid, info in registry.items():
                        if remainder.lower() in info.get("display_name", "").lower():
                            new_project_id = pid
                            break

                if not new_project_id:
                    print(f"\n⚠️  Couldn't match '{remainder}' to a known project. Showing the menu instead.\n")

            if not new_project_id:
                new_project_id = choose_project(registry)

            if not new_project_id:
                continue

            project_id = new_project_id
            display_name = registry.get(project_id, {}).get("display_name", project_id)
            print(f"\n✅ Switched to: {display_name}\n")
            history = []  # don't carry context across projects
            continue

        query = build_context_query(history, question)

        try:
            result = client.search(user_id=project_id, query=query)
        except Exception as e:
            print(f"\n⚠️  Something went wrong reaching this project's memory: {e}")
            print("    Double-check the project_id is correct and was ingested successfully.\n")
            continue

        answer = getattr(result, "answer", None)
        confidence = getattr(result, "confidence", None)

        if not answer:
            print("\nBot: I couldn't find anything relevant for that in this project.\n")
            continue

        print(f"\nBot: {answer}")
        if confidence is not None:
            tag = "🟢" if confidence >= 0.85 else ("🟡" if confidence >= 0.6 else "🔴")
            print(f"     {tag} confidence: {confidence}")
        print()

        history.append({"question": question, "answer": answer})


if __name__ == "__main__":
    main()

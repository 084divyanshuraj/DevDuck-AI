import os
import sys
import json
import tempfile
from dotenv import load_dotenv
from parcle import Parcle

# Force utf-8 encoding for Windows console to support emojis
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

load_dotenv()

API_KEY = os.environ.get("PARCLE_API_KEY")
if not API_KEY:
    print("Error: PARCLE_API_KEY environment variable not found.")
    sys.exit(1)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PARCLE_TEST_DIR = os.path.join(BASE_DIR, "Parcle-Test")
REGISTRY_PATH = os.path.join(PARCLE_TEST_DIR, "projects.json")

def load_registry():
    if not os.path.exists(REGISTRY_PATH):
        return {}
    with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def choose_project(registry):
    if not registry:
        return input("Enter project ID: ").strip()
        
    project_ids = list(registry.keys())
    print("\nAvailable projects to review against:")
    for i, pid in enumerate(project_ids, start=1):
        info = registry[pid]
        print(f"  {i}. {info.get('display_name', pid)}")
        
    while True:
        choice = input("\nPick a project to run the PR review for: ").strip()
        if choice.isdigit():
            idx = int(choice)
            if 1 <= idx <= len(project_ids):
                return project_ids[idx - 1]
        print("Invalid selection.")

def get_diff_content():
    default_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sample_pr.diff")
    
    print("\n----------------------------------------")
    user_path = input("Enter path to your .diff file (Press Enter to use default 'sample_pr.diff'): ").strip()
    
    final_path = user_path if user_path else default_path
    
    if not os.path.exists(final_path):
        print(f"❌ Error: Could not find file at {final_path}")
        return None, None
        
    with open(final_path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read(), final_path

def build_context_query(history, new_question):
    if not history:
        return new_question
        
    context_lines = []
    for turn in history[-4:]:
        context_lines.append(f"Q: {turn['q']}")
        context_lines.append(f"A: {turn['a']}")
        
    context_block = "\n".join(context_lines)
    return f"Context so far:\n{context_block}\n\nNew question: {new_question}"

def main():
    client = Parcle(api_key=API_KEY)
    registry = load_registry()
    
    print("========================================")
    print("  DEVDUCK PR REVIEWER (v2.0)")
    print("========================================")
    
    project_id = choose_project(registry)
    if not project_id:
        return
        
    display_name = registry.get(project_id, {}).get("display_name", project_id)
    print(f"\n✅ Attached PR Reviewer to: {display_name}")
    
    diff_content, file_path = get_diff_content()
    if not diff_content:
        sys.exit(1)
        
    print(f"\n📂 Loading Pull Request from {os.path.basename(file_path)}...")
    print("🔍 Asking DevDuck AI to cross-reference code changes against historical bugs...")
    
    initial_query = f"""
    Look at this code diff and tell me if it introduces a bug that we have fixed in the past.
    If it looks like a past bug, start your answer with "BLOCKED" and explain why, citing the past bug.
    If the code looks safe compared to our history, start your answer with "APPROVED".
    
    Code:
    {diff_content}
    """
    
    try:
        result = client.search(user_id=project_id, query=initial_query)
        review_answer = result.answer
    except Exception as e:
        print(f"❌ Error communicating with Parcle: {e}")
        sys.exit(1)
        
    print("\n========================================")
    print("PR REVIEW RESULTS")
    print("========================================\n")
    
    is_blocked = "BLOCKED" in review_answer.upper()
    
    if is_blocked:
        print("🚨 DECISION: PULL REQUEST BLOCKED 🚨")
    else:
        print("✅ DECISION: PULL REQUEST APPROVED")
        
    print("\nDevDuck AI Analysis:")
    print("--------------------------------")
    print(review_answer)
    print("--------------------------------\n")
    
    # INTERACTIVE CHAT LOOP
    history = [{"q": "Review this diff", "a": review_answer}]
    print("You can now ask follow-up questions about this review. Type 'exit' to sync report and quit.\n")
    
    while True:
        try:
            followup = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n")
            break
            
        if not followup:
            continue
            
        if followup.lower() in ("exit", "quit"):
            break
            
        query = build_context_query(history, followup)
        try:
            result = client.search(user_id=project_id, query=query)
            print(f"\nDevDuck: {result.answer}\n")
            history.append({"q": followup, "a": result.answer})
        except Exception as e:
            print(f"⚠️ Error: {e}\n")
            
    # MEMORY SYNC
    print("\n----------------------------------------")
    print(f"Syncing PR Review Report to {display_name}'s Parcle memory...")
    try:
        client.create_user(user_id=project_id)
        
        memory_payload = {
            "type": "pr_review_log",
            "project_id": project_id,
            "file_reviewed": os.path.basename(file_path),
            "status": "BLOCKED" if is_blocked else "APPROVED",
            "reasoning": review_answer
        }
        
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as tmp:
            json.dump(memory_payload, tmp)
            tmp_path = tmp.name
            
        client.ingest_file(user_id=project_id, file=tmp_path)
        os.remove(tmp_path)
        print("✅ PR Review Report successfully stored in DevDuck AI memory!")
        
    except Exception as e:
        print(f"❌ Warning: Failed to sync with Parcle memory: {e}")
        
    print("Review complete. Protect the main branch!")

if __name__ == "__main__":
    main()

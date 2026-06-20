import os
import sys
import json
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

# Paths
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

def load_diff():
    diff_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sample_pr.diff")
    if not os.path.exists(diff_path):
        return None
    with open(diff_path, "r", encoding="utf-8") as f:
        return f.read()

def main():
    client = Parcle(api_key=API_KEY)
    registry = load_registry()
    
    print("========================================")
    print("  DEVDUCK PR REVIEWER (Bug Preventer)")
    print("========================================")
    
    project_id = choose_project(registry)
    if not project_id:
        return
        
    display_name = registry.get(project_id, {}).get("display_name", project_id)
    
    print(f"\n✅ Initializing PR Review for: {display_name}")
    print("📂 Loading Pull Request #104 (sample_pr.diff)...")
    
    diff_content = load_diff()
    if not diff_content:
        print("❌ Error: Could not find sample_pr.diff")
        sys.exit(1)
        
    print("🔍 Asking DevDuck AI to cross-reference code changes against historical bugs...")
    
    query = f"""
    Look at this code diff and tell me if it introduces a bug that we have fixed in the past.
    If it looks like a past bug, start your answer with "BLOCKED" and explain why, citing the past bug.
    If the code looks safe compared to our history, start your answer with "APPROVED".
    
    Code:
    {diff_content}
    """
    
    try:
        result = client.search(user_id=project_id, query=query)
        answer = result.answer
    except Exception as e:
        print(f"❌ Error communicating with Parcle: {e}")
        sys.exit(1)
        
    print("\n========================================")
    print("PR REVIEW RESULTS")
    print("========================================\n")
    
    if "BLOCKED" in answer.upper():
        print("🚨 DECISION: PULL REQUEST BLOCKED 🚨")
    else:
        print("✅ DECISION: PULL REQUEST APPROVED")
        
    print("\nDevDuck AI Analysis:")
    print("--------------------------------")
    print(answer)
    print("--------------------------------\n")
    print("Review complete. Protect the main branch!")

if __name__ == "__main__":
    main()

import os
import sys
import json
from dotenv import load_dotenv

from parcle import Parcle
from bug_analyzer import analyze_severity

# Force utf-8 encoding for Windows console to support emojis
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

load_dotenv()

API_KEY = os.environ.get("PARCLE_API_KEY")
if not API_KEY:
    print("Error: PARCLE_API_KEY environment variable not found.")
    sys.exit(1)

# Read the unified projects registry
REGISTRY_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "Parcle-Test", "projects.json")

def load_registry():
    if not os.path.exists(REGISTRY_PATH):
        return {}
    with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def choose_project(registry):
    if not registry:
        return input("Enter project ID: ").strip()
        
    project_ids = list(registry.keys())
    print("\nAvailable projects for debugging:")
    for i, pid in enumerate(project_ids, start=1):
        info = registry[pid]
        print(f"  {i}. {info.get('display_name', pid)}")
        
    while True:
        choice = input("\nPick a project to debug: ").strip()
        if choice.isdigit():
            idx = int(choice)
            if 1 <= idx <= len(project_ids):
                return project_ids[idx - 1]
        print("Invalid selection.")

def build_context_query(history, new_question):
    context_lines = []
    for turn in history[-4:]:
        context_lines.append(f"Q: {turn['q']}")
        context_lines.append(f"A: {turn['a']}")
    
    context_block = "\n".join(context_lines)
    
    structured_query = f"""
    Context so far:
    {context_block}
    
    I am describing a bug or asking a follow-up: "{new_question}"
    Based on the ingested historical bugs memory, provide the most relevant answer.
    If it's a new bug report, format your answer EXACTLY as follows:
    
    Similar Issue Found:
    [Title of the similar issue]
    
    Root Cause:
    [Root cause of the similar issue]
    
    Suggested Fix:
    [Suggested fix for the similar issue]
    
    If it's a follow up question, just answer it normally.
    """
    return structured_query

def main():
    client = Parcle(api_key=API_KEY)
    registry = load_registry()
    
    print("========================================")
    print("  ZERO-SYNC DEBUGGER (v2.0)")
    print("========================================")
    
    project_id = choose_project(registry)
    if not project_id:
        return
        
    display_name = registry.get(project_id, {}).get("display_name", project_id)
    print(f"\n✅ Attached Debugger to: {display_name}")
    print("Type your bug description. Type 'exit' to quit, 'switch' to change projects.\n")
    
    history = []
    
    while True:
        try:
            user_input = input("Bug Report / Query: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nExiting Debugger...")
            break
            
        if not user_input:
            continue
            
        if user_input.lower() in ("exit", "quit"):
            break
            
        if user_input.lower() == "switch":
            project_id = choose_project(registry)
            display_name = registry.get(project_id, {}).get("display_name", project_id)
            print(f"\n✅ Switched to: {display_name}\n")
            history = []
            continue
            
        severity = analyze_severity(user_input)
        
        # Format Severity with Emojis
        sev_emoji = "🚨" if severity == "CRITICAL" else ("⚠️" if severity in ("ERROR", "WARNING") else "ℹ️")
        
        query = build_context_query(history, user_input)
        
        try:
            result = client.search(user_id=project_id, query=query)
        except Exception as e:
            print(f"⚠️ Error accessing {display_name}'s memory: {e}")
            continue
            
        print("\n==================================")
        print("ZERO-SYNC INSIGHTS")
        print("==================================\n")
        
        print(result.answer)
        print()
        
        print(f"Severity: {sev_emoji} {severity}")
        
        conf = result.confidence
        try:
            if isinstance(conf, (float, int)):
                conf_val = conf
                conf_str = f"{int(conf * 100)}%"
            else:
                conf_val = float(conf)
                conf_str = f"{int(conf_val * 100)}%"
        except:
            conf_val = 0.5
            conf_str = str(conf)
            
        conf_emoji = "🟢" if conf_val >= 0.85 else ("🟡" if conf_val >= 0.6 else "🔴")
        print(f"Confidence: {conf_emoji} {conf_str}\n")
        
        print("==================================\n")
        
        history.append({"q": user_input, "a": result.answer})

if __name__ == "__main__":
    main()

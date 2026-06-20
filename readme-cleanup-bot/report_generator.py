import os
import sys
import json
import tempfile
from dotenv import load_dotenv

from parcle import Parcle
from analyzer import RepositoryAnalyzer
from readme_checker import ReadmeChecker

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

def get_project_paths():
    """Attempt to load real paths from the teammate's ingest script."""
    sys.path.append(PARCLE_TEST_DIR)
    try:
        import ingest_all_projects
        return dict(ingest_all_projects.PROJECTS)
    except Exception:
        return {}

def choose_project(registry):
    if not registry:
        return input("Enter project ID: ").strip()
        
    project_ids = list(registry.keys())
    print("\nAvailable projects to analyze:")
    for i, pid in enumerate(project_ids, start=1):
        info = registry[pid]
        print(f"  {i}. {info.get('display_name', pid)}")
        
    while True:
        choice = input("\nPick a project to analyze: ").strip()
        if choice.isdigit():
            idx = int(choice)
            if 1 <= idx <= len(project_ids):
                return project_ids[idx - 1]
        print("Invalid selection.")

def main():
    client = Parcle(api_key=API_KEY)
    registry = load_registry()
    project_paths = get_project_paths()
    
    # Load mocked fallback repository data
    script_dir = os.path.dirname(os.path.abspath(__file__))
    sample_file_path = os.path.join(script_dir, "sample_repo_data.json")
    repo_data = {}
    if os.path.exists(sample_file_path):
        with open(sample_file_path, "r", encoding="utf-8") as f:
            repo_data_wrapper = json.load(f)
            repo_data = repo_data_wrapper.get("repository", {})
            
    print("========================================")
    print("  DEVDUCK README CLEANUP BOT (v2.0)")
    print("========================================")
    
    while True:
        project_id = choose_project(registry)
        if not project_id:
            break
            
        display_name = registry.get(project_id, {}).get("display_name", project_id)
        project_path = project_paths.get(project_id)
        
        print(f"\n🔍 Analyzing repository: {display_name}")
        if project_path and os.path.isdir(project_path):
            print(f"📂 Scanning real directory: {project_path}")
        else:
            print("⚠️ Real directory not found. Using DevDuck AI Mock Fallback Data.")
        
        # Run Structure Analysis
        struct_analyzer = RepositoryAnalyzer(repo_data, project_path)
        struct_results = struct_analyzer.analyze()
        
        # Run README Analysis
        fallback_readme = repo_data.get("readme_content", "")
        doc_checker = ReadmeChecker(fallback_readme, project_path)
        doc_results = doc_checker.analyze()
        
        # Combine Scores
        doc_score = doc_results["documentation_score"]
        struct_score = struct_results["structure_score"]
        maint_score = struct_results["maintainability_score"]
        
        overall_health = int((doc_score + struct_score + maint_score) / 3)
        
        # Emojis based on score
        score_emoji = "🟢" if overall_health >= 85 else ("🟡" if overall_health >= 60 else "🔴")
        
        # Combine Issues & Suggestions
        all_issues = doc_results["issues"] + struct_results["issues"]
        all_suggestions = list(set(doc_results["suggestions"] + struct_results["suggestions"]))
        
        # Format CLI Output
        print("\n========================================")
        print("DEVDUCK REPOSITORY ANALYSIS")
        print("========================================\n")
        
        print(f"Health Score: {score_emoji} {overall_health}/100\n")
        
        print("Issues Found:\n")
        if not all_issues:
            print("- ✅ None! Perfect repository!")
        else:
            for issue in all_issues:
                # Add emojis to issues
                prefix = "🚨" if "CRITICAL" in issue else "⚠️"
                print(f"- {prefix} {issue}")
            
        print("\nSuggestions:\n")
        if not all_suggestions:
            print("- Keep up the great work!")
        else:
            for suggestion in all_suggestions:
                print(f"- 💡 {suggestion}")
            
        print("\n========================================")
                
        # Parcle Memory Integration - Now specific to the project!
        print(f"\nSyncing analysis to {display_name}'s Parcle memory...")
        try:
            client.create_user(user_id=project_id)
            
            memory_payload = {
                "type": "repository_analysis",
                "project_id": project_id,
                "score": overall_health,
                "issues": all_issues,
                "suggestions": all_suggestions
            }
            
            with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as tmp:
                json.dump(memory_payload, tmp)
                tmp_path = tmp.name
                
            client.ingest_file(
                user_id=project_id,
                file=tmp_path
            )
            
            os.remove(tmp_path)
            print("✅ Analysis successfully stored in DevDuck AI memory!")
            
        except Exception as e:
            print(f"❌ Warning: Failed to sync with Parcle memory: {e}")
            
        # Continue loop
        print("\n----------------------------------------")
        cont = input("Analyze another project? (y/n): ").strip().lower()
        if cont != 'y':
            print("Exiting README Cleanup Bot. Goodbye!")
            break

if __name__ == "__main__":
    main()

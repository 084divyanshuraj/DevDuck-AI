import os
import sys
import json
import tempfile
from dotenv import load_dotenv

from parcle import Parcle
from analyzer import RepositoryAnalyzer
from readme_checker import ReadmeChecker

def main():
    load_dotenv()
    
    # Check for Parcle integration
    api_key = os.environ.get("PARCLE_API_KEY")
    if not api_key:
        print("Error: PARCLE_API_KEY environment variable not found.")
        sys.exit(1)
        
    client = Parcle(api_key=api_key)
    user_id = "readme_cleanup_bot"
    
    # Load mocked repository data
    script_dir = os.path.dirname(os.path.abspath(__file__))
    sample_file_path = os.path.join(script_dir, "sample_repo_data.json")
    
    if not os.path.exists(sample_file_path):
        print(f"Error: Could not find {sample_file_path}")
        sys.exit(1)
        
    with open(sample_file_path, "r", encoding="utf-8") as f:
        repo_data_wrapper = json.load(f)
        
    repo_data = repo_data_wrapper.get("repository", {})
    
    print("Analyze repository")
    # Simulate processing delay if we want, but instant is fine
    
    # Run Structure Analysis
    struct_analyzer = RepositoryAnalyzer(repo_data)
    struct_results = struct_analyzer.analyze()
    
    # Run README Analysis
    readme_content = repo_data.get("readme_content", "")
    doc_checker = ReadmeChecker(readme_content)
    doc_results = doc_checker.analyze()
    
    # Combine Scores
    doc_score = doc_results["documentation_score"]
    struct_score = struct_results["structure_score"]
    maint_score = struct_results["maintainability_score"]
    
    overall_health = int((doc_score + struct_score + maint_score) / 3)
    
    # Combine Issues & Suggestions
    all_issues = doc_results["issues"] + struct_results["issues"]
    # Provide custom phrasing if README Missing Usage Examples was expected exactly
    if "Missing Usage Section" in all_issues:
        all_issues.remove("Missing Usage Section")
        all_issues.append("README Missing Usage Examples")
        
    # Standardize phrasing to exactly match the demo if needed, otherwise use the generated ones
    all_suggestions = list(set(doc_results["suggestions"] + struct_results["suggestions"]))
    
    # Format CLI Output
    print("\n========================================")
    print("DEVDUCK REPOSITORY ANALYSIS")
    print("========================================\n")
    
    print(f"Health Score: {overall_health}/100\n")
    
    print("Issues Found:\n")
    for issue in all_issues:
        print(f"- {issue}")
        
    print("\nSuggestions:\n")
    for suggestion in all_suggestions:
        print(f"- {suggestion}")
        
    print("\n========================================")
    
    # Example missing sections printing (Optional, for demo logic)
    # if doc_results["generated_sections"]:
    #     print("\nGenerated Missing Sections Preview:")
    #     for section, text in doc_results["generated_sections"].items():
    #         print(f"--- {section} ---")
    #         print(text)
            
    # Parcle Memory Integration
    print("\nSyncing analysis to Parcle memory...")
    try:
        client.create_user(user_id=user_id)
        
        memory_payload = {
            "type": "repository_analysis",
            "score": overall_health,
            "issues": all_issues
        }
        
        # Save payload to a temporary file to ingest it
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as tmp:
            json.dump(memory_payload, tmp)
            tmp_path = tmp.name
            
        client.ingest_file(
            user_id=user_id,
            file=tmp_path
        )
        
        # Clean up temp file
        os.remove(tmp_path)
        print("Analysis successfully stored in DevDuck AI memory!")
        
    except Exception as e:
        print(f"Warning: Failed to sync with Parcle memory: {e}")

if __name__ == "__main__":
    main()

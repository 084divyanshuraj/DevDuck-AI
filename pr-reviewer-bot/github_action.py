import os
import sys
import json
import tempfile
import requests
from parcle import Parcle

# Force utf-8 encoding for Windows/CI console to support emojis
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

def main():
    print("========================================")
    print("  DEVDUCK GITHUB ACTION PR REVIEWER")
    print("========================================")

    # 1. Load Environment Variables
    parcle_api_key = os.environ.get("PARCLE_API_KEY")
    github_token = os.environ.get("GITHUB_TOKEN")
    project_id = os.environ.get("PROJECT_ID", "taskapp") # Default to taskapp if not specified

    if not parcle_api_key:
        print("Error: PARCLE_API_KEY environment variable not found.")
        sys.exit(1)
    
    if not github_token:
        print("Error: GITHUB_TOKEN environment variable not found.")
        sys.exit(1)

    # 2. Read the GitHub Action Event Payload
    event_path = os.environ.get("GITHUB_EVENT_PATH")
    if not event_path or not os.path.exists(event_path):
        print("Error: GITHUB_EVENT_PATH not found. Are you running this inside GitHub Actions?")
        sys.exit(1)

    with open(event_path, "r", encoding="utf-8") as f:
        event_data = json.load(f)

    if "pull_request" not in event_data:
        print("Error: This action must be run on a pull_request event.")
        sys.exit(1)

    pr = event_data["pull_request"]
    pr_number = pr["number"]
    repo_full_name = event_data["repository"]["full_name"]
    pr_url = pr["url"] # GitHub API URL for the PR

    print(f"✅ Triggered on PR #{pr_number} in {repo_full_name}")
    print(f"✅ Active Parcle Project Memory: {project_id}")

    # 3. Fetch the PR Diff
    print("📂 Fetching PR diff from GitHub...")
    headers = {
        "Authorization": f"token {github_token}",
        "Accept": "application/vnd.github.v3.diff" # Request the diff format
    }
    
    diff_response = requests.get(pr_url, headers=headers)
    if diff_response.status_code != 200:
        print(f"❌ Failed to fetch diff: {diff_response.status_code} {diff_response.text}")
        sys.exit(1)
        
    diff_content = diff_response.text
    if not diff_content.strip():
        print("ℹ️ No code changes found in this PR. Exiting.")
        sys.exit(0)

    # 4. Analyze Diff with Parcle
    print("🔍 Asking DevDuck AI to cross-reference code changes against historical bugs...")
    client = Parcle(api_key=parcle_api_key)

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

    is_blocked = "BLOCKED" in review_answer.upper()
    status_icon = "🚨" if is_blocked else "✅"
    decision = "BLOCKED" if is_blocked else "APPROVED"

    print(f"\n{status_icon} DECISION: PULL REQUEST {decision}")
    
    # 5. Post the Comment to GitHub
    print("\n📝 Posting AI review comment to GitHub PR...")
    
    comment_body = f"""### 🦆 DevDuck AI Review: {status_icon} **{decision}**

I have cross-referenced this Pull Request against `{project_id}`'s historical memory base.

**Analysis:**
{review_answer}

---
*Generated automatically by DevDuck AI GitHub Action*
"""

    comments_url = f"https://api.github.com/repos/{repo_full_name}/issues/{pr_number}/comments"
    post_headers = {
        "Authorization": f"token {github_token}",
        "Accept": "application/vnd.github.v3+json"
    }
    post_response = requests.post(comments_url, headers=post_headers, json={"body": comment_body})
    
    if post_response.status_code == 201:
        print("✅ Successfully posted comment to GitHub PR!")
    else:
        print(f"❌ Failed to post comment: {post_response.status_code} {post_response.text}")

    # 6. Sync Memory to Parcle (Connecting to the Frontend!)
    print(f"\n----------------------------------------")
    print(f"Syncing PR Review Report to Parcle memory...")
    try:
        client.create_user(user_id=project_id)
        
        memory_payload = {
            "type": "pr_review_log",
            "project_id": project_id,
            "pr_number": pr_number,
            "status": decision,
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

if __name__ == "__main__":
    main()

import os
import sys
import json
from dotenv import load_dotenv
from parcle import Parcle

# Force utf-8 encoding for Windows console to support emojis
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

def main():
    load_dotenv()
    
    api_key = os.environ.get("PARCLE_API_KEY")
    if not api_key:
        print("Error: PARCLE_API_KEY environment variable not found.")
        sys.exit(1)
        
    client = Parcle(api_key=api_key)
    
    # Load unified registry
    registry_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "Parcle-Test", "projects.json")
    
    if os.path.exists(registry_path):
        with open(registry_path, "r", encoding="utf-8") as f:
            registry = json.load(f)
    else:
        print("⚠️ No unified projects.json found. Using default zero_sync_debugger namespace.")
        registry = {"zero_sync_debugger": {"display_name": "Zero-Sync Default"}}
        
    script_dir = os.path.dirname(os.path.abspath(__file__))
    file_to_ingest = os.path.join(script_dir, "sample_bugs.json")
    
    if not os.path.exists(file_to_ingest):
        print(f"Error: {file_to_ingest} not found.")
        sys.exit(1)
        
    print(f"Starting bulk bug ingestion for {len(registry)} projects...")
    
    for project_id, info in registry.items():
        display_name = info.get("display_name", project_id)
        print(f"\n→ Syncing bug history for: {display_name} ({project_id})")
        
        try:
            client.create_user(user_id=project_id)
            client.ingest_file(user_id=project_id, file=file_to_ingest)
            print("  ✅ Bug memory synced successfully!")
        except Exception as e:
            print(f"  ❌ Failed to sync: {e}")
            
    print("\nBulk ingestion complete! All projects are now ready for debugging.")

if __name__ == "__main__":
    main()

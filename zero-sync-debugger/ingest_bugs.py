import os
import sys
from dotenv import load_dotenv

# Add parent directory to path so we can import parcle if it's there,
# or we can assume parcle is installed as a package or in PYTHONPATH.
# Using standard import since parcle is available.
from parcle import Parcle

def main():
    load_dotenv()
    
    api_key = os.environ.get("PARCLE_API_KEY")
    if not api_key:
        print("Error: PARCLE_API_KEY environment variable not found.")
        sys.exit(1)
        
    client = Parcle(api_key=api_key)
    
    user_id = "zero_sync_debugger"
    file_to_ingest = "sample_bugs.json"
    
    # Change directory to script's directory so relative paths work reliably
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    print(f"Creating Parcle user: {user_id}")
    client.create_user(user_id=user_id)
    
    if not os.path.exists(file_to_ingest):
        print(f"Error: {file_to_ingest} not found in {script_dir}")
        sys.exit(1)
        
    print(f"Ingesting {file_to_ingest} into Parcle memory...")
    client.ingest_file(
        user_id=user_id,
        file=file_to_ingest
    )
    
    print("Bugs ingested successfully!")

if __name__ == "__main__":
    main()

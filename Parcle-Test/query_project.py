import os
import sys
import json
from dotenv import load_dotenv

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(SCRIPT_DIR, ".env"))

try:
    from parcle import Parcle
except ImportError:
    print(json.dumps({"error": "The 'parcle' package isn't installed. Run: pip install parcle"}))
    sys.exit(1)

API_KEY = os.environ.get("PARCLE_API_KEY")
if not API_KEY:
    print(json.dumps({"error": "PARCLE_API_KEY not found in .env"}))
    sys.exit(1)

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python query_project.py <project_id> <query>"}))
        sys.exit(1)
        
    project_id = sys.argv[1]
    query = sys.argv[2]
    
    try:
        client = Parcle(api_key=API_KEY)
        result = client.search(user_id=project_id, query=query)
        
        answer = getattr(result, "answer", None)
        confidence = getattr(result, "confidence", 0.0)
        citations = getattr(result, "citations", [])
        
        formatted_citations = []
        for cite in citations:
            if hasattr(cite, "source"):
                formatted_citations.append(cite.source)
            elif isinstance(cite, dict) and "source" in cite:
                formatted_citations.append(cite["source"])
            else:
                formatted_citations.append(str(cite))
                
        print(json.dumps({
            "success": True,
            "answer": answer or "I couldn't find anything relevant for that in this project.",
            "confidence": confidence,
            "citations": formatted_citations
        }))
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))

if __name__ == "__main__":
    main()

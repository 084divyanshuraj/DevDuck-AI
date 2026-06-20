import os
import sys
from dotenv import load_dotenv
from parcle import Parcle
from bug_analyzer import analyze_severity

def main():
    load_dotenv()
    
    api_key = os.environ.get("PARCLE_API_KEY")
    if not api_key:
        print("Error: PARCLE_API_KEY environment variable not found.")
        sys.exit(1)
        
    client = Parcle(api_key=api_key)
    user_id = "zero_sync_debugger"
    
    print("Describe your bug:")
    try:
        user_input = input("> ")
    except EOFError:
        return
        
    if not user_input.strip():
        print("No description provided.")
        return
        
    severity = analyze_severity(user_input)
    
    # Structure the query so Parcle returns exactly what we need
    structured_query = f"""
    I am describing a bug: "{user_input}"
    Based on the ingested historical bugs memory, find the most similar issue.
    Format your answer EXACTLY as follows, do not include anything else:
    
    Similar Issue Found:
    [Title of the similar issue]
    
    Root Cause:
    [Root cause of the similar issue]
    
    Suggested Fix:
    [Suggested fix for the similar issue]
    """
    
    # Suppress parcle logging if possible, or just let it run
    try:
        result = client.search(
            user_id=user_id,
            query=structured_query
        )
    except Exception as e:
        print(f"Error communicating with Parcle: {e}")
        sys.exit(1)
        
    print("\n==================================")
    print("ZERO-SYNC DEBUGGER")
    print("==================================\n")
    
    # The LLM's answer should already contain the structured fields
    print(result.answer)
    print()
    
    print("Severity:")
    print(severity)
    print()
    
    conf = result.confidence
    # Attempt to format confidence nicely
    try:
        if isinstance(conf, (float, int)):
            conf_str = f"{int(conf * 100)}%"
        elif isinstance(conf, str) and conf.replace('.', '', 1).isdigit():
            conf_str = f"{int(float(conf) * 100)}%"
        else:
            conf_str = str(conf)
    except:
        conf_str = str(conf)
        
    print("Confidence:")
    print(conf_str)
    print()
    
    print("==================================")

if __name__ == "__main__":
    main()

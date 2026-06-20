import os
from dotenv import load_dotenv
from parcle import Parcle

load_dotenv()
client = Parcle(api_key=os.environ.get("PARCLE_API_KEY"))

# ── Update these to match the user_id values you used during ingestion ──
projects = ["taskapp", "weather-website", "tic-tac-toe", "tourist-safety"]

test_questions = [
    "What does this project do?",
    "What database does this project use?",
    "What is the main programming language used?",
]

for project in projects:
    print(f"\n{'=' * 60}")
    print(f"PROJECT: {project}")
    print('=' * 60)
    for q in test_questions:
        result = client.search(user_id=project, query=q)
        print(f"\nQ: {q}")
        print(f"A: {result.answer}")
        print(f"Confidence: {result.confidence}")
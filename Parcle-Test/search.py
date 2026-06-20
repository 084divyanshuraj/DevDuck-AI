import os
from dotenv import load_dotenv
from parcle import Parcle

load_dotenv()

client = Parcle(api_key=os.environ.get("PARCLE_API_KEY"))

questions = [
    "What database does this project use?",
    "How does authentication work?",
    "How do real-time updates work?",
    "Why was SQLite chosen?",
    "What are the common issues developers face?"
]

for q in questions:
    result = client.search(
        user_id="taskapp",
        query=q
    )

    print(f"\nQuestion: {q}")
    print(f"Answer: {result.answer}")
    print(f"Confidence: {result.confidence}")
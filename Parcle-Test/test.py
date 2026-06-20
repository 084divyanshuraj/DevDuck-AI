import os
from dotenv import load_dotenv
from parcle import Parcle

load_dotenv()

client = Parcle(api_key=os.environ.get("PARCLE_API_KEY"))

client.create_user(user_id="taskapp")

client.ingest_file(
    user_id="taskapp",
    file="README.md"
)

print("README uploaded successfully!")
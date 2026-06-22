# 🧠 DevDuck AI — Parcle Backend Agents

The Python backend powering all of DevDuck AI's intelligence. Every agent in this folder uses **Parcle** as a persistent, searchable memory store — so fixes, answers, and patches compound over time across the whole platform.

---

## 💡 What This Does

This folder contains five agents, each solving a real developer pain point:

| Agent | File | What it does |
|---|---|---|
| Onboarding Bot | `chat.py` | Answers natural-language questions about any project from its ingested codebase |
| Architecture Diagram | `generate_diagram.py` | Generates a Mermaid.js architecture diagram for any project |
| Smart Terminal | `devduck_run.py` | Runs commands with AI crash detection — fetches a fix from memory on failure |
| Project Ingestion | `ingest_all_projects.py` | Bulk-ingests project codebases into Parcle memory |
| Add Project | `add_project.py` | Adds a single new project to Parcle memory (supports folder, ZIP, GitHub) |

All agents share the **same Parcle workspace** — fixes logged by the Smart Terminal automatically appear in the Onboarding Bot's context. The platform gets smarter the more it's used.

---

## 📂 Files

```
Parcle-Test/
├── chat.py                   # Onboarding Bot — interactive CLI chatbot
├── generate_diagram.py       # Architecture diagram generator (Mermaid output)
├── devduck_run.py            # Smart Terminal — AI crash detection wrapper
├── ingest_all_projects.py    # Bulk project ingestion into Parcle memory
├── add_project.py            # Add a single project (CLI or called by Next.js API)
├── projects.json             # Registry of project IDs, names, descriptions
├── isolation_test.py         # Verifies per-project memory isolation
├── test.py / search.py       # Early prototypes — kept for reference
└── .env                      # PARCLE_API_KEY (never committed)
```

---

## 🚀 Getting Started

### 1. Install dependencies

```bash
pip install parcle python-dotenv requests
```

### 2. Set up your API key

Create a `.env` file in this folder:

```
PARCLE_API_KEY=your_key_here
```

Get your key at [hackathon.parcle.ai](https://hackathon.parcle.ai)

### 3. Ingest your projects

Open `ingest_all_projects.py` and add your project paths:

```python
PROJECTS = [
    ("my-project-id", r"C:\path\to\my\project"),
]
```

Then run:

```bash
python ingest_all_projects.py
```

### 4. Update the project registry

Add an entry to `projects.json` for each project:

```json
{
  "my-project-id": {
    "display_name": "My Project",
    "description": "A short description of what it does"
  }
}
```

---

## 🤖 Using Each Agent

### Onboarding Bot

Interactive CLI chatbot — ask natural-language questions about any ingested project:

```bash
python chat.py
```

Supports follow-up questions, project switching mid-conversation (`switch taskapp`), and conversation memory within a session.

---

### Architecture Diagram

Generates a Mermaid.js flowchart showing how a project's frontend, backend, and databases connect:

```bash
python generate_diagram.py taskapp
```

Returns JSON:
```json
{
  "success": true,
  "mermaid": "flowchart TD\n    Browser --> Server\n    ...",
  "confidence": 0.97
}
```

Used by the Next.js dashboard at `/dashboard/architecture`.

---

### Smart Terminal

Wraps any terminal command with AI crash detection. If the command fails, it searches Parcle memory for similar past errors and prints a fix immediately:

```bash
python devduck_run.py taskapp npm run build
```

Example output on crash:
```
🦆 DevDuck intercepted a crash! (exit code 1)
🔍 Searching project memory for a fix...

💡 Here's the fix: 🟢 confidence 94%
1. Root cause: ...
2. Run: ...
📥 This crash has been saved to project memory for future reference.
```

Also accessible from the unified launcher:

```bash
cd ..
python devduck.py
# Pick option 6
```

---

### Add a Single Project

```bash
python add_project.py --id my-project --path C:\path\to\project --name "My Project" --description "What it does"
```

Also called automatically by the Next.js dashboard when a user adds a project via the UI.

---

## 🔒 Security Notes

- `.env` is git-ignored — API keys are never committed
- Ingestion skips `.env` files found inside scanned project folders
- Files over 10MB are skipped automatically
- `node_modules`, `.git`, `__pycache__`, and other dependency folders are excluded

---

## 🧪 Verifying Memory Isolation

Each project gets its own `user_id` in Parcle — answers never bleed across projects. Verify this with:

```bash
python isolation_test.py
```

---

## 🛠️ Built With

- **[Parcle](https://parcle.ai)** — per-project AI memory with natural language search and cited answers
- **Python 3.13**

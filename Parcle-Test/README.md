# 🧠 Parcle Onboarding Assistant

An AI-powered onboarding chatbot that lets a new team member ask natural-language questions about *any* project in the team's codebase — and get accurate, cited answers pulled directly from the actual source code and docs, not just whatever's written in a README.

Built for a hackathon using **[Parcle](https://github.com/Parcle-AI/parcle-memory)**, an API that gives every "user" (in our case, every *project*) a private, persistent, searchable memory.

---

## 💡 The Problem

New hires/interns/teammates joining an existing codebase usually have to:
- Read through scattered, often outdated READMEs
- Ping a senior dev with basic questions ("what database does this use?", "how does auth work here?")
- Dig through unfamiliar source code just to understand the basics

This project solves that by ingesting a project's actual code + docs into Parcle's memory, then exposing a simple chat interface where anyone can just **ask**.

---

## ✨ Features

- 📥 **Bulk project ingestion** — point it at any project folder, it walks the whole tree and ingests everything relevant
- 🧩 **Multi-language support** — Python, JavaScript/JSX/TS, HTML, CSS, SQL, JSON, Markdown, and more
- 🔒 **Per-project memory isolation** — each project gets its own `user_id` in Parcle, so answers never bleed across projects (verified — see `isolation_test.py`)
- 💬 **Interactive chat with conversation memory** — follow-up questions like "tell me more about that" work within a session
- 🔀 **Project switching mid-conversation** — jump between projects without restarting (`switch`, `switch 2`, `switch taskapp`)
- 🛡️ **Safe by design** — automatically skips `.env`/secrets, oversized files (>10MB), and dependency folders (`node_modules`, `.git`, etc.) during ingestion

---

## 📂 Files in This Repo

| File | Purpose |
|---|---|
| `ingest_all_projects.py` | Bulk-ingests one or more project folders into Parcle, converting source code into ingestible text and skipping unsupported/oversized files |
| `chat.py` | The interactive onboarding chatbot — project picker menu, conversation memory, error handling |
| `projects.json` | Local registry mapping each `project_id` to a friendly display name and description, used by `chat.py`'s menu |
| `isolation_test.py` | Verification script that asks the same questions across multiple projects to confirm memory stays correctly isolated per project |
| `test.py` / `search.py` | Early prototype scripts from initial experimentation — kept for reference; superseded by `ingest_all_projects.py` and `chat.py` |
| `.env` *(not committed)* | Holds `PARCLE_API_KEY` — never pushed to git |

---

## 🚀 Getting Started

### 1. Install dependencies
```bash
pip install parcle python-dotenv
```

### 2. Set up your API key
Create a `.env` file in this folder:
```env
PARCLE_API_KEY=your_key_here
```

### 3. Ingest your projects
Open `ingest_all_projects.py` and add each project you want indexed:
```python
PROJECTS = [
    ("my-project-id", r"C:\path\to\my\project"),
]
```
Then run:
```bash
python ingest_all_projects.py
```

### 4. (Optional) Update the project menu
Add an entry to `projects.json` for each project so it shows up nicely in the chat menu:
```json
{
  "my-project-id": {
    "display_name": "My Project",
    "description": "A short description of what it does"
  }
}
```

### 5. Chat with it
```bash
python chat.py
```

---

## 🧪 Verifying Isolation

Run `isolation_test.py` after ingesting multiple projects to confirm each project's answers stay scoped to its own codebase, with no cross-contamination:
```bash
python isolation_test.py
```

---

## ⚠️ Security Notes

- `.env` is git-ignored — API keys are never committed
- The ingestion script explicitly excludes `.env` files found inside scanned project folders too, so a project's own secrets never get uploaded to Parcle either
- Files over Parcle's 10MB limit are automatically skipped rather than crashing the ingestion run

---

## 🛠️ Built With

- [Parcle](https://github.com/Parcle-AI/parcle-memory) — per-user (per-project) AI memory with cited search
- Python

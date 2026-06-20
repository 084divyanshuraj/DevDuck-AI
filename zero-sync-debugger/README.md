# Zero-Sync Debugger

Zero-Sync Debugger is an AI debugging assistant that utilizes Parcle as persistent memory to store and retrieve historical bugs, their root causes, and suggested fixes. 

## Architecture

```text
Bug Report
    ↓
Bug Analyzer
    ↓
Parcle Memory Search
    ↓
Historical Bug Retrieval
    ↓
Root Cause Analysis
    ↓
Fix Recommendation
```

1. **Bug Report**: The developer inputs a description of the current issue via the CLI.
2. **Bug Analyzer**: The `bug_analyzer.py` module evaluates the description for keywords to automatically assign a `Severity` level (e.g., INFO, WARNING, ERROR, CRITICAL).
3. **Parcle Memory Search**: The system queries Parcle's vector memory (`debug_search.py`), passing the bug description.
4. **Historical Bug Retrieval**: Parcle identifies the most similar issue from past ingested bug records.
5. **Root Cause Analysis & Fix Recommendation**: Parcle outputs the exact root cause and suggested fix based on the documented history.

## Workflow

1. **Ingestion (`ingest_bugs.py`)**: Bug records (e.g., `sample_bugs.json`) are uploaded into the Parcle user memory space (`zero_sync_debugger`).
2. **Analysis (`bug_analyzer.py`)**: Simple heuristic-based severity classification.
3. **Retrieval (`debug_search.py`)**: CLI application that prompts the user and prints the resulting insights, integrating both Parcle results and local severity analysis.

## Integration with Parcle

This project relies on Parcle for its AI-driven memory. The `Parcle` client is used in:
- `ingest_bugs.py`: Uses `client.create_user()` and `client.ingest_file()` to populate knowledge.
- `debug_search.py`: Uses `client.search()` with a structured prompt to retrieve well-formatted insights and confidence scores based on semantic similarity.

## Future Integrations

- **Context-Aware Onboarding Bot**: The debugger's memory can be used to help onboard new developers, letting them ask questions about past architectural mistakes and common pitfalls in the codebase.
- **Repository Cleanup Bot**: Future automated scripts can analyze the most frequently occurring "ERROR" or "WARNING" bugs from Parcle and suggest mass refactorings or dependency updates to clean up technical debt.

## Quickstart

1. Define `PARCLE_API_KEY` in your `.env` file.
2. Run data ingestion:
   ```bash
   python ingest_bugs.py
   ```
3. Start debugging:
   ```bash
   python debug_search.py
   ```
   *Example input:* `> Users getting login 500 error`

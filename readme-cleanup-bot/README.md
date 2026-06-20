# README Cleanup Bot

The README Cleanup Bot is the third module of the **DevDuck AI** ecosystem. It acts as an AI-powered repository analysis and documentation assistant that identifies structural flaws and ensures project documentation is up to par.

## Architecture

```text
Repository
      ↓
Repository Scanner (analyzer.py)
      ↓
README Analyzer (readme_checker.py)
      ↓
Quality Assessment (Health Score)
      ↓
Parcle Memory Storage
      ↓
Improvement Suggestions (CLI Output)
```

## Features

1. **README Quality Analysis**: Analyzes `README.md` to ensure critical sections (Installation, Usage, Features, Contributing, License, Deployment) are present.
2. **Repository Health Analysis**: Identifies poor structure including empty folders and unused/dead files.
3. **Documentation Generation**: Provides generated templates for missing README sections to immediately rectify issues.
4. **Health Score**: Aggregates a comprehensive "Overall Health Score" out of 100 based on Documentation, Structure, and Maintainability.
5. **Memory Integration**: Stores the completed analysis report back into Parcle (`readme_cleanup_bot` namespace), ensuring DevDuck AI remembers the project's state.

## Integration within DevDuck AI

This module shares the Parcle-backed memory architecture used by:
1. **Context-Aware Onboarding Bot**
2. **Zero-Sync Debugger**

By retaining repository state in Parcle, future agents can analyze the evolution of the repository's health over time.

## Quickstart

1. Ensure your `.env` contains a valid `PARCLE_API_KEY`.
2. Run the analyzer:
   ```bash
   python report_generator.py
   ```

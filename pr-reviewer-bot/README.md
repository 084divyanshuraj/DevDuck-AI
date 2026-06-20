# PR Reviewer Bot (Bug Preventer)

The PR Reviewer is **Module 4** of the DevDuck AI ecosystem. While the Zero-Sync Debugger helps you fix bugs *after* they occur, the PR Reviewer helps you prevent bugs *before* they are merged into the `main` branch.

## How it works

1. A developer submits a Pull Request.
2. The bot intercepts the code `.diff`.
3. It asks DevDuck's memory (via Parcle) to cross-reference the new code against the project's historical bug database.
4. If the developer accidentally re-introduces an old bug (e.g., removing a necessary `await` keyword that caused an outage last month), DevDuck automatically blocks the PR and cites the historical reason why.

## Try it out

1. View the `sample_pr.diff` to see a simulated developer mistake.
2. Run the reviewer:
   ```bash
   python reviewer.py
   ```

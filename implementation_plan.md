# Implementation Plan - Frontend-Backend Project Ingestion Integration

This plan details the steps to fully connect the DevDuck AI dashboard frontend with the Python backend (`Parcle-Test/add_project.py`). This guarantees zero integration mismatches when adding new codebases (either via local path, zip file upload, or GitHub clone) and keeps all bots in sync.

---

## User Review Required

> [!IMPORTANT]
> The backend script runs Python and Git operations. The Next.js development server will execute `python` and `git` commands on your local machine when calls are made to the new API routes. Ensure your local Python environment has the necessary packages (`dotenv`, and `parcle` if you choose to ingest into memory database).

---

## Proposed Changes

### Component 1: Python Backend CLI Enhancements

#### [MODIFY] [add_project.py](file:///c:/Users/sarra/OneDrive/Desktop/DevDuck-AI/Parcle-Test/add_project.py)
We will modify the script to support command-line arguments. If arguments are passed, it runs in non-interactive CLI mode. If no arguments are passed, it falls back to the interactive terminal menu.
- Arguments supported:
  - `--cli`: Boolean flag to trigger non-interactive mode.
  - `--name`: Project display name.
  - `--slug`: Unique project ID (validated).
  - `--description`: Short project description.
  - `--source-type`: Choice of `"folder"`, `"zip"`, or `"github"`.
  - `--source`: Path/URL.
  - `--ingest`: Ingest now toggle (`y`/`n`).
- Ensure clear output printing (e.g. status lines) so the Next.js backend can parse execution stages.

---

### Component 2: Next.js API Routes

#### [NEW] [route.ts](file:///c:/Users/sarra/OneDrive/Desktop/DevDuck-AI/web/src/app/api/projects/route.ts)
A GET endpoint to read `Parcle-Test/projects.json` and return the projects registered on the backend. This ensures the frontend project picker is populated directly from the backend source of truth.

#### [NEW] [route.ts](file:///c:/Users/sarra/OneDrive/Desktop/DevDuck-AI/web/src/app/api/projects/add/route.ts)
A POST endpoint that:
1. Accepts `multipart/form-data` or JSON payloads depending on the selected source type.
2. If source type is `zip`, writes the file to a temporary location.
3. Spawns `python Parcle-Test/add_project.py` via `child_process.spawn`.
4. Streams or returns process log output to the frontend.
5. Cleans up any temp files.

---

### Component 3: Frontend Views & Modals

#### [MODIFY] [layout.tsx](file:///c:/Users/sarra/OneDrive/Desktop/DevDuck-AI/web/src/app/dashboard/layout.tsx)
- Load active projects list from `GET /api/projects` on component mount instead of `localStorage`.
- Update `handleAddProjectSubmit` to perform a real `fetch` call to `POST /api/projects/add`.
- Stream or display stdout logs from the python subprocess in the loader modal in real time.
- Dispatch the reload event on success.

#### [MODIFY] [page.tsx](file:///c:/Users/sarra/OneDrive/Desktop/DevDuck-AI/web/src/app/dashboard/page.tsx)
- Update detail loading logic to query project details from the api/registry instead of hardcoded details.

---

## Verification Plan

### Automated Tests
- Run `npm run build` inside `web` folder to ensure clean typescript compilation.

### Manual Verification
- Run CLI script options to confirm interactive menu still works: `python devduck.py --setup` and pick option 5.
- Run frontend UI, trigger "+ Add Project" modal.
  - Test adding a local folder path. Verify `projects.json` and `ingest_all_projects.py` are updated.
  - Test cloning a GitHub repo. Verify it is cloned under `Parcle-Test/added_projects/`.
  - Test uploading a ZIP archive. Verify it is extracted under `Parcle-Test/added_projects/`.

<div align="center">
  <h1>DevDuck AI 🦆</h1>
  <p><strong>It takes a new developer 3 weeks to understand a legacy codebase. With DevDuck AI, it takes 3 seconds.</strong></p>
  
  <h3>🌍 <a href="https://dev-duck-ai.vercel.app/">Live Demo</a></h3>

  [![Powered by Parcle](https://img.shields.io/badge/Powered_by-Parcle_Memory_API-blue?style=for-the-badge)](https://parcle.io)
  [![Built with Next.js](https://img.shields.io/badge/Built_with-Next.js-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
</div>

---

## 🛑 The Problem
Codebases get messy. Knowledge is lost when senior developers leave the team. When a new hire joins, or a critical bug appears at 3 AM, developers spend hours digging through undocumented spaghetti code just to figure out how the system connects. 

## 💡 The DevDuck Solution
**DevDuck AI** is a unified, persistent AI ecosystem that acts as a 24/7 senior engineer. It doesn't just "read" your code—it uses **Parcle's Vector Memory Database** to ingest your entire repository, remember every past bug, and monitor every command you run in the terminal.

It is your omniscient co-developer.

---

## 🔥 Killer Features

### 🎙️ 1. Voice-Activated Onboarding Chatbot
Stop typing. We integrated the native browser Web Speech API directly into the Next.js UI. Just click the microphone, ask *"How does the authentication system work?"*, and watch DevDuck instantly search the repository's Parcle memory to give you an exact, cited answer with zero latency.

### 📊 2. Architecture Flowchart Generator
Tired of manually drawing system diagrams? Click the Architecture tab, and DevDuck will use its indexed memory to generate a beautiful, interactive **Mermaid.js** flowchart showing exactly how your frontend, backend, APIs, and databases connect.

### 💻 3. Smart Terminal Wrapper
Never Google a stack trace again. By running your commands through the DevDuck CLI (e.g., `devduck run npm start`), the AI watches your terminal output silently. If a command crashes, DevDuck intercepts the red stack trace, queries Parcle memory for similar past bugs, and prints the exact fix *right inside your terminal*.

### 🚨 4. GitHub PR Auto-Reviewer (CI/CD)
DevDuck guards your repository. We built a custom **GitHub Action** that automatically runs whenever a developer opens a Pull Request. It reads the `git diff`, cross-references the code changes against the project's historical bug memory, and automatically posts an AI review comment directly on GitHub—blocking the PR if it reintroduces an old bug!

---

## 🛠️ The Architecture Stack
We built a highly complex hybrid architecture to maximize performance and UI/UX:
- **Frontend Dashboard:** Built with **Next.js**, React, TailwindCSS, and Lucide Icons for a sleek, dark-mode developer experience.
- **Backend & Integrations:** Built with **Python**. The Next.js API routes spawn headless Python subprocesses to execute heavy machine learning tasks and interact with the file system natively.
- **Memory Engine:** Powered entirely by the **Parcle API**, utilizing distinct `user_id` namespaces to isolate memory between different developer projects.

---

## 🚀 Quick Start Guide (Run it locally)

Want to see the magic for yourself? Here is how to run the DevDuck Ecosystem.

### 1. Prerequisites
- Node.js (v18+)
- Python (3.10+)
- A Parcle API Key

### 2. Setup the Environment
Clone the repository and install the Python backend dependencies:
```bash
git clone https://github.com/084divyanshuraj/DevDuck-AI.git
cd DevDuck-AI
pip install -r requirements.txt # (Ensure parcle and python-dotenv are installed)
```

Create a `.env` file in the root directory and add your Parcle key:
```env
PARCLE_API_KEY=your_api_key_here
```

### 3. Launch the Next.js Dashboard
Navigate into the `web/` folder to start the UI:
```bash
cd web
npm install
npm run dev
```

Open `http://localhost:3000` in your browser. You can instantly register a new project (via local folder path or GitHub URL) and start chatting with your codebase!

---

## 🔮 Future Scope
While DevDuck AI currently functions as an open, unified ecosystem, we plan to implement robust user authentication in future versions.
- **Firebase Auth (Temporarily Bypassed):** We initially built and wired up full Firebase Authentication for this project. However, due to a last-minute domain whitelisting issue with our Vercel deployment during the hackathon submission window, we had to temporarily bypass the auth logic and mock the session to ensure judges can still access and test the core DevDuck AI dashboard features. In our next iteration, we will re-enable full Firebase Auth with GitHub OAuth to securely tie Parcle `user_id` namespaces to specific developer accounts.
- **RBAC (Role-Based Access Control):** Allowing team leads to manage which developers can query specific project memories.

---

<div align="center">
  <p>Built with ❤️ by <strong>Team Agentic Coders</strong> for <strong>Quackathon</strong></p>
</div>

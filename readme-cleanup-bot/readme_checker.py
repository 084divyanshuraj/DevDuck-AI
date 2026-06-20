import os

class ReadmeChecker:
    """
    Analyzes real README.md files (or fallback mock content) for missing critical sections.
    """
    
    REQUIRED_SECTIONS = {
        "Installation": "## Installation\n\n1. Clone repository\n2. Install dependencies\n3. Configure environment variables\n4. Run application\n",
        "Usage": "## Usage\n\nProvide examples of how to use the project here.\n",
        "Features": "## Features\n\n- Feature 1\n- Feature 2\n",
        "Contributing": "## Contributing\n\nPlease read CONTRIBUTING.md for details on our code of conduct.\n",
        "License": "## License\n\nThis project is licensed under the MIT License.\n",
        "Deployment": "## Deployment\n\nAdd additional notes about how to deploy this on a live system.\n"
    }

    def __init__(self, fallback_content: str, project_path: str = None):
        self.readme_content = ""
        self.missing_sections = []
        self.generated_sections = {}
        self.issues = []
        
        if project_path and os.path.isdir(project_path):
            readme_path = os.path.join(project_path, "README.md")
            if os.path.exists(readme_path):
                with open(readme_path, "r", encoding="utf-8", errors="ignore") as f:
                    self.readme_content = f.read().lower()
            else:
                self.issues.append("🚨 CRITICAL: Entire README.md is missing!")
                
        if not self.readme_content:
            # Fallback
            self.readme_content = fallback_content.lower()
            
    def analyze(self) -> dict:
        score = 100
        penalty_per_section = 15
        
        if "🚨 CRITICAL: Entire README.md is missing!" in self.issues:
            score = 10
            for section, template in self.REQUIRED_SECTIONS.items():
                self.missing_sections.append(section)
                self.issues.append(f"Missing {section} Section")
                self.generated_sections[section] = template
        else:
            for section, template in self.REQUIRED_SECTIONS.items():
                if section.lower() not in self.readme_content:
                    self.missing_sections.append(section)
                    self.issues.append(f"Missing {section} Section")
                    self.generated_sections[section] = template
                    score -= penalty_per_section
                    
        score = max(0, min(100, score))
        
        suggestions = []
        if "Deployment" in self.missing_sections:
            suggestions.append("Add deployment instructions")
        if "Contributing" in self.missing_sections:
            suggestions.append("Add contribution guidelines")
        if "Usage" in self.missing_sections:
            suggestions.append("Add usage examples")
        if "Installation" in self.missing_sections:
            suggestions.append("Add installation guide")
            
        return {
            "documentation_score": score,
            "issues": self.issues,
            "suggestions": suggestions,
            "generated_sections": self.generated_sections,
            "missing_sections": self.missing_sections
        }

    def generate_intelligent_sections(self, client, project_id: str) -> dict:
        """
        Uses Parcle to dynamically generate accurate content for missing sections based on the actual codebase.
        """
        intelligent_sections = {}
        print("\n🧠 DevDuck is reading the codebase to generate missing documentation...")
        
        for section in self.missing_sections:
            print(f"  → Generating '{section}' section...")
            
            # Craft targeted queries to Parcle depending on the section
            if section == "Installation":
                query = "What are the exact step-by-step instructions to install and configure this project? Include any dependencies (e.g. npm install, pip install) and environment variables needed. Return ONLY the markdown steps."
            elif section == "Usage":
                query = "How do you run or use this project? Provide the command to start the server or run the script, and an example if applicable. Return ONLY the markdown."
            elif section == "Features":
                query = "What are the core features of this project? Return them as a markdown bulleted list."
            elif section == "Deployment":
                query = "How is this project meant to be deployed? Return a brief deployment summary in markdown."
            else:
                query = f"Write a short, professional '{section}' section for the README of this project in markdown."
                
            try:
                result = client.search(user_id=project_id, query=query)
                if getattr(result, "answer", None):
                    # Format it nicely
                    intelligent_sections[section] = f"## {section}\n\n{result.answer}\n"
                else:
                    intelligent_sections[section] = self.generated_sections.get(section, "")
            except Exception as e:
                print(f"    ⚠️ Could not generate {section}: {e}")
                intelligent_sections[section] = self.generated_sections.get(section, "")
                
        return intelligent_sections

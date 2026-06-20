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
            "generated_sections": self.generated_sections
        }

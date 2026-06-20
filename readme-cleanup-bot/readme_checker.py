class ReadmeChecker:
    """
    Analyzes README content to identify missing critical sections.
    """
    
    REQUIRED_SECTIONS = {
        "Installation": "## Installation\n\n1. Clone repository\n2. Install dependencies\n3. Configure environment variables\n4. Run application\n",
        "Usage": "## Usage\n\nProvide examples of how to use the project here.\n",
        "Features": "## Features\n\n- Feature 1\n- Feature 2\n",
        "Contributing": "## Contributing\n\nPlease read CONTRIBUTING.md for details on our code of conduct, and the process for submitting pull requests to us.\n",
        "License": "## License\n\nThis project is licensed under the MIT License.\n",
        "Deployment": "## Deployment\n\nAdd additional notes about how to deploy this on a live system.\n"
    }

    def __init__(self, readme_content: str):
        self.readme_content = readme_content.lower()
        self.missing_sections = []
        self.generated_sections = {}
        self.issues = []
        
    def analyze(self) -> dict:
        """
        Runs the documentation analysis and calculates a documentation score.
        """
        score = 100
        penalty_per_section = 15
        
        for section, template in self.REQUIRED_SECTIONS.items():
            # Very basic heuristic search
            if section.lower() not in self.readme_content:
                self.missing_sections.append(section)
                self.issues.append(f"Missing {section} Section")
                self.generated_sections[section] = template
                score -= penalty_per_section
                
        # Ensure score does not drop below 0
        score = max(0, score)
        
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

if __name__ == "__main__":
    # Test case
    sample_readme = "# Test Project\n\n## Usage\nRun the app."
    checker = ReadmeChecker(sample_readme)
    print(checker.analyze())

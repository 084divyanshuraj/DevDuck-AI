class RepositoryAnalyzer:
    """
    Analyzes the structural health of the repository using provided metadata.
    """
    
    def __init__(self, repo_data: dict):
        self.repo_data = repo_data
        self.issues = []
        
    def analyze(self) -> dict:
        """
        Runs the full repository analysis.
        Returns a dictionary with scores and found issues.
        """
        empty_folders = self.repo_data.get("empty_folders", [])
        dead_files = self.repo_data.get("dead_files", [])
        total_files = len(self.repo_data.get("files", []))
        
        if empty_folders:
            self.issues.append(f"{len(empty_folders)} Empty Folders Detected")
            
        if dead_files:
            self.issues.append(f"{len(dead_files)} Unused/Dead Files Detected")
            
        # Mock scoring logic based on issues
        structure_score = 100 - (len(empty_folders) * 5)
        maintainability_score = 100 - (len(dead_files) * 10)
        
        # Ensure scores don't drop below 0
        structure_score = max(0, structure_score)
        maintainability_score = max(0, maintainability_score)
        
        # Suggestions based on issues
        suggestions = []
        if empty_folders:
            suggestions.append("Remove unused folders")
        if dead_files:
            suggestions.append("Delete dead files or integrate them into the project")
            
        return {
            "structure_score": structure_score,
            "maintainability_score": maintainability_score,
            "issues": self.issues,
            "suggestions": suggestions
        }

if __name__ == "__main__":
    # Test case
    sample_data = {
        "files": ["a", "b", "c"],
        "empty_folders": ["folder1/"],
        "dead_files": ["a"]
    }
    analyzer = RepositoryAnalyzer(sample_data)
    print(analyzer.analyze())

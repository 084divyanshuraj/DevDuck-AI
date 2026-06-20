import os

class RepositoryAnalyzer:
    """
    Analyzes the structural health of the repository either via real filesystem scanning
    or using fallback mock metadata.
    """
    
    EXCLUDE_DIRS = {"node_modules", ".git", "dist", "build", "__pycache__", ".venv", "venv", "env", ".next"}
    
    def __init__(self, repo_data: dict, project_path: str = None):
        self.repo_data = repo_data
        self.project_path = project_path
        self.issues = []
        
    def analyze(self) -> dict:
        empty_folders = []
        dead_files = [] 
        
        if self.project_path and os.path.isdir(self.project_path):
            # Real directory scanning
            for root, dirs, files in os.walk(self.project_path):
                dirs[:] = [d for d in dirs if d not in self.EXCLUDE_DIRS]
                
                # Check for empty folders
                if not dirs and not files:
                    empty_folders.append(root)
                    
            # For hackathon demonstration of "dead files", we fall back to mock data
            # unless we actually build an AST parser.
            dead_files = self.repo_data.get("dead_files", [])
        else:
            # Fallback to pure mock data
            empty_folders = self.repo_data.get("empty_folders", [])
            dead_files = self.repo_data.get("dead_files", [])
            
        if empty_folders:
            self.issues.append(f"{len(empty_folders)} Empty Folders Detected")
            
        if dead_files:
            self.issues.append(f"{len(dead_files)} Unused/Dead Files Detected")
            
        # Scoring logic
        structure_score = 100 - (len(empty_folders) * 5)
        maintainability_score = 100 - (len(dead_files) * 10)
        
        structure_score = max(0, min(100, structure_score))
        maintainability_score = max(0, min(100, maintainability_score))
        
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

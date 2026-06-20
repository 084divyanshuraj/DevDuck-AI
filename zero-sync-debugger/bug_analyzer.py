def analyze_severity(description: str) -> str:
    """
    Classifies a bug report into INFO, WARNING, ERROR, or CRITICAL
    based on keywords found in the description.
    """
    desc_lower = description.lower()
    
    critical_keywords = ["500", "crash", "fatal", "down", "outage", "panic", "critical"]
    error_keywords = ["404", "exception", "fail", "error", "broken", "incorrect"]
    warning_keywords = ["timeout", "slow", "deprecated", "delay", "warning", "performance"]
    info_keywords = ["info", "fallback", "default", "minor", "typo", "cosmetic"]
    
    if any(keyword in desc_lower for keyword in critical_keywords):
        return "CRITICAL"
    elif any(keyword in desc_lower for keyword in error_keywords):
        return "ERROR"
    elif any(keyword in desc_lower for keyword in warning_keywords):
        return "WARNING"
    elif any(keyword in desc_lower for keyword in info_keywords):
        return "INFO"
    else:
        # Default fallback
        return "INFO"

if __name__ == "__main__":
    # Test cases
    print(analyze_severity("Users get 500 error during login")) # CRITICAL
    print(analyze_severity("Navigating to /profile returns 404 error")) # ERROR
    print(analyze_severity("Application times out when querying")) # WARNING
    print(analyze_severity("Just a minor typo on the homepage")) # INFO

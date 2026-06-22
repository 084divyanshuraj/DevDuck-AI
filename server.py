import os
import sys
import json
import subprocess
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from dotenv import load_dotenv
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, "Parcle-Test", ".env"))

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests from Vercel

# Initialize Rate Limiter
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["100 per day"],
    storage_uri="memory://"
)

def run_script(script_path, args):
    """Helper to run a python script and return its JSON stdout"""
    try:
        result = subprocess.run(
            [sys.executable, script_path] + args,
            capture_output=True,
            text=True,
            cwd=os.path.dirname(script_path),
            env=os.environ.copy()
        )
        if result.returncode == 0:
            return json.loads(result.stdout)
        else:
            return {"error": result.stderr or f"Exit code {result.returncode}", "success": False}
    except Exception as e:
        return {"error": str(e), "success": False}

@app.route('/api/projects', methods=['GET'])
def get_projects():
    registry_path = os.path.join(BASE_DIR, "Parcle-Test", "projects.json")
    if not os.path.exists(registry_path):
        return jsonify([])
    try:
        with open(registry_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        projects_list = [
            {"id": slug, "name": details.get("display_name", slug), "description": details.get("description", "")}
            for slug, details in data.items()
        ]
        return jsonify(projects_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/architecture', methods=['POST'])
@limiter.limit("5 per minute")
def architecture():
    data = request.json
    project_id = data.get("projectId")
    if not project_id:
        return jsonify({"error": "Missing projectId"}), 400
        
    script_path = os.path.join(BASE_DIR, "Parcle-Test", "generate_diagram.py")
    output = run_script(script_path, [project_id])
    if output.get("success"):
        return jsonify(output)
    return jsonify({"error": output.get("error", "Failed to generate diagram")}), 500

@app.route('/api/chat', methods=['POST'])
@limiter.limit("10 per minute")
def chat():
    data = request.json
    project_id = data.get("projectId")
    question = data.get("question")
    if not project_id or not question:
        return jsonify({"error": "Missing projectId or question"}), 400

    script_path = os.path.join(BASE_DIR, "Parcle-Test", "query_project.py")
    output = run_script(script_path, [project_id, question])
    if "error" in output and not output.get("success", True):
        return jsonify({"error": output["error"]}), 500
    return jsonify(output)

@app.route('/api/terminal', methods=['POST'])
@limiter.limit("20 per minute")
def terminal():
    """
    Since Server-Sent Events (SSE) streaming over a cloud proxy is complex,
    we run the devduck_run.py script, capture the full crash log, 
    and return it synchronously as a single mock SSE payload for the frontend to digest.
    """
    data = request.json
    project_id = data.get("projectId")
    command = data.get("command")
    
    if not project_id or not command:
        return jsonify({"error": "Missing projectId or command"}), 400

    # RCE SANITIZATION SAFEGUARD
    dangerous_commands = ["rm", "sudo", "mkfs", "dd", "chmod", "chown"]
    cmd_base = command.split(" ")[0].lower()
    if cmd_base in dangerous_commands:
        def stream_error():
            yield f'data: {json.dumps({"type": "stderr", "text": "⚠️ DANGEROUS COMMAND BLOCKED BY DEVDUCK SECURITY ⚠️"})}\n\n'
            yield f'data: {json.dumps({"type": "exit", "text": "1"})}\n\n'
        return Response(stream_error(), mimetype='text/event-stream')

    script_path = os.path.join(BASE_DIR, "Parcle-Test", "devduck_run.py")
    
    def generate():
        # Stream the subprocess stdout/stderr in real-time as SSE
        args = [sys.executable, script_path, project_id] + command.split(" ")
        process = subprocess.Popen(
            args,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd=os.path.dirname(script_path),
            env=os.environ.copy()
        )

        for line in iter(process.stdout.readline, ''):
            yield f'data: {json.dumps({"type": "stdout", "text": line})}\n\n'
        
        for line in iter(process.stderr.readline, ''):
            yield f'data: {json.dumps({"type": "stderr", "text": line})}\n\n'

        process.wait()
        yield f'data: {json.dumps({"type": "exit", "text": str(process.returncode)})}\n\n'

    return Response(generate(), mimetype='text/event-stream')

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port, debug=False)

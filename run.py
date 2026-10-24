"""
AgriPulse AI One-Click Launcher
Starts the full-stack server and opens the interactive dashboard in your default browser.
"""

import os
import sys
import io
import time
import webbrowser
import threading
import uvicorn

if sys.platform == "win32":
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    except Exception:
        pass

def kill_existing_port_process(port=8500):
    """Frees up port if already in use by previous python/uvicorn process"""
    if sys.platform == "win32":
        try:
            import subprocess
            cmd = f'netstat -ano | findstr :{port}'
            output = subprocess.check_output(cmd, shell=True).decode('utf-8', errors='ignore')
            for line in output.strip().split('\n'):
                if f":{port}" in line and "LISTENING" in line:
                    pid = line.strip().split()[-1]
                    if pid.isdigit() and int(pid) != os.getpid():
                        print(f"🔄 Freeing port {port} (PID: {pid})...")
                        subprocess.run(f'taskkill /F /PID {pid}', shell=True, capture_output=True)
            time.sleep(0.5)
        except Exception:
            pass

def open_browser():
    time.sleep(1.2)
    url = "http://localhost:8500"
    print(f"\n✨ Opening AgriPulse AI Mission Control Dashboard in your browser: {url}\n")
    webbrowser.open(url)

if __name__ == "__main__":
    kill_existing_port_process(8500)

    # Add backend directory to path
    backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
    sys.path.insert(0, backend_dir)

    print("=" * 80)
    print(" 🛰️ [AGRIPULSE AI] Climate Satellite, ML Yield & CBOT Quant Platform")
    print("=" * 80)
    print(" Server URL: http://localhost:8500")
    print(" Starting unified backend & frontend server...")

    # Start browser opener in background thread
    threading.Thread(target=open_browser, daemon=True).start()

    # Run FastAPI server
    from server import app
    uvicorn.run(app, host="0.0.0.0", port=8500, log_level="info")

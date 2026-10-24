import os
import sys

# Change directory to root and execute root run.py
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(root_dir)
sys.path.insert(0, root_dir)

with open(os.path.join(root_dir, "run.py"), "r", encoding="utf-8") as f:
    exec(f.read())

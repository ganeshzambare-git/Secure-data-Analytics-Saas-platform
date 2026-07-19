import sys
import os

# Add the backend directory to the python path so absolute imports work
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.main import app

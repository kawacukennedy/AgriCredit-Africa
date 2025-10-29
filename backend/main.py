# Legacy main.py - Use app/main.py for the enhanced backend
# This file is kept for backward compatibility

from app.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
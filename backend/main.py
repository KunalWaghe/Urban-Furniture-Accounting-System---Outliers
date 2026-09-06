"""
Main execution entrypoint for the Urban Furniture Accounting System backend.
Allows running: python main.py
"""

import os
import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)

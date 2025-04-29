from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db import database
import uvicorn
from dotenv import load_dotenv
import os
from api import app as api_app

# Load environment variables
load_dotenv()

# Create main FastAPI app
app = FastAPI(
    title="Dynamic Data Analysis",
    description="Natural language data querying and visualization"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the API router
app.mount("/api", api_app)

@app.get("/")
async def root():
    """Root endpoint that provides API information."""
    return {
        "message": "Welcome to Dynamic Data Analysis API",
        "endpoints": {
            "query": "/api/query - Process natural language queries",
            "tables": "/api/tables - List all tables",
            "schema": "/api/schema/{table_name} - Get schema for a specific table",
            "test": "/api/test - Test API functionality"
        }
    }

@app.on_event("startup")
async def startup():
    await database.connect()
    print("Connected to database")

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()
    print("Disconnected from database")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
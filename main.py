"""NEMA Wetlands Compliance & Property Due Diligence Platform - REST API.

Phase 2 FastAPI application entry point.
Run with: uvicorn main:app --reload --port 8000
"""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router

app = FastAPI(
    title="NEMA East Africa Wetlands Due Diligence API",
    description="Preliminary mapped wetland and water-feature screening for deposit-stage property due diligence in Uganda and Kenya. Not a clearance, survey, title search, or authority decision.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    # Credentials and a wildcard origin are unsafe together. Production must
    # explicitly list its web application origins in ALLOWED_ORIGINS.
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

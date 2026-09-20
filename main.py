"""NEMA Wetlands Compliance & Property Due Diligence Platform - REST API.

Phase 2 FastAPI application entry point.
Run with: uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router

app = FastAPI(
    title="NEMA East Africa Wetlands Due Diligence API",
    description="Commercial PropTech REST API providing automated wetland risk scoring, statutory buffer checks, and bank-grade due diligence certificates for Uganda and Kenya.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

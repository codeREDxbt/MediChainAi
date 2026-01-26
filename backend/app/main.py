"""
MediChainAI Backend API

FastAPI application entry point with all routers registered.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routers import admin, auth, inference, reports, scans

settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.api_version,
    description="Backend API for MediChainAI - Privacy-first medical AI platform",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev server
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers with /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(scans.router, prefix="/api")
app.include_router(inference.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(reports.router, prefix="/api")


@app.get("/")
async def root():
    """Root endpoint - API health check."""
    return {
        "name": settings.app_name,
        "version": settings.api_version,
        "status": "healthy",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {"status": "ok"}

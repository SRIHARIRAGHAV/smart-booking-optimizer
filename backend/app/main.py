from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router
from app.services.retrieval_service import get_retrieval_service
from app.repositories.trip_repository import get_trip_repository

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite repository schema
    get_trip_repository()
    # Initialize LlamaIndex local vector store
    get_retrieval_service().initialize()
    yield

app = FastAPI(
    title="Smart Booking Optimizer API",
    description="Autonomous Multi-Agent Travel Planning & Budget Optimization System",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.get("/")
def root():
    return {
        "service": "Smart Booking Optimizer",
        "status": "operational",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

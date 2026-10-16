"""MealBridge FastAPI application with SQLite-backed donation workflows."""

from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Keep local IBM credentials out of source control and load them before the
# assistant router reads its configuration.
load_dotenv(Path(__file__).with_name(".env"))

from api import router
from assistant import router as assistant_router

app = FastAPI(
    title="MealBridge API",
    description="Hackathon prototype API backed by SQLite.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.exception_handler(FileNotFoundError)
async def missing_database_handler(_: Request, exc: FileNotFoundError) -> JSONResponse:
    return JSONResponse(status_code=503, content={"detail": str(exc)})


@app.exception_handler(Exception)
async def unexpected_error_handler(_: Request, __: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected server error occurred."},
    )


app.include_router(router)
app.include_router(assistant_router)


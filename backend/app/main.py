"""FastAPI application entrypoint."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health, meetings
from app.config import get_settings
from app.core.logging import get_logger
from app.database.database import init_db

logger = get_logger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    logger.info("Database initialized")
    if not settings.groq_api_key:
        logger.warning(
            "GROQ_API_KEY is not set - uploads will be accepted but processing will fail. "
            "Set it in backend/.env to enable transcription and analysis."
        )
    yield


app = FastAPI(
    title="AI Meeting Summarizer API",
    description="Transcribes meeting audio and extracts structured meeting intelligence.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(meetings.router)

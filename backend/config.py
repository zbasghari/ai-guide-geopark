import os
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings

# Repo layout: backend/config.py  ->  repo root is one level up.
# Resolve the knowledge base from this file so the app works regardless of
# which directory the server is started from (local, Railway, Docker, ...).
_REPO_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    # API Settings
    # Railway injects $PORT; set api_port via env or leave the default for local.
    api_host: str = "0.0.0.0"
    api_port: int = int(os.environ.get("PORT", "8000"))
    api_reload: bool = False

    # AI Model Settings
    # On hosted platforms Ollama (localhost) is unreachable — the chat falls
    # back to a knowledge-base answer. For live AI answers, set ai_provider to
    # "openai" or "anthropic" and the matching *_api_key env var.
    ai_provider: str = "ollama"  # "ollama", "openai", "anthropic"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.1:8b"
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4o-mini"
    anthropic_api_key: Optional[str] = None
    anthropic_model: str = "claude-3-haiku-20240307"

    # Knowledge Base (defaults to <repo>/knowledge, overridable via env)
    knowledge_base_path: str = str(_REPO_ROOT / "knowledge")

    # CORS
    cors_origins: list[str] = ["*"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
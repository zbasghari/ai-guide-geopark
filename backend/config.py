import os
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings

# Repo layout: backend/config.py.
# Self-contained layout (deploy-safe): backend/knowledge  and  backend/frontend.
# Fall back to the old repo-root layout (<root>/knowledge) for compatibility.
_BACKEND_DIR = Path(__file__).resolve().parent
_REPO_ROOT = _BACKEND_DIR.parent


def _find_dir(name: str) -> Path:
    candidates = [_BACKEND_DIR / name, _REPO_ROOT / name]
    for c in candidates:
        if c.exists():
            return c
    return candidates[0]


class Settings(BaseSettings):
    # API Settings
    # Railway injects $PORT; set api_port via env or leave the default for local.
    api_host: str = "0.0.0.0"
    api_port: int = int(os.environ.get("PORT", "8000"))
    api_reload: bool = False

    # AI Model Settings
    # ai_provider: "ollama" | "openai" | "anthropic".
    #   "openai" accepts ANY OpenAI-compatible endpoint via openai_base_url
    #   (OpenAI, DeepSeek, Groq, Mistral, OpenRouter, a local vLLM/LMStudio, ...).
    # On hosted platforms Ollama (localhost) is unreachable — the chat then
    # falls back to a knowledge-base answer. For live AI answers, set
    # ai_provider to "openai" or "anthropic" plus the matching *_api_key.
    ai_provider: str = "ollama"  # "ollama", "openai", "anthropic"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.1:8b"
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4o-mini"
    # OpenAI-compatible base URL. Defaults to the official OpenAI endpoint;
    # override for other providers, e.g. DeepSeek:
    #   https://api.deepseek.com/v1   (model: deepseek-chat)
    #   https://api.groq.com/openai/v1 (model: llama-3.3-70b-versatile)
    openai_base_url: str = "https://api.openai.com/v1"
    anthropic_api_key: Optional[str] = None
    anthropic_model: str = "claude-3-haiku-20240307"

    # Knowledge Base (overridable via env)
    knowledge_base_path: str = str(_find_dir("knowledge"))

    # Frontend static directory (overridable via env)
    frontend_dir: str = str(_find_dir("frontend"))

    # CORS
    cors_origins: list[str] = ["*"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
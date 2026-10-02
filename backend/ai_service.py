import os
import json
from typing import List, Dict, Any, Optional, AsyncGenerator
from dataclasses import dataclass
import httpx
from knowledge_base import KnowledgeBase, KnowledgeItem, get_knowledge_base
from config import settings


@dataclass
class ChatMessage:
    role: str  # "user", "assistant", "system"
    content: str


@dataclass
class ChatResponse:
    answer: str
    sources: List[Dict[str, Any]]


class AIService:
    def __init__(self, kb: KnowledgeBase):
        self.kb = kb
        self.client = httpx.AsyncClient(timeout=60.0)
    
    async def close(self):
        await self.client.aclose()
    
    def _build_system_prompt(self, language: str = "fa") -> str:
        """Build the system prompt for the AI guide."""
        if language == "fa":
            return """شما یک راهنمای رسمی و اطلاعاتی ژئوپارک هستید. قوانین زیر را به‌دقت دنبال کنید:

1. **اولویت با اطلاعات پایگاه دانش ژئوپارک**: همیشه از اطلاعات موجود در پایگاه دانش ژئوپارک برای پاسخ دادن استفاده کنید.

2. **عدم اختراع اطلاعات**: هرگز اطلاعات خاص ژئوپارک (ساعات بازدید، قیمت‌ها، مسیرها، امکانات، قوانین، مختصات جغرافیایی) را از خودتان نسازید. اگر اطلاعات در پایگاه دانش موجود نیست، صراحتاً بگویید: «این اطلاعات در حال حاضر در پایگاه دانش ژئوپارک موجود نیست.»

3. **تفکیک اطلاعات رسمی و عمومی**: بین اطلاعات رسمی ژئوپارک (از پایگاه دانش) و اطلاعات عمومی آموزشی (دانش عمومی ژئولوژی، جغرافیا) تمایز قائل شوید. اطلاعات عمومی را با پیشوند «به‌طور کلی...» یا «از دیدگاه علمی...» ارائه دهید.

4. **پاسخ‌های مختصر و مفید**: پاسخ‌ها باید مختصر، مفید و مناسب برای گردشگران باشد.

5. **زبان**: به زبان فارسی پاسخ دهید، مگر اینکه کاربر به زبان دیگر بپرسد.

6. **ارجاع به منبع**: وقتی پاسخ از پایگاه دانش است، عنوان منبع را در پایان ذکر کنید (مثال: منبع: راهنمای ژئوسایت آبشار قاره‌سی).

7. **پیشنهاد مرتبط**: وقتی مناسب است، مکان یا اطلاعات مرتبط دیگری از پایگاه دانش را پیشنهاد دهید.

8. **عدم ادعاهای پشتیبانی‌نشده**: درباره ساعات بازدید، ایمنی، مسیرها، قیمت‌ها، فاصله‌ها، یا در دسترس بودن ادعایی نکنید که در پایگاه دانش نباشد."""
        else:
            return """You are the official informational AI guide for the Geopark. Follow these rules strictly:

1. **Prioritize Geopark Knowledge Base**: Always use information from the Geopark knowledge base to answer questions.

2. **Never Invent Geopark-Specific Facts**: Never make up geopark-specific information (opening hours, prices, routes, facilities, rules, coordinates). If information is not in the knowledge base, clearly state: "This information is not currently available in the Geopark knowledge base."

3. **Distinguish Official vs General Information**: Distinguish between official Geopark information (from knowledge base) and general educational information (geology, geography general knowledge). Present general info with prefixes like "Generally speaking..." or "From a scientific perspective..."

4. **Concise and Useful**: Keep answers concise and useful for tourists.

5. **Language**: Answer in English unless the user asks in another language.

6. **Cite Sources**: When answering from knowledge base, cite the source title (e.g., "Source: Geosite Guide - Qarehsi Waterfall").

7. **Suggest Related**: When appropriate, suggest another relevant place or piece of information from the knowledge base.

8. **No Unsupported Claims**: Do not make claims about opening hours, safety, routes, prices, distances, or availability not in the knowledge base."""
    
    def _detect_language(self, text: str) -> str:
        """Simple language detection."""
        # Check for Persian/Arabic script
        persian_chars = sum(1 for c in text if '\u0600' <= c <= '\u06FF')
        # Check for Latin script
        latin_chars = sum(1 for c in text if 'a' <= c.lower() <= 'z')
        
        if persian_chars > latin_chars:
            return "fa"
        return "en"
    
    def _build_context(self, items: List[KnowledgeItem]) -> str:
        """Build context string from knowledge base items."""
        if not items:
            return "هیچ اطلاعات مرتبطی در پایگاه دانش یافت نشد."
        
        context_parts = []
        for item in items:
            context_parts.append(f"=== {item.title} ({item.category}) ===\n{item.content}\n")
        
        return "\n".join(context_parts)
    
    async def _call_ollama(self, messages: List[Dict[str, str]], model: str) -> str:
        """Call Ollama API."""
        url = f"{settings.ollama_base_url}/api/chat"
        payload = {
            "model": model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": 0.3,
                "top_p": 0.9,
            }
        }
        response = await self.client.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
        return data.get("message", {}).get("content", "")
    
    async def _call_openai(self, messages: List[Dict[str, str]], model: str) -> str:
        """Call an OpenAI-compatible /chat/completions endpoint.

        Uses `openai_base_url`, so the same code works with OpenAI itself or
        any compatible provider (DeepSeek, Groq, Mistral, OpenRouter, local
        vLLM/LMStudio, ...) — just set the base URL + key + model.
        """
        if not settings.openai_api_key:
            raise ValueError("OpenAI API key not configured")

        base_url = settings.openai_base_url.rstrip("/")
        url = f"{base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.openai_api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.3,
            "max_tokens": 1000,
        }
        response = await self.client.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]
    
    async def _call_anthropic(self, messages: List[Dict[str, str]], model: str) -> str:
        """Call Anthropic API."""
        if not settings.anthropic_api_key:
            raise ValueError("Anthropic API key not configured")
        
        # Convert messages format
        system_msg = ""
        user_messages = []
        for msg in messages:
            if msg["role"] == "system":
                system_msg = msg["content"]
            else:
                user_messages.append(msg)
        
        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "x-api-key": settings.anthropic_api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        }
        payload = {
            "model": model,
            "system": system_msg,
            "messages": user_messages,
            "max_tokens": 1000,
            "temperature": 0.3,
        }
        response = await self.client.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        return data["content"][0]["text"]
    
    def _grounded_fallback(self, question: str, items: List[KnowledgeItem], language: str) -> str:
        """Deterministic answer from the knowledge base when the AI model is unavailable.

        Uses ONLY content already in the knowledge base (first 2 relevant items'
        main section). No invented facts.
        """
        if not items:
            return "این اطلاعات در حال حاضر در پایگاه دانش ژئوپارک موجود نیست. می‌توانید پرسش دیگری مطرح کنید یا بخش‌های دیگر سایت را بررسی نمایید."

        lines: List[str] = []
        used = 0
        # Lazy import: helpers live in main.py (which imports ai_service),
        # so import at call time to avoid a module-level circular import.
        from main import _parse_sections, _clean_excerpt
        for item in items:
            if used >= 2:
                break
            # pick the first descriptive section (Tovizihat / Tajrohe / etc.)
            body = ""
            for section in _parse_sections(item.content).values():
                body = section
                break
            body = " ".join(body.split())
            if not body:
                continue
            body = _clean_excerpt(body, 400)
            lines.append(f"{item.title}: {body}")
            used += 1

        if not lines:
            return "این اطلاعات در حال حاضر در پایگاه دانش ژئوپارک موجود نیست."

        answer = "پاسخ بر اساس پایگاه دانش ژئوپارک:\n\n" + "\n\n".join(lines)
        answer += "\n\n(یادآوری: مدل هوش مصنوعی در دسترس نیست؛ پاسخ بالا به‌طور مستقیم از پایگاه دانش ارائه شده است.)"
        return answer

    async def chat(self, message: str, session_id: str = "default") -> ChatResponse:
        """Process a chat message and return response with sources."""
        # Detect language
        language = self._detect_language(message)
        
        # Search knowledge base
        kb_items = self.kb.search(message, top_k=5)
        
        # Build context
        context = self._build_context(kb_items)
        
        # Build messages
        system_prompt = self._build_system_prompt(language)
        full_system_prompt = f"{system_prompt}\n\n--- پایگاه دانش ژئوپارک (مرجع) ---\n{context}"
        
        messages = [
            {"role": "system", "content": full_system_prompt},
            {"role": "user", "content": message},
        ]
        
        # Call AI provider
        try:
            if settings.ai_provider == "ollama":
                answer = await self._call_ollama(messages, settings.ollama_model)
            elif settings.ai_provider == "openai":
                answer = await self._call_openai(messages, settings.openai_model)
            elif settings.ai_provider == "anthropic":
                answer = await self._call_anthropic(messages, settings.anthropic_model)
            else:
                answer = "AI provider not configured."
        except Exception:
            # Provider unreachable (e.g. Ollama not running): fall back to a
            # deterministic, fully grounded answer from the knowledge base.
            answer = self._grounded_fallback(message, kb_items, language)

        # Prepare sources
        sources = []
        for item in kb_items:
            sources.append({
                "id": item.id,
                "title": item.title,
                "category": item.category,
                "file_path": item.file_path,
            })
        
        return ChatResponse(answer=answer, sources=sources)


# Global instance
ai_service: Optional[AIService] = None


def init_ai_service(kb: KnowledgeBase) -> AIService:
    global ai_service
    ai_service = AIService(kb)
    return ai_service


def get_ai_service() -> AIService:
    if ai_service is None:
        raise RuntimeError("AI service not initialized. Call init_ai_service first.")
    return ai_service
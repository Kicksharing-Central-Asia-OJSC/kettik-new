from fastapi import FastAPI, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import httpx, os, json
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime

# load env
load_dotenv(Path(__file__).resolve().parent / ".env")

BOT_API_KEY = os.getenv("BOT_API_KEY", "")
DEV_CHAT_ID = os.getenv("KETTIK_DEV_CHAT_ID", None)
UPSTREAM = "https://kettik.kicksharing.asia/api/v1"

HEADERS = {"X-Bot-API-Key": BOT_API_KEY} if BOT_API_KEY else {}

app = FastAPI(title="Kettik Proxy")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CreateVerificationPayload(BaseModel):
    phone_number: str
    chat_id: int | None = None

class CheckVerificationPayload(BaseModel):
    phone_number: str
    code: str

def ok(data):
    return JSONResponse(data, status_code=200)

def fail(msg: str, status: int = 400):
    return JSONResponse({"error": msg}, status_code=status)

@app.get("/__health")
@app.get("/health")
async def health():
    return {
        "time": datetime.utcnow().isoformat()+"Z",
        "bot_key_loaded": bool(BOT_API_KEY),
        "dev_chat_id": bool(DEV_CHAT_ID),
        "upstream": UPSTREAM
    }

@app.post("/auth/bot/create-verification/")
async def create_verification(p: CreateVerificationPayload):
    # если chat_id не пришёл — используем DEV_CHAT_ID из .env (для локалки)
    chat_id = p.chat_id if p.chat_id is not None else DEV_CHAT_ID
    if not p.phone_number:
        return fail("phone_number обязателен", 400)
    if not chat_id:
        return fail("chat_id обязателен (или задайте KETTIK_DEV_CHAT_ID в .env)", 400)
    if not BOT_API_KEY:
        return fail("BOT_API_KEY не задан в .env", 500)

    payload = {"phone_number": p.phone_number, "chat_id": int(chat_id)}

    async with httpx.AsyncClient(base_url=UPSTREAM, timeout=15) as cli:
        r = await cli.post(
            "/auth/bot/create-verification/",
            headers=HEADERS,
            json=payload
        )

    try:
        data = r.json()
    except Exception:
        data = {"raw": r.text}

    return JSONResponse(data, status_code=r.status_code)

@app.post("/auth/bot/check/")
async def check_code(p: CheckVerificationPayload):
    if not p.phone_number or not p.code:
        return fail("phone_number и code обязательны", 400)
    if not BOT_API_KEY:
        return fail("BOT_API_KEY не задан в .env", 500)

    # На апстриме рабочий эндпоинт — /auth/verify-code/
    upstream_path_options = [
        "/auth/verify-code/",
        "/auth/verify/",
        "/auth/check-verification/",
    ]

    async with httpx.AsyncClient(base_url=UPSTREAM, timeout=15) as cli:
        last = None
        for path in upstream_path_options:
            r = await cli.post(path, headers=HEADERS, json=p.model_dump())
            last = r
            if r.status_code == 200:
                try:
                    data = r.json()
                except Exception:
                    data = {"raw": r.text}
                return ok(data)

    try:
        data = last.json()  # type: ignore
    except Exception:
        data = {"raw": getattr(last, "text", "")}  # type: ignore

    return JSONResponse(data, status_code=getattr(last, "status_code", 502))  # type: ignore

@app.get("/proxy/users/me/")
async def me(authorization: str = Header(default="")):
    if not authorization.lower().startswith("bearer "):
        return fail("Заголовок Authorization: Bearer <token> обязателен", 401)

    token = authorization.split(" ", 1)[1]

    async with httpx.AsyncClient(base_url=UPSTREAM, timeout=15) as cli:
        r = await cli.get(
            "/users/me/",
            headers={"Authorization": f"Bearer {token}"}
        )

    try:
        data = r.json()
    except Exception:
        data = {"raw": r.text}

    return JSONResponse(data, status_code=r.status_code)

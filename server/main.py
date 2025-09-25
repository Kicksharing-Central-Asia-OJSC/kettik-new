from fastapi import FastAPI, Request, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import httpx
import os
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime
from typing import Optional, Any, Dict
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Загрузка переменных окружения
load_dotenv(Path(__file__).resolve().parent / ".env")

# Конфигурация
BOT_API_KEY = os.getenv("BOT_API_KEY", "")
DEV_CHAT_ID = os.getenv("KETTIK_DEV_CHAT_ID")
UPSTREAM = os.getenv("UPSTREAM_API", "https://kettik.kicksharing.asia/api/v1")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

# Создание приложения
app = FastAPI(
    title="Kettik Proxy API",
    description="Прокси для интеграции фронтенда Kettik с основным бэкендом",
    version="1.0.0"
)

# CORS настройки
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ MODELS ============
class CreateVerificationRequest(BaseModel):
    phone_number: str = Field(..., description="Номер телефона в формате +996XXXXXXXXX")
    chat_id: Optional[int] = Field(None, description="Telegram chat ID (опционально для dev)")

class CheckVerificationRequest(BaseModel):
    phone_number: str = Field(..., description="Номер телефона")
    code: str = Field(..., description="Код подтверждения")

class UpdateProfileRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    email: Optional[str] = None
    birth_date: Optional[str] = None

class TopupRequest(BaseModel):
    amount: int = Field(..., gt=0, description="Сумма пополнения")
    payment_method_id: Optional[int] = None

# ============ UTILITIES ============
def get_headers() -> Dict[str, str]:
    """Получить заголовки для запросов к upstream API"""
    headers = {}
    if BOT_API_KEY:
        headers["X-Bot-API-Key"] = BOT_API_KEY
    return headers

def get_auth_headers(authorization: str) -> Dict[str, str]:
    """Получить заголовки с авторизацией"""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Authorization header required")
    return {"Authorization": authorization}

async def proxy_request(
    method: str,
    path: str,
    headers: Optional[Dict[str, str]] = None,
    json_data: Optional[Any] = None,
    timeout: int = 15
) -> tuple[Any, int]:
    """Универсальная функция для проксирования запросов"""
    url = f"{UPSTREAM}{path}"
    request_headers = get_headers()
    if headers:
        request_headers.update(headers)
    
    logger.info(f"Proxying {method} {path}")
    
    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            response = await client.request(
                method=method,
                url=url,
                headers=request_headers,
                json=json_data
            )
            
            try:
                data = response.json()
            except Exception:
                data = {"raw": response.text}
            
            return data, response.status_code
        except httpx.TimeoutException:
            logger.error(f"Timeout for {method} {path}")
            return {"error": "Request timeout"}, 504
        except Exception as e:
            logger.error(f"Error proxying request: {str(e)}")
            return {"error": str(e)}, 502

# ============ HEALTH CHECK ============
@app.get("/health", tags=["System"])
@app.get("/__health", include_in_schema=False)
async def health_check():
    """Проверка состояния сервиса"""
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "config": {
            "bot_key_configured": bool(BOT_API_KEY),
            "dev_chat_id_configured": bool(DEV_CHAT_ID),
            "upstream": UPSTREAM
        }
    }

# ============ AUTH ENDPOINTS ============
@app.post("/auth/bot/create-verification/", tags=["Auth"])
async def create_verification(request: CreateVerificationRequest):
    """Создание кода верификации"""
    # Если chat_id не указан, используем DEV_CHAT_ID для разработки
    chat_id = request.chat_id if request.chat_id is not None else DEV_CHAT_ID
    
    if not request.phone_number:
        raise HTTPException(status_code=400, detail="phone_number is required")
    
    if not chat_id:
        raise HTTPException(
            status_code=400,
            detail="chat_id is required or set KETTIK_DEV_CHAT_ID in .env"
        )
    
    if not BOT_API_KEY:
        raise HTTPException(status_code=500, detail="BOT_API_KEY not configured")
    
    payload = {
        "phone_number": request.phone_number,
        "chat_id": int(chat_id)
    }
    
    data, status_code = await proxy_request(
        method="POST",
        path="/auth/bot/create-verification/",
        json_data=payload
    )
    
    return JSONResponse(content=data, status_code=status_code)

@app.post("/auth/bot/check/", tags=["Auth"])
async def check_verification(request: CheckVerificationRequest):
    """Проверка кода верификации"""
    if not request.phone_number or not request.code:
        raise HTTPException(status_code=400, detail="phone_number and code are required")
    
    if not BOT_API_KEY:
        raise HTTPException(status_code=500, detail="BOT_API_KEY not configured")
    
    # Пробуем разные варианты эндпоинтов
    paths_to_try = [
        "/auth/verify-code/",
        "/auth/verify/",
        "/auth/check-verification/",
        "/auth/bot/check/"
    ]
    
    for path in paths_to_try:
        data, status_code = await proxy_request(
            method="POST",
            path=path,
            json_data=request.dict()
        )
        
        if status_code == 200:
            return JSONResponse(content=data, status_code=status_code)
    
    # Если ни один не сработал, возвращаем последний результат
    return JSONResponse(content=data, status_code=status_code)

# ============ USER ENDPOINTS ============
@app.get("/proxy/users/me/", tags=["User"])
async def get_user_me(authorization: str = Header(default="")):
    """Получить информацию о текущем пользователе"""
    headers = get_auth_headers(authorization)
    data, status_code = await proxy_request(
        method="GET",
        path="/users/me/",
        headers=headers
    )
    return JSONResponse(content=data, status_code=status_code)

@app.patch("/users/update_profile/", tags=["User"])
async def update_profile(
    request: UpdateProfileRequest,
    authorization: str = Header(default="")
):
    """Обновить профиль пользователя"""
    headers = get_auth_headers(authorization)
    data, status_code = await proxy_request(
        method="PATCH",
        path="/users/update_profile/",
        headers=headers,
        json_data=request.dict(exclude_none=True)
    )
    return JSONResponse(content=data, status_code=status_code)

@app.get("/users/balance/", tags=["User"])
async def get_balance(authorization: str = Header(default="")):
    """Получить баланс пользователя"""
    headers = get_auth_headers(authorization)
    data, status_code = await proxy_request(
        method="GET",
        path="/users/balance/",
        headers=headers
    )
    return JSONResponse(content=data, status_code=status_code)

# ============ PAYMENT ENDPOINTS ============
@app.post("/payments/topup/", tags=["Payments"])
async def topup_balance(
    request: TopupRequest,
    authorization: str = Header(default="")
):
    """Пополнить баланс"""
    headers = get_auth_headers(authorization)
    data, status_code = await proxy_request(
        method="POST",
        path="/payments/topup/",
        headers=headers,
        json_data=request.dict()
    )
    return JSONResponse(content=data, status_code=status_code)

@app.get("/payments/methods/", tags=["Payments"])
async def get_payment_methods(authorization: str = Header(default="")):
    """Получить список платежных методов"""
    headers = get_auth_headers(authorization)
    data, status_code = await proxy_request(
        method="GET",
        path="/payments/methods/",
        headers=headers
    )
    return JSONResponse(content=data, status_code=status_code)

@app.post("/payments/methods/add_card/", tags=["Payments"])
async def add_card(authorization: str = Header(default="")):
    """Добавить новую карту"""
    headers = get_auth_headers(authorization)
    data, status_code = await proxy_request(
        method="POST",
        path="/payments/methods/add_card/",
        headers=headers
    )
    return JSONResponse(content=data, status_code=status_code)

@app.post("/payments/methods/{card_id}/set_default/", tags=["Payments"])
async def set_default_card(
    card_id: int,
    authorization: str = Header(default="")
):
    """Установить карту по умолчанию"""
    headers = get_auth_headers(authorization)
    data, status_code = await proxy_request(
        method="POST",
        path=f"/payments/methods/{card_id}/set_default/",
        headers=headers
    )
    return JSONResponse(content=data, status_code=status_code)

@app.post("/payments/methods/{card_id}/deactivate/", tags=["Payments"])
async def deactivate_card(
    card_id: int,
    authorization: str = Header(default="")
):
    """Деактивировать карту"""
    headers = get_auth_headers(authorization)
    data, status_code = await proxy_request(
        method="POST",
        path=f"/payments/methods/{card_id}/deactivate/",
        headers=headers
    )
    return JSONResponse(content=data, status_code=status_code)

# ============ CRM INTEGRATION ENDPOINTS (для будущего) ============
@app.get("/crm/users/", tags=["CRM"])
async def get_users_list(
    authorization: str = Header(default=""),
    skip: int = 0,
    limit: int = 100
):
    """Получить список пользователей (для CRM)"""
    headers = get_auth_headers(authorization)
    data, status_code = await proxy_request(
        method="GET",
        path=f"/users/?skip={skip}&limit={limit}",
        headers=headers
    )
    return JSONResponse(content=data, status_code=status_code)

@app.get("/crm/rentals/", tags=["CRM"])
async def get_rentals_list(
    authorization: str = Header(default=""),
    skip: int = 0,
    limit: int = 100
):
    """Получить список аренд (для CRM)"""
    headers = get_auth_headers(authorization)
    data, status_code = await proxy_request(
        method="GET",
        path=f"/rentals/?skip={skip}&limit={limit}",
        headers=headers
    )
    return JSONResponse(content=data, status_code=status_code)

# ============ ERROR HANDLERS ============
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
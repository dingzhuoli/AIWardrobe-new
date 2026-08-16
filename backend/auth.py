"""Single-administrator authentication for AIWardrobe."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from collections import defaultdict, deque
from dataclasses import dataclass
from typing import Deque

from fastapi import APIRouter, Request, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from starlette.middleware.base import BaseHTTPMiddleware


COOKIE_NAME = "aiwardrobe_admin_session"
PASSWORD_SCHEME = "pbkdf2_sha256"
PASSWORD_ITERATIONS = 600_000
SESSION_MAX_AGE = 24 * 60 * 60
LOGIN_WINDOW_SECONDS = 5 * 60
LOGIN_MAX_ATTEMPTS = 5
LOGIN_LOCK_SECONDS = 15 * 60

PUBLIC_PATHS = {
    "/health",
    "/api/auth/login",
    "/api/auth/me",
}
PROTECTED_PREFIXES = (
    "/api",
    "/uploads",
    "/docs",
    "/redoc",
    "/openapi.json",
)


def _b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def _b64decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def hash_password(password: str, *, iterations: int = PASSWORD_ITERATIONS) -> str:
    """Create a salted PBKDF2-SHA256 password hash suitable for an env var."""
    if len(password) < 12:
        raise ValueError("管理员密码至少需要 12 个字符")
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return f"{PASSWORD_SCHEME}:{iterations}:{_b64encode(salt)}:{_b64encode(digest)}"


def verify_password(password: str, encoded_hash: str) -> bool:
    try:
        scheme, iterations_text, salt_text, digest_text = encoded_hash.split(":", 3)
        if scheme != PASSWORD_SCHEME:
            return False
        iterations = int(iterations_text)
        if iterations < 100_000 or iterations > 5_000_000:
            return False
        salt = _b64decode(salt_text)
        expected = _b64decode(digest_text)
        actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
        return hmac.compare_digest(actual, expected)
    except (TypeError, ValueError):
        return False


def _password_hash_is_valid(encoded_hash: str) -> bool:
    try:
        scheme, iterations_text, salt_text, digest_text = encoded_hash.split(":", 3)
        iterations = int(iterations_text)
        salt = _b64decode(salt_text)
        digest = _b64decode(digest_text)
        return (
            scheme == PASSWORD_SCHEME
            and 100_000 <= iterations <= 5_000_000
            and len(salt) >= 16
            and len(digest) == hashlib.sha256().digest_size
        )
    except (TypeError, ValueError):
        return False


@dataclass(frozen=True)
class AuthSettings:
    username: str
    password_hash: str
    session_secret: str
    session_max_age: int

    @classmethod
    def from_environment(cls) -> "AuthSettings":
        try:
            session_max_age = int(os.getenv("ADMIN_SESSION_MAX_AGE", str(SESSION_MAX_AGE)))
        except ValueError:
            session_max_age = SESSION_MAX_AGE
        return cls(
            username=os.getenv("ADMIN_USERNAME", "admin").strip(),
            password_hash=os.getenv("ADMIN_PASSWORD_HASH", "").strip(),
            session_secret=os.getenv("ADMIN_SESSION_SECRET", "").strip(),
            session_max_age=max(300, min(session_max_age, 30 * 24 * 60 * 60)),
        )

    def validation_error(self) -> str | None:
        if not self.username:
            return "ADMIN_USERNAME 不能为空"
        if not _password_hash_is_valid(self.password_hash):
            return "ADMIN_PASSWORD_HASH 未配置或格式无效"
        if len(self.session_secret) < 32:
            return "ADMIN_SESSION_SECRET 未配置或长度不足 32 个字符"
        return None


def _sign_session(username: str, settings: AuthSettings, now: int | None = None) -> str:
    issued_at = int(now if now is not None else time.time())
    payload = _b64encode(
        json.dumps(
            {"sub": username, "iat": issued_at, "nonce": secrets.token_urlsafe(12)},
            separators=(",", ":"),
        ).encode("utf-8")
    )
    signature = hmac.new(
        settings.session_secret.encode("utf-8"), payload.encode("ascii"), hashlib.sha256
    ).digest()
    return f"{payload}.{_b64encode(signature)}"


def _verify_session(token: str | None, settings: AuthSettings, now: int | None = None) -> str | None:
    if not token:
        return None
    try:
        payload, signature_text = token.split(".", 1)
        expected = hmac.new(
            settings.session_secret.encode("utf-8"), payload.encode("ascii"), hashlib.sha256
        ).digest()
        if not hmac.compare_digest(expected, _b64decode(signature_text)):
            return None
        claims = json.loads(_b64decode(payload))
        issued_at = int(claims["iat"])
        current_time = int(now if now is not None else time.time())
        if issued_at > current_time + 60 or current_time - issued_at > settings.session_max_age:
            return None
        if not hmac.compare_digest(str(claims.get("sub", "")), settings.username):
            return None
        return settings.username
    except (ValueError, TypeError, KeyError, json.JSONDecodeError):
        return None


class LoginRateLimiter:
    def __init__(self) -> None:
        self._attempts: dict[str, Deque[float]] = defaultdict(deque)
        self._locked_until: dict[str, float] = {}

    def retry_after(self, key: str, now: float | None = None) -> int:
        current_time = now if now is not None else time.monotonic()
        locked_until = self._locked_until.get(key, 0)
        if locked_until <= current_time:
            self._locked_until.pop(key, None)
            return 0
        return max(1, int(locked_until - current_time))

    def record_failure(self, key: str, now: float | None = None) -> None:
        current_time = now if now is not None else time.monotonic()
        attempts = self._attempts[key]
        while attempts and current_time - attempts[0] > LOGIN_WINDOW_SECONDS:
            attempts.popleft()
        attempts.append(current_time)
        if len(attempts) >= LOGIN_MAX_ATTEMPTS:
            self._locked_until[key] = current_time + LOGIN_LOCK_SECONDS
            attempts.clear()

    def clear(self, key: str) -> None:
        self._attempts.pop(key, None)
        self._locked_until.pop(key, None)


login_limiter = LoginRateLimiter()


def _request_key(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def _cookie_secure(request: Request) -> bool:
    configured = os.getenv("ADMIN_COOKIE_SECURE", "auto").strip().lower()
    if configured in {"1", "true", "yes", "on"}:
        return True
    if configured in {"0", "false", "no", "off"}:
        return False
    forwarded_proto = request.headers.get("x-forwarded-proto", "").split(",", 1)[0].strip()
    return request.url.scheme == "https" or forwarded_proto == "https"


def _set_session_cookie(response: Response, request: Request, token: str, max_age: int) -> None:
    response.set_cookie(
        COOKIE_NAME,
        token,
        max_age=max_age,
        httponly=True,
        secure=_cookie_secure(request),
        samesite="strict",
        path="/",
    )


class AdminAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if path in PUBLIC_PATHS or not path.startswith(PROTECTED_PREFIXES):
            return await call_next(request)

        settings = AuthSettings.from_environment()
        configuration_error = settings.validation_error()
        if configuration_error:
            return JSONResponse(
                status_code=503,
                content={"detail": "管理员认证尚未完成配置", "reason": configuration_error},
            )

        username = _verify_session(request.cookies.get(COOKIE_NAME), settings)
        if not username:
            return JSONResponse(status_code=401, content={"detail": "请先登录管理员账户"})
        request.state.admin_username = username
        return await call_next(request)


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=128)
    password: str = Field(min_length=1, max_length=1024)


router = APIRouter(prefix="/auth", tags=["管理员认证"])


@router.get("/me")
async def current_admin(request: Request):
    settings = AuthSettings.from_environment()
    configuration_error = settings.validation_error()
    if configuration_error:
        return JSONResponse(
            status_code=503,
            content={"authenticated": False, "configured": False, "reason": configuration_error},
        )
    username = _verify_session(request.cookies.get(COOKIE_NAME), settings)
    if not username:
        return JSONResponse(
            status_code=401,
            content={"authenticated": False, "configured": True},
        )
    return {"authenticated": True, "configured": True, "username": username}


@router.post("/login")
async def login(payload: LoginRequest, request: Request):
    settings = AuthSettings.from_environment()
    configuration_error = settings.validation_error()
    if configuration_error:
        return JSONResponse(
            status_code=503,
            content={"detail": "管理员认证尚未完成配置", "reason": configuration_error},
        )

    request_key = _request_key(request)
    retry_after = login_limiter.retry_after(request_key)
    if retry_after:
        return JSONResponse(
            status_code=429,
            headers={"Retry-After": str(retry_after)},
            content={"detail": "登录失败次数过多，请稍后再试"},
        )

    username_matches = hmac.compare_digest(payload.username, settings.username)
    password_matches = verify_password(payload.password, settings.password_hash)
    if not (username_matches and password_matches):
        login_limiter.record_failure(request_key)
        return JSONResponse(status_code=401, content={"detail": "用户名或密码错误"})

    login_limiter.clear(request_key)
    response = JSONResponse({"authenticated": True, "username": settings.username})
    _set_session_cookie(
        response,
        request,
        _sign_session(settings.username, settings),
        settings.session_max_age,
    )
    return response


@router.post("/logout")
async def logout(request: Request):
    response = JSONResponse({"authenticated": False})
    response.delete_cookie(
        COOKIE_NAME,
        path="/",
        httponly=True,
        secure=_cookie_secure(request),
        samesite="strict",
    )
    return response

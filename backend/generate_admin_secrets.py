"""Generate administrator environment values without exposing the password in shell history."""

import base64
from getpass import getpass
import hashlib
import secrets


def _encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def hash_password(password: str) -> str:
    if len(password) < 12:
        raise ValueError("管理员密码至少需要 12 个字符")
    iterations = 600_000
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return f"pbkdf2_sha256:{iterations}:{_encode(salt)}:{_encode(digest)}"


def main() -> None:
    username = input("管理员用户名 [admin]: ").strip() or "admin"
    password = getpass("管理员密码（至少 12 个字符）: ")
    confirmation = getpass("再次输入管理员密码: ")
    if password != confirmation:
        raise SystemExit("两次输入的密码不一致")

    try:
        password_hash = hash_password(password)
    except ValueError as exc:
        raise SystemExit(str(exc)) from exc

    print("\n请将以下内容写入 backend/.env：")
    print(f"ADMIN_USERNAME={username}")
    print(f"ADMIN_PASSWORD_HASH={password_hash}")
    print(f"ADMIN_SESSION_SECRET={secrets.token_urlsafe(48)}")
    print("ADMIN_SESSION_MAX_AGE=86400")
    print("ADMIN_COOKIE_SECURE=auto")


if __name__ == "__main__":
    main()

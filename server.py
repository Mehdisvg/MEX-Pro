"""
MEX Pro — Localhost (Python standart kütüphane, ek paket gerekmez)
Çalıştır: python server.py
Adres: http://127.0.0.1:8080
"""
from __future__ import annotations

import hashlib
import json
import secrets
import uuid
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
DATA.mkdir(exist_ok=True)
USERS_FILE = DATA / "users.json"
SESSIONS_FILE = DATA / "sessions.json"
EXERCISES_FILE = DATA / "exercises.json"
TR_NUTRITION_FILE = DATA / "tr-nutrition.json"
PORT = 8080


def _verify_google_id_token(id_token: str):
    try:
        with urlopen(
            "https://oauth2.googleapis.com/tokeninfo?id_token=" + id_token,
            timeout=10,
        ) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception:
        return None


def _load(path: Path, default):
    if path.exists():
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return default
    return default


def _save(path: Path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def _hash_password(password: str, salt: str) -> str:
    return hashlib.sha256(f"{salt}:{password}".encode()).hexdigest()


def _json_response(handler: BaseHTTPRequestHandler, data, status=200):
    body = json.dumps(data, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def _read_body(handler: BaseHTTPRequestHandler):
    length = int(handler.headers.get("Content-Length", 0))
    if not length:
        return {}
    try:
        return json.loads(handler.rfile.read(length).decode("utf-8"))
    except json.JSONDecodeError:
        return {}


def _get_token(handler: BaseHTTPRequestHandler):
    auth = handler.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:].strip()
    cookie = handler.headers.get("Cookie", "")
    for part in cookie.split(";"):
        part = part.strip()
        if part.startswith("mex_token="):
            return part.split("=", 1)[1]
    return ""


def _current_user(handler: BaseHTTPRequestHandler):
    token = _get_token(handler)
    if not token:
        return None, None
    sessions = _load(SESSIONS_FILE, {})
    sess = sessions.get(token)
    if not sess:
        return None, token
    users = _load(USERS_FILE, [])
    user = next((u for u in users if u["id"] == sess["userId"]), None)
    return user, token


class MexHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print("[%s] %s" % (self.log_date_time_string(), fmt % args))

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/health":
            return _json_response(
                self,
                {"ok": True, "service": "mex-pro", "time": datetime.now(timezone.utc).isoformat()},
            )
        if path == "/api/exercises":
            return _json_response(self, _load(EXERCISES_FILE, {"regions": []}))
        if path == "/api/exercise-details":
            details_file = DATA / "exercise-details.json"
            return _json_response(self, _load(details_file, {"exercises": []}))
        if path == "/api/tr-nutrition":
            return _json_response(self, _load(TR_NUTRITION_FILE, {"foods": [], "recipes": []}))
        if path == "/api/me":
            user, _ = _current_user(self)
            if not user:
                return _json_response(self, {"error": "Giriş gerekli"}, 401)
            return _json_response(
                self,
                {"user": {"id": user["id"], "email": user["email"], "name": user["name"], "plan": user.get("plan", "free")}},
            )
        if path == "/api/user-data":
            user, _ = _current_user(self)
            if not user:
                return _json_response(self, {"error": "Giriş gerekli"}, 401)
            ud = DATA / f"userdata_{user['id']}.json"
            return _json_response(self, _load(ud, {}))
        return self._serve_static(path)

    def do_POST(self):
        path = urlparse(self.path).path
        body = _read_body(self)

        if path == "/api/register":
            email = (body.get("email") or "").strip().lower()
            password = body.get("password") or ""
            name = (body.get("name") or "").strip() or "Sporcu"
            if not email or "@" not in email:
                return _json_response(self, {"error": "Geçerli e-posta gir"}, 400)
            if len(password) < 6:
                return _json_response(self, {"error": "Şifre en az 6 karakter"}, 400)
            users = _load(USERS_FILE, [])
            if any(u["email"] == email for u in users):
                return _json_response(self, {"error": "Bu e-posta kayıtlı"}, 409)
            salt = secrets.token_hex(8)
            user = {
                "id": str(uuid.uuid4()),
                "email": email,
                "name": name,
                "salt": salt,
                "passwordHash": _hash_password(password, salt),
                "plan": "free",
                "createdAt": datetime.now(timezone.utc).isoformat(),
            }
            users.append(user)
            _save(USERS_FILE, users)
            token = secrets.token_urlsafe(32)
            sessions = _load(SESSIONS_FILE, {})
            sessions[token] = {"userId": user["id"]}
            _save(SESSIONS_FILE, sessions)
            self.send_response(200)
            self._send_json_cookies(
                {"token": token, "user": {"id": user["id"], "email": user["email"], "name": user["name"], "plan": "free"}},
                token,
            )
            return

        if path == "/api/login":
            email = (body.get("email") or "").strip().lower()
            password = body.get("password") or ""
            users = _load(USERS_FILE, [])
            user = next((u for u in users if u["email"] == email), None)
            if not user or _hash_password(password, user["salt"]) != user["passwordHash"]:
                return _json_response(self, {"error": "E-posta veya şifre hatalı"}, 401)
            token = secrets.token_urlsafe(32)
            sessions = _load(SESSIONS_FILE, {})
            sessions[token] = {"userId": user["id"]}
            _save(SESSIONS_FILE, sessions)
            self.send_response(200)
            self._send_json_cookies(
                {
                    "token": token,
                    "user": {"id": user["id"], "email": user["email"], "name": user["name"], "plan": user.get("plan", "free")},
                },
                token,
            )
            return

        if path == "/api/logout":
            token = _get_token(self)
            if token:
                sessions = _load(SESSIONS_FILE, {})
                sessions.pop(token, None)
                _save(SESSIONS_FILE, sessions)
            self.send_response(200)
            self.send_header("Set-Cookie", "mex_token=; Path=/; Max-Age=0")
            return _json_response(self, {"ok": True})

        if path == "/api/user-data":
            user, _ = _current_user(self)
            if not user:
                return _json_response(self, {"error": "Giriş gerekli"}, 401)
            ud = DATA / f"userdata_{user['id']}.json"
            _save(ud, body)
            return _json_response(self, {"ok": True})

        if path == "/api/auth/google":
            cred = body.get("credential") or body.get("id_token")
            if not cred:
                return _json_response(self, {"error": "Google token gerekli"}, 400)
            info = _verify_google_id_token(cred)
            if not info or not info.get("email"):
                return _json_response(self, {"error": "Google doğrulama başarısız"}, 401)
            email = info["email"].lower()
            name = info.get("name") or email.split("@")[0]
            google_id = info.get("sub")
            users = _load(USERS_FILE, [])
            user = next((u for u in users if u.get("googleId") == google_id or u["email"] == email), None)
            if not user:
                user = {
                    "id": str(uuid.uuid4()),
                    "email": email,
                    "name": name,
                    "googleId": google_id,
                    "salt": "",
                    "passwordHash": "",
                    "plan": "pro",
                    "createdAt": datetime.now(timezone.utc).isoformat(),
                }
                users.append(user)
                _save(USERS_FILE, users)
            token = secrets.token_urlsafe(32)
            sessions = _load(SESSIONS_FILE, {})
            sessions[token] = {"userId": user["id"]}
            _save(SESSIONS_FILE, sessions)
            self.send_response(200)
            self._send_json_cookies(
                {
                    "token": token,
                    "user": {
                        "id": user["id"],
                        "email": user["email"],
                        "name": user["name"],
                        "plan": user.get("plan", "free"),
                        "provider": "google",
                    },
                },
                token,
            )
            return

        return _json_response(self, {"error": "Not found"}, 404)

    def _send_json_cookies(self, data, token):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Set-Cookie", f"mex_token={token}; Path=/; SameSite=Lax")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _serve_static(self, path: str):
        if path == "/" or path == "":
            path = "/index.html"
        rel = path.lstrip("/").replace("..", "")
        target = ROOT / rel
        if not target.is_file():
            target = ROOT / "index.html"
        content = target.read_bytes()
        ctype = "application/octet-stream"
        if target.suffix == ".html":
            ctype = "text/html; charset=utf-8"
        elif target.suffix == ".css":
            ctype = "text/css; charset=utf-8"
        elif target.suffix == ".js":
            ctype = "application/javascript; charset=utf-8"
        elif target.suffix == ".json":
            ctype = "application/json; charset=utf-8"
        elif target.suffix == ".webmanifest" or target.name == "manifest.json":
            ctype = "application/manifest+json; charset=utf-8"
        elif target.suffix == ".gif":
            ctype = "image/gif"
        elif target.suffix in (".png", ".webp", ".jpg", ".jpeg"):
            ctype = "image/" + target.suffix.lstrip(".")
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)


if __name__ == "__main__":
    print("MEX Pro sunucusu: http://127.0.0.1:%s" % PORT)
    print("Durdurmak icin Ctrl+C")
    HTTPServer(("127.0.0.1", PORT), MexHandler).serve_forever()

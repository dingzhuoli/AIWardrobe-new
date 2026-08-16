import os
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from auth import COOKIE_NAME, hash_password
import main


TEST_PASSWORD = "correct horse battery staple"
TEST_ENV = {
    "ADMIN_USERNAME": "admin",
    "ADMIN_PASSWORD_HASH": hash_password(TEST_PASSWORD, iterations=100_000),
    "ADMIN_SESSION_SECRET": "test-session-secret-that-is-longer-than-thirty-two-characters",
    "ADMIN_COOKIE_SECURE": "false",
}


class AdminAuthTests(unittest.TestCase):
    def setUp(self):
        self.environment = patch.dict(os.environ, TEST_ENV, clear=False)
        self.environment.start()
        self.client = TestClient(main.app)

    def tearDown(self):
        self.client.close()
        self.environment.stop()

    def test_health_and_login_page_assets_remain_public(self):
        self.assertEqual(self.client.get("/health").status_code, 200)
        self.assertNotEqual(self.client.get("/").status_code, 401)

    def test_api_and_uploaded_images_require_login(self):
        self.assertEqual(self.client.get("/api/config").status_code, 401)
        self.assertEqual(self.client.get("/uploads/private.png").status_code, 401)
        self.assertEqual(self.client.get("/docs").status_code, 401)

    def test_login_sets_http_only_cookie_and_unlocks_api(self):
        response = self.client.post(
            "/api/auth/login",
            json={"username": "admin", "password": TEST_PASSWORD},
        )

        self.assertEqual(response.status_code, 200)
        cookie_header = response.headers.get("set-cookie", "").lower()
        self.assertIn(COOKIE_NAME, cookie_header)
        self.assertIn("httponly", cookie_header)
        self.assertIn("samesite=strict", cookie_header)
        self.assertEqual(self.client.get("/api/config").status_code, 200)

    def test_wrong_password_does_not_create_session(self):
        response = self.client.post(
            "/api/auth/login",
            json={"username": "admin", "password": "definitely-wrong"},
        )
        self.assertEqual(response.status_code, 401)
        self.assertNotIn(COOKIE_NAME, response.headers.get("set-cookie", ""))

    def test_logout_invalidates_browser_session(self):
        self.client.post(
            "/api/auth/login",
            json={"username": "admin", "password": TEST_PASSWORD},
        )
        self.assertEqual(self.client.post("/api/auth/logout").status_code, 200)
        self.assertEqual(self.client.get("/api/config").status_code, 401)

    def test_tampered_cookie_is_rejected(self):
        self.client.cookies.set(COOKIE_NAME, "tampered.session")
        self.assertEqual(self.client.get("/api/config").status_code, 401)

    def test_missing_auth_configuration_fails_closed(self):
        with patch.dict(os.environ, {"ADMIN_PASSWORD_HASH": "", "ADMIN_SESSION_SECRET": ""}):
            response = self.client.get("/api/config")
        self.assertEqual(response.status_code, 503)
        self.assertIn("认证", response.json()["detail"])


if __name__ == "__main__":
    unittest.main()

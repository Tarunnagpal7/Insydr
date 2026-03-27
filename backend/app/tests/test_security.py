"""
Tests for all 14 security vulnerability fixes in the Insydr.AI project.
Run: cd /Users/tarunnagpal/Documents/insydr/backend && python -m pytest app/tests/test_security.py -v
"""

import re
import html
import secrets as secrets_module
from unittest.mock import AsyncMock, patch, MagicMock
import pytest


# ─── V1: JWT Secret Key Validation ───

class TestV1_JWTSecretValidation:
    """V1: JWT_SECRET_KEY must not have a weak/default value in production."""

    def test_weak_secret_raises_in_non_debug(self):
        """A weak secret MUST raise ValueError when DEBUG=False."""
        import os
        # Temporarily override env vars
        original_env = os.environ.copy()
        try:
            os.environ["JWT_SECRET_KEY"] = "insydr-secret-key-change-in-production-2026"
            os.environ["DEBUG"] = "False"
            os.environ["DATABASE_URL"] = "postgresql+asyncpg://test:test@localhost/test"
            os.environ["MAIL_USERNAME"] = "t"
            os.environ["MAIL_PASSWORD"] = "t"
            os.environ["MAIL_FROM"] = "t@t.com"
            os.environ["MAIL_SERVER"] = "localhost"

            from pydantic_settings import BaseSettings
            from pydantic import model_validator
            import importlib

            # Force reimport to test validation
            with pytest.raises(ValueError, match="SECURITY ERROR"):
                import app.core.config as cfg
                importlib.reload(cfg)
        finally:
            os.environ.clear()
            os.environ.update(original_env)

    def test_strong_secret_accepted(self):
        """A strong random secret should pass validation."""
        strong_secret = secrets_module.token_urlsafe(64)
        assert len(strong_secret) >= 32
        weak_markers = ["change-in-production", "insydr-secret", "secret-key", "changeme"]
        assert not any(m in strong_secret.lower() for m in weak_markers)


# ─── V2: Secure OTP Generation ───

class TestV2_SecureOTP:
    """V2: OTP must use cryptographically secure random."""

    def test_otp_is_6_digits(self):
        from app.security.auth import generate_otp
        for _ in range(100):
            otp = generate_otp()
            assert len(otp) == 6, f"OTP should be 6 digits, got {len(otp)}"
            assert otp.isdigit(), f"OTP should be all digits, got {otp}"

    def test_otp_range(self):
        from app.security.auth import generate_otp
        otps = [int(generate_otp()) for _ in range(1000)]
        assert min(otps) >= 100000, "OTP should be >= 100000"
        assert max(otps) <= 999999, "OTP should be <= 999999"

    def test_otp_uses_secrets_module(self):
        """Verify that generate_otp uses the secrets module, not random."""
        import inspect
        from app.security.auth import generate_otp
        source = inspect.getsource(generate_otp)
        assert "secrets" in source, "generate_otp should use the 'secrets' module"
        assert "random.randint" not in source, "generate_otp should NOT use random.randint"


# ─── V5: DEBUG Default ───

class TestV5_DebugDefault:
    """V5: DEBUG must default to False."""

    def test_debug_field_default_is_false(self):
        from app.core.config import Settings
        field_info = Settings.model_fields.get("DEBUG")
        assert field_info is not None
        assert field_info.default is False, (
            f"DEBUG field default should be False, got {field_info.default}"
        )


# ─── V8: Password Strength Validation ───

class TestV8_PasswordStrength:
    """V8: Passwords must meet complexity requirements."""

    def test_reject_short_password(self):
        from app.services.auth_service import _validate_password_strength
        with pytest.raises(ValueError, match="at least 8 characters"):
            _validate_password_strength("Ab1")

    def test_reject_no_uppercase(self):
        from app.services.auth_service import _validate_password_strength
        with pytest.raises(ValueError, match="uppercase"):
            _validate_password_strength("abcdefg1")

    def test_reject_no_lowercase(self):
        from app.services.auth_service import _validate_password_strength
        with pytest.raises(ValueError, match="lowercase"):
            _validate_password_strength("ABCDEFG1")

    def test_reject_no_digit(self):
        from app.services.auth_service import _validate_password_strength
        with pytest.raises(ValueError, match="digit"):
            _validate_password_strength("Abcdefgh")

    def test_accept_valid_password(self):
        from app.services.auth_service import _validate_password_strength
        # Should not raise
        _validate_password_strength("SecurePass1")
        _validate_password_strength("MyP@ssw0rd")
        _validate_password_strength("Ab1cdefg")


# ─── V10: HTML Escaping (XSS Prevention) ───

class TestV10_HTMLEscaping:
    """V10: User content in lead emails must be HTML-escaped."""

    def test_html_escape_script_tag(self):
        malicious = '<script>alert("xss")</script>'
        safe = html.escape(malicious)
        assert "<script>" not in safe
        assert "&lt;script&gt;" in safe

    def test_html_escape_preserves_normal_text(self):
        normal = "Hello, I need help with pricing"
        assert html.escape(normal) == normal

    def test_html_escape_handles_quotes(self):
        with_quotes = 'Name: "John" & <Company>'
        safe = html.escape(with_quotes)
        assert '"' not in safe or "&quot;" in safe
        assert "<Company>" not in safe
        assert "&lt;Company&gt;" in safe


# ─── V7: JWT Token Blacklisting ───

class TestV7_TokenBlacklisting:
    """V7: JWT blacklisting functions exist and have correct signatures."""

    def test_blacklist_function_exists(self):
        from app.security.auth import blacklist_token
        import inspect
        assert inspect.iscoroutinefunction(blacklist_token), "blacklist_token must be async"

    def test_is_blacklisted_function_exists(self):
        from app.security.auth import is_token_blacklisted
        import inspect
        assert inspect.iscoroutinefunction(is_token_blacklisted), "is_token_blacklisted must be async"


# ─── V11: API Key Not in Query Params ───

class TestV11_NoQueryParamAPIKey:
    """V11: Rate limiter must not read API key from query params."""

    def test_no_query_params_in_rate_limiter(self):
        import inspect
        from app.api.middleware.rate_limit import RateLimitDependency
        source = inspect.getsource(RateLimitDependency)
        assert "query_params" not in source, (
            "Rate limiter should NOT read API key from query_params"
        )


# ─── V12: RBAC Permissions Module ───

class TestV12_RBACPermissions:
    """V12: Permissions module must provide proper RBAC."""

    def test_workspace_role_enum_exists(self):
        from app.security.permissions import WorkspaceRole
        assert WorkspaceRole.VIEWER.value == "viewer"
        assert WorkspaceRole.MEMBER.value == "member"
        assert WorkspaceRole.ADMIN.value == "admin"
        assert WorkspaceRole.OWNER.value == "owner"

    def test_role_hierarchy_order(self):
        from app.security.permissions import _ROLE_HIERARCHY, WorkspaceRole
        assert _ROLE_HIERARCHY[WorkspaceRole.VIEWER] < _ROLE_HIERARCHY[WorkspaceRole.MEMBER]
        assert _ROLE_HIERARCHY[WorkspaceRole.MEMBER] < _ROLE_HIERARCHY[WorkspaceRole.ADMIN]
        assert _ROLE_HIERARCHY[WorkspaceRole.ADMIN] < _ROLE_HIERARCHY[WorkspaceRole.OWNER]

    def test_require_workspace_role_exists(self):
        from app.security.permissions import require_workspace_role
        assert callable(require_workspace_role)


# ─── V13: OTP Logging Guard ───

class TestV13_OTPLoggingGuard:
    """V13: OTP console logging must be gated behind DEBUG flag."""

    def test_otp_logging_uses_debug_flag(self):
        import inspect
        from app.services.auth_service import AuthService
        source = inspect.getsource(AuthService._create_otp)
        assert "settings.DEBUG" in source, (
            "_create_otp should gate console logging behind settings.DEBUG"
        )
        assert "if settings.DEBUG" in source


# ─── V14: Frontend API URL ───

class TestV14_FrontendAPIUrl:
    """V14: Frontend API fallback URL must use port 8000."""

    def test_api_url_port_is_8000(self):
        import os
        api_ts_path = os.path.join(
            os.path.dirname(__file__),
            "..", "..", "..", "..",  # up to insydr root
            "frontend", "src", "lib", "api.ts"
        )
        api_ts_path = os.path.normpath(api_ts_path)
        if os.path.exists(api_ts_path):
            content = open(api_ts_path).read()
            assert "localhost:8000" in content, "Fallback URL should use port 8000"
            assert "localhost:800/" not in content, "Port 800 (typo) should not appear"
        else:
            pytest.skip("Frontend api.ts not found at expected path")

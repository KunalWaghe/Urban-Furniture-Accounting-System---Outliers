"""
Unit tests for email_service and password reset email generation.
"""

from unittest.mock import patch, MagicMock
from app.services.email_service import send_password_reset_email, send_email
from app.core.config import settings


def test_send_email_skips_when_credentials_not_set():
    """Verify send_email safely skips dispatch without failing when SMTP is not configured."""
    with patch.object(settings, "SMTP_USER", ""), patch.object(settings, "SMTP_PASSWORD", ""):
        result = send_email("test@example.com", "Test Subject", "<p>Hello</p>")
        assert result is False


def test_send_email_success_with_mocked_smtp():
    """Verify send_email connects and sends via smtplib when credentials exist."""
    with patch.object(settings, "SMTP_USER", "myuser@gmail.com"), \
         patch.object(settings, "SMTP_PASSWORD", "mock-app-password"), \
         patch("smtplib.SMTP") as mock_smtp_cls:
        
        mock_server = MagicMock()
        mock_smtp_cls.return_value.__enter__.return_value = mock_server

        result = send_email("recipient@example.com", "Subject", "<p>Content</p>", "Content")

        assert result is True
        mock_server.ehlo.assert_called()
        mock_server.starttls.assert_called_once()
        mock_server.login.assert_called_once_with("myuser@gmail.com", "mock-app-password")
        mock_server.send_message.assert_called_once()


def test_send_password_reset_email_link_formatting():
    """Verify send_password_reset_email generates the correct reset URL format."""
    with patch("app.services.email_service.send_email") as mock_send:
        mock_send.return_value = True
        token = "test-secure-reset-token-12345"
        
        send_password_reset_email("user@example.com", token, recipient_name="Alice")
        
        mock_send.assert_called_once()
        args, kwargs = mock_send.call_args
        to_email, subject, html_body, text_body = args
        
        assert to_email == "user@example.com"
        assert "Reset Your Urban Furniture Password" in subject
        assert f"/reset-password?token={token}" in html_body
        assert f"/reset-password?token={token}" in text_body
        assert "Alice" in html_body

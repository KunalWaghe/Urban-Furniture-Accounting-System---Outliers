"""
Email delivery service using Python smtplib with HTML MIME support.

Designed for transactional emails such as Password Reset and Notifications.
Works out-of-the-box with Gmail SMTP (using an App Password) as well as
services like Brevo, SendGrid, Mailgun, or AWS SES.
"""

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_email(
    to_email: str,
    subject: str,
    html_body: str,
    text_body: Optional[str] = None
) -> bool:
    """
    Send an email via SMTP.
    
    If SMTP_USER or SMTP_PASSWORD are not configured, logs a helpful warning
    and avoids failing the calling request.
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning(
            "[EMAIL SERVICE] SMTP_USER or SMTP_PASSWORD not configured in backend/.env. "
            f"Skipping dispatch to {to_email}."
        )
        return False

    from_email = settings.EMAILS_FROM_EMAIL or settings.SMTP_USER
    from_name = settings.EMAILS_FROM_NAME or "Urban Furniture Accounting"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{from_name} <{from_email}>"
    msg["To"] = to_email

    # Plain text fallback
    if text_body:
        part_text = MIMEText(text_body, "plain", "utf-8")
        msg.attach(part_text)

    # HTML content
    part_html = MIMEText(html_body, "html", "utf-8")
    msg.attach(part_html)

    try:
        # Standard TLS connection (port 587 for Gmail/Brevo)
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)

        logger.info(f"[EMAIL SERVICE] Email successfully sent to {to_email}: '{subject}'")
        return True

    except smtplib.SMTPAuthenticationError as auth_err:
        logger.error(
            f"[EMAIL SERVICE] SMTP Authentication Failed for {settings.SMTP_USER}: {auth_err}. "
            "Please check that your Gmail App Password is correct."
        )
        return False
    except Exception as exc:
        logger.error(f"[EMAIL SERVICE] Failed to send email to {to_email}: {exc}")
        return False


def send_password_reset_email(
    to_email: str,
    reset_token: str,
    recipient_name: Optional[str] = None
) -> bool:
    """
    Send a branded password reset email with direct reset link.
    """
    frontend_base = settings.FRONTEND_URL.rstrip("/")
    reset_link = f"{frontend_base}/reset-password?token={reset_token}"
    greeting_name = recipient_name if recipient_name else "there"

    subject = "Reset Your Urban Furniture Password"

    text_body = f"""Hello {greeting_name},

We received a request to reset your password for the Urban Furniture Accounting System.

To choose a new password, click the link below (valid for 1 hour):
{reset_link}

If you did not request this password reset, please ignore this email. Your account remains secure.

Best regards,
Urban Furniture Accounting System
"""

    html_body = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #0f172a;
      margin: 0;
      padding: 24px;
    }}
    .container {{
      max-width: 560px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }}
    .header {{
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      padding: 32px 24px;
      text-align: center;
      color: #ffffff;
    }}
    .header h1 {{
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.025em;
    }}
    .header p {{
      margin: 6px 0 0 0;
      font-size: 14px;
      opacity: 0.9;
    }}
    .content {{
      padding: 32px 28px;
    }}
    .btn-container {{
      text-align: center;
      margin: 32px 0;
    }}
    .btn {{
      background-color: #0284c7;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 15px;
      font-weight: 600;
      padding: 12px 28px;
      border-radius: 8px;
      display: inline-block;
      box-shadow: 0 2px 4px rgba(2, 132, 199, 0.3);
    }}
    .warning {{
      background-color: #fffbeb;
      border-left: 4px solid #f59e0b;
      padding: 12px 16px;
      font-size: 13px;
      color: #78350f;
      border-radius: 0 6px 6px 0;
      margin: 24px 0;
    }}
    .footer {{
      background-color: #f1f5f9;
      padding: 20px 24px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
    }}
    .fallback-url {{
      word-break: break-all;
      color: #0284c7;
      font-size: 13px;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Urban Furniture</h1>
      <p>Accounting & Enterprise ERP</p>
    </div>
    <div class="content">
      <h2 style="font-size: 18px; margin-top: 0; color: #0f172a;">Password Reset Request</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #334155;">
        Hello <strong>{greeting_name}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #334155;">
        We received a request to reset the password associated with your Urban Furniture account. Click the button below to create a new password:
      </p>
      <div class="btn-container">
        <a href="{reset_link}" class="btn" target="_blank" rel="noopener noreferrer">Reset Password</a>
      </div>
      <div class="warning">
        <strong>Note:</strong> This link will expire in <strong>1 hour</strong>. If you did not make this request, you can safely ignore this email.
      </div>
      <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin-bottom: 4px;">
        If the button above does not work, copy and paste this link into your browser:
      </p>
      <a href="{reset_link}" class="fallback-url">{reset_link}</a>
    </div>
    <div class="footer">
      &copy; 2026 Urban Furniture Accounting System. All rights reserved.
    </div>
  </div>
</body>
</html>
"""

    sent = send_email(to_email, subject, html_body, text_body)

    # In development or if SMTP is not yet active, also log the link to the console for convenience
    print(f"\n[PASSWORD RESET] Recipient: {to_email}")
    print(f"[PASSWORD RESET LINK] {reset_link}\n")

    return sent

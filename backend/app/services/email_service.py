import logging
from pathlib import Path
from typing import List, Optional, Any, Dict
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from jinja2 import Environment, FileSystemLoader, select_autoescape
from app.core.config import settings

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.conf = ConnectionConfig(
            MAIL_USERNAME=settings.MAIL_USERNAME,
            MAIL_PASSWORD=settings.MAIL_PASSWORD,
            MAIL_FROM=settings.MAIL_FROM,
            MAIL_PORT=settings.MAIL_PORT,
            MAIL_SERVER=settings.MAIL_SERVER,
            MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
            MAIL_STARTTLS=settings.MAIL_STARTTLS,
            MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
            USE_CREDENTIALS=settings.USE_CREDENTIALS,
            VALIDATE_CERTS=settings.VALIDATE_CERTS,
            TEMPLATE_FOLDER=Path(__file__).parent.parent / 'templates' / 'email'
        )
        self.fastmail = FastMail(self.conf)
        
        # Initialize Jinja2 environment for manual rendering if needed
        self.template_env = Environment(
            loader=FileSystemLoader(str(self.conf.TEMPLATE_FOLDER)),
            autoescape=select_autoescape(['html', 'xml'])
        )

    async def send_email(
        self,
        subject: str,
        recipients: List[str],
        template_name: str,
        template_body: Dict[str, Any]
    ):
        """
        Send an email using a Jinja2 template.
        """
        message = MessageSchema(
            subject=subject,
            recipients=recipients,
            template_body=template_body,
            subtype=MessageType.html
        )
        
        try:
            await self.fastmail.send_message(message, template_name=template_name)
            logger.info(f"Email sent successfully to {recipients}")
        except Exception as e:
            logger.error(f"Failed to send email to {recipients}: {str(e)}")
            # In production, you might want to re-raise or handle this differently
            # For now, we log the error to avoid crashing the request
            pass

    async def send_verification_email(self, email: str, name: str, otp_code: str):
        await self.send_email(
            subject="Verify your Insydr Account",
            recipients=[email],
            template_name="verification.html",
            template_body={
                "name": name,
                "otp_code": otp_code,
                "expiry_minutes": settings.OTP_EXPIRY_MINUTES
            }
        )

    async def send_password_reset_email(self, email: str, otp_code: str):
        await self.send_email(
            subject="Reset your Insydr Password",
            recipients=[email],
            template_name="reset_password.html",
            template_body={
                "otp_code": otp_code,
                "expiry_minutes": settings.OTP_EXPIRY_MINUTES
            }
        )

    async def send_welcome_email(self, email: str, name: str):
        await self.send_email(
            subject="Welcome to Insydr! 🚀",
            recipients=[email],
            template_name="welcome.html",
            template_body={
                "name": name
            }
        )

    async def send_workspace_created_email(self, email: str, name: str, workspace_name: str, created_at: str, dashboard_url: str):
        message = MessageSchema(
            subject=f"Welcome to {workspace_name} on INSYDR.",
            recipients=[email],
            template_body={
                "name": name,
                "workspace_name": workspace_name,
                "created_at": created_at,
                "dashboard_url": dashboard_url
            },
            subtype=MessageType.html
        )
        await self.fastmail.send_message(message, template_name="workspace_created.html")

    async def send_invitation_email(self, email: str, inviter_name: str, workspace_name: str, invite_url: str):
        message = MessageSchema(
            subject=f"Invitation to join {workspace_name} on INSYDR.",
            recipients=[email],
            template_body={
                "inviter_name": inviter_name,
                "workspace_name": workspace_name,
                "invite_url": invite_url
            },
            subtype=MessageType.html
        )
        await self.fastmail.send_message(message, template_name="invitation.html")

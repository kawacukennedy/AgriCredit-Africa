from typing import List, Optional
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import structlog
from .config import settings

logger = structlog.get_logger()

class EmailService:
    """Service for sending emails"""

    def __init__(self):
        self.smtp_server = settings.SMTP_SERVER
        self.smtp_port = settings.SMTP_PORT
        self.smtp_username = settings.SMTP_USERNAME
        self.smtp_password = settings.SMTP_PASSWORD

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        from_email: Optional[str] = None
    ) -> bool:
        """Send an email"""
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = from_email or self.smtp_username
            msg['To'] = to_email

            # Add text content
            if text_content:
                msg.attach(MIMEText(text_content, 'plain'))

            # Add HTML content
            msg.attach(MIMEText(html_content, 'html'))

            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)

            logger.info("Email sent successfully", to_email=to_email, subject=subject)
            return True

        except Exception as e:
            logger.error("Failed to send email", error=str(e), to_email=to_email)
            return False

    def send_welcome_email(self, to_email: str, user_name: str) -> bool:
        """Send welcome email to new users"""
        subject = "Welcome to AgriCredit - Your Agricultural Finance Partner"

        html_content = f"""
        <html>
        <body>
            <h2>Welcome to AgriCredit, {user_name}!</h2>
            <p>Thank you for joining AgriCredit, your trusted partner in agricultural financing and AI-powered farming solutions.</p>

            <h3>What you can do:</h3>
            <ul>
                <li>Apply for agricultural loans with AI-powered credit scoring</li>
                <li>Get yield predictions for better planning</li>
                <li>Monitor your crops with IoT sensors</li>
                <li>Access carbon credit markets</li>
                <li>Trade agricultural products on our marketplace</li>
            </ul>

            <p>Get started by logging into your dashboard and exploring our features.</p>

            <p>Best regards,<br>The AgriCredit Team</p>
        </body>
        </html>
        """

        text_content = f"""
        Welcome to AgriCredit, {user_name}!

        Thank you for joining AgriCredit, your trusted partner in agricultural financing and AI-powered farming solutions.

        What you can do:
        - Apply for agricultural loans with AI-powered credit scoring
        - Get yield predictions for better planning
        - Monitor your crops with IoT sensors
        - Access carbon credit markets
        - Trade agricultural products on our marketplace

        Get started by logging into your dashboard and exploring our features.

        Best regards,
        The AgriCredit Team
        """

        return self.send_email(to_email, subject, html_content, text_content)

    def send_loan_approval_email(self, to_email: str, user_name: str, loan_amount: float, loan_id: int) -> bool:
        """Send loan approval notification"""
        subject = f"Good News! Your AgriCredit Loan Has Been Approved"

        html_content = f"""
        <html>
        <body>
            <h2>Congratulations, {user_name}!</h2>
            <p>Your loan application for ${loan_amount:,.2f} has been approved!</p>

            <p><strong>Loan Details:</strong></p>
            <ul>
                <li>Loan ID: {loan_id}</li>
                <li>Amount: ${loan_amount:,.2f}</li>
                <li>Status: Approved</li>
            </ul>

            <p>The funds will be disbursed to your account within 2-3 business days. You can track the status in your dashboard.</p>

            <p>If you have any questions, please contact our support team.</p>

            <p>Best regards,<br>The AgriCredit Team</p>
        </body>
        </html>
        """

        return self.send_email(to_email, subject, html_content)

    def send_payment_reminder_email(self, to_email: str, user_name: str, amount_due: float, due_date: str) -> bool:
        """Send payment reminder"""
        subject = f"Payment Reminder - AgriCredit Loan Due Soon"

        html_content = f"""
        <html>
        <body>
            <h2>Payment Reminder</h2>
            <p>Dear {user_name},</p>

            <p>This is a reminder that your loan payment of ${amount_due:,.2f} is due on {due_date}.</p>

            <p>Please ensure timely payment to avoid any late fees and maintain your good standing with AgriCredit.</p>

            <p>You can make your payment through:
            <ul>
                <li>Mobile money transfer</li>
                <li>Bank transfer</li>
                <li>Your AgriCredit dashboard</li>
            </ul>

            <p>Thank you for your continued partnership.</p>

            <p>Best regards,<br>The AgriCredit Team</p>
        </body>
        </html>
        """

        return self.send_email(to_email, subject, html_content)

    def send_marketplace_notification_email(self, to_email: str, user_name: str, listing_title: str, action: str) -> bool:
        """Send marketplace activity notification"""
        subject = f"Marketplace Update - {listing_title}"

        actions = {
            "sold": "has been sold",
            "expired": "has expired",
            "new_offer": "has received a new offer"
        }

        html_content = f"""
        <html>
        <body>
            <h2>Marketplace Update</h2>
            <p>Dear {user_name},</p>

            <p>Your listing "{listing_title}" {actions.get(action, 'has been updated')}.</p>

            <p>Please check your dashboard for more details.</p>

            <p>Best regards,<br>The AgriCredit Team</p>
        </body>
        </html>
        """

        return self.send_email(to_email, subject, html_content)

# Global email service instance
email_service = EmailService()
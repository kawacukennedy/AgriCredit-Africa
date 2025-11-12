import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from .config import settings

class EmailService:
    def __init__(self):
        self.smtp_server = settings.SMTP_SERVER
        self.smtp_port = settings.SMTP_PORT
        self.username = settings.SMTP_USERNAME
        self.password = settings.SMTP_PASSWORD
        self.from_email = settings.EMAIL_FROM

    def send_email(self, to_email: str, subject: str, body: str, html_body: Optional[str] = None):
        """Send email"""
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = self.from_email
            msg['To'] = to_email
            msg['Subject'] = subject

            # Add text body
            text_part = MIMEText(body, 'plain')
            msg.attach(text_part)

            # Add HTML body if provided
            if html_body:
                html_part = MIMEText(html_body, 'html')
                msg.attach(html_part)

            # Send email
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.username, self.password)
            server.sendmail(self.from_email, to_email, msg.as_string())
            server.quit()

            return True
        except Exception as e:
            print(f"Failed to send email: {e}")
            return False

    def send_welcome_email(self, to_email: str, user_name: str):
        """Send welcome email to new user"""
        subject = "Welcome to AgriCredit Africa!"
        body = f"""
        Dear {user_name},

        Welcome to AgriCredit Africa! We're excited to have you join our platform.

        AgriCredit is your gateway to decentralized microcredit, AI-powered marketplace,
        and sustainable agriculture practices across Africa.

        Get started by:
        1. Connecting your wallet
        2. Completing your farmer profile
        3. Exploring loan opportunities
        4. Joining the marketplace

        If you have any questions, feel free to reach out to our support team.

        Best regards,
        The AgriCredit Team
        """

        html_body = f"""
        <html>
        <body>
            <h2>Welcome to AgriCredit Africa, {user_name}!</h2>
            <p>We're excited to have you join our platform for decentralized microcredit and sustainable agriculture.</p>
            <h3>Get Started:</h3>
            <ol>
                <li>Connect your wallet</li>
                <li>Complete your farmer profile</li>
                <li>Explore loan opportunities</li>
                <li>Join the marketplace</li>
            </ol>
            <p>If you have questions, contact our support team.</p>
            <p>Best regards,<br>The AgriCredit Team</p>
        </body>
        </html>
        """

        return self.send_email(to_email, subject, body, html_body)

    def send_loan_approved_email(self, to_email: str, user_name: str, loan_amount: float):
        """Send loan approval notification"""
        subject = f"Your AgriCredit Loan of ${loan_amount} Has Been Approved!"
        body = f"""
        Dear {user_name},

        Congratulations! Your loan application for ${loan_amount} has been approved.

        Your funds will be disbursed to your connected wallet shortly.
        You can track your loan status in your dashboard.

        Remember to make timely repayments to maintain your credit score.

        Best regards,
        The AgriCredit Team
        """

        return self.send_email(to_email, subject, body)

    def send_payment_reminder_email(self, to_email: str, user_name: str, amount_due: float, due_date: str):
        """Send payment reminder"""
        subject = f"Payment Reminder - AgriCredit Loan Due {due_date}"
        body = f"""
        Dear {user_name},

        This is a reminder that your loan payment of ${amount_due} is due on {due_date}.

        Please ensure timely payment to avoid penalties and maintain your credit score.

        You can make payments through your dashboard or connected wallet.

        Best regards,
        The AgriCredit Team
        """

        return self.send_email(to_email, subject, body)

# Global email service instance
email_service = EmailService()
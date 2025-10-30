from celery import Celery
from typing import Dict, Any, Optional
import structlog
from datetime import datetime, timedelta
import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from .config import settings
from .cache import cache
from .email import email_service
from ..database.config import get_db
from ..database.models import User, SensorReading, Loan, Notification

logger = structlog.get_logger()

# Initialize Celery
celery_app = Celery(
    "agricredit",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.core.tasks"]
)

# Configure Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

# Initialize APScheduler for periodic tasks
scheduler = AsyncIOScheduler()

@celery_app.task(bind=True)
def process_sensor_data_task(self, device_id: int, reading_id: int):
    """Celery task to process sensor data"""
    try:
        logger.info("Processing sensor data", device_id=device_id, reading_id=reading_id)

        # Get database session
        db = next(get_db())

        # Get sensor reading
        reading = db.query(SensorReading).filter(SensorReading.id == reading_id).first()
        if not reading:
            logger.error("Sensor reading not found", reading_id=reading_id)
            return

        # Perform AI analysis
        # This would integrate with your AI models
        analysis_result = {
            "reading_id": reading_id,
            "device_id": device_id,
            "analysis": "completed",
            "timestamp": datetime.utcnow().isoformat()
        }

        # Store analysis result (you might want to create an Analysis model)
        logger.info("Sensor data analysis completed", reading_id=reading_id, result=analysis_result)

        return analysis_result

    except Exception as e:
        logger.error("Sensor data processing failed", error=str(e), device_id=device_id, reading_id=reading_id)
        raise self.retry(countdown=60, max_retries=3)

@celery_app.task(bind=True)
def send_notification_task(self, user_id: int, title: str, message: str, notification_type: str = "info"):
    """Celery task to send notifications"""
    try:
        logger.info("Sending notification", user_id=user_id, title=title, type=notification_type)

        db = next(get_db())

        # Create notification
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=notification_type
        )

        db.add(notification)
        db.commit()

        # Invalidate user notification cache
        cache.invalidate_user_cache(user_id)

        # Send email notification if needed
        user = db.query(User).filter(User.id == user_id).first()
        if user and user.email:
            try:
                email_service.send_notification_email(
                    user.email,
                    user.full_name or user.username,
                    title,
                    message
                )
            except Exception as e:
                logger.error("Failed to send email notification", error=str(e), user_id=user_id)

        logger.info("Notification sent successfully", user_id=user_id, notification_id=notification.id)

    except Exception as e:
        logger.error("Notification sending failed", error=str(e), user_id=user_id)
        raise self.retry(countdown=30, max_retries=3)

@celery_app.task(bind=True)
def update_oracle_feeds_task(self, device_id: int, reading_id: int):
    """Celery task to update oracle feeds"""
    try:
        logger.info("Updating oracle feeds", device_id=device_id, reading_id=reading_id)

        # This would integrate with Chainlink oracles
        # For now, just log the update
        oracle_update = {
            "device_id": device_id,
            "reading_id": reading_id,
            "status": "oracle_updated",
            "timestamp": datetime.utcnow().isoformat()
        }

        logger.info("Oracle feeds updated", oracle_update=oracle_update)

        return oracle_update

    except Exception as e:
        logger.error("Oracle feed update failed", error=str(e), device_id=device_id, reading_id=reading_id)
        raise self.retry(countdown=120, max_retries=5)

@celery_app.task(bind=True)
def process_loan_application_task(self, loan_id: int):
    """Celery task to process loan applications"""
    try:
        logger.info("Processing loan application", loan_id=loan_id)

        db = next(get_db())

        loan = db.query(Loan).filter(Loan.id == loan_id).first()
        if not loan:
            logger.error("Loan not found", loan_id=loan_id)
            return

        # Perform automated loan processing
        # This could include credit score checks, risk assessment, etc.

        # For now, just approve loans under $1000 automatically
        if loan.amount <= 1000 and loan.status == "pending":
            loan.status = "approved"
            loan.approved_at = datetime.utcnow()

            # Send notification
            send_notification_task.delay(
                loan.user_id,
                "Loan Approved",
                f"Your loan application for ${loan.amount} has been approved.",
                "success"
            )

            db.commit()
            logger.info("Loan auto-approved", loan_id=loan_id)

        return {"loan_id": loan_id, "status": loan.status}

    except Exception as e:
        logger.error("Loan processing failed", error=str(e), loan_id=loan_id)
        raise self.retry(countdown=300, max_retries=2)

@celery_app.task(bind=True)
def generate_daily_reports_task(self):
    """Celery task to generate daily reports"""
    try:
        logger.info("Generating daily reports")

        db = next(get_db())

        # Generate various daily statistics
        today = datetime.utcnow().date()

        # User registrations today
        new_users = db.query(User).filter(
            User.created_at >= today,
            User.created_at < today + timedelta(days=1)
        ).count()

        # Loans processed today
        new_loans = db.query(Loan).filter(
            Loan.created_at >= today,
            Loan.created_at < today + timedelta(days=1)
        ).count()

        # Sensor readings today
        sensor_readings = db.query(SensorReading).filter(
            SensorReading.timestamp >= today,
            SensorReading.timestamp < today + timedelta(days=1)
        ).count()

        report = {
            "date": today.isoformat(),
            "new_users": new_users,
            "new_loans": new_loans,
            "sensor_readings": sensor_readings,
            "generated_at": datetime.utcnow().isoformat()
        }

        logger.info("Daily report generated", report=report)

        # Store report (you might want to create a Reports model)
        # For now, just cache it
        cache.set_analytics_data("daily_report", today.isoformat(), report, ttl=86400)

        return report

    except Exception as e:
        logger.error("Daily report generation failed", error=str(e))
        raise

@celery_app.task(bind=True)
def cleanup_expired_data_task(self):
    """Celery task to cleanup expired data"""
    try:
        logger.info("Starting data cleanup")

        db = next(get_db())

        # Delete old sensor readings (older than 90 days)
        cutoff_date = datetime.utcnow() - timedelta(days=90)
        deleted_readings = db.query(SensorReading).filter(
            SensorReading.timestamp < cutoff_date
        ).delete()

        # Delete old notifications (older than 30 days)
        cutoff_date = datetime.utcnow() - timedelta(days=30)
        deleted_notifications = db.query(Notification).filter(
            Notification.created_at < cutoff_date,
            Notification.is_read == True
        ).delete()

        db.commit()

        cleanup_result = {
            "deleted_readings": deleted_readings,
            "deleted_notifications": deleted_notifications,
            "cleanup_timestamp": datetime.utcnow().isoformat()
        }

        logger.info("Data cleanup completed", cleanup_result=cleanup_result)

        return cleanup_result

    except Exception as e:
        logger.error("Data cleanup failed", error=str(e))
        raise

# APScheduler periodic tasks
async def schedule_periodic_tasks():
    """Schedule periodic tasks using APScheduler"""

    # Daily reports at 6 AM UTC
    scheduler.add_job(
        generate_daily_reports_task.delay,
        trigger=CronTrigger(hour=6, minute=0),
        id="daily_reports",
        name="Generate Daily Reports",
        replace_existing=True
    )

    # Data cleanup daily at 2 AM UTC
    scheduler.add_job(
        cleanup_expired_data_task.delay,
        trigger=CronTrigger(hour=2, minute=0),
        id="data_cleanup",
        name="Cleanup Expired Data",
        replace_existing=True
    )

    # Start the scheduler
    if not scheduler.running:
        scheduler.start()

# Task helper functions
def process_sensor_data_async(device_id: int, reading_id: int):
    """Helper to queue sensor data processing"""
    return process_sensor_data_task.delay(device_id, reading_id)

def send_notification_async(user_id: int, title: str, message: str, notification_type: str = "info"):
    """Helper to queue notification sending"""
    return send_notification_task.delay(user_id, title, message, notification_type)

def update_oracle_feeds_async(device_id: int, reading_id: int):
    """Helper to queue oracle feed updates"""
    return update_oracle_feeds_task.delay(device_id, reading_id)

def process_loan_application_async(loan_id: int):
    """Helper to queue loan processing"""
    return process_loan_application_task.delay(loan_id)

# Initialize periodic tasks when the module is imported
try:
    asyncio.create_task(schedule_periodic_tasks())
except RuntimeError:
    # Handle case where event loop is not running
    pass
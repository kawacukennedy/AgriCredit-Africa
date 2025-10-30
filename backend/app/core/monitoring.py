from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from fastapi import Request, Response
from fastapi.responses import PlainTextResponse
import time
import structlog
from typing import Callable
import psutil
import os

logger = structlog.get_logger()

# Prometheus metrics
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status_code']
)

REQUEST_LATENCY = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency',
    ['method', 'endpoint']
)

ACTIVE_CONNECTIONS = Gauge(
    'active_connections',
    'Number of active connections'
)

DB_CONNECTIONS = Gauge(
    'db_connections_active',
    'Number of active database connections'
)

CACHE_HITS = Counter(
    'cache_hits_total',
    'Total cache hits'
)

CACHE_MISSES = Counter(
    'cache_misses_total',
    'Total cache misses'
)

AI_MODEL_REQUESTS = Counter(
    'ai_model_requests_total',
    'Total AI model requests',
    ['model_type', 'status']
)

SENSOR_READINGS_PROCESSED = Counter(
    'sensor_readings_processed_total',
    'Total sensor readings processed'
)

BLOCKCHAIN_TRANSACTIONS = Counter(
    'blockchain_transactions_total',
    'Total blockchain transactions',
    ['contract_type', 'transaction_type']
)

SYSTEM_CPU_USAGE = Gauge(
    'system_cpu_usage_percent',
    'System CPU usage percentage'
)

SYSTEM_MEMORY_USAGE = Gauge(
    'system_memory_usage_percent',
    'System memory usage percentage'
)

class MonitoringMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        start_time = time.time()

        # Extract request info
        method = scope.get("method", "UNKNOWN")
        path = scope.get("path", "/")

        # Create a custom response handler
        response_started = False
        response_status = 200

        async def send_wrapper(message):
            nonlocal response_started, response_status

            if message["type"] == "http.response.start":
                response_started = True
                response_status = message["status"]

            await send(message)

        # Process the request
        await self.app(scope, receive, send_wrapper)

        # Record metrics after response
        if response_started:
            duration = time.time() - start_time

            # Record request metrics
            REQUEST_COUNT.labels(
                method=method,
                endpoint=path,
                status_code=str(response_status)
            ).inc()

            REQUEST_LATENCY.labels(
                method=method,
                endpoint=path
            ).observe(duration)

            # Log slow requests
            if duration > 1.0:  # More than 1 second
                logger.warning(
                    "Slow request detected",
                    method=method,
                    path=path,
                    duration=f"{duration:.3f}s",
                    status_code=response_status
                )

def update_system_metrics():
    """Update system-level metrics"""
    try:
        # CPU usage
        cpu_percent = psutil.cpu_percent(interval=1)
        SYSTEM_CPU_USAGE.set(cpu_percent)

        # Memory usage
        memory = psutil.virtual_memory()
        SYSTEM_MEMORY_USAGE.set(memory.percent)

    except Exception as e:
        logger.error("Failed to update system metrics", error=str(e))

def record_cache_hit():
    """Record a cache hit"""
    CACHE_HITS.inc()

def record_cache_miss():
    """Record a cache miss"""
    CACHE_MISSES.inc()

def record_ai_model_request(model_type: str, success: bool = True):
    """Record an AI model request"""
    status = "success" if success else "failure"
    AI_MODEL_REQUESTS.labels(model_type=model_type, status=status).inc()

def record_sensor_reading_processed():
    """Record a processed sensor reading"""
    SENSOR_READINGS_PROCESSED.inc()

def record_blockchain_transaction(contract_type: str, transaction_type: str):
    """Record a blockchain transaction"""
    BLOCKCHAIN_TRANSACTIONS.labels(
        contract_type=contract_type,
        transaction_type=transaction_type
    ).inc()

async def metrics_endpoint():
    """Prometheus metrics endpoint"""
    try:
        # Update system metrics before returning
        update_system_metrics()

        # Generate latest metrics
        output = generate_latest()
        return PlainTextResponse(
            output.decode('utf-8'),
            media_type=CONTENT_TYPE_LATEST
        )
    except Exception as e:
        logger.error("Failed to generate metrics", error=str(e))
        return PlainTextResponse(
            "# Error generating metrics\n",
            media_type=CONTENT_TYPE_LATEST
        )

def get_health_status():
    """Get comprehensive health status"""
    try:
        # System health
        cpu_percent = psutil.cpu_percent()
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')

        # Process health
        process = psutil.Process(os.getpid())
        process_memory = process.memory_info()
        process_cpu = process.cpu_percent()

        health_data = {
            "status": "healthy",
            "timestamp": time.time(),
            "system": {
                "cpu_percent": cpu_percent,
                "memory_percent": memory.percent,
                "memory_used_gb": memory.used / (1024**3),
                "memory_total_gb": memory.total / (1024**3),
                "disk_percent": disk.percent,
                "disk_free_gb": disk.free / (1024**3)
            },
            "process": {
                "cpu_percent": process_cpu,
                "memory_mb": process_memory.rss / (1024**2),
                "threads": process.num_threads(),
                "open_files": len(process.open_files())
            },
            "services": {
                "database": check_database_health(),
                "redis": check_redis_health(),
                "ipfs": check_ipfs_health(),
                "blockchain": check_blockchain_health()
            }
        }

        # Determine overall health
        if (cpu_percent > 90 or memory.percent > 90 or
            not all(health_data["services"].values())):
            health_data["status"] = "unhealthy"

        return health_data

    except Exception as e:
        logger.error("Health check failed", error=str(e))
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": time.time()
        }

def check_database_health():
    """Check database connectivity"""
    try:
        from ..database.config import engine
        from sqlalchemy import text

        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False

def check_redis_health():
    """Check Redis connectivity"""
    try:
        from .cache import cache
        return cache.redis_client.ping()
    except Exception:
        return False

def check_ipfs_health():
    """Check IPFS connectivity"""
    try:
        from .ipfs import ipfs_service
        # Simple check - try to get IPFS version
        client = ipfs_service._get_client()
        client.version()
        return True
    except Exception:
        return False

def check_blockchain_health():
    """Check blockchain connectivity"""
    try:
        # This would check Web3 connectivity
        # For now, return True as placeholder
        return True
    except Exception:
        return False

# Performance monitoring decorator
def monitor_performance(func: Callable):
    """Decorator to monitor function performance"""
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = await func(*args, **kwargs)
            duration = time.time() - start_time

            # Log slow operations
            if duration > 0.1:  # More than 100ms
                logger.info(
                    "Slow operation detected",
                    function=func.__name__,
                    duration=f"{duration:.3f}s"
                )

            return result
        except Exception as e:
            duration = time.time() - start_time
            logger.error(
                "Function execution failed",
                function=func.__name__,
                duration=f"{duration:.3f}s",
                error=str(e)
            )
            raise

    return wrapper
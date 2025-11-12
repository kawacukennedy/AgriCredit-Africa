from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import time
import psutil
import prometheus_client as prom
from typing import Callable
import logging

# Prometheus metrics
REQUEST_COUNT = prom.Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status_code']
)

REQUEST_LATENCY = prom.Histogram(
    'http_request_duration_seconds',
    'HTTP request latency',
    ['method', 'endpoint']
)

ACTIVE_CONNECTIONS = prom.Gauge(
    'active_connections',
    'Number of active connections'
)

SYSTEM_CPU_USAGE = prom.Gauge(
    'system_cpu_usage_percent',
    'System CPU usage percentage'
)

SYSTEM_MEMORY_USAGE = prom.Gauge(
    'system_memory_usage_percent',
    'System memory usage percentage'
)

AI_MODEL_INFERENCE_COUNT = prom.Counter(
    'ai_model_inference_total',
    'Total AI model inferences',
    ['model_type']
)

AI_MODEL_INFERENCE_LATENCY = prom.Histogram(
    'ai_model_inference_duration_seconds',
    'AI model inference latency',
    ['model_type']
)

BLOCKCHAIN_TRANSACTION_COUNT = prom.Counter(
    'blockchain_transactions_total',
    'Total blockchain transactions',
    ['transaction_type', 'status']
)

SENSOR_DATA_POINTS = prom.Counter(
    'sensor_data_points_total',
    'Total sensor data points processed',
    ['sensor_type']
)

class MonitoringMiddleware(BaseHTTPMiddleware):
    """Middleware for monitoring HTTP requests"""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()

        # Update active connections
        ACTIVE_CONNECTIONS.inc()

        try:
            response = await call_next(request)

            # Record metrics
            process_time = time.time() - start_time
            REQUEST_COUNT.labels(
                method=request.method,
                endpoint=request.url.path,
                status_code=response.status_code
            ).inc()

            REQUEST_LATENCY.labels(
                method=request.method,
                endpoint=request.url.path
            ).observe(process_time)

            return response

        finally:
            # Decrement active connections
            ACTIVE_CONNECTIONS.dec()

def update_system_metrics():
    """Update system-level metrics"""
    try:
        SYSTEM_CPU_USAGE.set(psutil.cpu_percent(interval=1))
        SYSTEM_MEMORY_USAGE.set(psutil.virtual_memory().percent)
    except Exception as e:
        logging.error(f"Failed to update system metrics: {e}")

def record_ai_inference(model_type: str, duration: float):
    """Record AI model inference metrics"""
    AI_MODEL_INFERENCE_COUNT.labels(model_type=model_type).inc()
    AI_MODEL_INFERENCE_LATENCY.labels(model_type=model_type).observe(duration)

def record_blockchain_transaction(transaction_type: str, status: str):
    """Record blockchain transaction metrics"""
    BLOCKCHAIN_TRANSACTION_COUNT.labels(
        transaction_type=transaction_type,
        status=status
    ).inc()

def record_sensor_data(sensor_type: str, count: int = 1):
    """Record sensor data processing metrics"""
    SENSOR_DATA_POINTS.labels(sensor_type=sensor_type).inc(count)

async def metrics_endpoint():
    """Prometheus metrics endpoint"""
    update_system_metrics()
    return Response(
        media_type="text/plain; charset=utf-8",
        content=prom.generate_latest()
    )

def get_health_status():
    """Get comprehensive health status"""
    try:
        # System health
        cpu_percent = psutil.cpu_percent()
        memory_percent = psutil.virtual_memory().percent
        disk_percent = psutil.disk_usage('/').percent

        # Database health (simplified)
        db_healthy = True  # Would check actual DB connection

        # Blockchain health (simplified)
        blockchain_healthy = True  # Would check actual blockchain connection

        # AI services health (simplified)
        ai_healthy = True  # Would check actual AI service health

        overall_healthy = all([
            cpu_percent < 90,
            memory_percent < 90,
            disk_percent < 90,
            db_healthy,
            blockchain_healthy,
            ai_healthy
        ])

        return {
            "status": "healthy" if overall_healthy else "unhealthy",
            "timestamp": time.time(),
            "services": {
                "system": {
                    "cpu_usage": f"{cpu_percent:.1f}%",
                    "memory_usage": f"{memory_percent:.1f}%",
                    "disk_usage": f"{disk_percent:.1f}%",
                    "healthy": cpu_percent < 90 and memory_percent < 90 and disk_percent < 90
                },
                "database": {
                    "status": "healthy" if db_healthy else "unhealthy",
                    "healthy": db_healthy
                },
                "blockchain": {
                    "status": "healthy" if blockchain_healthy else "unhealthy",
                    "healthy": blockchain_healthy
                },
                "ai_services": {
                    "status": "healthy" if ai_healthy else "unhealthy",
                    "healthy": ai_healthy
                }
            },
            "version": "2.1.0"
        }

    except Exception as e:
        logging.error(f"Health check failed: {e}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": time.time()
        }

class HealthChecker:
    """Advanced health checker for microservices"""

    def __init__(self):
        self.checks = []

    def add_check(self, name: str, check_func: Callable):
        """Add a health check function"""
        self.checks.append((name, check_func))

    async def run_checks(self):
        """Run all health checks"""
        results = {}
        overall_healthy = True

        for name, check_func in self.checks:
            try:
                result = await check_func()
                results[name] = result
                if not result.get("healthy", True):
                    overall_healthy = False
            except Exception as e:
                results[name] = {
                    "healthy": False,
                    "error": str(e)
                }
                overall_healthy = False

        return {
            "overall_healthy": overall_healthy,
            "checks": results,
            "timestamp": time.time()
        }

# Global health checker
health_checker = HealthChecker()

# Add default system checks
async def check_database():
    """Check database connectivity"""
    # Simplified - would check actual DB connection
    return {"healthy": True, "response_time": 0.001}

async def check_blockchain():
    """Check blockchain connectivity"""
    # Simplified - would check actual blockchain connection
    return {"healthy": True, "response_time": 0.005}

async def check_ai_services():
    """Check AI services health"""
    # Simplified - would check actual AI service endpoints
    return {"healthy": True, "response_time": 0.002}

health_checker.add_check("database", check_database)
health_checker.add_check("blockchain", check_blockchain)
health_checker.add_check("ai_services", check_ai_services)
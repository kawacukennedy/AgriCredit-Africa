from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List, Set
import json
import asyncio
import structlog
from datetime import datetime

logger = structlog.get_logger()

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.user_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int, channel: str = "general"):
        await websocket.accept()

        if channel not in self.active_connections:
            self.active_connections[channel] = []
        self.active_connections[channel].append(websocket)

        if user_id not in self.user_connections:
            self.user_connections[user_id] = set()
        self.user_connections[user_id].add(websocket)

        logger.info("WebSocket connected", user_id=user_id, channel=channel)

    def disconnect(self, websocket: WebSocket, user_id: int, channel: str = "general"):
        if channel in self.active_connections:
            self.active_connections[channel].remove(websocket)
            if not self.active_connections[channel]:
                del self.active_connections[channel]

        if user_id in self.user_connections:
            self.user_connections[user_id].discard(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]

        logger.info("WebSocket disconnected", user_id=user_id, channel=channel)

    async def send_personal_message(self, message: dict, user_id: int):
        """Send message to specific user"""
        if user_id in self.user_connections:
            for websocket in self.user_connections[user_id]:
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    logger.error("Failed to send personal message", error=str(e), user_id=user_id)

    async def broadcast_to_channel(self, message: dict, channel: str = "general"):
        """Broadcast message to all users in a channel"""
        if channel in self.active_connections:
            for websocket in self.active_connections[channel]:
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    logger.error("Failed to broadcast to channel", error=str(e), channel=channel)

    async def broadcast_to_all(self, message: dict):
        """Broadcast message to all connected users"""
        for channel, connections in self.active_connections.items():
            for websocket in connections:
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    logger.error("Failed to broadcast to all", error=str(e))

# Global connection manager
manager = ConnectionManager()

async def websocket_endpoint(websocket: WebSocket, user_id: int, channel: str = "general"):
    """WebSocket endpoint for real-time communication"""
    await manager.connect(websocket, user_id, channel)

    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)

                # Handle different message types
                if message.get("type") == "ping":
                    await websocket.send_json({"type": "pong", "timestamp": datetime.utcnow().isoformat()})
                elif message.get("type") == "subscribe":
                    # Handle subscription to specific topics
                    topic = message.get("topic", "general")
                    await manager.connect(websocket, user_id, topic)
                    await websocket.send_json({"type": "subscribed", "topic": topic})
                elif message.get("type") == "unsubscribe":
                    # Handle unsubscription from topics
                    topic = message.get("topic", "general")
                    manager.disconnect(websocket, user_id, topic)
                    await websocket.send_json({"type": "unsubscribed", "topic": topic})
                else:
                    # Echo back the message for now
                    await websocket.send_json({
                        "type": "echo",
                        "data": message,
                        "timestamp": datetime.utcnow().isoformat()
                    })

            except json.JSONDecodeError:
                await websocket.send_json({"error": "Invalid JSON format"})

    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id, channel)
    except Exception as e:
        logger.error("WebSocket error", error=str(e), user_id=user_id, channel=channel)
        manager.disconnect(websocket, user_id, channel)

# Notification broadcasting functions
async def broadcast_loan_update(loan_id: int, status: str, user_id: int):
    """Broadcast loan status updates"""
    message = {
        "type": "loan_update",
        "loan_id": loan_id,
        "status": status,
        "timestamp": datetime.utcnow().isoformat()
    }
    await manager.send_personal_message(message, user_id)
    await manager.broadcast_to_channel(message, "loans")

async def broadcast_sensor_alert(device_id: str, alert_type: str, message: str, user_id: int):
    """Broadcast sensor alerts"""
    alert_message = {
        "type": "sensor_alert",
        "device_id": device_id,
        "alert_type": alert_type,
        "message": message,
        "timestamp": datetime.utcnow().isoformat()
    }
    await manager.send_personal_message(alert_message, user_id)
    await manager.broadcast_to_channel(alert_message, "sensors")

async def broadcast_marketplace_update(listing_id: int, action: str, user_id: int):
    """Broadcast marketplace updates"""
    update_message = {
        "type": "marketplace_update",
        "listing_id": listing_id,
        "action": action,
        "timestamp": datetime.utcnow().isoformat()
    }
    await manager.send_personal_message(update_message, user_id)
    await manager.broadcast_to_channel(update_message, "marketplace")

async def broadcast_governance_update(proposal_id: int, action: str):
    """Broadcast governance updates"""
    governance_message = {
        "type": "governance_update",
        "proposal_id": proposal_id,
        "action": action,
        "timestamp": datetime.utcnow().isoformat()
    }
    await manager.broadcast_to_channel(governance_message, "governance")
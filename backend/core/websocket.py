from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List, Set
import json
import asyncio
from datetime import datetime

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}
        self.user_channels: Dict[int, Set[str]] = {}

    async def connect(self, websocket: WebSocket, user_id: int, channel: str = "general"):
        """Connect a user to a WebSocket channel"""
        await websocket.accept()

        if user_id not in self.active_connections:
            self.active_connections[user_id] = websocket

        if user_id not in self.user_channels:
            self.user_channels[user_id] = set()
        self.user_channels[user_id].add(channel)

        # Send welcome message
        await self.send_personal_message({
            "type": "connection_established",
            "message": f"Connected to channel: {channel}",
            "timestamp": datetime.utcnow().isoformat()
        }, user_id)

    def disconnect(self, user_id: int, channel: str = "general"):
        """Disconnect a user from a WebSocket channel"""
        if user_id in self.user_channels:
            self.user_channels[user_id].discard(channel)
            if not self.user_channels[user_id]:
                del self.user_channels[user_id]
                if user_id in self.active_connections:
                    del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: int):
        """Send message to specific user"""
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(message)
            except Exception as e:
                print(f"Failed to send message to user {user_id}: {e}")
                self.disconnect(user_id)

    async def broadcast_to_channel(self, message: dict, channel: str):
        """Broadcast message to all users in a channel"""
        disconnected_users = []

        for user_id, channels in self.user_channels.items():
            if channel in channels:
                try:
                    await self.active_connections[user_id].send_json(message)
                except Exception as e:
                    print(f"Failed to send to user {user_id}: {e}")
                    disconnected_users.append((user_id, channel))

        # Clean up disconnected users
        for user_id, channel in disconnected_users:
            self.disconnect(user_id, channel)

    async def broadcast_to_all(self, message: dict):
        """Broadcast message to all connected users"""
        disconnected_users = []

        for user_id, websocket in self.active_connections.items():
            try:
                await websocket.send_json(message)
            except Exception as e:
                print(f"Failed to send to user {user_id}: {e}")
                disconnected_users.append(user_id)

        # Clean up disconnected users
        for user_id in disconnected_users:
            if user_id in self.active_connections:
                del self.active_connections[user_id]
            if user_id in self.user_channels:
                del self.user_channels[user_id]

# Global connection manager
manager = ConnectionManager()

async def websocket_endpoint(websocket: WebSocket, user_id: int, channel: str = "general"):
    """WebSocket endpoint handler"""
    await manager.connect(websocket, user_id, channel)

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()

            # Handle different message types
            message_type = data.get("type", "unknown")

            if message_type == "ping":
                await manager.send_personal_message({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat()
                }, user_id)

            elif message_type == "subscribe":
                new_channel = data.get("channel")
                if new_channel:
                    await manager.connect(websocket, user_id, new_channel)
                    await manager.send_personal_message({
                        "type": "subscribed",
                        "channel": new_channel,
                        "timestamp": datetime.utcnow().isoformat()
                    }, user_id)

            elif message_type == "unsubscribe":
                old_channel = data.get("channel")
                if old_channel:
                    manager.disconnect(user_id, old_channel)
                    await manager.send_personal_message({
                        "type": "unsubscribed",
                        "channel": old_channel,
                        "timestamp": datetime.utcnow().isoformat()
                    }, user_id)

            elif message_type == "broadcast":
                # Allow broadcasting to channel (with proper authorization in production)
                await manager.broadcast_to_channel({
                    "type": "broadcast",
                    "from_user": user_id,
                    "message": data.get("message"),
                    "timestamp": datetime.utcnow().isoformat()
                }, channel)

    except WebSocketDisconnect:
        manager.disconnect(user_id, channel)
    except Exception as e:
        print(f"WebSocket error for user {user_id}: {e}")
        manager.disconnect(user_id, channel)

# Notification functions
async def notify_user(user_id: int, notification_type: str, data: dict):
    """Send notification to specific user"""
    message = {
        "type": "notification",
        "notification_type": notification_type,
        "data": data,
        "timestamp": datetime.utcnow().isoformat()
    }
    await manager.send_personal_message(message, user_id)

async def notify_channel(channel: str, notification_type: str, data: dict):
    """Send notification to all users in a channel"""
    message = {
        "type": "notification",
        "notification_type": notification_type,
        "data": data,
        "timestamp": datetime.utcnow().isoformat()
    }
    await manager.broadcast_to_channel(message, channel)

async def notify_loan_status(user_id: int, loan_id: int, status: str, amount: float = None):
    """Notify user about loan status change"""
    data = {
        "loan_id": loan_id,
        "status": status,
        "amount": amount
    }
    await notify_user(user_id, "loan_status_update", data)

async def notify_marketplace_update(user_id: int, listing_id: int, action: str):
    """Notify user about marketplace updates"""
    data = {
        "listing_id": listing_id,
        "action": action
    }
    await notify_user(user_id, "marketplace_update", data)

async def notify_sensor_alert(device_id: str, alert_type: str, severity: str, message: str):
    """Notify users about sensor alerts"""
    # This would need to find users associated with the device
    # For now, broadcast to a general alerts channel
    data = {
        "device_id": device_id,
        "alert_type": alert_type,
        "severity": severity,
        "message": message
    }
    await notify_channel("alerts", "sensor_alert", data)
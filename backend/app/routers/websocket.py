import json
from typing import List, Dict, Any, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast(self, event_type: str, data: Dict[str, Any]):
        """Broadcasts real-time events to all active CAD and responder dashboards."""
        payload = json.dumps({
            "event": event_type,
            "data": data
        })
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception:
                disconnected.add(connection)
        for dead in disconnected:
            self.active_connections.discard(dead)

manager = ConnectionManager()

@router.websocket("/ws/cad")
async def websocket_cad_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle client heartbeats or telemetry pings
            try:
                parsed = json.loads(data)
                if parsed.get("action") == "PING":
                    await websocket.send_text(json.dumps({"event": "PONG", "time": parsed.get("time")}))
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)

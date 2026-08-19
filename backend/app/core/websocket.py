import json
from collections import defaultdict

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[str, list[WebSocket]] = defaultdict(list)

    async def connect(self, channel: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections[channel].append(websocket)

    def disconnect(self, channel: str, websocket: WebSocket) -> None:
        self._connections[channel].remove(websocket)
        if not self._connections[channel]:
            del self._connections[channel]

    async def broadcast(self, channel: str, event: dict) -> None:
        message = json.dumps(event, default=str)
        dead_connections: list[WebSocket] = []
        for connection in self._connections.get(channel, []):
            try:
                await connection.send_text(message)
            except Exception:
                dead_connections.append(connection)
        for conn in dead_connections:
            self.disconnect(channel, conn)

    def get_active_users(self, channel: str) -> int:
        return len(self._connections.get(channel, []))


manager = ConnectionManager()

from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.websocket import manager

router = APIRouter()


@router.websocket("/api/boards/{project_id}/live")
async def board_websocket(websocket: WebSocket, project_id: UUID) -> None:
    channel = f"board:{project_id}"
    await manager.connect(channel, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(channel, websocket)

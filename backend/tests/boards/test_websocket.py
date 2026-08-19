"""
WebSocket board tests.

The ConnectionManager lives in app.core.websocket and is an in-process singleton,
so we can inspect it directly after each mutation to confirm broadcast logic is wired
without needing a real WebSocket client.
"""

import json
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

from app.core.websocket import ConnectionManager, manager


# ---------------------------------------------------------------------------
# Unit tests for ConnectionManager
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_connection_manager_connect_and_disconnect():
    """connect() accepts the socket and registers it; disconnect() removes it."""
    mgr = ConnectionManager()
    ws = AsyncMock()
    await mgr.connect("board:abc", ws)
    ws.accept.assert_awaited_once()
    assert mgr.get_active_users("board:abc") == 1

    mgr.disconnect("board:abc", ws)
    assert mgr.get_active_users("board:abc") == 0


@pytest.mark.asyncio
async def test_connection_manager_broadcast_sends_json():
    """broadcast() serialises the event and sends it to all channel connections."""
    mgr = ConnectionManager()
    ws = AsyncMock()
    await mgr.connect("board:xyz", ws)

    event = {"event": "task.created", "data": {"id": "abc-123"}}
    await mgr.broadcast("board:xyz", event)

    ws.send_text.assert_awaited_once_with(json.dumps(event, default=str))


@pytest.mark.asyncio
async def test_connection_manager_broadcast_dead_connection_removed():
    """broadcast() silently removes connections that raise during send."""
    mgr = ConnectionManager()
    ws = AsyncMock()
    ws.send_text.side_effect = RuntimeError("connection closed")
    await mgr.connect("board:dead", ws)

    await mgr.broadcast("board:dead", {"event": "task.updated", "data": {}})

    assert mgr.get_active_users("board:dead") == 0


@pytest.mark.asyncio
async def test_connection_manager_broadcast_no_channel_is_noop():
    """broadcast() to a channel with no subscribers does not raise."""
    mgr = ConnectionManager()
    await mgr.broadcast("board:nonexistent", {"event": "task.moved", "data": {}})


# ---------------------------------------------------------------------------
# Integration tests: mutation endpoints trigger manager.broadcast
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_task_broadcasts_event(
    client: AsyncClient, auth_headers: dict, project_id: str
):
    """POST /api/projects/{id}/tasks triggers manager.broadcast with task.created."""
    with patch.object(manager, "broadcast", new_callable=AsyncMock) as mock_broadcast:
        resp = await client.post(
            f"/api/projects/{project_id}/tasks",
            json={"title": "WS task", "priority": "high"},
            headers=auth_headers,
        )
    assert resp.status_code == 201
    mock_broadcast.assert_awaited_once()
    call_args = mock_broadcast.call_args
    assert call_args[0][0].startswith("board:")
    assert call_args[0][1]["event"] == "task.created"
    assert call_args[0][1]["data"]["title"] == "WS task"


@pytest.mark.asyncio
async def test_update_task_broadcasts_event(
    client: AsyncClient, auth_headers: dict, project_id: str
):
    """PATCH /api/tasks/{id} triggers manager.broadcast with task.updated."""
    create_resp = await client.post(
        f"/api/projects/{project_id}/tasks",
        json={"title": "Original", "priority": "medium"},
        headers=auth_headers,
    )
    task_id = create_resp.json()["data"]["id"]

    with patch.object(manager, "broadcast", new_callable=AsyncMock) as mock_broadcast:
        resp = await client.patch(
            f"/api/tasks/{task_id}",
            json={"title": "Updated"},
            headers=auth_headers,
        )
    assert resp.status_code == 200
    mock_broadcast.assert_awaited_once()
    assert mock_broadcast.call_args[0][1]["event"] == "task.updated"


@pytest.mark.asyncio
async def test_move_task_broadcasts_event(
    client: AsyncClient, auth_headers: dict, project_id: str
):
    """POST /api/tasks/{id}/move triggers manager.broadcast with task.moved."""
    create_resp = await client.post(
        f"/api/projects/{project_id}/tasks",
        json={"title": "Moveable", "priority": "low"},
        headers=auth_headers,
    )
    task_id = create_resp.json()["data"]["id"]

    board_resp = await client.get(
        f"/api/projects/{project_id}/board", headers=auth_headers
    )
    target_column_id = board_resp.json()["data"]["columns"][1]["id"]

    with patch.object(manager, "broadcast", new_callable=AsyncMock) as mock_broadcast:
        resp = await client.post(
            f"/api/tasks/{task_id}/move",
            json={"column_id": target_column_id, "position": "a"},
            headers=auth_headers,
        )
    assert resp.status_code == 200
    mock_broadcast.assert_awaited_once()
    assert mock_broadcast.call_args[0][1]["event"] == "task.moved"


@pytest.mark.asyncio
async def test_archive_task_broadcasts_event(
    client: AsyncClient, auth_headers: dict, project_id: str
):
    """DELETE /api/tasks/{id} triggers manager.broadcast with task.archived."""
    create_resp = await client.post(
        f"/api/projects/{project_id}/tasks",
        json={"title": "To archive", "priority": "low"},
        headers=auth_headers,
    )
    task_id = create_resp.json()["data"]["id"]

    with patch.object(manager, "broadcast", new_callable=AsyncMock) as mock_broadcast:
        resp = await client.delete(
            f"/api/tasks/{task_id}",
            headers=auth_headers,
        )
    assert resp.status_code == 200
    mock_broadcast.assert_awaited_once()
    payload = mock_broadcast.call_args[0][1]
    assert payload["event"] == "task.archived"
    assert payload["data"]["id"] == task_id


@pytest.mark.asyncio
async def test_websocket_endpoint_accepts_connection(
    client: AsyncClient, auth_headers: dict, project_id: str
):
    """WS /api/boards/{project_id}/live — endpoint is registered and reachable."""
    # Use the ASGI test transport's GET to confirm route exists (not 404).
    # True WS handshake testing requires a specialised client beyond httpx.
    async with client.stream(
        "GET",
        f"/api/boards/{project_id}/live",
        headers={"upgrade": "websocket", "connection": "upgrade"},
    ) as response:
        # A registered WS route returns 403 for plain GET, not 404.
        assert response.status_code != 404

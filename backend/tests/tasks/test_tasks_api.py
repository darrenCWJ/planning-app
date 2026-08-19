import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_task(client: AsyncClient, auth_headers: dict, project_id: str):
    response = await client.post(
        f"/api/projects/{project_id}/tasks",
        json={"title": "My first task", "description": "Do something", "priority": "medium"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["data"]["title"] == "My first task"
    assert body["data"]["column_id"] is not None


@pytest.mark.asyncio
async def test_get_board(client: AsyncClient, auth_headers: dict, project_id: str):
    await client.post(
        f"/api/projects/{project_id}/tasks",
        json={"title": "Task A", "priority": "high"},
        headers=auth_headers,
    )
    response = await client.get(
        f"/api/projects/{project_id}/board",
        headers=auth_headers,
    )
    assert response.status_code == 200
    board = response.json()["data"]
    assert len(board["columns"]) == 3
    assert any(
        any(t["title"] == "Task A" for t in col["tasks"])
        for col in board["columns"]
    )


@pytest.mark.asyncio
async def test_move_task(client: AsyncClient, auth_headers: dict, project_id: str):
    create_resp = await client.post(
        f"/api/projects/{project_id}/tasks",
        json={"title": "Movable", "priority": "low"},
        headers=auth_headers,
    )
    task_id = create_resp.json()["data"]["id"]

    board_resp = await client.get(f"/api/projects/{project_id}/board", headers=auth_headers)
    columns = board_resp.json()["data"]["columns"]
    target_column_id = columns[1]["id"]  # "In Progress"

    response = await client.post(
        f"/api/tasks/{task_id}/move",
        json={"column_id": target_column_id, "position": "a"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["data"]["column_id"] == target_column_id


@pytest.mark.asyncio
async def test_update_task(client: AsyncClient, auth_headers: dict, project_id: str):
    create_resp = await client.post(
        f"/api/projects/{project_id}/tasks",
        json={"title": "Update me", "priority": "medium"},
        headers=auth_headers,
    )
    task_id = create_resp.json()["data"]["id"]

    response = await client.patch(
        f"/api/tasks/{task_id}",
        json={"title": "Updated title", "priority": "high"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["data"]["title"] == "Updated title"


@pytest.mark.asyncio
async def test_filter_tasks(client: AsyncClient, auth_headers: dict, project_id: str):
    await client.post(
        f"/api/projects/{project_id}/tasks",
        json={"title": "High priority", "priority": "high"},
        headers=auth_headers,
    )
    await client.post(
        f"/api/projects/{project_id}/tasks",
        json={"title": "Low priority", "priority": "low"},
        headers=auth_headers,
    )
    response = await client.get(
        f"/api/projects/{project_id}/tasks?priority=high",
        headers=auth_headers,
    )
    assert response.status_code == 200
    tasks = response.json()["data"]
    assert all(t["priority"] == "high" for t in tasks)

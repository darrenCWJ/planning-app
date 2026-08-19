import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_project(client: AsyncClient, auth_headers: dict, workspace_id: str):
    response = await client.post(
        f"/api/workspaces/{workspace_id}/projects",
        json={"name": "Sprint Board", "key": "SB", "description": "Main sprint board"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["data"]["name"] == "Sprint Board"
    assert body["data"]["key"] == "SB"
    assert len(body["data"]["columns"]) == 3  # default: To Do, In Progress, Done


@pytest.mark.asyncio
async def test_list_projects(client: AsyncClient, auth_headers: dict, workspace_id: str):
    await client.post(
        f"/api/workspaces/{workspace_id}/projects",
        json={"name": "Project A", "key": "PA", "description": ""},
        headers=auth_headers,
    )
    response = await client.get(
        f"/api/workspaces/{workspace_id}/projects",
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert len(response.json()["data"]) >= 1


@pytest.mark.asyncio
async def test_get_project(client: AsyncClient, auth_headers: dict, workspace_id: str):
    create_resp = await client.post(
        f"/api/workspaces/{workspace_id}/projects",
        json={"name": "Detail", "key": "DT", "description": "test"},
        headers=auth_headers,
    )
    project_id = create_resp.json()["data"]["id"]
    response = await client.get(f"/api/projects/{project_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["data"]["id"] == project_id

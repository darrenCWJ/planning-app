import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_workspace(client: AsyncClient, auth_headers: dict):
    response = await client.post(
        "/api/workspaces",
        json={"name": "My Team", "slug": "my-team"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["data"]["name"] == "My Team"
    assert body["data"]["slug"] == "my-team"


@pytest.mark.asyncio
async def test_list_workspaces(client: AsyncClient, auth_headers: dict):
    await client.post(
        "/api/workspaces",
        json={"name": "Workspace 1", "slug": "ws-1"},
        headers=auth_headers,
    )
    response = await client.get("/api/workspaces", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()["data"]) >= 1


@pytest.mark.asyncio
async def test_create_workspace_requires_auth(client: AsyncClient):
    response = await client.post(
        "/api/workspaces",
        json={"name": "No Auth", "slug": "no-auth"},
    )
    assert response.status_code == 403 or response.status_code == 401


@pytest.mark.asyncio
async def test_invite_member(client: AsyncClient, auth_headers: dict):
    create_resp = await client.post(
        "/api/workspaces",
        json={"name": "Invite Test", "slug": "invite-test"},
        headers=auth_headers,
    )
    ws_id = create_resp.json()["data"]["id"]
    response = await client.post(
        f"/api/workspaces/{ws_id}/members",
        json={"email": "newmember@example.com", "role": "member"},
        headers=auth_headers,
    )
    assert response.status_code == 201 or response.status_code == 200

"""Tests for role-based permission middleware."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_viewer_cannot_create_task(
    client: AsyncClient, viewer_headers: dict, project_id: str
):
    """A viewer role must not be allowed to create tasks (requires MEMBER or above)."""
    response = await client.post(
        f"/api/projects/{project_id}/tasks",
        json={"title": "Should fail", "priority": "low"},
        headers=viewer_headers,
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_member_can_create_task(
    client: AsyncClient, auth_headers: dict, project_id: str
):
    """The workspace owner (MEMBER-or-above) must be able to create tasks."""
    response = await client.post(
        f"/api/projects/{project_id}/tasks",
        json={"title": "Should work", "priority": "low"},
        headers=auth_headers,
    )
    assert response.status_code == 201


@pytest.mark.asyncio
async def test_non_member_cannot_access_workspace(
    client: AsyncClient, outsider_headers: dict
):
    """A user with no workspace memberships should get an empty list, not a 403."""
    response = await client.get("/api/workspaces", headers=outsider_headers)
    assert response.status_code == 200
    assert response.json()["data"] == []


@pytest.mark.asyncio
async def test_unauthenticated_cannot_create_task(
    client: AsyncClient, project_id: str
):
    """Requests with no auth header must be rejected with 403."""
    response = await client.post(
        f"/api/projects/{project_id}/tasks",
        json={"title": "No auth", "priority": "low"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_outsider_cannot_create_task(
    client: AsyncClient, outsider_headers: dict, project_id: str
):
    """A user who is not a member of the project's workspace must receive 403."""
    response = await client.post(
        f"/api/projects/{project_id}/tasks",
        json={"title": "Should fail too", "priority": "low"},
        headers=outsider_headers,
    )
    assert response.status_code == 403

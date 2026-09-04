# Phase 1: Core Task Enhancements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add subtasks, assignee/due-date UI wiring, full-text search, and a personal dashboard to the Planning App.

**Architecture:** New `subtasks` module follows existing module pattern (model/schema/service/router). Assignees and due dates already exist in the Task model — only frontend wiring needed. Search uses PostgreSQL full-text search with GIN index. Dashboard aggregates existing data through a new endpoint.

**Tech Stack:** FastAPI, SQLAlchemy 2.0 (async), PostgreSQL 16, Alembic, React 18, TanStack Query, TailwindCSS, dnd-kit

**Spec:** `docs/superpowers/specs/2026-09-03-feature-expansion-design.md`

## Global Constraints

- Python >= 3.12, Node >= 20
- All backend models use `UUID(as_uuid=True)` primary keys with `uuid.uuid4` default
- All timestamps use `DateTime(timezone=True)` with `datetime.now(timezone.utc)` default
- All responses use `envelope(data)` wrapper
- All protected endpoints use `Depends(get_current_user_id)` and `Depends(require_*_role(...))`
- Frontend API functions unwrap `resp.data.data` from envelope
- TanStack Query for all server state; no local caching

---

## Task 1: Subtasks Backend

**Files:**
- Create: `backend/app/modules/subtasks/__init__.py`
- Create: `backend/app/modules/subtasks/models.py`
- Create: `backend/app/modules/subtasks/schemas.py`
- Create: `backend/app/modules/subtasks/service.py`
- Create: `backend/app/modules/subtasks/router.py`
- Create: `backend/alembic/versions/0005_add_subtasks_and_search_index.py`
- Modify: `backend/app/main.py`
- Modify: `backend/app/modules/tasks/models.py`
- Test: `backend/tests/test_subtasks.py`

**Interfaces:**
- Consumes: `app.core.database.Base`, `get_db`, `get_current_user_id`, `envelope`
- Produces: `Subtask` model, CRUD service functions, router at `/api/tasks/{task_id}/subtasks`

## Task 2: Subtasks Frontend

**Files:**
- Create: `frontend/src/features/subtask/api.ts`
- Create: `frontend/src/features/subtask/hooks/useSubtasks.ts`
- Create: `frontend/src/features/subtask/components/SubtaskList.tsx`
- Modify: `frontend/src/features/board/components/TaskDetailModal.tsx`
- Modify: `frontend/src/features/board/components/TaskCard.tsx`

**Interfaces:**
- Consumes: `apiClient`, subtask endpoints
- Produces: `SubtaskData` type, `useSubtasks(taskId)` hook, `<SubtaskList>` component

## Task 3: Assignee Wiring (Frontend)

**Files:**
- Create: `frontend/src/features/board/components/AssigneePicker.tsx`
- Modify: `frontend/src/features/board/api.ts`
- Modify: `frontend/src/features/board/components/TaskCard.tsx`
- Modify: `frontend/src/features/board/components/TaskDetailModal.tsx`
- Modify: `frontend/src/features/board/components/FilterBar.tsx`
- Modify: `frontend/src/features/board/pages/BoardPage.tsx`

**Interfaces:**
- Consumes: `WorkspaceMember` from workspace/api, `updateTask` from board/api
- Produces: `<AssigneePicker>` component, assignee filter in FilterBar

## Task 4: Due Date Enhancement (Frontend)

**Files:**
- Create: `frontend/src/features/board/components/DueDateBadge.tsx`
- Modify: `frontend/src/features/board/components/TaskCard.tsx`
- Modify: `frontend/src/features/board/components/FilterBar.tsx`
- Modify: `frontend/src/features/board/pages/BoardPage.tsx`

**Interfaces:**
- Consumes: `TaskData.due_date`
- Produces: `<DueDateBadge>` component, due date filter in FilterBar

## Task 5: Search Backend

**Files:**
- Create: `backend/app/modules/search/__init__.py`
- Create: `backend/app/modules/search/service.py`
- Create: `backend/app/modules/search/router.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_search.py`

**Interfaces:**
- Consumes: `Task`, `Project` models
- Produces: `search_tasks()` service, router at `/api/workspaces/{id}/search`

## Task 6: Search Frontend

**Files:**
- Create: `frontend/src/features/search/api.ts`
- Create: `frontend/src/features/search/hooks/useSearch.ts`
- Create: `frontend/src/features/search/components/SearchBar.tsx`
- Modify: `frontend/src/components/shared/Layout.tsx`

**Interfaces:**
- Consumes: `apiClient`, search endpoint
- Produces: `<SearchBar>` in Layout header

## Task 7: Dashboard Backend

**Files:**
- Create: `backend/app/modules/dashboard/__init__.py`
- Create: `backend/app/modules/dashboard/service.py`
- Create: `backend/app/modules/dashboard/router.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_dashboard.py`

**Interfaces:**
- Consumes: `Task`, `Project`, `WorkspaceMember` models
- Produces: `get_dashboard()` service, router at `/api/users/me/dashboard`

## Task 8: Dashboard Frontend

**Files:**
- Create: `frontend/src/features/dashboard/api.ts`
- Create: `frontend/src/features/dashboard/hooks/useDashboard.ts`
- Create: `frontend/src/features/dashboard/pages/DashboardPage.tsx`
- Modify: `frontend/src/app/Router.tsx`
- Modify: `frontend/src/components/shared/Sidebar.tsx`

**Interfaces:**
- Consumes: `apiClient`, dashboard endpoint, `<DueDateBadge>`
- Produces: `<DashboardPage>` at `/dashboard` route

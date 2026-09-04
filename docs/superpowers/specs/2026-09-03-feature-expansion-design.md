# Planning App Feature Expansion — Design Spec

**Date:** 2026-09-03
**Status:** Approved
**Stack:** FastAPI (Python 3.12), React 18, PostgreSQL 16, Redis, Vite, TailwindCSS

## Overview

Expand the Planning App from a basic board tool into a full project management platform with task enhancements, calendar, knowledge base, artifact storage, and team collaboration features.

Delivered in 3 phases, each independently usable.

---

## Phase 1: Core Task Enhancements

### 1.1 Assignees (frontend wiring only)

`Task.assignee_id` and `Task.due_date` already exist in the backend model and schemas. No migration needed.

**Frontend changes:**
- Task card: avatar chip showing assignee initials. Click opens member picker dropdown (workspace members).
- Task detail modal: member dropdown picker for assignee field.
- Board filter bar: add "Assignee" filter.

### 1.2 Due Dates (frontend wiring only)

**Frontend changes:**
- Task card: due date badge. Colors: gray (future), orange (due within 3 days), red (overdue).
- Task detail modal: date picker input for due_date field.
- Board filter bar: add "Due Date" filter (overdue, due today, due this week, no date).

### 1.3 Subtasks / Checklists

**New model — `Subtask`:**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| task_id | UUID FK tasks | ON DELETE CASCADE |
| title | String(500) | |
| is_completed | Boolean | default false |
| position | Integer | ordering within task |
| created_at | DateTime | |
| updated_at | DateTime | |

**Endpoints:**
- `POST /api/tasks/{task_id}/subtasks` — create
- `GET /api/tasks/{task_id}/subtasks` — list (ordered by position)
- `PATCH /api/subtasks/{id}` — update title or toggle is_completed
- `PUT /api/tasks/{task_id}/subtasks/reorder` — bulk reorder (accepts `[{id, position}]`)
- `DELETE /api/subtasks/{id}`

**Frontend:**
- Task card: progress bar "3/5" when subtasks exist.
- Task detail modal: checklist section — checkboxes, inline add input, drag to reorder.

### 1.4 Search

**Endpoint:**
- `GET /api/workspaces/{workspace_id}/search?q=term&limit=20&offset=0`
- Uses PostgreSQL `to_tsvector` / `to_tsquery` on `tasks.title` and `tasks.description`.
- Returns results grouped by project: `{ projects: [{ project, tasks: [...] }] }`.
- Add GIN index on `(to_tsvector('english', title || ' ' || coalesce(description, '')))`.

**Frontend:**
- Search bar in top nav (Cmd+K shortcut to focus).
- Results dropdown: grouped by project, shows task title with highlighted match, priority badge, assignee avatar.
- Click result navigates to board with task detail modal open.

### 1.5 Dashboard

**New page:** `/dashboard` (default landing after login)

**Endpoint:**
- `GET /api/users/me/dashboard`
- Returns: assigned_tasks (grouped by project), overdue_tasks, due_this_week, recent_tasks.

**Frontend sections:**
- "My Tasks" — table grouped by project, sorted by due date.
- "Overdue" — red-highlighted list of past-due tasks.
- "Due This Week" — upcoming deadlines.
- Quick-nav cards linking to each workspace/project.

---

## Phase 2: Calendar, Activity, Notifications

### 2.1 Calendar View

**New page:** `/workspaces/:id/calendar`

**Endpoint:**
- `GET /api/workspaces/{workspace_id}/calendar?start=YYYY-MM-DD&end=YYYY-MM-DD`
- Returns tasks with due_date in range, across all projects in the workspace.
- Response includes: task, project_name, project_key, column_name.

**Frontend:**
- Month view: CSS grid, 7 columns. Each cell shows task chips (color-coded by project).
- Week view: rows per day with more detail per task.
- Toggle: month/week. Navigation: prev/next, today button.
- Filters: project, assignee.
- Click task chip opens task detail modal.
- No external calendar library — CSS grid based.

### 2.2 Activity Log

**New model — `Activity`:**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| workspace_id | UUID FK | |
| project_id | UUID FK, nullable | |
| task_id | UUID FK, nullable | |
| actor_id | UUID FK users | |
| action | Enum | created, updated, moved, commented, assigned, archived |
| entity_type | Enum | task, project, column, comment |
| entity_id | UUID | |
| details | JSONB | old/new values |
| created_at | DateTime | |

**Indexes:** `(workspace_id, created_at DESC)`, `(task_id, created_at DESC)`, `(actor_id, created_at DESC)`

**Endpoints:**
- `GET /api/tasks/{task_id}/activity?cursor=&limit=20`
- `GET /api/projects/{project_id}/activity?cursor=&limit=20`
- `GET /api/workspaces/{workspace_id}/activity?cursor=&limit=20`
- Cursor-based pagination (cursor = created_at + id).

**Integration:** Activity records created by the service layer implicitly — every task/project/column/comment mutation writes an Activity row in the same DB transaction.

**Frontend:**
- Task detail modal: "Activity" tab with timeline.
- Project page: activity tab.
- Each entry: avatar + "Alice moved this to Done" + relative time.

### 2.3 Notifications

**New model — `Notification`:**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | recipient |
| type | Enum | assigned, commented, due_soon, mentioned |
| title | String(200) | |
| message | String(500) | |
| link | String(500) | deep link path |
| activity_id | UUID FK activity, nullable | |
| is_read | Boolean | default false |
| created_at | DateTime | |

**Index:** `(user_id, is_read, created_at DESC)`

**Endpoints:**
- `GET /api/notifications?limit=20&cursor=`
- `GET /api/notifications/unread-count`
- `PATCH /api/notifications/{id}/read`
- `POST /api/notifications/mark-all-read`

**Trigger rules:**
| Event | Recipient | Type |
|-------|-----------|------|
| Task assigned to user | Assignee | assigned |
| Comment on assigned task | Assignee (if not commenter) | commented |
| Task due within 24 hours | Assignee | due_soon |

Due-soon: checked by a periodic Celery beat task.

**Frontend:**
- Bell icon in top nav with red unread count badge.
- Dropdown panel: notification list, clickable (navigates via link field).
- "Mark all as read" button.

**Extensibility:** Type field enables future per-type delivery preferences (email, WebSocket). No preferences UI in this phase.

---

## Phase 3: Knowledge Base & Attachments

### 3.1 Knowledge Base

**New model — `KBPage`:**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| workspace_id | UUID FK | |
| parent_id | UUID FK kb_pages, nullable | tree structure |
| title | String(500) | |
| slug | String(200) | unique per workspace |
| content | Text | markdown |
| created_by | UUID FK users | |
| updated_by | UUID FK users | |
| position | Integer | sibling ordering |
| is_archived | Boolean | default false |
| created_at | DateTime | |
| updated_at | DateTime | |

**Unique constraint:** `(workspace_id, slug)`

**Endpoints:**
- `POST /api/workspaces/{workspace_id}/kb` — create page
- `GET /api/workspaces/{workspace_id}/kb` — page tree (nested JSON)
- `GET /api/kb/{page_id}` — full page content
- `PATCH /api/kb/{page_id}` — update title, content, parent_id, position
- `DELETE /api/kb/{page_id}` — soft delete (archive)
- `GET /api/workspaces/{workspace_id}/kb/search?q=term` — full-text search

**Frontend:**
- `/workspaces/:id/kb` — sidebar tree nav + main content area.
- `/workspaces/:id/kb/:pageId` — page view/edit.
- Editor: markdown textarea with tabbed preview.
- Page header: editable title, breadcrumbs, "last edited by X, Y ago".
- Tree sidebar: collapsible, drag to reorder/re-parent. "New page" button.

### 3.2 Attachments

**New model — `Attachment`:**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| workspace_id | UUID FK | |
| task_id | UUID FK, nullable | |
| kb_page_id | UUID FK, nullable | |
| uploaded_by | UUID FK users | |
| filename | String(500) | stored name (UUID-prefixed) |
| original_filename | String(500) | user-facing name |
| content_type | String(200) | MIME type |
| size_bytes | BigInteger | |
| storage_path | String(1000) | relative path on disk |
| created_at | DateTime | |

**Storage:** `uploads/{workspace_id}/{YYYY}/{MM}/{uuid}_{original_filename}`

**Config:** `UPLOAD_DIR` env var (default `./uploads`). Max file size: 50MB.

**Endpoints:**
- `POST /api/attachments/upload` — multipart (file + task_id or kb_page_id + workspace_id)
- `GET /api/attachments/{id}/download` — stream with Content-Type/Content-Disposition
- `GET /api/tasks/{task_id}/attachments` — list for task
- `GET /api/kb/{page_id}/attachments` — list for KB page
- `DELETE /api/attachments/{id}` — delete record + file

**Validation:** File size check, content type allowlist (images, PDFs, docs, archives — reject executables), sanitize original_filename.

**Frontend:**
- Task detail modal: "Attachments" section with drag-and-drop zone.
- KB page: attachment section below content.
- File list: type icon, filename, size, uploader, date, download/delete buttons.
- Image attachments: inline thumbnail preview (< 5MB).

---

## Cross-Cutting Concerns

### Pagination
All list endpoints: cursor-based (`?cursor=&limit=20`). Cursor encodes `(created_at, id)`.

### Authorization
All endpoints enforce workspace membership via existing permission middleware. KB/attachments inherit workspace access. Deletes require admin/owner role.

### Migrations
One Alembic migration per phase:
- Phase 1: `subtasks` table + GIN index on tasks for search
- Phase 2: `activities` + `notifications` tables
- Phase 3: `kb_pages` + `attachments` tables

### Frontend State
- TanStack Query for all server state (existing pattern).
- Optimistic updates for subtask toggles and notification mark-as-read.
- New query keys: `['subtasks', taskId]`, `['search', query]`, `['dashboard']`, `['calendar', workspaceId, start, end]`, `['activity', entityType, entityId]`, `['notifications']`, `['kb-tree', workspaceId]`, `['kb-page', pageId]`, `['attachments', entityType, entityId]`.

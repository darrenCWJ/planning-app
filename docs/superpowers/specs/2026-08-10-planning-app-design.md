# Planning App — Design Spec

## Overview

A Jira-like planning and project management app for mixed teams of dozens of users. Supports kanban boards, sprint planning, epics, and task management with real-time collaboration. Built as a modular monolith, fully containerized for portability and self-hosting.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Vite, shadcn/ui, React Query, Zustand, dnd-kit |
| Backend | Python, FastAPI, SQLAlchemy 2.0 (async), Pydantic v2, Alembic |
| Database | PostgreSQL |
| Cache/PubSub | Redis |
| Task Queue | Celery + Redis |
| Real-time | FastAPI WebSocket + Redis Pub/Sub |
| Containerization | Docker, Docker Compose |
| CI/CD | GitHub Actions |
| Image Registry | GitHub Container Registry |

## Architecture

### Approach: Modular Monolith

Single deployable unit with strict domain module boundaries. Each module owns its own models, schemas, router, service layer, and events. Cross-module communication goes through defined service interfaces.

```
┌─────────────────────────────────────────────────────┐
│                    React SPA                         │
│  (Board views, Sprint planning, Task management)    │
└──────────────────────┬──────────────────────────────┘
                       │ REST + WebSocket
┌──────────────────────▼──────────────────────────────┐
│              FastAPI Application                      │
│                                                      │
│  ┌──────┐ ┌────────┐ ┌───────┐ ┌───────┐ ┌──────┐ │
│  │ Auth │ │Projects│ │Boards │ │Sprints│ │Notifs│  │
│  │Module│ │ Module │ │Module │ │Module │ │Module│  │
│  └──┬───┘ └───┬────┘ └───┬───┘ └───┬───┘ └──┬───┘ │
│     │         │          │         │         │      │
│  ┌──▼─────────▼──────────▼─────────▼─────────▼──┐  │
│  │           Service Layer (per module)           │  │
│  └──────────────────────┬────────────────────────┘  │
└─────────────────────────┼───────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
  ┌──────────┐    ┌─────────────┐    ┌──────────┐
  │PostgreSQL│    │    Redis     │    │  Storage │
  │  (Data)  │    │(WS, Cache,  │    │(Local/S3)│
  │          │    │  Sessions)  │    │          │
  └──────────┘    └─────────────┘    └──────────┘
```

### Backend Module Structure

```
app/
├── core/
│   ├── auth.py        # Current user, JWT decode
│   ├── permissions.py # Role checking decorators
│   ├── pagination.py  # Cursor-based pagination
│   ├── websocket.py   # WS connection manager
│   └── config.py      # Settings, env vars
├── modules/
│   ├── auth/
│   ├── workspaces/
│   ├── projects/
│   ├── boards/
│   ├── tasks/
│   ├── sprints/
│   ├── epics/
│   └── notifications/
└── main.py
```

Each module follows:

```
modules/<name>/
├── router.py      # API endpoints
├── service.py     # Business logic
├── models.py      # SQLAlchemy models
├── schemas.py     # Pydantic request/response
├── events.py      # Events emitted/listened
└── exceptions.py  # Module-specific errors
```

### Frontend Structure

```
src/
├── app/                  # App shell, routing, providers
├── components/
│   ├── ui/               # shadcn/ui primitives
│   └── shared/           # App-wide components
├── features/
│   ├── auth/
│   ├── workspace/
│   ├── project/
│   ├── board/
│   ├── task/
│   ├── sprint/
│   ├── epic/
│   └── notifications/
├── hooks/                # Shared hooks
├── lib/                  # API client, WebSocket manager, utils
└── stores/               # Zustand stores (UI state only)
```

## Domain Model

### Entity Hierarchy

```
Workspace (top-level tenant)
├── Members (users + roles: owner, admin, member, viewer)
├── Projects
│   ├── Boards (kanban views)
│   │   ├── Columns (status buckets, ordered)
│   │   └── Cards → Tasks
│   ├── Sprints (time-boxed iterations)
│   │   └── Sprint Items → Tasks
│   ├── Epics (large initiatives)
│   │   └── Tasks (children)
│   └── Tasks (the core unit)
│       ├── Assignees
│       ├── Labels/Tags
│       ├── Comments
│       ├── Attachments
│       ├── Activity log
│       └── Sub-tasks
└── Custom Fields (per workspace, applied to tasks)
```

### Key Design Decisions

- **Multi-workspace:** A user can belong to multiple workspaces. All data is workspace-scoped.
- **Tasks are central:** A task can appear on a board, belong to a sprint, and live under an epic simultaneously (relationships, not copies).
- **Flexible statuses:** Each project defines its own workflow columns. Board columns map to these statuses.
- **Custom fields:** Workspace-level custom fields (text, number, date, dropdown, user) stored as JSONB.
- **Ordering:** Fractional indexing for column and card ordering (single row update, no cascades).
- **Soft deletes:** Tasks and projects use an archived flag + timestamp.

### Access Control

| Role | Workspace | Project | Tasks |
|------|-----------|---------|-------|
| Owner | Full control | Full | Full |
| Admin | Manage members, settings | Full | Full |
| Member | View settings | Create/edit tasks | Own + assigned |
| Viewer | View only | View only | View only |

Project-level overrides can restrict or expand access per project.

## API Design

### Patterns

- REST with consistent envelope: `{ "data": ..., "meta": { "total", "cursor" } }`
- Cursor-based pagination for lists
- WebSocket channels per board: `ws://.../boards/{board_id}/live`
- Internal event bus: modules emit events (e.g., `task.moved`, `sprint.started`)

### Key Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/auth/register` | Email signup |
| POST | `/auth/login` | JWT token pair |
| POST | `/auth/oauth/{provider}` | OAuth callback |
| GET | `/workspaces` | List user's workspaces |
| POST | `/workspaces/{id}/invite` | Invite member |
| GET | `/projects/{id}/board` | Get board with columns + cards |
| PATCH | `/tasks/{id}` | Update task fields |
| POST | `/tasks/{id}/move` | Move task to column/position |
| WS | `/boards/{id}/live` | Real-time board updates |
| GET | `/sprints/{id}/burndown` | Sprint burndown data |

## Frontend Decisions

- **React Query** for all server state (caching, optimistic updates, background refetching)
- **Zustand** for client-only UI state (sidebar, filters, drag state)
- **Optimistic updates** on board interactions (move instantly, reconcile with server)
- **URL-driven state** for filters, active sprint, board view (shareable)
- **Task detail as modal + route** (click opens modal, URL updates for direct links)
- **dnd-kit** for drag-and-drop board interactions

### Key Views

| View | Description |
|------|-------------|
| Board | Kanban columns with drag-and-drop cards |
| Backlog | Flat task list with bulk actions, filters, sorting |
| Sprint | Active sprint board + backlog panel for planning |
| Epic roadmap | Epics as rows with progress bars, expandable |
| My Work | Tasks assigned to current user across projects |
| Timeline | Gantt-style view (post-MVP) |

## Real-time Strategy

- **Hybrid approach:** WebSockets for boards and notifications, polling for everything else
- Board view subscribes to WebSocket channel on mount
- Incoming events patch React Query cache directly
- Presence indicators show who is viewing the same board

## Deployment & Portability

### Guiding Principle

The app runs anywhere Docker runs. No vendor-specific services in the code.

### Docker Compose Stack

```yaml
services:
  frontend:   # Nginx serving React build
  api:        # FastAPI + WebSocket
  worker:     # Celery worker
  postgres:   # Database
  redis:      # Cache, WS pub/sub, task queue
  proxy:      # Traefik/Nginx for SSL + routing
```

### Portability Decisions

- Everything is Docker Compose — same file works on laptop, NAS, VPS, or cloud
- No managed service dependencies — Postgres and Redis run as containers (swappable for managed)
- File storage abstraction — local filesystem or S3-compatible via env var
- Config via environment variables only — no vendor-specific config files
- Reverse proxy layer (Traefik/Nginx) handles SSL, swappable per environment

### Deployment Targets (all supported)

| Target | How |
|--------|-----|
| Local dev | `docker compose up` (hot reload via volume mounts) |
| Self-host | `docker compose -f docker-compose.prod.yml up -d` |
| Northflank | Push Docker images, use managed or containerized DB/Redis |
| Vercel + cloud | Frontend on Vercel, API containers on any Docker host |
| VPS | Docker Compose + Traefik for SSL |
| Kubernetes | Helm chart (post-MVP) |

### Self-Hosting Experience

```bash
git clone <repo>
cp .env.example .env   # Edit with domain, secrets
docker compose -f docker-compose.prod.yml up -d
```

### CI/CD

- GitHub Actions: lint, type check, unit tests, integration tests, build images, E2E, push to GHCR
- Deploy step is pluggable (SSH + pull, Northflank webhook, or Vercel CLI)

## Testing Strategy

| Layer | Tool | Coverage | What it tests |
|-------|------|----------|---------------|
| Unit (backend) | pytest | 80%+ | Service logic, utilities, validators |
| Integration (backend) | pytest + httpx | Key flows | API endpoints, DB operations, auth |
| Unit (frontend) | Vitest + Testing Library | 80%+ | Components, hooks, stores |
| E2E | Playwright | Critical paths | Full user journeys |

### Backend Testing

- Each module has its own `tests/` directory
- Integration tests use a real Postgres (testcontainers)
- Factory pattern for test data
- Auth tests cover token lifecycle and permission boundaries

### Frontend Testing

- Component tests for interactive elements (board, drag-drop, forms)
- Hook tests for data fetching logic
- E2E: sign up, create project, create board, move task, verify real-time

### Quality Gates (must pass to merge)

- All tests green
- No type errors (pyright + tsc)
- Lint clean (ruff + eslint)
- Coverage above threshold

## Phasing

### Phase 1 — MVP (Core task management + boards)

- Auth (email/password + Google OAuth)
- Workspace creation + member invites
- Projects with customizable workflow columns
- Kanban board with drag-and-drop
- Task CRUD (title, description, assignee, labels, due date, priority)
- Task detail view with comments
- Real-time board updates via WebSocket
- Basic role-based permissions (owner, admin, member)
- Search and filter tasks

### Phase 2 — Sprint planning + epics

- Sprint creation, start/end dates, sprint backlog
- Move tasks into/out of sprints
- Burndown chart
- Sprint retrospective summary
- Epics with task grouping and progress tracking
- Epic roadmap view

### Phase 3 — Collaboration + polish

- Sub-tasks
- Activity log on tasks
- File attachments
- In-app notifications + email digests
- @mentions in comments
- "My Work" personal dashboard
- Custom fields

### Phase 4 — Advanced features

- Automations (when task moves to X, assign to Y)
- Timeline/Gantt view
- Reporting dashboard (velocity, cycle time, throughput)
- Workspace templates
- Bulk operations
- API for integrations

### MVP Success Criteria

- Team can create a project, set up a board, create and move tasks, assign work
- Real-time: two people see the same board update live
- Usable on desktop (mobile-responsive post-MVP)

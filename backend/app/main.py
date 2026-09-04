from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.modules.auth.router import router as auth_router, users_router
from app.modules.boards.router import router as boards_router
from app.modules.boards.websocket import router as boards_ws_router
from app.modules.projects.router import router as projects_router
from app.modules.tasks.router import router as tasks_router
from app.modules.activity.router import router as activity_router
from app.modules.attachments.router import router as attachments_router
from app.modules.calendar.router import router as calendar_router
from app.modules.kb.router import router as kb_router
from app.modules.analytics.router import router as analytics_router
from app.modules.csv_io.router import router as csv_router
from app.modules.dashboard.router import router as dashboard_router
from app.modules.dependencies.router import router as dependencies_router
from app.modules.sprints.router import router as sprints_router
from app.modules.webhooks.router import router as webhooks_router
from app.modules.recurring.router import router as recurring_router
from app.modules.timetracking.router import router as timetracking_router
from app.modules.notifications.router import router as notifications_router
from app.modules.search.router import router as search_router
from app.modules.subtasks.router import router as subtasks_router
from app.modules.workspaces.router import router as workspaces_router

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(workspaces_router)
app.include_router(projects_router)
app.include_router(tasks_router)
app.include_router(boards_router)
app.include_router(boards_ws_router)
app.include_router(subtasks_router)
app.include_router(search_router)
app.include_router(dashboard_router)
app.include_router(activity_router)
app.include_router(notifications_router)
app.include_router(calendar_router)
app.include_router(kb_router)
app.include_router(attachments_router)
app.include_router(dependencies_router)
app.include_router(timetracking_router)
app.include_router(recurring_router)
app.include_router(analytics_router)
app.include_router(sprints_router)
app.include_router(webhooks_router)
app.include_router(csv_router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}

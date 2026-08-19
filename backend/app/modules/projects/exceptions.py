class ProjectNotFoundError(Exception):
    def __init__(self, project_id: str) -> None:
        super().__init__(f"Project not found: {project_id}")


class ProjectKeyConflictError(Exception):
    def __init__(self, key: str) -> None:
        super().__init__(f"Project key already exists in workspace: {key}")

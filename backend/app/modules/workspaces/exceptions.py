class WorkspaceNotFoundError(Exception):
    """Raised when a workspace cannot be found."""


class UserNotFoundError(Exception):
    """Raised when a user to invite cannot be found."""


class MemberAlreadyExistsError(Exception):
    """Raised when the user is already a member of the workspace."""

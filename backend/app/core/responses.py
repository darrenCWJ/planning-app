from typing import Any


def envelope(data: Any, meta: dict | None = None) -> dict:
    return {"data": data, "meta": meta}

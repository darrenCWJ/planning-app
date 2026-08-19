from app.core.responses import envelope
from app.core.security import hash_password, verify_password


def test_envelope_wraps_data():
    result = envelope({"id": 1, "name": "Test"})
    assert result == {"data": {"id": 1, "name": "Test"}, "meta": None}


def test_envelope_includes_meta():
    meta = {"total": 10, "cursor": "abc123"}
    result = envelope([1, 2, 3], meta=meta)
    assert result == {"data": [1, 2, 3], "meta": meta}


def test_hash_and_verify_password():
    hashed = hash_password("mypassword123")
    assert hashed != "mypassword123"
    assert verify_password("mypassword123", hashed) is True
    assert verify_password("wrongpassword", hashed) is False

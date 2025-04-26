import pytest

def test_import_server():
    import server

def test_list_endpoints_schema(monkeypatch):
    import server

    # Patch api_schema to a minimal value
    monkeypatch.setattr(server, "api_schema", {"paths": {"/foo": {"get": {}, "description": "test"}}})
    result = server.list_endpoints()
    assert "/foo" in result
    assert "methods" in result["/foo"]

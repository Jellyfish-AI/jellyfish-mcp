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

@pytest.fixture(autouse=True)
def patch_env(monkeypatch):
    monkeypatch.setenv("JELLYFISH_API_TOKEN", "dummy_token")

@pytest.fixture
def mock_requests(monkeypatch):
    class DummyResponse:
        def __init__(self, status_code=200, text="{}", json_data=None):
            self.status_code = status_code
            self.text = text
            self._json = json_data or {}

        def json(self):
            return self._json

    def dummy_get(url, headers=None, params=None):
        return DummyResponse(json_data={"ok": True, "url": url, "params": params})

    monkeypatch.setattr("requests.get", dummy_get)
    return dummy_get

@pytest.fixture
def patch_schema(monkeypatch):
    import server
    monkeypatch.setattr(server, "api_schema", {"paths": {"/foo": {"get": {}, "description": "desc"}}})

def test_get_api_schema(monkeypatch, patch_schema):
    import server
    result = server.get_api_schema()
    assert isinstance(result, str)
    assert "paths" in result

def test_list_endpoints(monkeypatch, patch_schema):
    import server
    result = server.list_endpoints()
    assert "/foo" in result

def test_get_endpoint(mock_requests):
    import server
    result = server.get_endpoint("foo/bar", params={"a": 1})
    assert result["ok"]

def test_get_endpoint_structure_and_error(monkeypatch):
    import server

    # Simulate a successful response
    class DummyResponse:
        status_code = 200
        text = '{"foo": "bar"}'
        def json(self):
            return {"foo": "bar"}
    monkeypatch.setattr("requests.get", lambda *a, **kw: DummyResponse())
    result = server.get_endpoint("foo/bar")
    assert isinstance(result, dict)
    assert result["foo"] == "bar"

    # Simulate an error response
    class ErrorResponse:
        status_code = 404
        text = "Not found"
        def json(self):
            raise Exception("Should not be called")
    monkeypatch.setattr("requests.get", lambda *a, **kw: ErrorResponse())
    result = server.get_endpoint("foo/bar")
    assert "error" in result
    assert result["error"] == "Request failed: HTTP 404"
    assert "Not found" in result["message"]

def test_allocations_by_person(mock_requests):
    import server
    result = server.allocations_by_person()
    assert result["ok"]

def test_allocations_by_team(mock_requests):
    import server
    result = server.allocations_by_team()
    assert result["ok"]

def test_allocations_by_investment_category(mock_requests):
    import server
    result = server.allocations_by_investment_category()
    assert result["ok"]

def test_allocations_by_investment_category_person(mock_requests):
    import server
    result = server.allocations_by_investment_category_person()
    assert result["ok"]

def test_allocations_by_investment_category_team(mock_requests):
    import server
    result = server.allocations_by_investment_category_team()
    assert result["ok"]

def test_allocations_by_work_category(mock_requests):
    import server
    result = server.allocations_by_work_category()
    assert result["ok"]

def test_allocations_by_work_category_person(mock_requests):
    import server
    result = server.allocations_by_work_category_person()
    assert result["ok"]

def test_allocations_by_work_category_team(mock_requests):
    import server
    result = server.allocations_by_work_category_team()
    assert result["ok"]

def test_allocations_filter_fields(mock_requests):
    import server
    result = server.allocations_filter_fields()
    assert result["ok"]

def test_allocations_summary_by_investment_category(mock_requests):
    import server
    result = server.allocations_summary_by_investment_category()
    assert result["ok"]

def test_allocations_summary_by_work_category(mock_requests):
    import server
    result = server.allocations_summary_by_work_category()
    assert result["ok"]

def test_deliverable_details(mock_requests):
    import server
    result = server.deliverable_details()
    assert result["ok"]

def test_deliverable_scope_and_effort_history(mock_requests):
    import server
    result = server.deliverable_scope_and_effort_history()
    assert result["ok"]

def test_work_categories(mock_requests):
    import server
    result = server.work_categories()
    assert result["ok"]

def test_work_category_contents(mock_requests):
    import server
    result = server.work_category_contents()
    assert result["ok"]

def test_company_metrics(mock_requests):
    import server
    result = server.company_metrics()
    assert result["ok"]

def test_person_metrics(mock_requests):
    import server
    result = server.person_metrics(person_id=[1])
    assert result["ok"]

def test_team_metrics(mock_requests):
    import server
    result = server.team_metrics(team_id=[1])
    assert result["ok"]

def test_team_sprint_summary(mock_requests):
    import server
    result = server.team_sprint_summary(team_id=1)
    assert result["ok"]

def test_unlinked_pull_requests(mock_requests):
    import server
    result = server.unlinked_pull_requests()
    assert result["ok"]

def test_list_engineers(mock_requests):
    import server
    result = server.list_engineers()
    assert result["ok"]

def test_search_people(mock_requests):
    import server
    result = server.search_people()
    assert result["ok"]

def test_list_teams(mock_requests):
    import server
    result = server.list_teams()
    assert result["ok"]

def test_search_teams(mock_requests):
    import server
    result = server.search_teams()
    assert result["ok"]

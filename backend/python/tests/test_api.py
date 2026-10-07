from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app


def test_health_reports_configuration_without_exposing_secrets():
    settings = Settings(
        thingspeak_channel_id="123456",
        thingspeak_read_api_key="do-not-return-this-key",
        internal_api_key="this-is-a-long-internal-key-for-tests",
    )
    with TestClient(create_app(settings, start_poller=False)) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["thingspeakConfigured"] is True
    assert "do-not-return-this-key" not in response.text
    assert "this-is-a-long-internal-key-for-tests" not in response.text


def test_dashboard_requires_bearer_auth_and_uses_consistent_error_shape():
    with TestClient(create_app(Settings(), start_poller=False)) as client:
        response = client.get("/api/v1/dashboard/summary")

    assert response.status_code == 401
    payload = response.json()
    assert payload["status"] == 401
    assert payload["error"] == "Unauthorized"
    assert payload["message"] == "Autenticação Bearer obrigatória."
    assert payload["path"] == "/api/v1/dashboard/summary"


def test_cors_uses_explicit_configured_origin_not_wildcard():
    settings = Settings(cors_allowed_origins="https://frontend.example.test")
    with TestClient(create_app(settings, start_poller=False)) as client:
        response = client.options(
            "/api/v1/dashboard/summary",
            headers={
                "Origin": "https://frontend.example.test",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "Authorization",
            },
        )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "https://frontend.example.test"
    assert response.headers["access-control-allow-origin"] != "*"

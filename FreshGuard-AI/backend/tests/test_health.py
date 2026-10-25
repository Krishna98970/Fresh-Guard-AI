from unittest.mock import Mock

from fastapi.testclient import TestClient
from pymongo.errors import PyMongoError

from app import app
from core.database import get_db


def test_health_endpoint():
    database = Mock()
    app.dependency_overrides[get_db] = lambda: database
    try:
        with TestClient(app) as client:
            response = client.get('/api/health')
        assert response.status_code == 200
        assert response.json()['status'] == 'healthy'
        assert response.json()['database'] == 'connected'
        assert response.json()['produce_model'] == 'loaded'
        assert response.json()['cardboard_model'] == 'loaded'
        database.command.assert_called_once_with('ping')
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_database_connection_failure_returns_cors_readable_error():
    def fail_to_connect():
        raise PyMongoError('database unavailable')

    app.dependency_overrides[get_db] = fail_to_connect
    try:
        with TestClient(app) as client:
            response = client.post(
                '/api/auth/login',
                headers={'Origin': 'http://localhost:3001'},
                json={'warehouse_id': 'WH-MTH-001', 'employee_id': 'EMP-1001', 'password': 'demo123'},
            )
        assert response.status_code == 503
        assert response.json()['detail'].startswith('Database unavailable')
        assert response.headers['access-control-allow-origin'] == 'http://localhost:3001'
    finally:
        app.dependency_overrides.pop(get_db, None)

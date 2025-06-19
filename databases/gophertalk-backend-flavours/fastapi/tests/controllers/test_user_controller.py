import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from app import app  

client = TestClient(app)


@pytest.fixture
def mock_token_header():
    return {"Authorization": "Bearer mockToken"}

@pytest.fixture
def mock_user_dto():
    return {
        "id": 1,
        "user_name": "test_user",
        "first_name": "John",
        "last_name": "Doe",
        "status": 1
    }

@pytest.fixture
def mock_update_dto():
    return {
        "id": 1,
        "user_name": "test_user",
        "first_name": "Jane",
        "last_name": "Smith",
        "status": 1
    }


def test_get_all_users_success(mock_token_header, mock_user_dto):
    users = [mock_user_dto]
    with patch("controllers.user_controller.get_all_users", return_value=users):
        res = client.get("/api/users?limit=10&offset=0", headers=mock_token_header)
        assert res.status_code == 200
        assert res.json() == users


def test_get_all_users_failure(mock_token_header):
    with patch("controllers.user_controller.get_all_users", side_effect=Exception("Service error")):
        res = client.get("/api/users?limit=10&offset=0", headers=mock_token_header)
        assert res.status_code == 400


def test_get_user_by_id_success(mock_token_header, mock_user_dto):
    with patch("controllers.user_controller.get_user_by_id", return_value=mock_user_dto):
        res = client.get("/api/users/1", headers=mock_token_header)
        assert res.status_code == 200
        assert res.json() == mock_user_dto


def test_get_user_by_id_invalid_id(mock_token_header):
    res = client.get("/api/users/abc", headers=mock_token_header)
    assert res.status_code == 422


def test_get_user_by_id_not_found(mock_token_header):
    with patch("controllers.user_controller.get_user_by_id", side_effect=ValueError("Not found")):
        res = client.get("/api/users/2", headers=mock_token_header)
        assert res.status_code == 404


def test_update_user_success(mock_token_header, mock_user_dto, mock_update_dto):
    with patch("controllers.user_controller.update_user", return_value=mock_update_dto):
        res = client.put("/api/users/1", headers=mock_token_header, json=mock_user_dto)
        assert res.status_code == 200
        assert res.json() == mock_update_dto


def test_update_user_invalid_id(mock_token_header):
    res = client.put("/api/users/abc", headers=mock_token_header, json={})
    assert res.status_code == 422


def test_update_user_validation_fail(mock_token_header):
    invalid_dto = {"user_name": "x"}  
    res = client.put("/api/users/1", headers=mock_token_header, json=invalid_dto)
    assert res.status_code == 422


def test_update_user_service_error(mock_token_header,mock_update_dto):
    with patch("controllers.user_controller.update_user", side_effect=Exception("Service error")):
        res = client.put("/api/users/1", headers=mock_token_header, json=mock_update_dto)
        assert res.status_code == 400


def test_delete_user_success(mock_token_header):
    with patch("controllers.user_controller.delete_user", return_value=None):
        res = client.delete("/api/users/1", headers=mock_token_header)
        assert res.status_code == 204


def test_delete_user_invalid_id(mock_token_header):
    res = client.delete("/api/users/abc", headers=mock_token_header)
    assert res.status_code == 422


def test_delete_user_not_found(mock_token_header):
    with patch("controllers.user_controller.delete_user", side_effect=ValueError("Not found")):
        res = client.delete("/api/users/2", headers=mock_token_header)
        assert res.status_code == 404

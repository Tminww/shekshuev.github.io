import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from app import app

client = TestClient(app)


@pytest.fixture
def tokens():
    return {"access_token": "access", "refresh_token": "refresh"}


def test_login_success(tokens):
    login_data = {"user_name": "test_user", "password": "test123!"}

    with patch("controllers.auth_controller.login_service", return_value=tokens) as mock_login:
        response = client.post("/api/auth/login", json=login_data)

    assert response.status_code == 200
    assert response.json() == tokens
    mock_login.assert_called_once_with(login_data)


def test_login_failure():
    login_data = {"user_name": "test_user", "password": "invalid123!"}

    with patch("controllers.auth_controller.login_service", side_effect=ValueError("Wrong password")) as mock_login:
        response = client.post("/api/auth/login", json=login_data)

    assert response.status_code == 401
    assert response.json() == {"detail": "Wrong password"}
    mock_login.assert_called_once_with(login_data)


def test_register_success(tokens):
    register_data = {
        "user_name": "test_user",
        "password": "test123!",
        "password_confirm": "test123!",
        "first_name": "John",
        "last_name": "Doe",
    }

    with patch("controllers.auth_controller.register_service", return_value=tokens) as mock_register:
        response = client.post("/api/auth/register", json=register_data)

    assert response.status_code == 201
    assert response.json() == tokens
    mock_register.assert_called_once_with(register_data)


def test_register_failure():
    register_data = {
        "user_name": "test_user",
        "password": "test123!",
        "password_confirm": "test123!",
        "first_name": "John",
        "last_name": "Doe",
    }

    with patch("controllers.auth_controller.register_service", side_effect=ValueError("User already exists")) as mock_register:
        response = client.post("/api/auth/register", json=register_data)

    assert response.status_code == 401
    assert response.json() == {"detail": "User already exists"}
    mock_register.assert_called_once_with(register_data)

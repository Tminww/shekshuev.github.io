from unittest.mock import patch

import bcrypt
import pytest
from services import auth_service


def test_login_success():
    dto = {
        "user_name": "testuser",
        "password": "password123",
    }

    hashed = bcrypt.hashpw(dto["password"].encode(), bcrypt.gensalt()).decode()
    user = {"id": 1, "user_name": "testuser", "password_hash": hashed}

    with (
        patch("services.auth_service.get_user_by_username", return_value=user),
        patch("services.auth_service.generate_token_pair", return_value={
            "access_token": "access123",
            "refresh_token": "refresh123",
        }),
    ):
        result = auth_service.login(dto)
        assert result == {
            "access_token": "access123",
            "refresh_token": "refresh123",
        }


def test_login_user_not_found():
    dto = {"user_name": "ghost", "password": "123"}

    with patch("services.auth_service.get_user_by_username", side_effect=ValueError("User not found")):
        with pytest.raises(ValueError, match="User not found"):
            auth_service.login(dto)


def test_login_wrong_password():
    dto = {
        "user_name": "testuser",
        "password": "wrongpass",
    }

    correct_hash = bcrypt.hashpw("password123".encode(), bcrypt.gensalt()).decode()
    user = {"id": 1, "user_name": "testuser", "password_hash": correct_hash}

    with patch("services.auth_service.get_user_by_username", return_value=user):
        with patch("bcrypt.checkpw", return_value=False):
            with pytest.raises(ValueError, match="Wrong password"):
                auth_service.login(dto)


def test_register_success():
    dto = {
        "user_name": "newuser",
        "password": "password123",
        "first_name": "New",
        "last_name": "User",
    }

    fake_user = {
        "id": 42,
        "user_name": "newuser",
        "password_hash": "hashed",
        "first_name": "New",
        "last_name": "User",
    }

    with (
        patch("bcrypt.hashpw", return_value=b"hashed_password"),
        patch("services.auth_service.create_user", return_value=fake_user),
        patch("services.auth_service.generate_token_pair", return_value={
            "access_token": "access123",
            "refresh_token": "refresh123",
        }),
    ):
        result = auth_service.register(dto)
        assert result == {
            "access_token": "access123",
            "refresh_token": "refresh123",
        }

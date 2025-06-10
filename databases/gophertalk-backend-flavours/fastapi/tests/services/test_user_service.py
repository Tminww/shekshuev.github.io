from datetime import datetime
from unittest.mock import patch

import pytest
from services import user_service


def test_get_all_users_success():
    users = [
        {
            "id": 1,
            "user_name": "john",
            "first_name": "John",
            "last_name": "Doe",
            "status": 1,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        },
        {
            "id": 2,
            "user_name": "jane",
            "first_name": "Jane",
            "last_name": "Smith",
            "status": 1,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        },
    ]

    with patch("services.user_service.get_all_users", return_value=users) as mock:
        result = user_service.get_all(100, 0)
        assert result == users
        mock.assert_called_once_with(100, 0)


def test_get_all_users_failure():
    with patch("services.user_service.get_all_users", side_effect=Exception("SQL error")) as mock:
        with pytest.raises(Exception, match="SQL error"):
            user_service.get_all(100, 0)
        mock.assert_called_once_with(100, 0)


def test_get_user_by_id_success():
    user = {
        "id": 1,
        "user_name": "john",
        "first_name": "John",
        "last_name": "Doe",
        "status": 1,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    with patch("services.user_service.get_user_by_id", return_value=user) as mock:
        result = user_service.get_by_id(1)
        assert result == user
        mock.assert_called_once_with(1)


def test_get_user_by_id_failure():
    with patch("services.user_service.get_user_by_id", side_effect=Exception("User not found")) as mock:
        with pytest.raises(Exception, match="User not found"):
            user_service.get_by_id(2)
        mock.assert_called_once_with(2)


def test_update_user_success():
    dto = {
        "user_name": "john_updated",
        "first_name": "John",
        "last_name": "Doe",
        "password": "newpassword",
    }

    expected = {
        "id": 1,
        "user_name": "john_updated",
        "first_name": "John",
        "last_name": "Doe",
        "status": 1,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    with (
        patch("services.user_service.update_user", return_value=expected) as mock_update,
        patch("bcrypt.hashpw", return_value=b"hashed_pw") as mock_hash,
    ):
        result = user_service.update(1, dto)
        assert result == expected
        assert mock_update.call_args[0][1]["password_hash"] == b"hashed_pw"
        mock_update.assert_called_once()
        mock_hash.assert_called_once()


def test_update_user_failure():
    with patch("services.user_service.update_user", side_effect=Exception("Update failed")) as mock:
        with pytest.raises(Exception, match="Update failed"):
            user_service.update(2, {"user_name": "ghost"})
        mock.assert_called_once()


def test_delete_user_success():
    with patch("services.user_service.delete_user", return_value=None) as mock:
        result = user_service.delete(1)
        assert result is None
        mock.assert_called_once_with(1)


def test_delete_user_failure():
    with patch("services.user_service.delete_user", side_effect=Exception("Delete error")) as mock:
        with pytest.raises(Exception, match="Delete error"):
            user_service.delete(2)
        mock.assert_called_once_with(2)

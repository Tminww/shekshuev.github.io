import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta

from repositories.user_repository import (
    create_user,
    get_all_users,
    get_user_by_id,
    get_user_by_username,
    update_user,
    delete_user,
)

def normalize_sql(sql: str) -> str:
    return " ".join(sql.lower().split())

@pytest.fixture
def mock_conn():
    with patch("config.db.pool.connection") as mock_conn_context:
        yield mock_conn_context


def test_create_user_success(mock_conn):
    dto = {
        "user_name": "john",
        "first_name": "John",
        "last_name": "Doe",
        "password_hash": "password",
    }
    expected = {
        "id": 1,
        "user_name": "john",
        "password_hash": "password",
        "status": 1,
    }

    mock_cursor = MagicMock()
    mock_cursor.fetchone.return_value = expected
    mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

    result = create_user(dto)

    assert result == expected

def test_create_user_error(mock_conn):
    dto = {
        "user_name": "john",
        "first_name": "John",
        "last_name": "Doe",
        "password_hash": "password",
    }

    fake_error = Exception("insert failed")

    mock_cursor = MagicMock()
    mock_cursor.execute.side_effect = fake_error
    mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

    with pytest.raises(Exception, match="insert failed"):
        create_user(dto)

    sql_called = mock_cursor.execute.call_args[0][0].lower()
    assert "insert into users" in sql_called
    assert "user_name" in sql_called
    assert "password_hash" in sql_called

    params = mock_cursor.execute.call_args[0][1]
    assert params == (
        dto["user_name"],
        dto["first_name"],
        dto["last_name"],
        dto["password_hash"],
    )

def test_get_all_users_success(mock_conn):
    now = datetime.utcnow()
    expected = [{
        "id": 1,
        "user_name": "john",
        "first_name": "John",
        "last_name": "Doe",
        "status": 1,
        "created_at": now,
        "updated_at": now,
    }]

    mock_cursor = MagicMock()
    mock_cursor.fetchall.return_value = expected
    mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

    result = get_all_users(limit=10, offset=0)
    assert result == expected


def test_get_all_users_error(mock_conn):
    mock_cursor = MagicMock()
    mock_cursor.execute.side_effect = Exception("SQL error")
    mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

    with pytest.raises(Exception, match="SQL error"):
        get_all_users(limit=100, offset=0)

    sql_called = mock_cursor.execute.call_args[0][0].lower()

    normalized_sql = normalize_sql(sql_called)
    assert "from users where deleted_at is null" in normalized_sql

    params = mock_cursor.execute.call_args[0][1]
    assert params == (0, 100)


def test_get_user_by_id_success(mock_conn):
    now = datetime.utcnow()
    expected = {
        "user_name": "john",
        "first_name": "John",
        "last_name": "Doe",
        "status": 1,
        "created_at": now,
        "updated_at": now,
    }

    mock_cursor = MagicMock()
    mock_cursor.fetchone.return_value = expected
    mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

    result = get_user_by_id(1)
    assert result == expected


def test_get_user_by_id_not_found(mock_conn):
    mock_cursor = MagicMock()
    mock_cursor.fetchone.return_value = None
    mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

    with pytest.raises(ValueError, match="User not found"):
        get_user_by_id(999)


def test_get_user_by_username_success(mock_conn):
    expected = {
        "user_name": "john",
        "password_hash": "password",
        "status": 1,
    }

    mock_cursor = MagicMock()
    mock_cursor.fetchone.return_value = expected
    mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

    result = get_user_by_username("john")
    assert result == expected


def test_get_user_by_username_not_found(mock_conn):
    mock_cursor = MagicMock()
    mock_cursor.fetchone.return_value = None
    mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

    with pytest.raises(ValueError, match="User not found"):
        get_user_by_username("notfound")


def test_update_user_success(mock_conn):
    now = datetime.utcnow()
    earlier = now - timedelta(hours=1)

    dto = {
        "user_name": "john_updated",
        "first_name": "John",
        "last_name": "Doe",
        "password_hash": "password",
    }

    expected = {
        "id": 1,
        "user_name": "john_updated",
        "first_name": "John",
        "last_name": "Doe",
        "status": 1,
        "created_at": earlier,
        "updated_at": now,
    }

    mock_cursor = MagicMock()
    mock_cursor.fetchone.return_value = expected
    mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

    result = update_user(1, dto)
    assert result == expected


def test_update_user_no_fields(mock_conn):
    with pytest.raises(ValueError, match="No fields to update"):
        update_user(1, {})


def test_update_user_not_found(mock_conn):
    dto = {"user_name": "ghost"}

    mock_cursor = MagicMock()
    mock_cursor.fetchone.return_value = None
    mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

    with pytest.raises(ValueError, match="User not found"):
        update_user(999, dto)


def test_delete_user_success(mock_conn):
    mock_cursor = MagicMock()
    mock_cursor.rowcount = 1
    mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

    assert delete_user(1) is None


def test_delete_user_not_found(mock_conn):
    mock_cursor = MagicMock()
    mock_cursor.rowcount = 0
    mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

    with pytest.raises(ValueError, match="User not found"):
        delete_user(2)

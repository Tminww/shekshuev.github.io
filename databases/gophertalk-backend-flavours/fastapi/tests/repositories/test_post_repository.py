from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest
from psycopg.errors import UniqueViolation
from repositories.post_repository import (create_post, delete_post,
                                          dislike_post, get_all_posts,
                                          get_post_by_id, like_post, view_post)


def normalize_sql(sql: str) -> str:
    return " ".join(sql.lower().split())


@pytest.fixture
def mock_conn():
    with patch("config.db.pool.connection") as mock_conn_context:
        yield mock_conn_context



def test_create_post_success(mock_conn):
    dto = {
        "text": "Lorem ipsum dolor sit amet, consectetur adipiscing",
        "user_id": 1,
        "reply_to_id": None,
    }

    expected = {
        "id": 1,
        "text": dto["text"],
        "created_at": datetime.utcnow(),
        "reply_to_id": None,
    }

    mock_cursor = MagicMock()
    mock_cursor.fetchone.return_value = expected
    mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

    result = create_post(dto)

    assert result == expected

    sql_called = mock_cursor.execute.call_args[0][0].lower()
    normalized_sql = normalize_sql(sql_called)
    assert "insert into posts" in normalized_sql

    params = mock_cursor.execute.call_args[0][1]
    assert params == (dto["text"], dto["user_id"], dto["reply_to_id"])


def test_create_post_error(mock_conn):
    dto = {
        "text": "Lorem ipsum dolor sit amet, consectetur adipiscing",
        "user_id": 1,
        "reply_to_id": None,
    }

    fake_error = Exception("insert failed")

    mock_cursor = MagicMock()
    mock_cursor.execute.side_effect = fake_error
    mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

    with pytest.raises(Exception, match="insert failed"):
        create_post(dto)

    sql_called = mock_cursor.execute.call_args[0][0].lower()
    normalized_sql = normalize_sql(sql_called)
    assert "insert into posts" in normalized_sql

    params = mock_cursor.execute.call_args[0][1]
    assert params == (dto["text"], dto["user_id"], dto["reply_to_id"])

def test_create_post_success(mock_conn):
    dto = {
        "text": "Lorem ipsum dolor sit amet, consectetur adipiscing",
        "user_id": 1,
        "reply_to_id": None,
    }

    expected = {
        "id": 1,
        "text": dto["text"],
        "created_at": datetime.utcnow(),
        "reply_to_id": None,
    }

    mock_cursor = MagicMock()
    mock_cursor.fetchone.return_value = expected
    mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

    result = create_post(dto)

    assert result == expected

    sql_called = mock_cursor.execute.call_args[0][0].lower()
    normalized_sql = normalize_sql(sql_called)
    assert "insert into posts" in normalized_sql

    params = mock_cursor.execute.call_args[0][1]
    assert params == (dto["text"], dto["user_id"], dto["reply_to_id"])


def test_create_post_error(mock_conn):
    dto = {
        "text": "Lorem ipsum dolor sit amet, consectetur adipiscing",
        "user_id": 1,
        "reply_to_id": None,
    }

    fake_error = Exception("insert failed")

    mock_cursor = MagicMock()
    mock_cursor.execute.side_effect = fake_error
    mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

    with pytest.raises(Exception, match="insert failed"):
        create_post(dto)

    sql_called = mock_cursor.execute.call_args[0][0].lower()
    normalized_sql = normalize_sql(sql_called)
    assert "insert into posts" in normalized_sql

    params = mock_cursor.execute.call_args[0][1]
    assert params == (dto["text"], dto["user_id"], dto["reply_to_id"])


def test_get_all_posts_success(mock_conn):
    now = datetime(2025, 4, 24, 20, 55, 53, 21000)

    dto = {
        "user_id": 1,
        "owner_id": 0,
        "limit": 100,
        "offset": 0,
        "reply_to_id": 1,
        "search": "test",
    }

    mock_cursor = MagicMock()
    mock_cursor.fetchall.return_value = [
        {
            "id": 1,
            "text": "Post 1",
            "reply_to_id": None,
            "created_at": now,
            "likes_count": 10,
            "views_count": 100,
            "replies_count": 0,
            "user_liked": True,
            "user_viewed": True,
            "user_id": 1,
            "user_name": "username",
            "first_name": "first",
            "last_name": "last",
        },
        {
            "id": 2,
            "text": "Post 2",
            "reply_to_id": None,
            "created_at": now,
            "likes_count": 5,
            "views_count": 50,
            "replies_count": 2,
            "user_liked": False,
            "user_viewed": True,
            "user_id": 1,
            "user_name": "username",
            "first_name": "first",
            "last_name": "last",
        },
    ]
    mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

    result = get_all_posts(dto)

    assert result == [
        {
            "id": 1,
            "text": "Post 1",
            "reply_to_id": None,
            "created_at": now,
            "likes_count": 10,
            "views_count": 100,
            "replies_count": 0,
            "user_liked": True,
            "user_viewed": True,
            "user": {
                "id": 1,
                "user_name": "username",
                "first_name": "first",
                "last_name": "last",
            },
        },
        {
            "id": 2,
            "text": "Post 2",
            "reply_to_id": None,
            "created_at": now,
            "likes_count": 5,
            "views_count": 50,
            "replies_count": 2,
            "user_liked": False,
            "user_viewed": True,
            "user": {
                "id": 1,
                "user_name": "username",
                "first_name": "first",
                "last_name": "last",
            },
        },
    ]

    sql_called = mock_cursor.execute.call_args[0][0].lower()
    normalized = normalize_sql(sql_called)
    assert "select" in normalized

    params = mock_cursor.execute.call_args[0][1]
    assert params[0] == dto["user_id"]


def test_get_all_posts_error(mock_conn):
    dto = {
        "user_id": 1,
        "owner_id": 0,
        "limit": 100,
        "offset": 0,
        "reply_to_id": 1,
        "search": "test",
    }

    mock_cursor = MagicMock()
    mock_cursor.execute.side_effect = Exception("query failed")
    mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

    with pytest.raises(Exception, match="query failed"):
        get_all_posts(dto)

    sql_called = mock_cursor.execute.call_args[0][0].lower()
    normalized = normalize_sql(sql_called)
    assert "select" in normalized

    params = mock_cursor.execute.call_args[0][1]
    assert params[0] == dto["user_id"]


def test_get_post_by_id_success(mock_conn):
    user_id = 1
    post_id = 1
    now = datetime.utcnow()

    row = {
        "post_id": post_id,
        "text": "Lorem ipsum dolor sit amet, consectetur adipiscing",
        "reply_to_id": None,
        "created_at": now,
        "user_id": user_id,
        "user_name": "username",
        "first_name": "first_name",
        "last_name": "last_name",
        "likes_count": 10,
        "views_count": 100,
        "replies_count": 0,
        "user_liked": True,
        "user_viewed": True,
    }

    mock_cursor = MagicMock()
    mock_cursor.fetchone.return_value = row
    mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

    result = get_post_by_id(post_id, user_id)

    assert result == {
        "id": row["post_id"],
        "text": row["text"],
        "reply_to_id": row["reply_to_id"],
        "created_at": row["created_at"],
        "likes_count": row["likes_count"],
        "views_count": row["views_count"],
        "replies_count": row["replies_count"],
        "user_liked": row["user_liked"],
        "user_viewed": row["user_viewed"],
        "user": {
            "id": row["user_id"],
            "user_name": row["user_name"],
            "first_name": row["first_name"],
            "last_name": row["last_name"],
        },
    }

    sql_called = mock_cursor.execute.call_args[0][0].lower()
    assert "select" in normalize_sql(sql_called)

    params = mock_cursor.execute.call_args[0][1]
    assert params == (user_id, user_id, post_id)


def test_get_post_by_id_not_found(mock_conn):
    mock_cursor = MagicMock()
    mock_cursor.fetchone.return_value = None
    mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

    with pytest.raises(Exception, match="Post not found"):
        get_post_by_id(999, 1)

    sql_called = mock_cursor.execute.call_args[0][0].lower()
    assert "select" in normalize_sql(sql_called)

    params = mock_cursor.execute.call_args[0][1]
    assert params == (1, 1, 999)

def test_delete_post_success(mock_conn):
    post_id = 1
    owner_id = 1

    mock_cursor = MagicMock()
    mock_cursor.rowcount = 1
    mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

    assert delete_post(post_id, owner_id) is None

    sql_called = mock_cursor.execute.call_args[0][0].lower()
    normalized_sql = normalize_sql(sql_called)
    assert "update posts set deleted_at = now()" in normalized_sql
    assert "where id =" in normalized_sql and "user_id =" in normalized_sql

    params = mock_cursor.execute.call_args[0][1]
    assert params == (post_id, owner_id)


def test_delete_post_not_found(mock_conn):
    post_id = 2
    owner_id = 1

    mock_cursor = MagicMock()
    mock_cursor.rowcount = 0
    mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

    with pytest.raises(Exception, match="Post not found or already deleted"):
        delete_post(post_id, owner_id)

    sql_called = mock_cursor.execute.call_args[0][0].lower()
    normalized_sql = normalize_sql(sql_called)
    assert "update posts set deleted_at = now()" in normalized_sql

    params = mock_cursor.execute.call_args[0][1]
    assert params == (post_id, owner_id)

def test_view_post_success(mock_conn):
    post_id = 1
    user_id = 1

    mock_cursor = MagicMock()
    mock_cursor.rowcount = 1
    mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

    assert view_post(post_id, user_id) is None

    sql_called = mock_cursor.execute.call_args[0][0].lower()
    normalized_sql = normalize_sql(sql_called)
    assert "insert into views (post_id, user_id)" in normalized_sql

    params = mock_cursor.execute.call_args[0][1]
    assert params == (post_id, user_id)


def test_view_post_error_sql(mock_conn):
    post_id = 2
    user_id = 1

    mock_cursor = MagicMock()
    mock_cursor.execute.side_effect = Exception("insert failed")
    mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

    with pytest.raises(Exception, match="insert failed"):
        view_post(post_id, user_id)

    sql_called = mock_cursor.execute.call_args[0][0].lower()
    normalized_sql = normalize_sql(sql_called)
    assert "insert into views (post_id, user_id)" in normalized_sql

    params = mock_cursor.execute.call_args[0][1]
    assert params == (post_id, user_id)


def test_view_post_already_viewed(mock_conn):
    post_id = 3
    user_id = 1

    mock_cursor = MagicMock()
    mock_cursor.execute.side_effect = UniqueViolation(
        'duplicate key value violates unique constraint "pk__views"'
    )
    mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

    with pytest.raises(ValueError, match="Post already viewed"):
        view_post(post_id, user_id)


def test_like_post_success(mock_conn):
    post_id = 1
    user_id = 1

    mock_cursor = MagicMock()
    mock_cursor.rowcount = 1
    mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

    assert like_post(post_id, user_id) is None

    sql_called = mock_cursor.execute.call_args[0][0].lower()
    normalized_sql = normalize_sql(sql_called)
    assert "insert into likes (post_id, user_id)" in normalized_sql

    params = mock_cursor.execute.call_args[0][1]
    assert params == (post_id, user_id, post_id)


def test_like_post_error(mock_conn):
    post_id = 2
    user_id = 1

    mock_cursor = MagicMock()
    mock_cursor.execute.side_effect = Exception("insert failed")
    mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

    with pytest.raises(Exception, match="insert failed"):
        like_post(post_id, user_id)

    sql_called = mock_cursor.execute.call_args[0][0].lower()
    normalized_sql = normalize_sql(sql_called)
    assert "insert into likes (post_id, user_id)" in normalized_sql

    params = mock_cursor.execute.call_args[0][1]
    assert params == (post_id, user_id, post_id)


def test_like_post_already_liked(mock_conn):
    post_id = 3
    user_id = 1

    mock_cursor = MagicMock()
    mock_cursor.execute.side_effect = UniqueViolation(
        'duplicate key value violates unique constraint "pk__likes"'
    )
    mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

    with pytest.raises(ValueError, match="Post already liked"):
        like_post(post_id, user_id)

def test_dislike_post_success(mock_conn):
    post_id = 1
    user_id = 1

    mock_cursor = MagicMock()
    mock_cursor.rowcount = 1
    mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

    assert dislike_post(post_id, user_id) is None

    sql_called = mock_cursor.execute.call_args[0][0].lower()
    normalized_sql = normalize_sql(sql_called)
    assert "delete from likes where post_id = %s and user_id = %s" in normalized_sql

    params = mock_cursor.execute.call_args[0][1]
    assert params == (post_id, user_id, post_id)


def test_dislike_post_error(mock_conn):
    post_id = 2
    user_id = 1

    mock_cursor = MagicMock()
    mock_cursor.execute.side_effect = Exception("delete failed")
    mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

    with pytest.raises(Exception, match="delete failed"):
        dislike_post(post_id, user_id)

    sql_called = mock_cursor.execute.call_args[0][0].lower()
    normalized_sql = normalize_sql(sql_called)
    assert "delete from likes where post_id = %s and user_id = %s" in normalized_sql

    params = mock_cursor.execute.call_args[0][1]
    assert params == (post_id, user_id, post_id)


def test_dislike_post_not_found(mock_conn):
    post_id = 3
    user_id = 1

    mock_cursor = MagicMock()
    mock_cursor.rowcount = 0
    mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

    with pytest.raises(Exception, match="Post not found"):
        dislike_post(post_id, user_id)

    sql_called = mock_cursor.execute.call_args[0][0].lower()
    normalized_sql = normalize_sql(sql_called)
    assert "delete from likes where post_id = %s and user_id = %s" in normalized_sql

    params = mock_cursor.execute.call_args[0][1]
    assert params == (post_id, user_id, post_id)

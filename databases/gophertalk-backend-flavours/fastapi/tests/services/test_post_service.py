from unittest.mock import patch

import pytest
from services import post_service


def test_get_all_posts_success():
    posts = [{"id": 1, "text": "post1"}, {"id": 2, "text": "post2"}]
    with patch("services.post_service.get_all_posts", return_value=posts) as mock:
        result = post_service.get_all_posts({"user_id": 1, "limit": 100, "offset": 0})
        assert result == posts
        mock.assert_called_once()


def test_get_all_posts_error():
    with patch("services.post_service.get_all_posts", side_effect=Exception("DB error")) as mock:
        with pytest.raises(Exception, match="DB error"):
            post_service.get_all_posts({"user_id": 1, "limit": 100, "offset": 0})
        mock.assert_called_once()


def test_create_post_success():
    post = {"id": 1, "text": "new post"}
    with patch("services.post_service.create_post", return_value=post) as mock:
        result = post_service.create_post({"text": "new post", "user_id": 1})
        assert result == post
        mock.assert_called_once()


def test_create_post_error():
    with patch("services.post_service.create_post", side_effect=Exception("Insert error")) as mock:
        with pytest.raises(Exception, match="Insert error"):
            post_service.create_post({"text": "new post", "user_id": 1})
        mock.assert_called_once()


def test_delete_post_success():
    with patch("services.post_service.delete_post", return_value=None) as mock:
        assert post_service.delete_post(1, 0) is None
        mock.assert_called_once_with(1, 0)


def test_delete_post_error():
    with patch("services.post_service.delete_post", side_effect=Exception("Delete error")) as mock:
        with pytest.raises(Exception, match="Delete error"):
            post_service.delete_post(2, 0)
        mock.assert_called_once_with(2, 0)


def test_view_post_success():
    with patch("services.post_service.view_post", return_value=None) as mock:
        assert post_service.view_post(1, 0) is None
        mock.assert_called_once_with(1, 0)


def test_view_post_error():
    with patch("services.post_service.view_post", side_effect=Exception("View error")) as mock:
        with pytest.raises(Exception, match="View error"):
            post_service.view_post(2, 0)
        mock.assert_called_once_with(2, 0)


def test_like_post_success():
    with patch("services.post_service.like_post", return_value=None) as mock:
        assert post_service.like_post(1, 0) is None
        mock.assert_called_once_with(1, 0)


def test_like_post_error():
    with patch("services.post_service.like_post", side_effect=Exception("Like error")) as mock:
        with pytest.raises(Exception, match="Like error"):
            post_service.like_post(2, 0)
        mock.assert_called_once_with(2, 0)


def test_dislike_post_success():
    with patch("services.post_service.dislike_post", return_value=None) as mock:
        assert post_service.dislike_post(1, 0) is None
        mock.assert_called_once_with(1, 0)


def test_dislike_post_error():
    with patch("services.post_service.dislike_post", side_effect=Exception("Dislike error")) as mock:
        with pytest.raises(Exception, match="Dislike error"):
            post_service.dislike_post(2, 0)
        mock.assert_called_once_with(2, 0)

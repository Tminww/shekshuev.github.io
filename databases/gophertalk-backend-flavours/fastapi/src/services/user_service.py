import bcrypt
from repositories.user_repository import (delete_user, get_all_users,
                                          get_user_by_id, update_user)


def get_all(limit: int, offset: int) -> list[dict]:
    return get_all_users(limit, offset)


def get_by_id(user_id: int) -> dict:
    return get_user_by_id(user_id)


def update(user_id: int, dto: dict) -> dict:
    update_fields = dict(dto)

    if "password" in update_fields:
        update_fields["password_hash"] = bcrypt.hashpw(
            update_fields["password"].encode(), bcrypt.gensalt()
        )
        del update_fields["password"]

    return update_user(user_id, update_fields)


def delete(user_id: int) -> None:
    return delete_user(user_id)

from repositories import post_repository


def get_all_posts(filter_dto: dict) -> list[dict]:
    return post_repository.get_all_posts(filter_dto)


def create_post(create_dto: dict) -> dict:
    return post_repository.create_post(create_dto)


def delete_post(post_id: int, owner_id: int) -> None:
    return post_repository.delete_post(post_id, owner_id)


def view_post(post_id: int, user_id: int) -> None:
    return post_repository.view_post(post_id, user_id)


def like_post(post_id: int, user_id: int) -> None:
    return post_repository.like_post(post_id, user_id)


def dislike_post(post_id: int, user_id: int) -> None:
    return post_repository.dislike_post(post_id, user_id)

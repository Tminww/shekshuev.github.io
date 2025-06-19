from config.db import pool
from psycopg.errors import UniqueViolation
from psycopg.rows import dict_row


def create_post(dto: dict) -> dict:
    query = """
        INSERT INTO posts (text, user_id, reply_to_id)
        VALUES (%s, %s, %s)
        RETURNING id, text, user_id, reply_to_id, created_at;
    """
    values = (
        dto["text"],
        dto["user_id"],
        dto.get("reply_to_id"),  
    )

    with pool.connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, values)
            return cur.fetchone()


def get_all_posts(dto: dict) -> list[dict]:
    params = [dto["user_id"]]
    query = """
        WITH likes_count AS (
            SELECT post_id, COUNT(*) AS likes_count
            FROM likes GROUP BY post_id
        ),
        views_count AS (
            SELECT post_id, COUNT(*) AS views_count
            FROM views GROUP BY post_id
        ),
        replies_count AS (
            SELECT reply_to_id, COUNT(*) AS replies_count
            FROM posts WHERE reply_to_id IS NOT NULL GROUP BY reply_to_id
        )
        SELECT
            p.id, p.text, p.reply_to_id, p.created_at,
            u.id AS user_id, u.user_name, u.first_name, u.last_name,
            COALESCE(lc.likes_count, 0) AS likes_count,
            COALESCE(vc.views_count, 0) AS views_count,
            COALESCE(rc.replies_count, 0) AS replies_count,
            CASE WHEN l.user_id IS NOT NULL THEN true ELSE false END AS user_liked,
            CASE WHEN v.user_id IS NOT NULL THEN true ELSE false END AS user_viewed
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN likes_count lc ON p.id = lc.post_id
        LEFT JOIN views_count vc ON p.id = vc.post_id
        LEFT JOIN replies_count rc ON p.id = rc.reply_to_id
        LEFT JOIN likes l ON l.post_id = p.id AND l.user_id = %s
        LEFT JOIN views v ON v.post_id = p.id AND v.user_id = %s
        WHERE p.deleted_at IS NULL
    """

    if "search" in dto and dto["search"]:
        query += f" AND p.text ILIKE %s"
        params.append(f"%{dto['search']}%")

    if "owner_id" in dto and dto["owner_id"]:
        query += f" AND p.user_id = %s"
        params.append(dto["owner_id"])

    if "reply_to_id" in dto and dto["reply_to_id"]:
        query += f" AND p.reply_to_id = %s ORDER BY p.created_at ASC"
        params.append(dto["reply_to_id"])
    else:
        query += " AND p.reply_to_id IS NULL ORDER BY p.created_at DESC"

    query += " OFFSET %s LIMIT %s"
    params.extend([dto["offset"], dto["limit"]])

    with pool.connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, params)
            rows = cur.fetchall()

    return [
        {
            "id": row["id"],
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
        for row in rows
    ]


def get_post_by_id(post_id: int, user_id: int) -> dict:
    query = """
        WITH likes_count AS (
            SELECT post_id, COUNT(*) AS likes_count
            FROM likes
            GROUP BY post_id
        ),
        views_count AS (
            SELECT post_id, COUNT(*) AS views_count
            FROM views
            GROUP BY post_id
        ),
        replies_count AS (
            SELECT reply_to_id, COUNT(*) AS replies_count
            FROM posts
            WHERE reply_to_id IS NOT NULL
            GROUP BY reply_to_id
        )
        SELECT
            p.id AS post_id,
            p.text,
            p.reply_to_id,
            p.created_at,
            u.id AS user_id,
            u.user_name,
            u.first_name,
            u.last_name,
            COALESCE(lc.likes_count, 0) AS likes_count,
            COALESCE(vc.views_count, 0) AS views_count,
            COALESCE(rc.replies_count, 0) AS replies_count,
            CASE WHEN l.user_id IS NOT NULL THEN true ELSE false END AS user_liked,
            CASE WHEN v.user_id IS NOT NULL THEN true ELSE false END AS user_viewed
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN likes_count lc ON p.id = lc.post_id
        LEFT JOIN views_count vc ON p.id = vc.post_id
        LEFT JOIN replies_count rc ON p.id = rc.reply_to_id
        LEFT JOIN likes l ON l.post_id = p.id AND l.user_id = %s
        LEFT JOIN views v ON v.post_id = p.id AND v.user_id = %s
        WHERE p.id = %s AND p.deleted_at IS NULL;
    """
    params = (user_id, user_id, post_id)

    with pool.connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, params)
            row = cur.fetchone()

            if row is None:
                raise ValueError("Post not found")

            return {
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
        
def delete_post(post_id: int, owner_id: int) -> None:
    query = """
        UPDATE posts
        SET deleted_at = NOW()
        WHERE id = %s AND user_id = %s AND deleted_at IS NULL;
    """
    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (post_id, owner_id))
            if cur.rowcount == 0:
                raise ValueError("Post not found or already deleted")
            

def view_post(post_id: int, user_id: int) -> None:
    query = """
        INSERT INTO views (post_id, user_id)
        VALUES (%s, %s);
    """
    try:
        with pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (post_id, user_id))
                if cur.rowcount == 0:
                    raise ValueError("Post not found")
    except UniqueViolation as err:
        if "pk__views" in str(err):
            raise ValueError("Post already viewed") from err
        raise


def like_post(post_id: int, user_id: int) -> None:
    query = """
        INSERT INTO likes (post_id, user_id)
        SELECT %s, %s
    """

    try:
        with pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (post_id, user_id))
                if cur.rowcount == 0:
                    raise ValueError("Post not found")
    except UniqueViolation as err:
        if "pk__likes" in str(err):
            raise ValueError("Post already liked") from err
        raise
    

def dislike_post(post_id: int, user_id: int) -> None:
    query = """
        DELETE FROM likes
        WHERE post_id = %s AND user_id = %s
    """

    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (post_id, user_id))
            if cur.rowcount == 0:
                raise ValueError("Post not found")


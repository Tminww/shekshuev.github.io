from config.db import pool
from psycopg.rows import dict_row


def create_user(dto: dict) -> dict:
    query = """
        INSERT INTO users (user_name, first_name, last_name, password_hash)
        VALUES (%s, %s, %s, %s)
        RETURNING id, user_name, password_hash, status;
    """
    values = (
        dto["user_name"],
        dto["first_name"],
        dto["last_name"],
        dto["password_hash"],
    )

    with pool.connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, values)
            return cur.fetchone()
        
def get_all_users(limit: int, offset: int) -> list[dict]:
    query = """
        SELECT id, user_name, first_name, last_name, status, created_at, updated_at
        FROM users
        WHERE deleted_at IS NULL
        OFFSET %s LIMIT %s;
    """
    params = (offset, limit)

    with pool.connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, params)
            return cur.fetchall()
        
def get_user_by_id(user_id: int) -> dict:
    query = """
        SELECT user_name, first_name, last_name, status, created_at, updated_at
        FROM users
        WHERE id = %s AND deleted_at IS NULL;
    """
    with pool.connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, (user_id,))
            result = cur.fetchone()

            if result is None:
                raise ValueError("User not found")
            return result
        
def get_user_by_username(user_name: str) -> dict:
    query = """
        SELECT user_name, password_hash, status
        FROM users
        WHERE user_name = %s AND deleted_at IS NULL;
    """
    with pool.connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, (user_name,))
            result = cur.fetchone()

            if result is None:
                raise ValueError("User not found")
            return result
        
def update_user(user_id: int, dto: dict) -> dict:
    fields = []
    values = []

    if "password_hash" in dto:
        fields.append("password_hash = %s")
        values.append(dto["password_hash"])
    if "user_name" in dto:
        fields.append("user_name = %s")
        values.append(dto["user_name"])
    if "first_name" in dto:
        fields.append("first_name = %s")
        values.append(dto["first_name"])
    if "last_name" in dto:
        fields.append("last_name = %s")
        values.append(dto["last_name"])

    if not fields:
        raise ValueError("No fields to update")

    fields.append("updated_at = NOW()")
    values.append(user_id)

    query = f"""
        UPDATE users
        SET {", ".join(fields)}
        WHERE id = %s AND deleted_at IS NULL
        RETURNING id, user_name, first_name, last_name, status, created_at, updated_at;
    """

    with pool.connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, values)
            result = cur.fetchone()

            if result is None:
                raise ValueError("User not found")

            return result

def delete_user(user_id: int) -> None:
    query = """
        UPDATE users
        SET deleted_at = NOW()
        WHERE id = %s AND deleted_at IS NULL;
    """

    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (user_id,))
            if cur.rowcount == 0:
                raise ValueError("User not found")
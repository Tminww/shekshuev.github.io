from os import getenv

from fastapi import Depends, HTTPException, Request
from jose import JWTError, jwt
from pydantic import BaseModel

JWT_SECRET = getenv("ACCESS_TOKEN_SECRET")
ALGORITHM = "HS256"

class TokenPayload(BaseModel):
    sub: str  # ID пользователя
    exp: int  # время жизни токена

def get_current_user(request: Request) -> TokenPayload:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")

    token = auth_header[7:]  # убираем "Bearer "

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        user = TokenPayload(**payload)
        request.state.user = user 
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def verify_same_user(user_id: int, token: TokenPayload = Depends(get_current_user)):
    if int(token.sub) != int(user_id):
        raise HTTPException(status_code=401, detail="Forbidden")
    return token

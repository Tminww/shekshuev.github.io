from fastapi import APIRouter, HTTPException, status
from dto.auth_dto import LoginDTO, RegisterDTO
from services.auth_service import login as login_service, register as register_service

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login")
def login(dto: LoginDTO):
    try:
        tokens = login_service(dto.model_dump())
        return tokens
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

@router.post("/register", status_code=201)
def register(dto: RegisterDTO):
    try:
        tokens = register_service(dto.model_dump())
        return tokens
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
from fastapi import APIRouter, HTTPException, Query, Path, status
from typing import List

from dto.user_dto import UpdateUserDTO, ReadUserDTO
from services.user_service import (
    get_all_users,
    get_user_by_id,
    update_user,
    delete_user,
)

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/", response_model=List[ReadUserDTO])
def get_all(limit: int = Query(10, ge=1), offset: int = Query(0, ge=0)):
    try:
        return get_all_users(limit, offset)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{user_id}", response_model=ReadUserDTO)
def get_by_id(user_id: int = Path(..., gt=0)):
    try:
        return get_user_by_id(user_id)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.put("/{user_id}", response_model=ReadUserDTO)
def update_by_id(user_id: int, dto: UpdateUserDTO):
    try:
        return update_user(user_id, dto.model_dump())
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_by_id(user_id: int = Path(..., gt=0)):
    try:
        delete_user(user_id)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

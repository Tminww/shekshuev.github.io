from pydantic import BaseModel, Field, validator
import regex as re 

def username_validator(value: str) -> str:
    if not re.match(r"^[a-zA-Z0-9_]{5,30}$", value):
        raise ValueError("Must be alphanumeric or underscore (5-30 characters)")
    if re.match(r"^[0-9]", value):
        raise ValueError("Must start with a letter")
    return value

def password_validator(value: str) -> str:
    if not re.match(r"^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&]).{5,30}$", value):
        raise ValueError("Must contain letter, number and special character (5-30 characters)")
    return value

def name_validator(value: str) -> str:
    if not re.match(r"^[\p{L}]+$", value, re.UNICODE):
        raise ValueError("Only letters allowed")
    return value

class LoginDTO(BaseModel):
    user_name: str = Field(..., min_length=5, max_length=30)
    password: str = Field(..., min_length=5, max_length=30)

    _validate_username = validator("user_name", allow_reuse=True)(username_validator)
    _validate_password = validator("password", allow_reuse=True)(password_validator)

class RegisterDTO(LoginDTO):
    password_confirm: str = Field(..., min_length=5, max_length=30)
    first_name: str = Field(..., min_length=1, max_length=30)
    last_name: str = Field(..., min_length=1, max_length=30)

    _validate_password_confirm = validator("password_confirm", allow_reuse=True)(password_validator)
    _validate_first_name = validator("first_name", allow_reuse=True)(name_validator)
    _validate_last_name = validator("last_name", allow_reuse=True)(name_validator)

    @validator("password_confirm")
    def passwords_match(cls, v, values):
        if "password" in values and v != values["password"]:
            raise ValueError("Passwords must match")
        return v
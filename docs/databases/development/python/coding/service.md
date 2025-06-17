# Разработка функционального слоя web-приложения

На предыдущем этапе мы реализовали слой репозиториев — прямой доступ к данным. Теперь переходим к следующему этапу архитектуры — функциональному слою, или слою логики приложения. Его часто называют сервисным, так как он содержит "сервисы" — модули, реализующие ключевые действия с данными.

**Зачем нужен функциональный слой?**

Функциональный слой изолирует логику работы приложения от деталей хранения данных (репозитории) и от деталей транспортного уровня (например, HTTP-запросов). Такой подход помогает:

- Повысить переиспользуемость логики — сервис можно вызывать не только из контроллера, но и, например, из фоновой задачи;

- Упростить тестирование — сервисы можно протестировать отдельно от HTTP и базы данных;

- Улучшить читаемость кода — каждый модуль занимается своей задачей;

У- простить совместную разработку — разные разработчики могут работать над контроллерами и сервисами независимо.

**Какие сервисы мы реализуем?**

- В нашем приложении GopherTalk мы реализуем три ключевых сервиса:

- `auth_service` — регистрация, вход в систему, генерация токенов.

- `user_service` — управление пользователями (поиск, обновление, удаление).

- `post_service` — работа с постами (создание, получение, лайки, просмотры и удаление).

Каждый из этих сервисов будет использовать соответствующий репозиторий и, при необходимости, вспомогательные функции (например, для работы с паролями или токенами).

## Разработка сервиса авторизации

Этот сервис отвечает за регистрацию, вход пользователя и генерацию пары токенов. Он взаимодействует с репозиторием пользователей и вспомогательными утилитами для работы с паролями и JWT.

::: details Что такое JWT?

JSON Web Token (JWT) — это открытый стандарт (RFC 7519), представляющий собой компактный и автономный способ безопасной передачи информации между участниками в виде JSON-объекта. Токен подписывается цифровой подписью, что позволяет проверить подлинность и целостность данных. JWT состоит из трёх частей: заголовка (header), полезной нагрузки (payload) и подписи (signature), каждая из которых кодируется в Base64Url и разделяется точками.

JWT — это строка, которая содержит закодированную информацию о пользователе и других данных, подписанную с помощью секретного ключа или пары публичного/приватного ключей. Это позволяет удостовериться, что токен не был подделан и что отправитель — тот, за кого себя выдает.

**Преимущества JWT**

- **Самодостаточность**: JWT содержит всю необходимую информацию внутри себя, что позволяет проверять токен локально без обращения к базе данных или централизованному хранилищу сессий, улучшая производительность и масштабируемость.
- **Кросс-платформенность**: JWT можно использовать в разных языках программирования и средах, что удобно для распределённых систем.
- **Гибкость**: в токене можно хранить дополнительную информацию, например, роли пользователя, время действия токена и другие пользовательские данные.
- **Удобство для Single Sign-On (SSO)**: благодаря компактности и возможности использования между разными доменами JWT широко применяется для единого входа в системы.
- **Безопасность подписи**: цифровая подпись обеспечивает целостность и аутентичность данных, что предотвращает подделку токена.

**Недостатки JWT**

- **Отсутствие встроенного механизма отзыва**: JWT не поддерживает отзыв токенов по умолчанию, что может быть проблемой при необходимости немедленно аннулировать доступ.
- **Риск при утечке**: если секретный ключ или приватный ключ подписи скомпрометированы, злоумышленник может создавать поддельные токены.
- **Сложность управления сессиями**: в отличие от классических сессионных куки, JWT требует дополнительной логики для управления жизненным циклом сессии и безопасным хранением на клиенте.
- **Не всегда проще в использовании**: несмотря на популярность, JWT не всегда проще в реализации и эксплуатации, особенно для начинающих разработчиков.

**Использования JWT**

- **Авторизация**: самый распространённый сценарий — после входа пользователя сервер выдаёт JWT, который клиент отправляет с каждым запросом для доступа к защищённым ресурсам.
- **Обмен информацией между сервисами**: JWT используется для безопасной передачи информации между различными системами, где важно удостовериться в подлинности отправителя и целостности данных.
- **Single Sign-On (SSO)**: благодаря компактности и независимости от конкретного сервера JWT подходит для реализации единого входа в несколько приложений или доменов.
- **Микросервисная архитектура**: в распределённых системах JWT позволяет каждому сервису самостоятельно проверять права пользователя без централизованного хранилища сессий.

**JWT состоит из трёх частей, разделённых точками (`.`):**

- **Header (Заголовок)**  
  Содержит метаданные о токене: тип токена (обычно "JWT") и используемый алгоритм подписи (например, HS256, RS256). Это JSON-объект, закодированный в Base64Url.

- **Payload (Полезная нагрузка)**  
  Содержит утверждения (claims) — данные, которые передаются в токене, например, идентификатор пользователя, роли, время жизни токена и другие пользовательские данные. Также JSON-объект, закодированный в Base64Url.

- **Signature (Подпись)**  
  Криптографическая подпись, которая создаётся на основе заголовка и полезной нагрузки с использованием секретного ключа или пары ключей. Позволяет проверить целостность и подлинность токена.

:::

В папке `src` проекта создайте папку `services`, а в ней файл `auth_service.py`, и поместите туда следующий код:

```python
import os
from datetime import datetime, timedelta

import bcrypt
from jose import jwt
from repositories.user_repository import create_user, get_user_by_username

ACCESS_SECRET = os.getenv("ACCESS_TOKEN_SECRET", "dev_secret")
REFRESH_SECRET = os.getenv("REFRESH_TOKEN_SECRET", "dev_refresh")
ACCESS_EXPIRES = int(os.getenv("ACCESS_TOKEN_EXPIRES", "3600"))       # 1 час по дефолту
REFRESH_EXPIRES = int(os.getenv("REFRESH_TOKEN_EXPIRES", "86400"))   # 24 часа по дефолту


def login(dto: dict) -> dict:
    user = get_user_by_username(dto["user_name"])
    if not user:
        raise ValueError("User not found")

    if not bcrypt.checkpw(dto["password"].encode(), user["password_hash"].encode()):
        raise ValueError("Wrong password")

    return generate_token_pair(user["id"])


def register(dto: dict) -> dict:
    password_hash = bcrypt.hashpw(dto["password"].encode(), bcrypt.gensalt()).decode()

    user_data = {
        "user_name": dto["user_name"],
        "password_hash": password_hash,
        "first_name": dto["first_name"],
        "last_name": dto["last_name"],
    }

    try:
        user = create_user(user_data)
    except errors.UniqueViolation:
        raise ValueError("User already exists")
    return generate_token_pair(user["id"])


def generate_token_pair(user_id: int) -> dict:
    now = datetime.utcnow()

    access_token = jwt.encode(
        {"sub": str(user_id), "exp": now + timedelta(seconds=ACCESS_EXPIRES)},
        ACCESS_SECRET,
        algorithm="HS256"
    )

    refresh_token = jwt.encode(
        {"sub": str(user_id), "exp": now + timedelta(seconds=REFRESH_EXPIRES)},
        REFRESH_SECRET,
        algorithm="HS256"
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
    }

```

#### Описание методов

**`login(dto)`**

- Ищет пользователя по имени.

- Проверяет правильность пароля.

- Возвращает токены, если всё корректно.

**`register(dto)`**

- Хеширует пароль.

- Создаёт нового пользователя.

- Возвращает токены для нового пользователя.

**`generate_token_pair(user_id)`**

- Генерирует два токена:

  - access token — для быстрой аутентификации;

  - refresh token — для обновления access token без повторного входа.

- Использует секреты и время жизни токенов из конфигурации.

В сервисе авторизации для создания JWT-токенов используются переменные окружения. Они позволяют гибко настраивать параметры безопасности без изменения кода приложения.

| Переменная              | Текущее значение                 | Описание                                                          |
| :---------------------- | :------------------------------- | :---------------------------------------------------------------- |
| `ACCESS_TOKEN_EXPIRES`  | `3600`                           | Срок действия access-токена (время жизни). Указывается в секундах |
| `REFRESH_TOKEN_EXPIRES` | `86400`                          | Срок действия refresh-токена. Обычно длиннее, чем у access-токена |
| `ACCESS_TOKEN_SECRET`   | `super_secret_access_token_key`  | Секретная строка для подписания access-токенов                    |
| `REFRESH_TOKEN_SECRET`  | `super_secret_refresh_token_key` | Секретная строка для подписания refresh-токенов                   |

В нашем приложении используется библиотека `python-jose` для создания и валидации JWT-токенов.
По умолчанию мы применяем алгоритм HS256 (HMAC + SHA-256) — это симметричный алгоритм, при котором для подписи и проверки токена используется один и тот же секретный ключ.

**Важно:**

- Для `access_token` и `refresh_token` мы используем разные секретные ключи, чтобы повысить безопасность и упростить отзыв токенов.
- Срок действия токенов задаётся в секундах через переменные окружения

## Тестирование сервиса авторизации

Сразу напишем тесты для `auth_service`, чтобы проверить его работу. Для этого в папке `tests` создайте папку `services`, а в ней файл `test_auth_service.py`. Поместите в него код ниже.

::: details Unit-тесты auth_service

```python
from unittest.mock import patch

import bcrypt
import pytest
from services import auth_service


def test_login_success():
    dto = {
        "user_name": "testuser",
        "password": "password123",
    }

    hashed = bcrypt.hashpw(dto["password"].encode(), bcrypt.gensalt()).decode()
    user = {"id": 1, "user_name": "testuser", "password_hash": hashed}

    with (
        patch("services.auth_service.get_user_by_username", return_value=user),
        patch("services.auth_service.generate_token_pair", return_value={
            "access_token": "access123",
            "refresh_token": "refresh123",
        }),
    ):
        result = auth_service.login(dto)
        assert result == {
            "access_token": "access123",
            "refresh_token": "refresh123",
        }


def test_login_user_not_found():
    dto = {"user_name": "ghost", "password": "123"}

    with patch("services.auth_service.get_user_by_username", side_effect=ValueError("User not found")):
        with pytest.raises(ValueError, match="User not found"):
            auth_service.login(dto)


def test_login_wrong_password():
    dto = {
        "user_name": "testuser",
        "password": "wrongpass",
    }

    correct_hash = bcrypt.hashpw("password123".encode(), bcrypt.gensalt()).decode()
    user = {"id": 1, "user_name": "testuser", "password_hash": correct_hash}

    with patch("services.auth_service.get_user_by_username", return_value=user):
        with patch("bcrypt.checkpw", return_value=False):
            with pytest.raises(ValueError, match="Wrong password"):
                auth_service.login(dto)


def test_register_success():
    dto = {
        "user_name": "newuser",
        "password": "password123",
        "first_name": "New",
        "last_name": "User",
    }

    fake_user = {
        "id": 42,
        "user_name": "newuser",
        "password_hash": "hashed",
        "first_name": "New",
        "last_name": "User",
    }

    with (
        patch("bcrypt.hashpw", return_value=b"hashed_password"),
        patch("services.auth_service.create_user", return_value=fake_user),
        patch("services.auth_service.generate_token_pair", return_value={
            "access_token": "access123",
            "refresh_token": "refresh123",
        }),
    ):
        result = auth_service.register(dto)
        assert result == {
            "access_token": "access123",
            "refresh_token": "refresh123",
        }

```

:::

Запустите тесты. Если все сделано правильно, ошибок в тестах не будет.

```bash
tests/repositories/test_post_repository.py::test_create_post_success PASSED                                [  2%]
tests/repositories/test_post_repository.py::test_create_post_error PASSED                                  [  5%]
tests/repositories/test_post_repository.py::test_get_all_posts_success PASSED                              [  8%]
tests/repositories/test_post_repository.py::test_get_all_posts_error PASSED                                [ 11%]
tests/repositories/test_post_repository.py::test_get_post_by_id_success PASSED                             [ 14%]
tests/repositories/test_post_repository.py::test_get_post_by_id_not_found PASSED                           [ 17%]
tests/repositories/test_post_repository.py::test_delete_post_success PASSED                                [ 20%]
tests/repositories/test_post_repository.py::test_delete_post_not_found PASSED                              [ 23%]
tests/repositories/test_post_repository.py::test_view_post_success PASSED                                  [ 26%]
tests/repositories/test_post_repository.py::test_view_post_error_sql PASSED                                [ 29%]
tests/repositories/test_post_repository.py::test_view_post_already_viewed PASSED                           [ 32%]
tests/repositories/test_post_repository.py::test_like_post_success PASSED                                  [ 35%]
tests/repositories/test_post_repository.py::test_like_post_error PASSED                                    [ 38%]
tests/repositories/test_post_repository.py::test_like_post_already_liked PASSED                            [ 41%]
tests/repositories/test_post_repository.py::test_dislike_post_success PASSED                               [ 44%]
tests/repositories/test_post_repository.py::test_dislike_post_error PASSED                                 [ 47%]
tests/repositories/test_post_repository.py::test_dislike_post_not_found PASSED                             [ 50%]
tests/repositories/test_user_repository.py::test_create_user_success PASSED                                [ 52%]
tests/repositories/test_user_repository.py::test_create_user_error PASSED                                  [ 55%]
tests/repositories/test_user_repository.py::test_get_all_users_success PASSED                              [ 58%]
tests/repositories/test_user_repository.py::test_get_all_users_error PASSED                                [ 61%]
tests/repositories/test_user_repository.py::test_get_user_by_id_success PASSED                             [ 64%]
tests/repositories/test_user_repository.py::test_get_user_by_id_not_found PASSED                           [ 67%]
tests/repositories/test_user_repository.py::test_get_user_by_username_success PASSED                       [ 70%]
tests/repositories/test_user_repository.py::test_get_user_by_username_not_found PASSED                     [ 73%]
tests/repositories/test_user_repository.py::test_update_user_success PASSED                                [ 76%]
tests/repositories/test_user_repository.py::test_update_user_no_fields PASSED                              [ 79%]
tests/repositories/test_user_repository.py::test_update_user_not_found PASSED                              [ 82%]
tests/repositories/test_user_repository.py::test_delete_user_success PASSED                                [ 85%]
tests/repositories/test_user_repository.py::test_delete_user_not_found PASSED                              [ 88%]
tests/services/test_auth_service.py::test_login_success PASSED                                             [ 91%]
tests/services/test_auth_service.py::test_login_user_not_found PASSED                                      [ 94%]
tests/services/test_auth_service.py::test_login_wrong_password PASSED                                      [ 97%]
tests/services/test_auth_service.py::test_register_success PASSED                                          [100%]
=================================================== 34 passed ====================================================
```

## Разработка сервиса пользователей

Сервис пользователей отвечает за работу с данными пользователей через репозиторий. В его задачи входят получение списка пользователей, поиск конкретного пользователя по ID, обновление информации пользователя (включая шифрование пароля) и удаление пользователя.

Для его реализации в каталоге `services` создайте файл `user_service.js` и поместите туда код:

```python
from repositories.user_repository import (
    get_all_users,
    get_user_by_id,
    update_user,
    delete_user,
)
import bcrypt


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
```

**`get_all(limit, offset)`**

- Получает всех пользователей с пагинацией.

- Делает запрос в репозиторий с параметрами смещения (`offset`) и лимита (`limit`).

**`get_by_id(id)`**

- Находит пользователя по его уникальному идентификатору.

**`update(id, userDto)`**

- Обновляет данные пользователя.

- Если передан новый пароль, он хэшируется через `bcrypt` перед сохранением.

- Оригинальный пароль удаляется из объекта перед обновлением.

**`delete(id)`**

- Удаляет пользователя по его ID. На уровне репозитория обычно реализовано мягкое удаление через установку поля `deleted_at`.

## Тестирование сервиса пользователей

Также сразу напишем тесты для `user_service`, чтобы проверить его работу. Для этого в папке `tests/services` создайте файл `test_user_service.py`. Поместите в него код ниже.

::: details Unit-тесты user_service

```python
from datetime import datetime
from unittest.mock import patch

import pytest
from services import user_service


def test_get_all_users_success():
    users = [
        {
            "id": 1,
            "user_name": "john",
            "first_name": "John",
            "last_name": "Doe",
            "status": 1,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        },
        {
            "id": 2,
            "user_name": "jane",
            "first_name": "Jane",
            "last_name": "Smith",
            "status": 1,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        },
    ]

    with patch("services.user_service.get_all_users", return_value=users) as mock:
        result = user_service.get_all(100, 0)
        assert result == users
        mock.assert_called_once_with(100, 0)


def test_get_all_users_failure():
    with patch("services.user_service.get_all_users", side_effect=Exception("SQL error")) as mock:
        with pytest.raises(Exception, match="SQL error"):
            user_service.get_all(100, 0)
        mock.assert_called_once_with(100, 0)


def test_get_user_by_id_success():
    user = {
        "id": 1,
        "user_name": "john",
        "first_name": "John",
        "last_name": "Doe",
        "status": 1,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    with patch("services.user_service.get_user_by_id", return_value=user) as mock:
        result = user_service.get_by_id(1)
        assert result == user
        mock.assert_called_once_with(1)


def test_get_user_by_id_failure():
    with patch("services.user_service.get_user_by_id", side_effect=Exception("User not found")) as mock:
        with pytest.raises(Exception, match="User not found"):
            user_service.get_by_id(2)
        mock.assert_called_once_with(2)


def test_update_user_success():
    dto = {
        "user_name": "john_updated",
        "first_name": "John",
        "last_name": "Doe",
        "password": "newpassword",
    }

    expected = {
        "id": 1,
        "user_name": "john_updated",
        "first_name": "John",
        "last_name": "Doe",
        "status": 1,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    with (
        patch("services.user_service.update_user", return_value=expected) as mock_update,
        patch("bcrypt.hashpw", return_value=b"hashed_pw") as mock_hash,
    ):
        result = user_service.update(1, dto)
        assert result == expected
        assert mock_update.call_args[0][1]["password_hash"] == b"hashed_pw"
        mock_update.assert_called_once()
        mock_hash.assert_called_once()


def test_update_user_failure():
    with patch("services.user_service.update_user", side_effect=Exception("Update failed")) as mock:
        with pytest.raises(Exception, match="Update failed"):
            user_service.update(2, {"user_name": "ghost"})
        mock.assert_called_once()


def test_delete_user_success():
    with patch("services.user_service.delete_user", return_value=None) as mock:
        result = user_service.delete(1)
        assert result is None
        mock.assert_called_once_with(1)


def test_delete_user_failure():
    with patch("services.user_service.delete_user", side_effect=Exception("Delete error")) as mock:
        with pytest.raises(Exception, match="Delete error"):
            user_service.delete(2)
        mock.assert_called_once_with(2)
```

:::

Запустите тесты. Если все сделано правильно, ошибок в тестах не будет.

```bash
tests/repositories/test_post_repository.py::test_create_post_success PASSED                                [  2%]
tests/repositories/test_post_repository.py::test_create_post_error PASSED                                  [  4%]
tests/repositories/test_post_repository.py::test_get_all_posts_success PASSED                              [  7%]
tests/repositories/test_post_repository.py::test_get_all_posts_error PASSED                                [  9%]
tests/repositories/test_post_repository.py::test_get_post_by_id_success PASSED                             [ 11%]
tests/repositories/test_post_repository.py::test_get_post_by_id_not_found PASSED                           [ 14%]
tests/repositories/test_post_repository.py::test_delete_post_success PASSED                                [ 16%]
tests/repositories/test_post_repository.py::test_delete_post_not_found PASSED                              [ 19%]
tests/repositories/test_post_repository.py::test_view_post_success PASSED                                  [ 21%]
tests/repositories/test_post_repository.py::test_view_post_error_sql PASSED                                [ 23%]
tests/repositories/test_post_repository.py::test_view_post_already_viewed PASSED                           [ 26%]
tests/repositories/test_post_repository.py::test_like_post_success PASSED                                  [ 28%]
tests/repositories/test_post_repository.py::test_like_post_error PASSED                                    [ 30%]
tests/repositories/test_post_repository.py::test_like_post_already_liked PASSED                            [ 33%]
tests/repositories/test_post_repository.py::test_dislike_post_success PASSED                               [ 35%]
tests/repositories/test_post_repository.py::test_dislike_post_error PASSED                                 [ 38%]
tests/repositories/test_post_repository.py::test_dislike_post_not_found PASSED                             [ 40%]
tests/repositories/test_user_repository.py::test_create_user_success PASSED                                [ 42%]
tests/repositories/test_user_repository.py::test_create_user_error PASSED                                  [ 45%]
tests/repositories/test_user_repository.py::test_get_all_users_success PASSED                              [ 47%]
tests/repositories/test_user_repository.py::test_get_all_users_error PASSED                                [ 50%]
tests/repositories/test_user_repository.py::test_get_user_by_id_success PASSED                             [ 52%]
tests/repositories/test_user_repository.py::test_get_user_by_id_not_found PASSED                           [ 54%]
tests/repositories/test_user_repository.py::test_get_user_by_username_success PASSED                       [ 57%]
tests/repositories/test_user_repository.py::test_get_user_by_username_not_found PASSED                     [ 59%]
tests/repositories/test_user_repository.py::test_update_user_success PASSED                                [ 61%]
tests/repositories/test_user_repository.py::test_update_user_no_fields PASSED                              [ 64%]
tests/repositories/test_user_repository.py::test_update_user_not_found PASSED                              [ 66%]
tests/repositories/test_user_repository.py::test_delete_user_success PASSED                                [ 69%]
tests/repositories/test_user_repository.py::test_delete_user_not_found PASSED                              [ 71%]
tests/services/test_auth_service.py::test_login_success PASSED                                             [ 73%]
tests/services/test_auth_service.py::test_login_user_not_found PASSED                                      [ 76%]
tests/services/test_auth_service.py::test_login_wrong_password PASSED                                      [ 78%]
tests/services/test_auth_service.py::test_register_success PASSED                                          [ 80%]
tests/services/test_user_service.py::test_get_all_users_success PASSED                                     [ 83%]
tests/services/test_user_service.py::test_get_all_users_failure PASSED                                     [ 85%]
tests/services/test_user_service.py::test_get_user_by_id_success PASSED                                    [ 88%]
tests/services/test_user_service.py::test_get_user_by_id_failure PASSED                                    [ 90%]
tests/services/test_user_service.py::test_update_user_success PASSED                                       [ 92%]
tests/services/test_user_service.py::test_update_user_failure PASSED                                       [ 95%]
tests/services/test_user_service.py::test_delete_user_success PASSED                                       [ 97%]
tests/services/test_user_service.py::test_delete_user_failure PASSED                                       [100%]
=================================================== 42 passed ====================================================
```

## Разработка сервиса постов

В этом сервисе реализуется бизнес-логика для работы с постами в социальной сети GopherTalk. Сервис служит промежуточным слоем между контроллерами и репозиторием, обеспечивая удобный интерфейс для работы с публикациями.

```python
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
```

**`get_all_posts(filter_dto)`**

- Получает список постов с поддержкой фильтрации по автору, тексту поста или родительскому посту (`reply_to_id`). Делегирует выполнение запроса в `get_all_posts` репозитория.

**`create_post(create_dto)`**

- Создаёт новый пост в системе. Получает DTO с данными поста и вызывает `create_post` репозитория, чтобы сохранить запись в базе данных.

**`delete_post(post_id, owner_id)`**

- Удаляет пост пользователя. Передаёт идентификатор поста и владельца в `delete_post` репозитория, где происходит мягкое удаление (установка `deleted_at`).

**`view_post(post_id, user_id)`**

- Фиксирует факт просмотра поста пользователем. Вызывает `view_post` репозитория, чтобы добавить новую запись в таблицу просмотров (`views`).

**`like_post(post_id, user_id)`**

- Позволяет пользователю поставить лайк на пост. Обращается к `like_post` репозитория, чтобы сохранить лайк в базе данных.

**`dislike_post(post_id, user_id)`**

- Позволяет пользователю убрать свой лайк с поста. Вызывает `dislike_post` репозитория для удаления записи о лайке.

## Тестирование сервиса постов

Аналогично и здесь сразу напишем тесты для `post_service`, чтобы проверить его работу. Для этого в папке `tests/services` создайте файл `test_post_service.py`. Поместите в него код ниже.

::: details Unit-тесты userService

```python
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

```

:::

Запустите тесты. Если все сделано правильно, ошибок в тестах не будет.

```bash
tests/repositories/test_post_repository.py::test_create_post_success PASSED                                [  1%]
tests/repositories/test_post_repository.py::test_create_post_error PASSED                                  [  3%]
tests/repositories/test_post_repository.py::test_get_all_posts_success PASSED                              [  5%]
tests/repositories/test_post_repository.py::test_get_all_posts_error PASSED                                [  7%]
tests/repositories/test_post_repository.py::test_get_post_by_id_success PASSED                             [  9%]
tests/repositories/test_post_repository.py::test_get_post_by_id_not_found PASSED                           [ 11%]
tests/repositories/test_post_repository.py::test_delete_post_success PASSED                                [ 12%]
tests/repositories/test_post_repository.py::test_delete_post_not_found PASSED                              [ 14%]
tests/repositories/test_post_repository.py::test_view_post_success PASSED                                  [ 16%]
tests/repositories/test_post_repository.py::test_view_post_error_sql PASSED                                [ 18%]
tests/repositories/test_post_repository.py::test_view_post_already_viewed PASSED                           [ 20%]
tests/repositories/test_post_repository.py::test_like_post_success PASSED                                  [ 22%]
tests/repositories/test_post_repository.py::test_like_post_error PASSED                                    [ 24%]
tests/repositories/test_post_repository.py::test_like_post_already_liked PASSED                            [ 25%]
tests/repositories/test_post_repository.py::test_dislike_post_success PASSED                               [ 27%]
tests/repositories/test_post_repository.py::test_dislike_post_error PASSED                                 [ 29%]
tests/repositories/test_post_repository.py::test_dislike_post_not_found PASSED                             [ 31%]
tests/repositories/test_user_repository.py::test_create_user_success PASSED                                [ 33%]
tests/repositories/test_user_repository.py::test_create_user_error PASSED                                  [ 35%]
tests/repositories/test_user_repository.py::test_get_all_users_success PASSED                              [ 37%]
tests/repositories/test_user_repository.py::test_get_all_users_error PASSED                                [ 38%]
tests/repositories/test_user_repository.py::test_get_user_by_id_success PASSED                             [ 40%]
tests/repositories/test_user_repository.py::test_get_user_by_id_not_found PASSED                           [ 42%]
tests/repositories/test_user_repository.py::test_get_user_by_username_success PASSED                       [ 44%]
tests/repositories/test_user_repository.py::test_get_user_by_username_not_found PASSED                     [ 46%]
tests/repositories/test_user_repository.py::test_update_user_success PASSED                                [ 48%]
tests/repositories/test_user_repository.py::test_update_user_no_fields PASSED                              [ 50%]
tests/repositories/test_user_repository.py::test_update_user_not_found PASSED                              [ 51%]
tests/repositories/test_user_repository.py::test_delete_user_success PASSED                                [ 53%]
tests/repositories/test_user_repository.py::test_delete_user_not_found PASSED                              [ 55%]
tests/services/test_auth_service.py::test_login_success PASSED                                             [ 57%]
tests/services/test_auth_service.py::test_login_user_not_found PASSED                                      [ 59%]
tests/services/test_auth_service.py::test_login_wrong_password PASSED                                      [ 61%]
tests/services/test_auth_service.py::test_register_success PASSED                                          [ 62%]
tests/services/test_post_service.py::test_get_all_posts_success PASSED                                     [ 64%]
tests/services/test_post_service.py::test_get_all_posts_error PASSED                                       [ 66%]
tests/services/test_post_service.py::test_create_post_success PASSED                                       [ 68%]
tests/services/test_post_service.py::test_create_post_error PASSED                                         [ 70%]
tests/services/test_post_service.py::test_delete_post_success PASSED                                       [ 72%]
tests/services/test_post_service.py::test_delete_post_error PASSED                                         [ 74%]
tests/services/test_post_service.py::test_view_post_success PASSED                                         [ 75%]
tests/services/test_post_service.py::test_view_post_error PASSED                                           [ 77%]
tests/services/test_post_service.py::test_like_post_success PASSED                                         [ 79%]
tests/services/test_post_service.py::test_like_post_error PASSED                                           [ 81%]
tests/services/test_post_service.py::test_dislike_post_success PASSED                                      [ 83%]
tests/services/test_post_service.py::test_dislike_post_error PASSED                                        [ 85%]
tests/services/test_user_service.py::test_get_all_users_success PASSED                                     [ 87%]
tests/services/test_user_service.py::test_get_all_users_failure PASSED                                     [ 88%]
tests/services/test_user_service.py::test_get_user_by_id_success PASSED                                    [ 90%]
tests/services/test_user_service.py::test_get_user_by_id_failure PASSED                                    [ 92%]
tests/services/test_user_service.py::test_update_user_success PASSED                                       [ 94%]
tests/services/test_user_service.py::test_update_user_failure PASSED                                       [ 96%]
tests/services/test_user_service.py::test_delete_user_success PASSED                                       [ 98%]
tests/services/test_user_service.py::test_delete_user_failure PASSED                                       [100%]
=================================================== 42 passed ====================================================
```

## Итог

В рамках данного учебного вопроса мы разработали уровень бизнес-логики для трёх основных сущностей: пользователей, постов и аутентификации.
Каждый сервис был реализован через соответствующий репозиторий и обеспечивал выполнение своих задач без прямого взаимодействия с базой данных.

- `auth_service` отвечает за регистрацию и аутентификацию пользователей, создание пары токенов (access и refresh), а также проверку пароля.

- `user_service` обеспечивает работу с пользователями: получение списка всех пользователей, получение пользователя по ID, обновление данных и удаление пользователей.

- `post_service` управляет созданием, удалением, просмотром постов и действиями пользователей (лайк, дизлайк).

Была соблюдена чистая архитектура:

- Репозитории инкапсулируют работу с базой данных.

- Сервисы выполняют бизнес-логику и валидируют данные.

- Взаимодействие между слоями происходит через интерфейсы и DTO-структуры.

Также для каждого сервиса были разработаны и адаптированы тесты на `pytest` с использованием `unittest.mock`, которые проверяют как положительные, так и отрицательные сценарии выполнения методов. Это позволило убедиться в корректности бизнес-логики до этапа интеграции с реальной базой данных.

Таким образом, реализованная структура закладывает надёжную основу для дальнейшего масштабирования и расширения проекта.

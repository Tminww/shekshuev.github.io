# Установка библиотек и подключение базы данных PostgreSQL к приложению

## Введение

В рамках этого учебного курса мы будем разрабатывать **веб-приложение с использованием Python, FastAPI и базы данных PostgreSQL**.  
Для взаимодействия между приложением и базой данных мы будем использовать библиотеку [`psycopg`](https://www.psycopg.org/), официальную реализацию PostgreSQL-драйвера для Python.

**`psycopg`** — это высокопроизводительный адаптер PostgreSQL для Python. В версии 3 он стал более гибким, поддерживает как синхронный, так и асинхронный режим работы, удобную работу с типами PostgreSQL, пул подключений и многое другое.

Мы будем использовать **синхронный интерфейс**, чтобы сфокусироваться на базовых принципах работы с базой данных — без усложнения кода корутинами.

Преимущества `psycopg`:

- высокая производительность;
- простота подключения;
- поддержка параметризованных запросов (безопасность от SQL-инъекций);
- поддержка пулов соединений;
- хорошая совместимость с PostgreSQL-типами (`JSON`, `UUID`, `ARRAY`, `TIMESTAMP` и т.д.);
- активная поддержка и документация.

Благодаря этому мы сможем использовать **всю мощь PostgreSQL прямо из кода на Python** — просто, эффективно и без необходимости использовать ORM.

## Основы API библиотеки `psycopg`

Библиотека `psycopg` предоставляет несколько ключевых интерфейсов для работы с PostgreSQL в соответствии со стандартом [**Python DB API 2.0**](https://peps.python.org/pep-0249/).  
В этом разделе мы рассмотрим три основных компонента:

1. Прямое подключение через `connect()`;
2. Пул подключений через `ConnectionPool`;
3. Работа с результатами запросов через `cursor`.

### 1. Подключение напрямую через `connect()`

Функция `psycopg.connect()` позволяет установить **одно явное соединение** с базой данных PostgreSQL.  
Это базовый интерфейс, полезный для простых операций и ручного управления транзакциями.

#### Пример:

```python
import psycopg

conn = psycopg.connect(
    host="localhost",
    port=5432,
    user="postgres",
    password="secret",
    dbname="mydb"
)

with conn.cursor() as cur:
    cur.execute("SELECT NOW()")
    result = cur.fetchone()
    print(result)

conn.close()
```

#### Особенности:

- Соединение создаётся вручную и закрывается вручную (`conn.close()`).
- По умолчанию `psycopg` использует неавтоматические транзакции: нужно вызывать `conn.commit()` или `conn.rollback()`.

Параметры подключения:

```python
psycopg.connect(
    host="localhost",
    port=5432,
    user="postgres",
    password="secret",
    dbname="mydb",
    connect_timeout=10,
    application_name="myapp"
)

```

Также можно использовать DSN-строку:

```python
psycopg.connect("postgresql://postgres:secret@localhost:5432/mydb")
```

### 2. Пул подключений (рекомендуемый способ)

Объект `ConnectionPool` из модуля `psycopg_pool` управляет множеством соединений с базой данных. Это более производительный и устойчивый способ подключения в реальных приложениях.

#### Пример:

```python
from psycopg_pool import ConnectionPool

pool = ConnectionPool(conninfo="postgresql://postgres:secret@localhost:5432/mydb")

with pool.connection() as conn:
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM users WHERE id = %s", (1,))
        row = cur.fetchone()
        print(row)

```

#### Преимущества:

- Повторное использование уже открытых соединений;
- Подходит для приложений с высокой нагрузкой;

Конфигурация пула:

```python
pool = ConnectionPool(
    conninfo="...",
    min_size=1,            # минимальное количество соединений
    max_size=10,           # максимальное количество соединений
    max_idle=30,           # максимальное время простоя соединения (секунды)
    timeout=5              # таймаут ожидания соединения из пула (секунды)
)
```

### 3. Результаты выполнения SQL-запросов

После выполнения `cursor.execute(...)` результат запроса доступен через курсор.
Типичный объект результата включает:

- `cursor.fetchone()` — получить одну строку;
- `cursor.fetchall()` — получить все строки;
- `cursor.rowcount` — количество строк, возвращённых или затронутых;
- `cursor.description` — метаинформация о колонках (имена, типы и т.д.).

#### Пример:

```python
with conn.cursor() as cur:
    cur.execute("SELECT 1 AS one, 2 AS two;")
    print(cur.description[0].name)  # 'one'
    print(cur.description[1].name)  # 'two'
    print(cur.fetchall())           # [(1, 2)]
```

Если нужно получать строки в виде словарей (`dict`), можно задать `row_factory`:

```python
with conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
    cur.execute("SELECT id, name FROM users;")
    for row in cur.fetchall():
        print(row["id"], row["name"])
```

## Структура проекта

Создайте каталог `gophertalk-backend-fastapi`. В нем создайте подкаталог `src`, файлы `.env`, `requirements.txt`, `README.md`.
В каталоге `src` создайте каталоги, указанные ниже, а также пустой файл `app.py`.
Также создайте каталог `__tests__` и подкаталоги в нем.

```bash
gophertalk-backend-fastapi/
├── src/
│   ├── controllers/       # Обработка HTTP-запросов
│   ├── services/          # Бизнес-логика
│   ├── repositories/      # Работа с БД (SQL-запросы)
│   ├── routes/            # Определение маршрутов
│   ├── dependencies/      # Общие зависимости FastAPI
│   ├── packages/          # скачанные пакеты с зависимостями
│   ├── config/            # Конфигурация проекта
│   ├── utils/             # Вспомогательные функции
│   ├── validators/        # Валидаторы входных данных
│   └── app.py             # Инициализация приложения
├── __tests__              # unit тесты
│   ├── controllers/
│   ├── services/
│   └── repositories/
├── .env                   # Переменные окружения
├── requirements.txt
└── README.md
```

## Инициализация проекта и установка зависимостей

В корне проекта в папке `gophertalk-backend-fastapi` создайте виртуальное окружение и активируйте его:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

::: details Настройка для Linux
В файл `requirements.txt` поместите следующее содержимое:

```text
./src/packages-linux/annotated_types-0.7.0-py3-none-any.whl
./src/packages-linux/anyio-4.9.0-py3-none-any.whl
./src/packages-linux/bcrypt-4.3.0-cp39-abi3-manylinux_2_34_x86_64.whl
./src/packages-linux/certifi-2025.4.26-py3-none-any.whl
./src/packages-linux/cffi-1.17.1-cp310-cp310-manylinux_2_17_x86_64.manylinux2014_x86_64.whl
./src/packages-linux/click-8.2.1-py3-none-any.whl
./src/packages-linux/cryptography-45.0.4-cp37-abi3-manylinux_2_34_x86_64.whl
./src/packages-linux/ecdsa-0.19.1-py2.py3-none-any.whl
./src/packages-linux/exceptiongroup-1.3.0-py3-none-any.whl
./src/packages-linux/fastapi-0.115.12-py3-none-any.whl
./src/packages-linux/h11-0.16.0-py3-none-any.whl
./src/packages-linux/httpcore-1.0.9-py3-none-any.whl
./src/packages-linux/httptools-0.6.4-cp310-cp310-manylinux_2_5_x86_64.manylinux1_x86_64.manylinux_2_17_x86_64.manylinux2014_x86_64.whl
./src/packages-linux/httpx-0.28.1-py3-none-any.whl
./src/packages-linux/idna-3.10-py3-none-any.whl
./src/packages-linux/iniconfig-2.1.0-py3-none-any.whl
./src/packages-linux/packaging-25.0-py3-none-any.whl
./src/packages-linux/pluggy-1.6.0-py3-none-any.whl
./src/packages-linux/psycopg_binary-3.2.9-cp310-cp310-manylinux_2_17_x86_64.manylinux2014_x86_64.whl
./src/packages-linux/psycopg_pool-3.2.6-py3-none-any.whl
./src/packages-linux/psycopg-3.2.9-py3-none-any.whl
./src/packages-linux/pyasn1-0.6.1-py3-none-any.whl
./src/packages-linux/pycparser-2.22-py3-none-any.whl
./src/packages-linux/pydantic-2.11.5-py3-none-any.whl
./src/packages-linux/pydantic_core-2.33.2-cp310-cp310-manylinux_2_17_x86_64.manylinux2014_x86_64.whl
./src/packages-linux/pygments-2.19.1-py3-none-any.whl
./src/packages-linux/pytest-8.4.0-py3-none-any.whl
./src/packages-linux/python_dotenv-1.1.0-py3-none-any.whl
./src/packages-linux/python_jose-3.5.0-py2.py3-none-any.whl
./src/packages-linux/PyYAML-6.0.2-cp310-cp310-manylinux_2_17_x86_64.manylinux2014_x86_64.whl
./src/packages-linux/rsa-4.9.1-py3-none-any.whl
./src/packages-linux/six-1.17.0-py2.py3-none-any.whl
./src/packages-linux/sniffio-1.3.1-py3-none-any.whl
./src/packages-linux/starlette-0.46.2-py3-none-any.whl
./src/packages-linux/tomli-2.2.1-py3-none-any.whl
./src/packages-linux/typing_extensions-4.14.0-py3-none-any.whl
./src/packages-linux/typing_inspection-0.4.1-py3-none-any.whl
./src/packages-linux/uvicorn-0.34.3-py3-none-any.whl
./src/packages-linux/uvloop-0.21.0-cp310-cp310-manylinux_2_17_x86_64.manylinux2014_x86_64.whl
./src/packages-linux/watchfiles-1.0.5-cp310-cp310-manylinux_2_17_x86_64.manylinux2014_x86_64.whl
./src/packages-linux/websockets-15.0.1-cp310-cp310-manylinux_2_5_x86_64.manylinux1_x86_64.manylinux_2_17_x86_64.manylinux2014_x86_64.whl
```

Распакуйте содержимое [архива](/databases/packages-linux.zip) в папку `src/packages-linux`.

Выполните команду

```bash
pip install -r requirements.txt
```

:::

::: details Настройка для Windows
В файл `requirements.txt` поместите следующее содержимое:

```text
./src/packages-win/annotated_types-0.7.0-py3-none-any.whl
./src/packages-win/anyio-4.9.0-py3-none-any.whl
./src/packages-win/bcrypt-4.3.0-cp39-abi3-win_amd64.whl
./src/packages-win/certifi-2025.4.26-py3-none-any.whl
./src/packages-win/cffi-1.17.1-cp310-cp310-win_amd64.whl
./src/packages-win/click-8.2.1-py3-none-any.whl
./src/packages-win/cryptography-45.0.4-cp37-abi3-win_amd64.whl
./src/packages-win/ecdsa-0.19.1-py2.py3-none-any.whl
./src/packages-win/exceptiongroup-1.3.0-py3-none-any.whl
./src/packages-win/fastapi-0.115.12-py3-none-any.whl
./src/packages-win/h11-0.16.0-py3-none-any.whl
./src/packages-win/httpcore-1.0.9-py3-none-any.whl
./src/packages-win/httptools-0.6.4-cp310-cp310-manylinux_2_5_x86_64.manylinux1_x86_64.manylinux_2_17_x86_64.manylinux2014_x86_64.whl
./src/packages-win/httpx-0.28.1-py3-none-any.whl
./src/packages-win/idna-3.10-py3-none-any.whl
./src/packages-win/iniconfig-2.1.0-py3-none-any.whl
./src/packages-win/packaging-25.0-py3-none-any.whl
./src/packages-win/pluggy-1.6.0-py3-none-any.whl
./src/packages-win/psycopg_binary-3.2.9-cp310-cp310-win_amd64.whl
./src/packages-win/psycopg_pool-3.2.6-py3-none-any.whl
./src/packages-win/psycopg-3.2.9-py3-none-any.whl
./src/packages-win/pyasn1-0.6.1-py3-none-any.whl
./src/packages-win/pycparser-2.22-py3-none-any.whl
./src/packages-win/pydantic-2.11.5-py3-none-any.whl
./src/packages-win/pydantic_core-2.33.2-cp310-cp310-win_amd64.whl
./src/packages-win/pygments-2.19.1-py3-none-any.whl
./src/packages-win/pytest-8.4.0-py3-none-any.whl
./src/packages-win/python_dotenv-1.1.0-py3-none-any.whl
./src/packages-win/python_jose-3.5.0-py2.py3-none-any.whl
./src/packages-win/PyYAML-6.0.2-cp310-cp310-manylinux_2_17_x86_64.manylinux2014_x86_64.whl
./src/packages-win/rsa-4.9.1-py3-none-any.whl
./src/packages-win/six-1.17.0-py2.py3-none-any.whl
./src/packages-win/sniffio-1.3.1-py3-none-any.whl
./src/packages-win/starlette-0.46.2-py3-none-any.whl
./src/packages-win/tomli-2.2.1-py3-none-any.whl
./src/packages-win/typing_extensions-4.14.0-py3-none-any.whl
./src/packages-win/typing_inspection-0.4.1-py3-none-any.whl
./src/packages-win/uvicorn-0.34.3-py3-none-any.whl
./src/packages-win/uvloop-0.21.0-cp310-cp310-manylinux_2_17_x86_64.manylinux2014_x86_64.whl
./src/packages-win/watchfiles-1.0.5-cp310-cp310-manylinux_2_17_x86_64.manylinux2014_x86_64.whl
./src/packages-win/websockets-15.0.1-cp310-cp310-manylinux_2_5_x86_64.manylinux1_x86_64.manylinux_2_17_x86_64.manylinux2014_x86_64.whl
```

Распакуйте содержимое [архива](/databases/packages-win.zip) в папку `src/packages-win`.

Выполните команду

```bash
pip install -r requirements.txt
```

:::

::: details Онлайн настройка
Выполните команду

```bash
pip install \
  fastapi \
  psycopg \
  psycopg-binary \
  psycopg_pool \
  python-dotenv \
  pydantic \
  "python-jose[cryptography]" \
  bcrypt \
  httpx \
  pytest \
  "uvicorn[standard]"
```

:::

Большинство указанных библиотек имеют собственные зависимости, поэтому при в каталоге `src/packages-*` вы увидели десятки `.whl`-файлов. Это нормально — Python-пакеты часто собираются из множества взаимосвязанных компонентов.

### Основные зависимости проекта и их назначение:

| Библиотека                  | Назначение                                                                   |
| --------------------------- | ---------------------------------------------------------------------------- |
| `fastapi`                   | Веб-фреймворк для создания API. Основан на `Starlette` и `Pydantic`.         |
| `psycopg`                   | Драйвер для работы с PostgreSQL. Обеспечивает подключение и SQL-запросы.     |
| `psycop_pool`               | Пул соединений для `psycopg`                                                 |
| `python-dotenv`             | Загрузка переменных окружения из `.env` файлов в `os.environ`.               |
| `pydantic`                  | Валидация и сериализация входных данных (используется FastAPI).              |
| `python-jose[cryptography]` | Работа с JWT-токенами, включая `HS256`, `RS256`, `exp`, `iat`, и т.д.        |
| `bcrypt`                    | Безопасное хеширование паролей.                                              |
| `httpx`                     | HTTP-клиент, используется для тестирования и взаимодействия с API.           |
| `pytest`                    | Фреймворк для написания и запуска тестов.                                    |
| `uvicorn[standard]`         | ASGI-сервер для запуска FastAPI, `standard` включает поддержку перезагрузки. |

Даже если вы явно указали 9–10 пакетов, итоговая установка может включать более 40 `.whl` файлов. Все они перечислены в `requirements.txt`, и при установке из него `pip` не обращается в интернет, что важно для изолированной среды.

## Установка переменных окружения

Использование переменных окружения в проекте позволяет отделить конфиденциальные и изменяемые настройки (например, параметры подключения к базе данных) от основного кода приложения. Это важно по нескольким причинам.

Во-первых, безопасность: данные вроде логина, пароля, адреса сервера и имени базы данных не должны попадать в систему контроля версий (например, Git), чтобы избежать утечек при публикации кода. Переменные окружения можно хранить в .env файле, который добавляется в .gitignore, или задавать напрямую в среде запуска (например, на сервере или в CI/CD).

Во-вторых, гибкость и удобство настройки: приложение можно разворачивать в разных средах — локально, на тестовом сервере, в продакшене — без изменения исходного кода. Достаточно задать переменные окружения для каждой среды.

В-третьих, читаемость и масштабируемость: конфигурационные значения собраны в одном месте, их проще менять и документировать. Это особенно важно в командной разработке и при работе с множеством сервисов и баз данных.

Для удобства разработки мы используем пакет `python-dotenv`, который умеет считывать переменные из файла `.env`. Пример заполнения этого файла представлен ниже.

```bash
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=postgres
ACCESS_TOKEN_EXPIRES=3600
REFRESH_TOKEN_EXPIRES=86400
ACCESS_TOKEN_SECRET=super_secret_access_token_key
REFRESH_TOKEN_SECRET=super_secret_refresh_token_key
```

Значения переменных установите сами. Вам нужен сервер PostgreSQL, база данных в нем и учетная запись с правами в этой БД.

Значения переменных `ACCESS_TOKEN_EXPIRES`, `REFRESH_TOKEN_EXPIRES`, `ACCESS_TOKEN_SECRET` и `REFRESH_TOKEN_SECRET` не изменяйте, они понадобятся в дальнейшем.

## Настройка подключения к PostgreSQL

Создайте файл `db.py` в каталоге `src/config`. Поместите в него следующий код:

```python
import os
from psycopg_pool import ConnectionPool

pool = ConnectionPool(
    conninfo=f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}"
             f"@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
)
```

Разберем, что происходит в этом коде.

1. Импорт библиотек

   ```python
   import os
   from psycopg_pool import ConnectionPool
   ```

   - `os` — стандартный модуль для работы с переменными окружения (`os.getenv()`).
   - `ConnectionPool` — создаёт и управляет пулом соединений к PostgreSQL.

2. Создание пула подключений

   ```python
   pool = ConnectionPool(conninfo=...)
   ```

   - Параметры подключения собираются в строку `conninfo`, которая поддерживает стандартный синтаксис PostgreSQL: `postgresql://user:password@host:port/dbname`.
   - Пул будет автоматически переиспользовать соединения и управлять ими.

## Создание главного файла приложения, запуск приложения и проверка подключения к БД

Создайте файл `app.py` в каталоге `src/`. Поместите в него следующее содержимое:

```python
import os

from dotenv import load_dotenv
from fastapi import FastAPI, Response, status

load_dotenv()

from config.db import pool

app = FastAPI()
port = int(os.getenv("PORT", 3000))


@app.get("/api/health-check")
def health_check():
    try:
        with pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
                cur.fetchone()
        return Response(content="OK", status_code=status.HTTP_200_OK)
    except Exception:
        return Response(content="DB connection failed", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
```

Этот код — минимальный сервер на FastAPI, подключённый к базе данных PostgreSQL через `psycopg`. Разберём его подробнее.

---

### 1. Импорт библиотек

```python
import os
from dotenv import load_dotenv
from fastapi import FastAPI, Response, status
from src.config.db import pool
```

- `os` — стандартный модуль Python для работы с переменными окружения (`os.getenv()`).
- `load_dotenv()` — загружает переменные из `.env` файла в `os.environ`.
- FastAPI — фреймворк для создания веб-сервера и REST API.
- `pool` — пул подключений к PostgreSQL, созданный в `src/config/db.py`.

### 2. Загрузка переменных окружения

```python
load_dotenv()
```

- Загружает переменные из файла `.env` в глобальное окружение.
- После этого можно безопасно использовать `os.getenv("DB_USER")` и другие переменные в коде.

### 3. Создание приложения и определение порта

```python
app = FastAPI()
port = int(os.getenv("PORT", 3000))
```

- `app` — это экземпляр FastAPI-приложения. Через него определяются маршруты, `middlewares` и обработчики ошибок.
- `port` — порт, на котором будет запущено приложение (берётся из `.env` или устанавливается значение по умолчанию — `3000`).

### 4. Маршрут `/api/health-check`

```python
@app.get("/api/health-check")
def health_check():
    try:
        with pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
                cur.fetchone()
        return Response(content="OK", status_code=status.HTTP_200_OK)
    except Exception:
        return Response(content="DB connection failed", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
```

- Это технический `GET`-маршрут для проверки работоспособности приложения и соединения с PostgreSQL.
- Выполняется простой запрос `SELECT 1` внутри пула подключений.
- Если соединение успешно — возвращается `200 OK`, иначе `500 DB connection failed`.

::: details HTTP коды
HTTP-статус-коды делятся на 5 категорий, каждая из которых имеет своё назначение. Вот некоторые из них:

### 🔵 1xx — Информационные (Informational)

| Код | Назначение                                                            |
| --- | --------------------------------------------------------------------- |
| 100 | Продолжайте (Continue) — сервер получил заголовки и ждёт тело запроса |
| 101 | Переключение протоколов (Switching Protocols) — например, WebSocket   |

---

### 🟢 2xx — Успешные (Success)

| Код | Назначение                                                                 |
| --- | -------------------------------------------------------------------------- |
| 200 | OK — успешный запрос                                                       |
| 201 | Created — успешно создан ресурс (чаще при POST)                            |
| 204 | No Content — запрос успешен, но тело ответа отсутствует (например, DELETE) |

---

### 🟡 3xx — Перенаправление (Redirection)

| Код | Назначение                                                |
| --- | --------------------------------------------------------- |
| 301 | Moved Permanently — постоянное перенаправление            |
| 302 | Found — временное перенаправление                         |
| 304 | Not Modified — использовать закешированную версию ресурса |

---

### 🔴 4xx — Ошибки клиента (Client Errors)

| Код | Назначение                                                                        |
| --- | --------------------------------------------------------------------------------- |
| 400 | Bad Request — некорректный запрос                                                 |
| 401 | Unauthorized — требуется авторизация                                              |
| 403 | Forbidden — доступ запрещён, даже при наличии авторизации                         |
| 404 | Not Found — запрашиваемый ресурс не найден                                        |
| 409 | Conflict — конфликт запроса (например, при создании дубликата)                    |
| 422 | Unprocessable Entity — ошибка обработки данных (например, ошибка валидации формы) |

---

### 🔴 5xx — Ошибки сервера (Server Errors)

| Код | Назначение                                                              |
| --- | ----------------------------------------------------------------------- |
| 500 | Internal Server Error — внутренняя ошибка сервера                       |
| 502 | Bad Gateway — неверный ответ от стороннего сервера                      |
| 503 | Service Unavailable — сервер временно недоступен (например, перегружен) |
| 504 | Gateway Timeout — истекло время ожидания ответа от другого сервиса      |

:::

::: details HTTP методы
HTTP-методы определяют тип действия, которое клиент (например, браузер или frontend-приложение) хочет выполнить на сервере по заданному URL. Они являются основой для построения REST API и позволяют реализовывать операции чтения, создания, обновления и удаления ресурсов.

Каждый метод имеет своё назначение и семантику, и его правильное использование помогает сделать API логичным, безопасным и удобным для использования.

| Метод   | Назначение                                                                        | Идёмпотентность | Безопасность | Используется в REST для  |
| ------- | --------------------------------------------------------------------------------- | --------------- | ------------ | ------------------------ |
| GET     | Получение данных с сервера                                                        | ✅ Да           | ✅ Да        | Чтение                   |
| POST    | Отправка новых данных на сервер (создание ресурса)                                | ❌ Нет          | ❌ Нет       | Создание                 |
| PUT     | Полное обновление ресурса (замена)                                                | ✅ Да           | ❌ Нет       | Обновление               |
| PATCH   | Частичное обновление ресурса                                                      | ❌ Нет          | ❌ Нет       | Частичное обновление     |
| DELETE  | Удаление ресурса                                                                  | ✅ Да           | ❌ Нет       | Удаление                 |
| HEAD    | Как `GET`, но без тела ответа (используется для проверки заголовков, кеша и т.д.) | ✅ Да           | ✅ Да        | Проверка доступности     |
| OPTIONS | Возвращает допустимые методы для указанного ресурса (применяется для CORS)        | ✅ Да           | ✅ Да        | Обнаружение возможностей |

Если метод идемпотентен, это значит, что повторный вызов этого метода не изменит результат. Например:

- `GET /users` вернёт один и тот же список при каждом вызове;

- `DELETE /user/5` удалит пользователя, и повторный вызов уже ничего не изменит (если пользователь был удалён в первый раз);

- `POST /users` не идемпотентен — при каждом вызове может создаваться новый пользователь.

Безопасный HTTP-метод — это метод, который не изменяет состояние сервера. Он используется только для получения информации, и его выполнение не должно иметь побочных эффектов (например, создавать, изменять или удалять данные). Например:

- `GET` — безопасен, потому что просто читает данные;

- `POST` — не безопасен, потому что может создавать ресурсы или выполнять действия.

:::

### 5. Запуск сервера

```python
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=PORT, reload=True)
```

- Это точка входа для запуска приложения.
- Используется сервер `uvicorn`, совместимый с `ASGI`, который запускает FastAPI-приложение.
- Аргумент `"app:app"` означает: импортировать объект `app` из файла `app.py`.
- Опция `reload=True` автоматически перезапускает сервер при изменении кода (удобно при разработке).

Чтобы запустить наше приложение, выполните команду

```bash
python3 src/app.py
```

Если все сделано правильно, то в консоли будет вывод:

```bash
INFO:     Uvicorn running on http://0.0.0.0:3000 (Press CTRL+C to quit)
INFO:     Started reloader process [90112] using WatchFiles
INFO:     Started server process [90118]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

Чтобы проверить, что подключение к БД выполнено успешно, необходимо сделать `GET` запрос по адресу `http://localhost:3000/api/health-check`. Сделать это можно несколькими способами.

1. С помощью утилиты `curl`

   В другой консоли (так как в первой у нас запущено приложение) выполните команду:

   ```bash
   curl http://localhost:3000/api/health-check
   ```

   В случае успеха вы увидите ответ `OK`. Иначе в консоли с приложением будет ошибка.

2. С помощью браузера.

   Откройте любой браузер и перейдите по адресу `http://localhost:3000/api/health-check`. При таком действии браузер отправляет `GET` запрос. Если все нормально, то вы также увидите текст `Ok`.

3. С помощью программного обеспечения Postman, об этом далее.

## Итог

Мы создали минимальный, но уже работоспособный каркас веб-приложения на основе **FastAPI**.  
Вы узнали, как:

- подключать необходимые зависимости (`fastapi`, `psycopg`, `python-dotenv` и др.);
- использовать `.env` файл для хранения конфигурации;
- подключаться к PostgreSQL через **пул соединений** (`psycopg_pool`);
- реализовать базовую маршрутизацию (`/api/health-check`) для проверки доступности БД;

Этот фундаментальный каркас послужит основой для дальнейшей разработки полноценного REST API.

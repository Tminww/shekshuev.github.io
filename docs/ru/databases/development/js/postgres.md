# Разработка слоя репозиториев web-приложения

## Архитектура приложения: контроллеры, сервисы и репозитории

Когда приложение начинает расти, добавляется всё больше бизнес-логики, валидации, работы с базой данных — и код быстро превращается в нечитаемую "кашу". Чтобы этого избежать, используется **разделение ответственности** — принцип, при котором каждый компонент отвечает только за свою задачу.

В небольших веб-приложениях удобно придерживаться следующей архитектуры:

### 1. Контроллеры (controllers)

Контроллер — это слой, который принимает HTTP-запрос, обрабатывает его и возвращает ответ. Здесь происходит:

- чтение параметров из `req`,
- вызов нужного метода сервиса,
- формирование ответа (`res.status().json(...)`).

Контроллер не содержит бизнес-логики и не обращается напрямую к базе данных — он просто **управляет потоком данных**. Кроме того, на уровне контроллера решаются вопросы по разграничению доступа к ресурсам и фильтрации запросов.

### 2. Сервисы (services)

Сервис — это слой, где находится основная **бизнес-логика приложения**. Он:

- обрабатывает данные,
- проверяет условия (например, "пользователь уже существует"),
- вызывает репозиторий для доступа к базе.

Сервис ничего не знает про `req` и `res` — он универсален и может использоваться как в HTTP-приложении, так и, например, в CLI-утилите или фоновом скрипте.

### 3. Репозитории (repositories)

Репозиторий — это слой, отвечающий за **доступ к данным**. Обычно здесь хранятся SQL-запросы.  
Сервис говорит: "дай мне пользователя по id", а репозиторий выполняет конкретный SQL-запрос и возвращает результат.

Такой подход позволяет:

- изолировать работу с базой,
- легче писать и запускать юнит-тесты,
- менять способ хранения данных (например, заменить PostgreSQL на MongoDB) с минимальными изменениями.

### Преимущества архитектуры:

- Код становится **чище, понятнее и масштабируемее**;
- Каждый слой можно **тестировать отдельно**;
- Упрощается командная разработка — каждый работает в своей зоне ответственности;
- Легче поддерживать и расширять приложение в будущем.

В соответсвии с архитектурой мы построим разработку следующим образом: сначала разработаем слой репозитория, затем слой сервисов и в конце слой контроллеров. Для каждого слоя напишем Вам будут предоставлены unit-тесты для проверки корректности разработки конкретного слоя.

## Разработка репозитория пользователей

В папке `src` проекта создайте папку `repositories`, а в ней файл `userRepository.js`. Поместите в него следующий код:

```js
import { pool } from "../db/index.js";

export const UserRepository = {
  async createUser(dto) {
    const query = `
      INSERT INTO users (user_name, first_name, last_name, password_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING id, user_name, password_hash, status;
    `;
    const values = [dto.user_name, dto.first_name, dto.last_name, dto.password_hash];
    const res = await pool.query(query, values);
    return res.rows[0];
  },
};
```

Этот код реализует метод `createUser` в объекте `UserRepository`, который отвечает за добавление нового пользователя в базу данных.

### Пошаговый разбор

- Импорт подключения к базе данных:

  ```js
  import { pool } from "../db/index.js";
  ```

  Здесь импортируется объект `pool`, который представляет пул подключений к базе данных PostgreSQL. Он уже настроен в другом модуле (`db/index.js`) и позволяет выполнять SQL-запросы.

- Экспорт объекта `UserRepository`:

  ```js
  export const UserRepository = { ... }
  ```

- Определение метода `createUser`:

  ```js
  async createUser(dto) { ... }
  ```

  Метод `createUser` — асинхронная функция, которая принимает объект `dto` (data transfer object) с полями нового пользователя. В нашем случае это `user_name`, `first_name`, `last_name`, `password_hash`.

- SQL-запрос на вставку

  ```js
  const query = `
  INSERT INTO users (user_name, first_name, last_name, password_hash)
  VALUES ($1, $2, $3, $4)
  RETURNING id, user_name, password_hash, status;
  `;
  ```

  Это SQL-запрос, который вставляет нового пользователя в таблицу `users`. Используются подстановки `$1`, `$2`, `$3`, `$4` — это позиционные параметры (предотвращают SQL-инъекции). После вставки сразу возвращаются данные нового пользователя: его `id`, `user_name`, `password_hash` и `status`.

  ::: details SQL-инъекции
  SQL-инъекция — это один из самых распространённых видов атак на базу данных.
  Она возникает, когда ввод пользователя напрямую вставляется в SQL-запрос без проверки и экранирования, что позволяет злоумышленнику изменить логику запроса.

  **Пример уязвимого кода:**

  ```js
  const userInput = "' OR 1=1 --";
  const query = `SELECT * FROM users WHERE user_name = '${userInput}'`;
  ```

  Вместо ожидаемого безопасного значения, пользователь ввёл строку `' OR 1=1 --`.

  В результате итоговый SQL-запрос будет выглядеть так:

  ```sql
  SELECT * FROM users WHERE user_name = '' OR 1=1 --';
  ```

  Что здесь происходит:

  - `user_name = ''` — первое условие, оно просто проверяет, что имя пользователя пустое;

  - `OR 1=1` — логическое выражение, которое всегда истинно, то есть условие выполняется для всех пользователей;

  - `--` — начало SQL-комментария, всё, что идёт после него, игнорируется СУБД;

  - `';` — эта часть уже не исполняется, так как закомментирована.

  Этот запрос вернёт всех пользователей из базы, потому что `1=1` всегда истинно. Если такой запрос используется при входе в систему, злоумышленник может войти без пароля, просто потому что запрос "обманывает" проверку логина.

  Используя позиционные параметры, мы избегаем этой проблемы:

  ```js
  const query = "SELECT * FROM users WHERE user_name = $1";
  const values = [userInput];
  await pool.query(query, values);
  ```

  В случае использования позиционных параметров, даже если пользователь введёт `' OR 1=1 --`, это не приведёт к SQL-инъекции, потому что ввод не вставляется напрямую в текст SQL-запроса. Вместо этого он передаётся отдельно в виде значения, а не как часть кода, а на уровне драйвера PostgreSQL (`pg`) реализован механизм, который:

  - экранирует специальные символы,

  - оборачивает значение в кавычки при необходимости,

  - и гарантирует, что ввод будет интерпретироваться именно как строка, а не как SQL-операторы.

  Проще говоря, драйвер сам "разделяет" SQL-код и пользовательские данные, не давая последним повлиять на логику выполнения запроса.

  Поэтому даже вредоносная строка будет просто передана как обычное значение поля `user_name`, а не как часть SQL-запроса.

  :::

- Подготовка значений для запроса:

  ```js
  const values = [dto.user_name, dto.first_name, dto.last_name, dto.password_hash];
  ```

  Значения берутся из входного объекта `dto` и передаются в том порядке, в котором указаны в SQL-запросе.

- Выполнение запроса

  ```js
  const res = await pool.query(query, values);
  ```

  Запрос выполняется с помощью метода `pool.query(...)`. Он асинхронный, поэтому используется `await`. Результат сохраняется в переменной `res`.

- Возврат результата:

  ```js
  return res.rows[0];
  ```

  После выполнения запроса возвращается первая (и единственная) строка результата — то есть данные только что созданного пользователя.

Мы сделали создание пользователя. Также необходимо реализовать методы:

- `getAllUsers` - получение списка всех пользователей с пагинацией,

- `getUserById` - получение пользователя по его id,

- `getUserByUserName` - получение пользователя по его имени пользователя,

- `updateUser` - обновление данных пользователя,

- `deleteUser` - удаление пользователя

Реализуем метод `getAllUsers`.

```js
import { pool } from "../db/index.js";

export const UserRepository = {
  async createUser(dto) {
    const query = `
      INSERT INTO users (user_name, first_name, last_name, password_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING id, user_name, password_hash, status;
    `;
    const values = [dto.user_name, dto.first_name, dto.last_name, dto.password_hash];
    const res = await pool.query(query, values);
    return res.rows[0];
  },

  async getAllUsers(limit, offset) {
    const query = `
      SELECT id, user_name, first_name, last_name, status, created_at, updated_at
      FROM users
      WHERE deleted_at IS NULL
      OFFSET $1 LIMIT $2;
    `;
    const res = await pool.query(query, [offset, limit]);
    return res.rows;
  },
};
```

Обратите внимание, что метод принимает два параметра - `offset` и `limit`. Они необходимы для того, чтобы сделать пагинацию, то есть отдавать не всех пользователей сразу, а частями в рамках скользящего окна.

Перейдем к методам `getUserById` и `getUserByUserName`.

```js
import { pool } from "../db/index.js";

export const UserRepository = {
  async createUser(dto) {
    const query = `
      INSERT INTO users (user_name, first_name, last_name, password_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING id, user_name, password_hash, status;
    `;
    const values = [dto.user_name, dto.first_name, dto.last_name, dto.password_hash];
    const res = await pool.query(query, values);
    return res.rows[0];
  },

  async getAllUsers(limit, offset) {
    const query = `
      SELECT id, user_name, first_name, last_name, status, created_at, updated_at
      FROM users
      WHERE deleted_at IS NULL
      OFFSET $1 LIMIT $2;
    `;
    const res = await pool.query(query, [offset, limit]);
    return res.rows;
  },

  async getUserById(id) {
    const query = `...`;
    const res = await pool.query(query, [id]);
    if (res.rowCount === 0) {
      throw new Error("User not found");
    }
    return res.rows[0];
  },

  async getUserByUserName(user_name) {
    const query = `... `;
    const res = await pool.query(query, [user_name]);
    if (res.rowCount === 0) {
      throw new Error("User not found");
    }
    return res.rows[0];
  },
};
```

> [!IMPORTANT] Задание
> Напишите самостоятельно SQL запросы для методов `getUserById` и `getUserByUserName`. Для метода `getUserById` необходимо вернуть поля `user_name`, `first_name`, `last_name`, `status`, `created_at`, `updated_at`, а для метода `getUserByUserName` - `user_name`, `password_hash`, `status`.

Рассмотрим метод `updateUser`

```js
async updateUser(id, dto) {
    const fields = [];
    const args = [];
    let index = 1;

    if (dto.password_hash) {
      fields.push(`password_hash = $${index++}`);
      args.push(dto.password_hash);
    }
    if (dto.user_name) {
      fields.push(`user_name = $${index++}`);
      args.push(dto.user_name);
    }
    if (dto.first_name) {
      fields.push(`first_name = $${index++}`);
      args.push(dto.first_name);
    }
    if (dto.last_name) {
      fields.push(`last_name = $${index++}`);
      args.push(dto.last_name);
    }

    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    fields.push(`updated_at = NOW()`);
    const query = `
      UPDATE users SET ${fields.join(", ")}
      WHERE id = $${index} AND deleted_at IS NULL
      RETURNING id, user_name, first_name, last_name, status, created_at, updated_at;
    `;
    args.push(id);

    const res = await pool.query(query, args);
    if (res.rowCount === 0) {
      throw new Error("User not found");
    }
    return res.rows[0];
  }
```

Этот асинхронный метод предназначен для обновления данных пользователя в базе данных. Он принимает два аргумента:

- `id`: Идентификатор пользователя, которого необходимо обновить.
- `dto`: Объект, содержащий данные для обновления.

### Логика работы:

1.  **Инициализация**:

    - Создаются два массива: `fields` для хранения строк с обновлениями полей (`field = $index`) и `args` для хранения значений, которые будут подставлены в запрос.
    - `index` инициализируется значением `1`. Эта переменная используется для генерации плейсхолдеров `$1`, `$2` и т.д. в SQL-запросе.

2.  **Проверка полей для обновления**:

    - Выполняется последовательная проверка наличия полей в объекте `dto` и добавление соответствующих данных в массивы `fields` и `args`:
      - `password_hash`: Если присутствует, добавляется `password_hash = $index` в `fields` и значение `dto.password_hash` в `args`.
      - `user_name`: Аналогично для имени пользователя.
      - `first_name`: Аналогично для имени.
      - `last_name`: Аналогично для фамилии.
    - При каждом добавлении поля `index` увеличивается.

3.  **Проверка наличия полей для обновления**:

    - Если массив `fields` пуст (то есть в `dto` не было полей для обновления), выбрасывается исключение `Error("No fields to update")`.

4.  **Добавление поля `updated_at`**:

    - В массив `fields` добавляется строка `updated_at = NOW()`, которая обновит поле `updated_at` текущим временем.

5.  **Формирование SQL-запроса**:

    - Формируется SQL-запрос для обновления данных пользователя.
    - Используется конструкция `UPDATE users SET ${fields.join(", ")}`, где `fields.join(", ")` объединяет строки с обновлениями полей в одну строку, разделенную запятыми.
    - Условие `WHERE id = $index AND deleted_at IS NULL` указывает, что обновлять нужно пользователя с заданным `id`, который не помечен как удаленный (`deleted_at IS NULL`).
    - Конструкция `RETURNING id, user_name, first_name, last_name, status, created_at, updated_at` возвращает данные обновленного пользователя.

6.  **Добавление `id` пользователя в аргументы запроса**:

    - В массив `args` добавляется `id` пользователя, который будет использоваться в условии `WHERE id = $index`.

7.  **Выполнение запроса**:

    - Выполняется SQL-запрос с использованием `pool.query(query, args)`. Результат запроса сохраняется в переменной `res`.

8.  **Обработка результата запроса**:
    - Если `res.rowCount === 0`, то есть не было найдено ни одного пользователя для обновления, выбрасывается исключение `Error("User not found")`.
    - В противном случае возвращается первая строка результата запроса (`res.rows[0]`), содержащая данные обновленного пользователя.

Последний метод, который мы реализуем в этом репозитории - это метод удаления пользователя `deleteUser`.

```js
async deleteUser(id) {
    const query = `...`;
    const res = await pool.query(query, [id]);
    if (res.rowCount === 0) {
      throw new Error("User not found");
    }
  }
```

Этот асинхронный метод предназначен для "удаления" пользователя из базы данных. Фактически, это может быть мягкое удаление (soft delete), когда запись не удаляется физически, а лишь помечается как удалённая. Либо это может быть полное удаление записи из таблицы.

### Логика работы:

1.  **Формирование SQL-запроса**

2.  **Выполнение запроса**:

    - Выполняется SQL-запрос с использованием `pool.query(query, [id])`. Результат запроса сохраняется в переменной `res`.

3.  **Обработка результата запроса**:
    - Если `res.rowCount === 0`, это значит, что не было найдено пользователя с указанным `id` для удаления. В этом случае выбрасывается исключение `Error("User not found")`.

> [!IMPORTANT] Задание
> Напишите SQL-запрос, который выполняет мягкое удаление пользователя, устанавливая значение `deleted_at` в текущее время для пользователя с указанным `id`. Также напишите SQL-запрос, который полностью удаляет пользователя с указанным `id` из таблицы.

# Разработка функционального слоя web-приложения

# Разработка слоя контроллеров web-приложения

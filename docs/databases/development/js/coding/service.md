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

- `AuthService` — регистрация, вход в систему, генерация токенов.

- `UserService` — управление пользователями (поиск, обновление, удаление).

- `PostService` — работа с постами (создание, получение, лайки, просмотры и удаление).

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

В папке `src` проекта создайте папку `services`, а в ней файл `authService.js`, и поместите туда следующий код:

```js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserRepository } from "../repositories/userRepository.js";

export const AuthService = {
  async login(dto) {
    const user = await UserRepository.getUserByUserName(dto.user_name);
    if (!user) {
      throw new Error("User not found");
    }
    const valid = await bcrypt.compare(dto.password, user.password_hash);
    if (!valid) {
      throw new Error("Wrong password");
    }
    return this.generateTokenPair(user);
  },

  async register(dto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const newUserDTO = {
      user_name: dto.user_name,
      password_hash: hashedPassword,
      first_name: dto.first_name,
      last_name: dto.last_name,
    };
    const user = await UserRepository.createUser(newUserDTO);
    return this.generateTokenPair(user);
  },

  generateTokenPair(user) {
    const id = user.id.toString();
    const accessToken = jwt.sign({ sub: id }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES,
    });
    const refreshToken = jwt.sign({ sub: id }, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES,
    });
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  },
};
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

**`generateTokenPair(user)`**

- Генерирует два токена:

  - access token — для быстрой аутентификации;

  - refresh token — для обновления access token без повторного входа.

- Использует секреты и время жизни токенов из конфигурации.

В сервисе авторизации (`AuthService`) для создания JWT-токенов используются переменные окружения. Они позволяют гибко настраивать параметры безопасности без изменения кода приложения.

| Переменная              | Текущее значение                 | Пример другого значения     | Описание                                                                                                      |
| :---------------------- | :------------------------------- | :-------------------------- | :------------------------------------------------------------------------------------------------------------ |
| `ACCESS_TOKEN_EXPIRES`  | `1h`                             | `15m`, `2h`, `7d`           | Срок действия access-токена (время жизни). Указывается в формате времени: минуты (`m`), часы (`h`), дни (`d`) |
| `REFRESH_TOKEN_EXPIRES` | `24h`                            | `7d`, `30d`                 | Срок действия refresh-токена. Обычно длиннее, чем у access-токена                                             |
| `ACCESS_TOKEN_SECRET`   | `super_secret_access_token_key`  | `any_random_secure_key`     | Секретная строка для подписания access-токенов                                                                |
| `REFRESH_TOKEN_SECRET`  | `super_secret_refresh_token_key` | `another_random_secure_key` | Секретная строка для подписания refresh-токенов                                                               |

По умолчанию библиотека jsonwebtoken использует алгоритм HS256 (HMAC + SHA-256).
Это симметричный алгоритм: для подписи и проверки токена используется один и тот же секретный ключ.

Требования к секретному ключу (`ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`):

- Секрет должен быть достаточно длинным и случайным, чтобы обеспечить безопасность.

- Рекомендуемая длина — не менее 32 символов.

- Нельзя использовать простые слова вроде password или 12345.

- Хорошая практика: генерировать секрет через специальные генераторы (например, openssl rand -hex 32).

## Тестирование сервиса авторизации

Сразу напишем тесты для `authService`, чтобы проверить его работу. Для этого в папке `__tests__` создайте папку `services`, а в ней файл `authService.test.js`. Поместите в него код ниже.

::: details Unit-тесты authService

```js
import { describe, expect, jest } from "@jest/globals";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserRepository } from "../../src/repositories/userRepository.js";
import { AuthService } from "../../src/services/authService.js";

describe("AuthService", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("login", () => {
    it("successfully logs in a user", async () => {
      const password = "password123";
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = {
        id: 1,
        user_name: "testuser",
        password_hash: hashedPassword,
      };

      const dto = {
        user_name: "testuser",
        password: "password123",
      };

      jest.spyOn(UserRepository, "getUserByUserName").mockResolvedValue(user);
      jest.spyOn(bcrypt, "compare").mockResolvedValue(true);
      jest.spyOn(jwt, "sign").mockReturnValue("mocked_token");

      const result = await AuthService.login(dto);

      expect(result).toEqual({
        access_token: "mocked_token",
        refresh_token: "mocked_token",
      });

      expect(bcrypt.compare).toHaveBeenCalledWith(dto.password, user.password_hash);
    });

    it("throws error if user not found", async () => {
      const dto = {
        user_name: "nonexistent",
        password: "password123",
      };

      jest.spyOn(UserRepository, "getUserByUserName").mockResolvedValue(null);

      await expect(AuthService.login(dto, {})).rejects.toThrow("User not found");
    });

    it("throws error if password is wrong", async () => {
      const user = {
        id: 1,
        user_name: "testuser",
        password_hash: await bcrypt.hash("password123", 10),
      };

      const dto = {
        user_name: "testuser",
        password: "wrongpassword",
      };

      jest.spyOn(UserRepository, "getUserByUserName").mockResolvedValue(user);
      jest.spyOn(bcrypt, "compare").mockResolvedValue(false);

      await expect(AuthService.login(dto, {})).rejects.toThrow("Wrong password");
    });
  });

  describe("register", () => {
    it("successfully registers a user", async () => {
      const dto = {
        user_name: "newuser",
        password: "password123",
        first_name: "New",
        last_name: "User",
      };

      const user = {
        id: 1,
        user_name: "newuser",
        password_hash: "hashed_password",
        first_name: "New",
        last_name: "User",
      };

      jest.spyOn(bcrypt, "hash").mockResolvedValue("hashed_password");
      jest.spyOn(UserRepository, "createUser").mockResolvedValue(user);
      jest.spyOn(jwt, "sign").mockReturnValue("mocked_token");

      const result = await AuthService.register(dto);

      expect(result).toEqual({
        access_token: "mocked_token",
        refresh_token: "mocked_token",
      });

      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
      expect(UserRepository.createUser).toHaveBeenCalled();
    });
  });
});
```

:::

Запустите тесты. Если все сделано правильно, ошибок в тестах не будет.

```bash
npm run test

> gophertalk-backend-express@0.1.0 test
> node --experimental-vm-modules node_modules/jest/bin/jest.js

(node:82199) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
 PASS  __tests__/services/authService.test.js
 PASS  __tests__/repositories/postRepository.test.js
 PASS  __tests__/repositories/userRepository.test.js

Test Suites: 3 passed, 3 total
Tests:       34 passed, 34 total
Snapshots:   0 total
Time:        0.405 s, estimated 1 s
Ran all test suites.
```

## Разработка сервиса пользователей

Сервис пользователей (`UserService`) отвечает за работу с данными пользователей через репозиторий. В его задачи входят получение списка пользователей, поиск конкретного пользователя по ID, обновление информации пользователя (включая шифрование пароля) и удаление пользователя.

Для его реализации в каталоге `services` создайте файл `src/userService.js` и поместите туда код:

```js
import { UserRepository } from "../repositories/userRepository.js";
import bcrypt from "bcrypt";

export const UserService = {
  async getAllUsers(limit, offset) {
    return await UserRepository.getAllUsers(limit, offset);
  },

  async getUserById(id) {
    return await UserRepository.getUserById(id);
  },

  async updateUser(id, userDto) {
    const updateFields = { ...userDto };
    if (updateFields.password) {
      const saltRounds = 10;
      updateFields.password_hash = await bcrypt.hash(updateFields.password, saltRounds);
      delete updateFields.password;
    }
    return await UserRepository.updateUser(id, updateFields);
  },

  async deleteUser(id) {
    return await UserRepository.deleteUser(id);
  },
};
```

**`getAllUsers(limit, offset)`**

- Получает всех пользователей с пагинацией.

- Делает запрос в репозиторий с параметрами смещения (`offset`) и лимита (`limit`).

**`getUserById(id)`**

- Находит пользователя по его уникальному идентификатору.

**`updateUser(id, userDto)`**

- Обновляет данные пользователя.

- Если передан новый пароль, он хэшируется через `bcrypt` перед сохранением.

- Оригинальный пароль удаляется из объекта перед обновлением.

**`deleteUser(id)`**

- Удаляет пользователя по его ID. На уровне репозитория обычно реализовано мягкое удаление через установку поля `deleted_at`.

## Тестирование сервиса пользователей

Также сразу напишем тесты для `userService`, чтобы проверить его работу. Для этого в папке `__tests__/services` создайте файл `userService.test.js`. Поместите в него код ниже.

::: details Unit-тесты userService

```js
import { expect, jest } from "@jest/globals";
import { UserRepository } from "../../src/repositories/userRepository.js";
import { UserService } from "../../src/services/userService.js";

describe("UserService", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllUsers", () => {
    it("successfully gets all users", async () => {
      const mock = jest.spyOn(UserRepository, "getAllUsers");
      const now = new Date();

      const expectedUsers = [
        {
          id: 1,
          user_name: "john",
          first_name: "John",
          last_name: "Doe",
          status: 1,
          created_at: now,
          updated_at: now,
        },
        {
          id: 2,
          user_name: "jane",
          first_name: "Jane",
          last_name: "Smith",
          status: 1,
          created_at: now,
          updated_at: now,
        },
      ];

      mock.mockResolvedValueOnce(expectedUsers);

      const result = await UserService.getAllUsers(100, 0);

      expect(result).toEqual(expectedUsers);
      expect(mock).toHaveBeenCalledWith(100, 0);
    });

    it("returns error on getAllUsers failure", async () => {
      const mock = jest.spyOn(UserRepository, "getAllUsers");

      mock.mockRejectedValueOnce(new Error("SQL error"));

      await expect(UserService.getAllUsers(100, 0)).rejects.toThrow("SQL error");
      expect(mock).toHaveBeenCalledWith(100, 0);
    });
  });

  describe("getUserById", () => {
    it("successfully gets user by id", async () => {
      const mock = jest.spyOn(UserRepository, "getUserById");
      const now = new Date();

      const expectedUser = {
        id: 1,
        user_name: "john",
        first_name: "John",
        last_name: "Doe",
        status: 1,
        created_at: now,
        updated_at: now,
      };

      mock.mockResolvedValueOnce(expectedUser);

      const result = await UserService.getUserById(1);

      expect(result).toEqual(expectedUser);
      expect(mock).toHaveBeenCalledWith(1);
    });

    it("returns error if user not found", async () => {
      const mock = jest.spyOn(UserRepository, "getUserById");

      mock.mockRejectedValueOnce(new Error("User not found"));

      await expect(UserService.getUserById(2)).rejects.toThrow("User not found");
      expect(mock).toHaveBeenCalledWith(2);
    });
  });

  describe("updateUser", () => {
    it("successfully updates user", async () => {
      const mockUpdate = jest.spyOn(UserRepository, "updateUser");
      const now = new Date();

      const updateDTO = {
        user_name: "john_updated",
        first_name: "John",
        last_name: "Doe",
        password: "newpassword",
      };

      const expectedUpdatedUser = {
        id: 1,
        user_name: "john_updated",
        first_name: "John",
        last_name: "Doe",
        status: 1,
        created_at: new Date(now.getTime() - 3600000),
        updated_at: now,
      };

      mockUpdate.mockResolvedValueOnce(expectedUpdatedUser);

      const result = await UserService.updateUser(1, { ...updateDTO });

      expect(result).toEqual(expectedUpdatedUser);
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockUpdate.mock.calls[0][1].password_hash).toBeDefined();
    });

    it("returns error if update fails", async () => {
      const mockUpdate = jest.spyOn(UserRepository, "updateUser");

      mockUpdate.mockRejectedValueOnce(new Error("Update failed"));

      await expect(UserService.updateUser(2, { user_name: "ghost" })).rejects.toThrow("Update failed");
    });
  });

  describe("deleteUser", () => {
    it("successfully deletes user", async () => {
      const mockDelete = jest.spyOn(UserRepository, "deleteUser");

      mockDelete.mockResolvedValueOnce(undefined);

      await expect(UserService.deleteUser(1)).resolves.toBeUndefined();
      expect(mockDelete).toHaveBeenCalledWith(1);
    });

    it("returns error if delete fails", async () => {
      const mockDelete = jest.spyOn(UserRepository, "deleteUser");

      mockDelete.mockRejectedValueOnce(new Error("Delete error"));

      await expect(UserService.deleteUser(2)).rejects.toThrow("Delete error");
      expect(mockDelete).toHaveBeenCalledWith(2);
    });
  });
});
```

:::

Запустите тесты. Если все сделано правильно, ошибок в тестах не будет.

```bash
npm run test

> gophertalk-backend-express@0.1.0 test
> node --experimental-vm-modules node_modules/jest/bin/jest.js

(node:89149) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
 PASS  __tests__/services/authService.test.js
 PASS  __tests__/repositories/postRepository.test.js
 PASS  __tests__/repositories/userRepository.test.js
 PASS  __tests__/services/userService.test.js

Test Suites: 4 passed, 4 total
Tests:       42 passed, 42 total
Snapshots:   0 total
Time:        0.525 s, estimated 1 s
Ran all test suites.
```

## Разработка сервиса постов

В этом сервисе реализуется бизнес-логика для работы с постами в социальной сети GopherTalk. Сервис служит промежуточным слоем между контроллерами и репозиторием, обеспечивая удобный интерфейс для работы с публикациями.

```js
import { PostRepository } from "../repositories/postRepository.js";

export const PostService = {
  async getAllPosts(filterDTO) {
    return await PostRepository.getAllPosts(filterDTO);
  },

  async createPost(createDTO) {
    return await PostRepository.createPost(createDTO);
  },

  async deletePost(postId, ownerId) {
    return await PostRepository.deletePost(postId, ownerId);
  },

  async viewPost(postId, userId) {
    return await PostRepository.viewPost(postId, userId);
  },

  async likePost(postId, userId) {
    return await PostRepository.likePost(postId, userId);
  },

  async dislikePost(postId, userId) {
    return await PostRepository.dislikePost(postId, userId);
  },
};
```

**`getAllPosts(filterDTO)`**

- Получает список постов с поддержкой фильтрации по автору, тексту поста или родительскому посту (`reply_to_id`). Делегирует выполнение запроса в `PostRepository.getAllPosts`.

**`createPost(createDTO)`**

- Создаёт новый пост в системе. Получает DTO с данными поста и вызывает `PostRepository.createPost`, чтобы сохранить запись в базе данных.

**`deletePost(postId, ownerId)`**

- Удаляет пост пользователя. Передаёт идентификатор поста и владельца в `PostRepository.deletePost`, где происходит мягкое удаление (установка `deleted_at`).

**`viewPost(postId, userId)`**

- Фиксирует факт просмотра поста пользователем. Вызывает `PostRepository.viewPost`, чтобы добавить новую запись в таблицу просмотров (`views`).

**`likePost(postId, userId)`**

- Позволяет пользователю поставить лайк на пост. Обращается к `PostRepository.likePost`, чтобы сохранить лайк в базе данных.

**`dislikePost(postId, userId)`**

- Позволяет пользователю убрать свой лайк с поста. Вызывает `PostRepository.dislikePost` для удаления записи о лайке.

## Тестирование сервиса постов

Аналогично и здесь сразу напишем тесты для `postService`, чтобы проверить его работу. Для этого в папке `__tests__/services` создайте файл `postService.test.js`. Поместите в него код ниже.

::: details Unit-тесты postService

```js
import { describe, expect, jest } from "@jest/globals";
import { PostRepository } from "../../src/repositories/postRepository.js";
import { PostService } from "../../src/services/postService.js";

describe("PostService", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllPosts", () => {
    it("successfully gets all posts", async () => {
      const posts = [
        { id: 1, text: "post1" },
        { id: 2, text: "post2" },
      ];
      const mock = jest.spyOn(PostRepository, "getAllPosts").mockResolvedValue(posts);

      const result = await PostService.getAllPosts({
        user_id: 1,
        limit: 100,
        offset: 0,
      });
      expect(result).toEqual(posts);
      expect(mock).toHaveBeenCalledTimes(1);
    });

    it("throws error on failure", async () => {
      const mock = jest.spyOn(PostRepository, "getAllPosts").mockRejectedValue(new Error("DB error"));

      await expect(PostService.getAllPosts({ user_id: 1, limit: 100, offset: 0 })).rejects.toThrow("DB error");
      expect(mock).toHaveBeenCalledTimes(1);
    });
  });

  describe("createPost", () => {
    it("successfully creates a post", async () => {
      const post = { id: 1, text: "new post" };
      const mock = jest.spyOn(PostRepository, "createPost").mockResolvedValue(post);

      const result = await PostService.createPost({
        text: "new post",
        user_id: 1,
      });
      expect(result).toEqual(post);
      expect(mock).toHaveBeenCalledTimes(1);
    });

    it("throws error on insert failure", async () => {
      const mock = jest.spyOn(PostRepository, "createPost").mockRejectedValue(new Error("Insert error"));

      await expect(PostService.createPost({ text: "new post", user_id: 1 })).rejects.toThrow("Insert error");
      expect(mock).toHaveBeenCalledTimes(1);
    });
  });

  describe("deletePost", () => {
    it("successfully deletes a post", async () => {
      const mock = jest.spyOn(PostRepository, "deletePost").mockResolvedValue();

      await expect(PostService.deletePost(1, 0)).resolves.toBeUndefined();
      expect(mock).toHaveBeenCalledWith(1, 0);
    });

    it("throws error on delete failure", async () => {
      const mock = jest.spyOn(PostRepository, "deletePost").mockRejectedValue(new Error("Delete error"));

      await expect(PostService.deletePost(2, 0)).rejects.toThrow("Delete error");
      expect(mock).toHaveBeenCalledWith(2, 0);
    });
  });

  describe("viewPost", () => {
    it("successfully views a post", async () => {
      const mock = jest.spyOn(PostRepository, "viewPost").mockResolvedValue();

      await expect(PostService.viewPost(1, 0)).resolves.toBeUndefined();
      expect(mock).toHaveBeenCalledWith(1, 0);
    });

    it("throws error on view failure", async () => {
      const mock = jest.spyOn(PostRepository, "viewPost").mockRejectedValue(new Error("View error"));

      await expect(PostService.viewPost(2, 0)).rejects.toThrow("View error");
      expect(mock).toHaveBeenCalledWith(2, 0);
    });
  });

  describe("likePost", () => {
    it("successfully likes a post", async () => {
      const mock = jest.spyOn(PostRepository, "likePost").mockResolvedValue();

      await expect(PostService.likePost(1, 0)).resolves.toBeUndefined();
      expect(mock).toHaveBeenCalledWith(1, 0);
    });

    it("throws error on like failure", async () => {
      const mock = jest.spyOn(PostRepository, "likePost").mockRejectedValue(new Error("Like error"));

      await expect(PostService.likePost(2, 0)).rejects.toThrow("Like error");
      expect(mock).toHaveBeenCalledWith(2, 0);
    });
  });

  describe("dislikePost", () => {
    it("successfully dislikes a post", async () => {
      const mock = jest.spyOn(PostRepository, "dislikePost").mockResolvedValue();

      await expect(PostService.dislikePost(1, 0)).resolves.toBeUndefined();
      expect(mock).toHaveBeenCalledWith(1, 0);
    });

    it("throws error on dislike failure", async () => {
      const mock = jest.spyOn(PostRepository, "dislikePost").mockRejectedValue(new Error("Dislike error"));

      await expect(PostService.dislikePost(2, 0)).rejects.toThrow("Dislike error");
      expect(mock).toHaveBeenCalledWith(2, 0);
    });
  });
});
```

:::

Запустите тесты. Если все сделано правильно, ошибок в тестах не будет.

```bash
npm run test

> gophertalk-backend-express@0.1.0 test
> node --experimental-vm-modules node_modules/jest/bin/jest.js

(node:95533) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
 PASS  __tests__/services/postService.test.js
 PASS  __tests__/services/authService.test.js
 PASS  __tests__/services/userService.test.js
 PASS  __tests__/repositories/userRepository.test.js
 PASS  __tests__/repositories/postRepository.test.js

Test Suites: 5 passed, 5 total
Tests:       54 passed, 54 total
Snapshots:   0 total
Time:        0.568 s, estimated 1 s
Ran all test suites.
```

## Итог

В рамках данного учебного вопроса мы разработали уровень бизнес-логики для трёх основных сущностей: пользователей, постов и аутентификации.
Каждый сервис был реализован через соответствующий репозиторий и обеспечивал выполнение своих задач без прямого взаимодействия с базой данных.

- `AuthService` отвечает за регистрацию и аутентификацию пользователей, создание пары токенов (access и refresh), а также проверку пароля.

- `UserService` обеспечивает работу с пользователями: получение списка всех пользователей, получение пользователя по ID, обновление данных и удаление пользователей.

- `PostService` управляет созданием, удалением, просмотром постов и действиями пользователей (лайк, дизлайк).

Была соблюдена чистая архитектура:

- Репозитории инкапсулируют работу с базой данных.

- Сервисы выполняют бизнес-логику и валидируют данные.

- Взаимодействие между слоями происходит через интерфейсы и DTO-структуры.

Также для каждого сервиса были разработаны и адаптированы тесты на Jest, которые проверяют как положительные, так и отрицательные сценарии выполнения методов. Это позволило убедиться в корректности бизнес-логики до этапа интеграции с реальной базой данных.

Таким образом, реализованная структура закладывает надёжную основу для дальнейшего масштабирования и расширения проекта.

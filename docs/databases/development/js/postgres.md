## Developing the Repository Layer of a Web Application

You need to manually create SQL tables that reflect the structure of the GopherTalk social network. Below are the tables, their fields, and the relationships between them.

1. **Table `users`** — stores user data.
2. **Table `posts`** — stores user posts. The `reply_to_id` field refers to another post if it's a reply.
3. **Table `likes`** — stores information about which users liked which posts.
4. **Table `views`** — stores information about which users viewed which posts.

```mermaid
erDiagram
  users {
    BIGSERIAL id PK
    VARCHAR(30) user_name
    VARCHAR(30) first_name
    VARCHAR(30) last_name
    VARCHAR(72) password_hash
    SMALLINT status
    TIMESTAMP created_at
    TIMESTAMP updated_at
    TIMESTAMP deleted_at
  }

  posts {
    BIGSERIAL id PK
    VARCHAR(280) text
    BIGINT reply_to_id FK
    BIGINT user_id FK
    TIMESTAMP created_at
    TIMESTAMP deleted_at
  }

  likes {
    BIGINT user_id PK, FK
    BIGINT post_id PK, FK
    TIMESTAMP created_at
  }

  views {
    BIGINT user_id PK, FK
    BIGINT post_id PK, FK
    TIMESTAMP created_at
  }

  users ||--o{ posts : ""
  users ||--o{ likes : ""
  users ||--o{ views : ""

  posts ||--o{ likes : ""
  posts ||--o{ views : ""
  posts ||--o{ posts : ""

```

### Requirements:

- Use the data types and constraints as described.
- Set up primary and foreign keys accordingly.
- Create a unique index on `user_name`, but only for users who are not deleted (`deleted_at IS NULL`).
- Make sure that the `status` field can only have values `0` or `1`.

> 💡 Tip: After creating the tables, verify the schema using an ER diagram to ensure the relationships are correct.

## Application Architecture: Controllers, Services, and Repositories

As an application grows, more business logic, validation, and database operations are added — and the code quickly turns into an unreadable mess.  
To prevent this, we use the principle of **separation of concerns** — where each component is responsible only for its specific task.

In small web applications, it's convenient to follow this architecture:

### 1. Controllers

A controller is the layer that handles an HTTP request, processes it, and returns a response. Here’s what typically happens:

- reading parameters from `req`,
- calling the appropriate service method,
- forming the response (`res.status().json(...)`).

A controller does **not** contain business logic or directly access the database — it simply **orchestrates the data flow**.  
Additionally, access control and request filtering are often handled at the controller level.

### 2. Services

A service is the layer that contains the core **business logic** of the application. It:

- processes data,
- checks conditions (e.g., "user already exists"),
- calls the repository to access the database.

A service knows nothing about `req` or `res` — it’s universal and can be reused in HTTP apps, CLI tools, or background scripts.

### 3. Repositories

A repository is the layer responsible for **data access**. This is where SQL queries usually live.  
The service says: “get me the user by id”, and the repository executes the SQL query and returns the result.

This approach allows you to:

- isolate database logic,
- write and run unit tests more easily,
- switch the data storage method (e.g., from PostgreSQL to MongoDB) with minimal changes.

### Advantages of this architecture:

- Code becomes **cleaner, clearer, and more maintainable**;
- Each layer can be **tested independently**;
- Teamwork is simplified — everyone focuses on their own area of responsibility;
- It’s easier to support and scale the application in the future.

According to the chosen architecture, we will build the development process as follows:  
first, we will implement the repository layer, then the service layer, and finally the controller layer.  
For each layer, you will be provided with unit tests to verify the correctness of your implementation.

## Developing the User Repository

At this stage, we will implement the **user repository** — the layer responsible for interacting with the database.  
This layer handles storing, retrieving, updating, and deleting user data, without involving any business logic or HTTP controllers.

The repository will include methods for:

- creating a new user,
- retrieving all users with pagination,
- finding a user by `id` and by `user_name`,
- updating user data,
- soft-deleting a user.

We will start with the simplest method — `createUser`, which inserts a new user into the `users` table.  
Then, we will implement the remaining methods and write unit tests to ensure everything works as expected.

In the src folder of the project, create a folder named repositories, and inside it, create a file called `userRepository.js`. Place the following code into that file:

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

This code implements the createUser method in the UserRepository object, which is responsible for adding a new user to the database.

### Step-by-step Breakdown

- Importing the database connection:

  ```js
  import { pool } from "../db/index.js";
  ```

  This line imports the `pool` object, which represents a connection pool to the PostgreSQL database.  
  It is already configured in another module (`db/index.js`) and allows executing SQL queries.

- Exporting the `UserRepository` object:

  ```js
  export const UserRepository = { ... }
  ```

  This line exports the `UserRepository` object so that it can be used in other parts of the application.

- Defining the `createUser` method:

  ```js
  async createUser(dto) { ... }
  ```

  The `createUser` method is an asynchronous function that accepts a `dto` (data transfer object) containing the fields of the new user. In our case: `user_name`, `first_name`, `last_name`, `password_hash`.

- SQL INSERT query

  ```js
  const query = `
  INSERT INTO users (user_name, first_name, last_name, password_hash)
  VALUES ($1, $2, $3, $4)
  RETURNING id, user_name, password_hash, status;
  `;
  ```

  This SQL query inserts a new user into the `users` table. It uses placeholders `$1`, `$2`, `$3`, `$4` — these are positional parameters (used to prevent SQL injections). After the insertion, it immediately returns the new user's `id`, `user_name`, `password_hash`, and `status`.

  ::: details SQL Injections
  SQL injection is one of the most common types of database attacks. It occurs when user input is inserted directly into an SQL query without proper validation or escaping, allowing an attacker to alter the logic of the query.

  **Example of vulnerable code:**

  ```js
  const userInput = "' OR 1=1 --";
  const query = `SELECT * FROM users WHERE user_name = '${userInput}'`;
  ```

  A user provides the input `' OR 1=1 --`, and the code inserts it directly into the query.

  As a result, the final SQL query looks like:

  ```sql
  SELECT * FROM users WHERE user_name = '' OR 1=1 --';
  ```

  The query will:

  - `user_name = ''` — check if the username is empty;

  - `OR 1=1` — a logical expression that is always true, so the condition applies to all users;

  - `--` — begins an SQL comment; everything after it is ignored by the database;

  - `';` — this part is not executed because it is commented out.

  The query will return all users from the database, because `1=1` is always true.  
  If such a query is used for login, an attacker could log in without a password — because the query bypasses the intended logic.

  Using positional parameters solves this problem:

  ```js
  const query = "SELECT * FROM users WHERE user_name = $1";
  const values = [userInput];
  await pool.query(query, values);
  ```

  Instead of injecting the user input directly into the query string, we pass it as a separate value.  
  The PostgreSQL driver (`pg`) ensures safety by:

  - Escaping special characters,

  - Wrapping the value in quotes if necessary,

  - Ensuring that the input is treated as a plain string, not as SQL code.

  In other words, the driver safely separates SQL code from user-provided data, preventing malicious input from altering the logic of the query.

  Therefore, even a dangerous string like `' OR 1=1 --` will be passed as a simple value to the `user_name` field, not as executable SQL code.

  :::

- Preparing values for the query:

  ```js
  const values = [dto.user_name, dto.first_name, dto.last_name, dto.password_hash];
  ```

  The values are taken from the input `dto` object and passed in the same order as defined in the SQL query.

- Executing the query

  ```js
  const res = await pool.query(query, values);
  ```

  The query is executed using the `pool.query(...)` method.  
  It is asynchronous, so `await` is used.  
  The result is stored in the `res` variable.

- Returning the result:

  ```js
  return res.rows[0];
  ```

  After executing the query, the first (and only) row from the result is returned — that is, the data of the newly created user.

We have implemented user creation. We also need to implement the following methods:

- `getAllUsers` – retrieve a list of all users with pagination,

- `getUserById` – retrieve a user by their ID,

- `getUserByUserName` – retrieve a user by their username,

- `updateUser` – update user data,

- `deleteUser` – delete a user

Let's implement the `getAllUsers` method.

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

Note that the method takes two parameters — `offset` and `limit`. These are required to implement pagination, meaning users will be returned in parts using a sliding window, rather than all at once.

Let's move on to the `getUserById` and `getUserByUserName` methods.

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

> [!IMPORTANT] Task  
> Write the SQL queries for the `getUserById` and `getUserByUserName` methods yourself. For the `getUserById` method, you should return the fields: `user_name`, `first_name`, `last_name`, `status`, `created_at`, `updated_at`. For the `getUserByUserName` method, return: `user_name`, `password_hash`, `status`.

Let's look at the `updateUser` method

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

This asynchronous method is designed to update user data in the database. It accepts two arguments:

- `id`: The ID of the user to update.
- `dto`: An object containing the data to update.

### Operation Logic:

1.  **Initialization**:

    - Two arrays are created: `fields` to store strings with field updates (`field = $index`) and `args` to store the values that will be substituted into the query.
    - `index` is initialized to `1`. This variable is used to generate placeholders `$1`, `$2`, etc., in the SQL query.

2.  **Checking Fields for Updates**:

    - A sequential check is performed for the presence of fields in the `dto` object, and the corresponding data is added to the `fields` and `args` arrays:
      - `password_hash`: If present, `password_hash = $index` is added to `fields` and the value `dto.password_hash` to `args`.
      - `user_name`: Similarly for the username.
      - `first_name`: Similarly for the first name.
      - `last_name`: Similarly for the last name.
    - With each field added, `index` is incremented.

3.  **Checking for the Presence of Fields to Update**:

    - If the `fields` array is empty (i.e., there were no fields to update in `dto`), an exception `Error("No fields to update")` is thrown.

4.  **Adding the `updated_at` Field**:

    - The string `updated_at = NOW()` is added to the `fields` array, which will update the `updated_at` field with the current time.

5.  **Forming the SQL Query**:

    - An SQL query is formed to update the user data.
    - The construction `UPDATE users SET ${fields.join(", ")}` is used, where `fields.join(", ")` combines the strings with field updates into one string separated by commas.
    - The condition `WHERE id = $index AND deleted_at IS NULL` specifies that you need to update the user with the specified `id` who is not marked as deleted (`deleted_at IS NULL`).
    - The construction `RETURNING id, user_name, first_name, last_name, status, created_at, updated_at` returns the updated user data.

6.  **Adding the User's `id` to the Query Arguments**:

    - The user's `id` is added to the `args` array, which will be used in the `WHERE id = $index` condition.

7.  **Executing the Query**:

    - The SQL query is executed using `pool.query(query, args)`. The query result is saved in the `res` variable.

8.  **Handling the Query Result**:
    - If `res.rowCount === 0`, that is, no users were found to update, an exception `Error("User not found")` is thrown.
    - Otherwise, the first row of the query result (`res.rows[0]`), containing the updated user data, is returned.

The last method we will implement in this repository is the `deleteUser` method to delete a user.

```js
async deleteUser(id) {
    const query = `...`;
    const res = await pool.query(query, [id]);
    if (res.rowCount === 0) {
      throw new Error("User not found");
    }
  }
```

This asynchronous method is designed to "delete" a user from the database. In fact, this could be a soft delete, where the record is not physically deleted, but only marked as deleted. Or it could be a complete deletion of the record from the table.

### Operation Logic:

1.  **Forming the SQL Query**

2.  **Executing the Query**:

    - The SQL query is executed using `pool.query(query, [id])`. The query result is saved in the `res` variable.

3.  **Handling the Query Result**:
    - If `res.rowCount === 0`, this means that no user with the specified `id` was found to delete. In this case, an `Error("User not found")` exception is thrown.

> [!IMPORTANT] Задание
> Write an SQL query that performs a soft delete of a user, setting the `deleted_at` value to the current time for the user with the specified `id`. Also, write an SQL query that completely deletes the user with the specified `id` from the table.

## Testing the User Repository

In the root of the project, create a `__tests__` folder, and in it a `repositories` folder. In the `repositories` folder, create a `userRepository.test.js` file and place the code with unit tests in it:

```js
import { expect, jest } from "@jest/globals";
import { pool } from "../../src/config/db.js";
import { UserRepository } from "../../src/repositories/userRepository.js";

function normalizeSQL(sql) {
  return sql.toLowerCase().replace(/\s+/g, " ").trim();
}

describe("UserRepository", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createUser", () => {
    it("successfully creates new user", async () => {
      const mock = jest.spyOn(pool, "query");

      const dto = {
        user_name: "john",
        first_name: "John",
        last_name: "Doe",
        password_hash: "password",
      };

      const expected = {
        id: 1,
        user_name: "john",
        password_hash: "password",
        status: 1,
      };

      mock.mockResolvedValueOnce({ rows: [expected], rowCount: 1 });

      const result = await UserRepository.createUser(dto);

      expect(result).toEqual(expected);
      const [sql, params] = mock.mock.calls[0];
      const normalizedSQL = normalizeSQL(sql);
      expect(normalizedSQL).toContain("insert into users (user_name, first_name, last_name, password_hash)");
      expect(normalizedSQL).toContain("returning id, user_name, password_hash, status");
      expect(params).toEqual([dto.user_name, dto.first_name, dto.last_name, dto.password_hash]);
    });

    it("error on user insert", async () => {
      const mock = jest.spyOn(pool, "query");

      const dto = {
        user_name: "john",
        first_name: "John",
        last_name: "Doe",
        password_hash: "password",
      };

      const fakeError = new Error("insert failed");
      mock.mockRejectedValueOnce(fakeError);

      await expect(UserRepository.createUser(dto)).rejects.toThrow("insert failed");

      const [sql, params] = mock.mock.calls[0];
      const normalizedSQL = normalizeSQL(sql);
      expect(normalizedSQL).toContain("insert into users (user_name, first_name, last_name, password_hash)");
      expect(params).toEqual([dto.user_name, dto.first_name, dto.last_name, dto.password_hash]);
    });
  });

  describe("getAllUsers", () => {
    it("successfully gets all users", async () => {
      const mock = jest.spyOn(pool, "query");

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

      mock.mockResolvedValueOnce({
        rows: expectedUsers,
        rowCount: expectedUsers.length,
      });

      const result = await UserRepository.getAllUsers(100, 0);

      expect(result).toEqual(expectedUsers);

      const [sql, params] = mock.mock.calls[0];
      const normalizedSQL = normalizeSQL(sql);
      expect(normalizedSQL).toContain(
        "select id, user_name, first_name, last_name, status, created_at, updated_at from users where deleted_at is null"
      );
      expect(params).toEqual([0, 100]);
    });

    it("returns error", async () => {
      const mock = jest.spyOn(pool, "query");
      mock.mockRejectedValueOnce(new Error("SQL error"));

      await expect(UserRepository.getAllUsers(100, 0)).rejects.toThrow("SQL error");

      const [sql, params] = mock.mock.calls[0];
      const normalizedSQL = normalizeSQL(sql);
      expect(normalizedSQL).toContain("from users where deleted_at is null");
      expect(params).toEqual([0, 100]);
    });
  });

  describe("getUserById", () => {
    it("successfully gets user by id", async () => {
      const mock = jest.spyOn(pool, "query");
      const now = new Date();

      const expected = {
        id: 1,
        user_name: "john",
        first_name: "John",
        last_name: "Doe",
        status: 1,
        created_at: now,
        updated_at: now,
      };

      mock.mockResolvedValueOnce({ rows: [expected], rowCount: 1 });

      const result = await UserRepository.getUserById(1);

      expect(result).toEqual(expected);

      const [sql, params] = mock.mock.calls[0];
      const normalizedSQL = normalizeSQL(sql);
      expect(normalizedSQL).toContain("from users where id = $1 and deleted_at is null");
      expect(params).toEqual([1]);
    });

    it("returns error if user not found", async () => {
      const mock = jest.spyOn(pool, "query");
      mock.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      await expect(UserRepository.getUserById(2)).rejects.toThrow("User not found");

      const [sql, params] = mock.mock.calls[0];
      const normalizedSQL = normalizeSQL(sql);
      expect(normalizedSQL).toContain("from users where id = $1 and deleted_at is null");
      expect(params).toEqual([2]);
    });
  });

  describe("getUserByUserName", () => {
    it("successfully gets user by username", async () => {
      const mock = jest.spyOn(pool, "query");

      const expected = {
        id: 1,
        user_name: "john",
        password_hash: "password",
        status: 1,
      };

      mock.mockResolvedValueOnce({ rows: [expected], rowCount: 1 });

      const result = await UserRepository.getUserByUserName("john");

      expect(result).toEqual(expected);

      const [sql, params] = mock.mock.calls[0];
      const normalizedSQL = normalizeSQL(sql);
      expect(normalizedSQL).toContain("from users where user_name = $1 and deleted_at is null");
      expect(params).toEqual(["john"]);
    });

    it("returns error if user not found", async () => {
      const mock = jest.spyOn(pool, "query");
      mock.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      await expect(UserRepository.getUserByUserName("notfound")).rejects.toThrow("User not found");

      const [sql, params] = mock.mock.calls[0];
      const normalizedSQL = normalizeSQL(sql);
      expect(normalizedSQL).toContain("from users where user_name = $1 and deleted_at is null");
      expect(params).toEqual(["notfound"]);
    });
  });

  describe("updateUser", () => {
    it("successfully updates user", async () => {
      const mock = jest.spyOn(pool, "query");
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const id = 1;
      const dto = {
        user_name: "john_updated",
        first_name: "John",
        last_name: "Doe",
        password_hash: "password",
      };

      const expected = {
        id,
        user_name: dto.user_name,
        first_name: dto.first_name,
        last_name: dto.last_name,
        status: 1,
        created_at: oneHourAgo,
        updated_at: now,
      };

      mock.mockResolvedValueOnce({ rows: [expected], rowCount: 1 });

      const result = await UserRepository.updateUser(id, dto);

      expect(result).toEqual(expected);

      const [sql, params] = mock.mock.calls[0];
      const normalizedSQL = normalizeSQL(sql);
      expect(normalizedSQL).toContain("update users set");
      expect(normalizedSQL).toContain("where id = $");
      expect(normalizedSQL).toContain("returning id, user_name, first_name, last_name, status");
      expect(params).toContain(dto.user_name);
      expect(params).toContain(dto.password_hash);
      expect(params).toContain(dto.first_name);
      expect(params).toContain(dto.last_name);
      expect(params).toContain(id);
    });

    it("returns error if no fields to update", async () => {
      await expect(UserRepository.updateUser(1, {})).rejects.toThrow("No fields to update");
    });

    it("returns error if user not found", async () => {
      const mock = jest.spyOn(pool, "query");

      const dto = {
        user_name: "ghost",
      };

      mock.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      await expect(UserRepository.updateUser(999, dto)).rejects.toThrow("User not found");

      const [sql, params] = mock.mock.calls[0];
      const normalizedSQL = normalizeSQL(sql);
      expect(normalizedSQL).toContain("update users set");
      expect(normalizedSQL).toContain("where id = $");
      expect(params).toEqual(["ghost", 999]);
    });
  });

  describe("deleteUser", () => {
    it("successfully deletes user", async () => {
      const mock = jest.spyOn(pool, "query");

      mock.mockResolvedValueOnce({ rowCount: 1 });

      await expect(UserRepository.deleteUser(1)).resolves.toBeUndefined();

      const [sql, params] = mock.mock.calls[0];
      const normalizedSQL = normalizeSQL(sql);
      expect(normalizedSQL).toContain("update users set deleted_at = now()");
      expect(normalizedSQL).toContain("where id = $1 and deleted_at is null");
      expect(params).toEqual([1]);
    });

    it("returns error if user not found", async () => {
      const mock = jest.spyOn(pool, "query");

      mock.mockResolvedValueOnce({ rowCount: 0 });

      await expect(UserRepository.deleteUser(2)).rejects.toThrow("User not found");

      const [sql, params] = mock.mock.calls[0];
      const normalizedSQL = normalizeSQL(sql);
      expect(normalizedSQL).toContain("update users set deleted_at = now()");
      expect(params).toEqual([2]);
    });
  });
});
```

After that run the command

```bash
npm run test
```

If you did everything correctly, all tests will pass.

```bash
> gophertalk-backend-express@0.1.0 test
> node --experimental-vm-modules node_modules/jest/bin/jest.js

(node:50607) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
 PASS  __tests__/repositories/userRepository.test.js
  UserRepository
    createUser
      ✓ successfully creates new user (2 ms)
      ✓ error on user insert (2 ms)
    getAllUsers
      ✓ successfully gets all users (1 ms)
      ✓ returns error
    getUserById
      ✓ successfully gets user by id (1 ms)
      ✓ returns error if user not found
    getUserByUserName
      ✓ successfully gets user by username
      ✓ returns error if user not found (1 ms)
    updateUser
      ✓ successfully updates user
      ✓ returns error if no fields to update (1 ms)
      ✓ returns error if user not found
    deleteUser
      ✓ successfully deletes user
      ✓ returns error if user not found

Test Suites: 1 passed, 1 total
Tests:       13 passed, 13 total
Snapshots:   0 total
Time:        0.138 s
Ran all test suites.
```

## Post Repository Development

At this stage, we will implement the **post repository** — the layer responsible for interacting with the `posts` table and its related tables: `likes`, `views`, and replies (nested posts).

The post repository will include the following methods:

- creating a new post (`createPost`);
- retrieving a list of posts with filters and pagination (`getAllPosts`);
- retrieving a single post by `id`, including author info, like/view/reply counts (`getPostByID`);
- deleting a post by its owner (`deletePost`);
- marking a post as viewed by a user (`viewPost`);
- liking/disliking a post (`likePost`, `dislikePost`).

We’ll start with the implementation of the `createPost` method, then move on to the others.  
All methods interact with the database using SQL queries with parameterized inputs to prevent SQL injection, and return data in DTO format.

Create a file `src/repositories/postRepository.js` and put the following code in it:

```js
import { pool } from "../db/index.js";

export const PostRepository = {
  async createPost(dto) {
    const query = `...`;
    const values = [dto.text, dto.userId, dto.replyToId];
    const res = await pool.query(query, values);
    return res.rows[0];
  },
};
```

Explanation

- `dto` is an object containing the new post's data (`text`, `user_id`, `reply_to_id`);

- The SQL query inserts the data into the posts table;

- After the insertion, the newly created post’s fields (`id`, `text`, `created_at`, `reply_to_id`) are immediately returned.

> [!IMPORTANT] Task
> According to the explanation, write a SQL query to add a new post. Do not forget to use positional parameters `$1`, `$2`, `$3` - to prevent SQL injection

The `getAllPosts` method returns a list of posts with extended information: number of likes, views, replies, as well as user information and likes and views from the current user.

```js
async getAllPosts(dto) {
    const params = [dto.user_id];
    let query = `
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
      LEFT JOIN likes l ON l.post_id = p.id AND l.user_id = $1
      LEFT JOIN views v ON v.post_id = p.id AND v.user_id = $1
      WHERE p.deleted_at IS NULL
    `;

    if (dto.search) {
      query += ` AND p.text ILIKE $${params.length + 1}`;
      params.push(`%${dto.search}%`);
    }

    if (dto.owner_id) {
      query += ` AND p.user_id = $${params.length + 1}`;
      params.push(dto.owner_id);
    }

    if (dto.reply_to_id) {
      query += ` AND p.reply_to_id = $${params.length + 1} ORDER BY p.created_at ASC`;
      params.push(dto.reply_to_id);
    } else {
      query += ` AND p.reply_to_id IS NULL ORDER BY p.created_at DESC`;
    }

    query += ` OFFSET $${params.length + 1} LIMIT $${params.length + 2}`;
    params.push(dto.offset, dto.limit);

    const res = await pool.query(query, params);

    return res.rows.map((row) => ({
      id: row.id,
      text: row.text,
      reply_to_id: row.reply_to_id,
      created_at: row.created_at,
      likes_count: row.likes_count,
      views_count: row.views_count,
      replies_count: row.replies_count,
      user_liked: row.user_liked,
      user_viewed: row.user_viewed,
      user: {
        id: row.user_id,
        user_name: row.user_name,
        first_name: row.first_name,
        last_name: row.last_name,
      },
    }));
  }
```

The `getAllPosts` method is designed to get a list of posts with extended information:

- post author;

- number of likes, views, replies;

- flags, whether the current user liked and/or viewed this post.

#### SQL query structure

The query is built using CTE (Common Table Expressions) and looks like this:

```sql
WITH likes_count AS (...),
     views_count AS (...),
     replies_count AS (...)
SELECT ...
FROM posts ...
```

Let's look at all the parts in order.

#### 1. Calculating the number of likes for each post

```sql
likes_count AS (
  SELECT post_id, COUNT(*) AS likes_count
  FROM likes
  GROUP BY post_id
)
```

Here, the number of likes for each post is collected from the `likes` table. `GROUP BY post_id` is used to group the likes by post.

#### 2. Counting the number of views

```sql
views_count AS (
  SELECT post_id, COUNT(*) AS views_count
  FROM views
  GROUP BY post_id
)
```

Similar to the first CTE, but now views from the `views` table are counted.

#### 3. Counting the number of replies to each post

```sql
replies_count AS (
  SELECT reply_to_id, COUNT(*) AS replies_count
  FROM posts
  WHERE reply_to_id IS NOT NULL
  GROUP BY reply_to_id
)
```

Here, from the `posts` table itself, those rows are selected where `reply_to_id IS NOT NULL`, that is, these are replies to other posts. It is calculated how many such replies each parent post has.

#### 4. Main query

```sql
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
LEFT JOIN likes l ON l.post_id = p.id AND l.user_id = $1
LEFT JOIN views v ON v.post_id = p.id AND v.user_id = $1
WHERE p.deleted_at IS NULL
...
```

What's going on here:

- `JOIN users` — join a post with its author by `user_id`;

- `LEFT JOIN` with `likes_count`, `views_count`, `replies_count` - data from CTE about the number of likes, views and replies is added;

- `LEFT JOIN likes l` and `views v` - checks if the current user (`$1` is his id) has liked or viewed something. These fields are used in the logical expressions below;

- `CASE WHEN ... THEN true ELSE false` - defines `user_liked` and `user_viewed`;

- `COALESCE(..., 0)` — if there is no data on likes/views/responses (for example, no one liked), `0` is substituted;

- `WHERE p.deleted_at IS NULL` — filtering: only non-deleted posts are taken.

#### 5. Additional filters

**By text:**

```sql
if (dto.search) {
  query += ` AND p.text ILIKE $${params.length + 1}`;
  params.push(`%${dto.search}%`);
}
```

If the string `search` is passed, posts with a match in the text are searched.

**By user (author):**

```sql
if (dto.owner_id) {
  query += ` AND p.user_id = $${params.length + 1}`;
  params.push(dto.owner_id);
}
```

If `owner_id` is passed, posts of a specific user are selected.

**By replies:**

```sql
if (dto.reply_to_id) {
  query += ` AND p.reply_to_id = $${params.length + 1} ORDER BY p.created_at ASC`;
} else {
  query += ` AND p.reply_to_id IS NULL ORDER BY p.created_at DESC`;
}
```

Checks if posts are replies to another post (`reply_to_id`) or root posts.

#### 6. Pagination

```js
query += ` OFFSET $${params.length + 1} LIMIT $${params.length + 2}`;
params.push(dto.offset, dto.limit);
```

The "sliding window" mechanics are implemented - a certain range of posts is selected.

#### 7. Returned result

The result is collected as an array of posts. Each post contains:

- data of the post itself,

- data of the author (`user`),

- number of likes, views, replies,

- flags `user_liked`, `user_viewed`.

Next, let's look at the implementation of the `getPostById` method.

```js
import { pool } from "../db/index.js";

export const PostRepository = {
  async getPostById(postId, userId) {
    const query = `
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
      LEFT JOIN likes l ON l.post_id = p.id AND l.user_id = $1
      LEFT JOIN views v ON v.post_id = p.id AND v.user_id = $1
      WHERE p.id = $2 AND p.deleted_at IS NULL;
    `;

    const res = await pool.query(query, [userId, postId]);
    if (res.rowCount === 0) {
      throw new Error("Post not found");
    }

    const row = res.rows[0];
    return {
      id: row.post_id,
      text: row.text,
      reply_to_id: row.reply_to_id,
      created_at: row.created_at,
      likes_count: row.likes_count,
      views_count: row.views_count,
      replies_count: row.replies_count,
      user_liked: row.user_liked,
      user_viewed: row.user_viewed,
      user: {
        id: row.user_id,
        user_name: row.user_name,
        first_name: row.first_name,
        last_name: row.last_name,
      },
    };
  },
};
```

The `getPostById` method is used to retrieve a single specific post by its ID. It returns detailed information about the post, including likes, views, replies, and author information. The method is similar to `getAllPosts`, except for a few differences.

**Filtering by Post ID**

Instead of fetching multiple posts, the query is limited to a single post:

```sql
WHERE p.id = $2 AND p.deleted_at IS NULL
```

The first parameter (`$1`) is `user_id` (needed to determine whether the user liked/viewed the post),
the second (`$2`) is the ID of the post itself that is being searched.

**No pagination**

The method returns only one post, so there is no `OFFSET` and `LIMIT`.

**Return Value**

`getPostById` returns a single post object, while `getAllPosts` returns an array.

**Edge Case Handling**

If no post is found, `getPostById` throws a "Post not found" exception, while `getAllPosts` returns an empty array.

Let's move on to implementing the `deletePost` method in the `PostRepository` repository.

```js
async deletePost(id, ownerId) {
  const query = `...`;
  const res = await pool.query(query, [id, ownerId]);
  if (res.rowCount === 0) {
    throw new Error("Post not found or already deleted");
  }
}
```

> [!IMPORTANT] Task
> Implement the `deletePost` method, which marks a post as deleted. The SQL query should update the `deleted_at` field with the current time, work only with posts owned by the author, and exclude already deleted posts.

Now we implement a method that records the fact that a user has viewed a post. Each user can view a post only once - repeated views are not recorded.

```js
async function viewPost(postId, userId) {
  const query = `...`;

  try {
    const res = await pool.query(query, [postId, userId]);
    if (res.rowCount === 0) {
      throw new Error("Post not found");
    }
  } catch (err) {
    if (err.message.includes("pk__views")) {
      throw new Error("Post already viewed");
    }
    throw err;
  }
}
```

> [!CAUTION] Warning
> Pay attention to the line `err.message.includes("pk__views")`. Here `pk__views` is the name of the primary key of the table `views`. Substitute yours if it is different.

> [!IMPORTANT] Task
> Implement the `viewPost` method, which adds a new record to the `views` table.

Now we implement a method that allows a user to like a post. One user can only like a post once - repeated attempts should cause an error.

```js
async function likePost(postId, userId) {
  const query = `...`;

  try {
    const res = await pool.query(query, [postId, userId]);
    if (res.rowCount === 0) {
      throw new Error("Post not found");
    }
  } catch (err) {
    if (err.message.includes("pk__likes")) {
      throw new Error("Post already liked");
    }
    throw err;
  }
}
```

> [!CAUTION] Warning
> Pay attention to the line `err.message.includes("pk__likes")`. Here `pk__likes` is the name of the primary key of the table `likes`. Substitute yours if it is different.

> [!IMPORTANT] Task
> Implement the `likePost` method, which adds a new record to the `likes` table.

The `dislikePost` method allows the user to remove a like from a post if they have previously given it.

```js
async function dislikePost(postId, userId) {
  const query = `...`;

  const res = await pool.query(query, [postId, userId]);

  if (res.rowCount === 0) {
    throw new Error("Post not found");
  }
}
```

> [!IMPORTANT] Task
> Implement the `dislikePost` method, which deletes a record from the `likes` table.

## Testing the Post Repository

In the `__tests__/repositories` folder, create a `postRepository.test.js` file and place the code with unit tests in it:

::: details postRepository unit tests

```js
import { describe, expect, jest } from "@jest/globals";
import { pool } from "../../src/config/db.js";
import { PostRepository } from "../../src/repositories/postRepository.js";

function normalizeSQL(sql) {
  return sql.toLowerCase().replace(/\s+/g, " ").trim();
}

describe("PostRepository", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createPost", () => {
    it("should successfully create a post", async () => {
      const mock = jest.spyOn(pool, "query");

      const dto = {
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing",
        user_id: 1,
        reply_to_id: null,
      };

      const expected = {
        id: 1,
        text: dto.text,
        created_at: new Date(),
        reply_to_id: null,
      };

      mock.mockResolvedValueOnce({ rows: [expected], rowCount: 1 });

      const result = await PostRepository.createPost(dto);

      expect(result).toEqual(expected);

      const [sql, params] = mock.mock.calls[0];
      const normalizedSQL = normalizeSQL(sql);
      expect(normalizedSQL).toContain("insert into posts");
      expect(params).toEqual([dto.text, dto.user_id, dto.reply_to_id]);
    });

    it("should return error on insert failure", async () => {
      const mock = jest.spyOn(pool, "query");

      const dto = {
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing",
        user_id: 1,
        reply_to_id: null,
      };

      const fakeError = new Error("insert failed");
      mock.mockRejectedValueOnce(fakeError);

      await expect(PostRepository.createPost(dto)).rejects.toThrow("insert failed");

      const [sql, params] = mock.mock.calls[0];
      const normalizedSQL = normalizeSQL(sql);
      expect(normalizedSQL).toContain("insert into posts");
      expect(params).toEqual([dto.text, dto.user_id, dto.reply_to_id]);
    });
  });

  describe("getAllPosts", () => {
    it("should successfully return all posts", async () => {
      const mock = jest.spyOn(pool, "query");

      const now = new Date("2025-04-24T20:55:53.021Z");

      const dto = {
        user_id: 1,
        owner_id: 0,
        limit: 100,
        offset: 0,
        reply_to_id: 1,
        search: "test",
      };

      const rows = [
        {
          id: 1,
          text: "Post 1",
          reply_to_id: null,
          created_at: now,
          likes_count: 10,
          views_count: 100,
          replies_count: 0,
          user_liked: true,
          user_viewed: true,
          user_id: 1,
          user_name: "username",
          first_name: "first",
          last_name: "last",
        },
        {
          id: 2,
          text: "Post 2",
          reply_to_id: null,
          created_at: now,
          likes_count: 5,
          views_count: 50,
          replies_count: 2,
          user_liked: false,
          user_viewed: true,
          user_id: 1,
          user_name: "username",
          first_name: "first",
          last_name: "last",
        },
      ];

      mock.mockResolvedValueOnce({ rows, rowCount: rows.length });

      const result = await PostRepository.getAllPosts(dto);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[1].likes_count).toBe(5);

      const [sql, params] = mock.mock.calls[0];
      const normalized = normalizeSQL(sql);
      expect(normalized).toContain("select");
      expect(params[0]).toBe(dto.user_id);
    });

    it("should return error on SQL failure", async () => {
      const mock = jest.spyOn(pool, "query");

      const dto = {
        user_id: 1,
        owner_id: 0,
        limit: 100,
        offset: 0,
        reply_to_id: 1,
        search: "test",
      };

      mock.mockRejectedValueOnce(new Error("query failed"));

      await expect(PostRepository.getAllPosts(dto)).rejects.toThrow("query failed");

      const [sql, params] = mock.mock.calls[0];
      const normalized = normalizeSQL(sql);
      expect(normalized).toContain("select");
      expect(params[0]).toBe(dto.user_id);
    });
  });

  describe("getPostById", () => {
    it("should successfully get post by ID", async () => {
      const userId = 1;
      const postId = 1;
      const now = new Date();

      const row = {
        post_id: postId,
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing",
        reply_to_id: null,
        created_at: now,
        user_id: userId,
        user_name: "username",
        first_name: "first_name",
        last_name: "last_name",
        likes_count: 10,
        views_count: 100,
        replies_count: 0,
        user_liked: true,
        user_viewed: true,
      };

      const mock = jest.spyOn(pool, "query");
      mock.mockResolvedValueOnce({ rows: [row], rowCount: 1 });

      const result = await PostRepository.getPostById(postId, userId);

      expect(result).toEqual({
        id: row.post_id,
        text: row.text,
        reply_to_id: row.reply_to_id,
        created_at: row.created_at,
        likes_count: row.likes_count,
        views_count: row.views_count,
        replies_count: row.replies_count,
        user_liked: row.user_liked,
        user_viewed: row.user_viewed,
        user: {
          id: row.user_id,
          user_name: row.user_name,
          first_name: row.first_name,
          last_name: row.last_name,
        },
      });

      const [sql, params] = mock.mock.calls[0];
      expect(normalizeSQL(sql)).toContain("select");
      expect(params).toEqual([userId, postId]);
    });

    it("should throw error if post not found", async () => {
      const mock = jest.spyOn(pool, "query");
      mock.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      await expect(PostRepository.getPostById(999, 1)).rejects.toThrow("Post not found");

      const [sql, params] = mock.mock.calls[0];
      expect(normalizeSQL(sql)).toContain("select");
      expect(params).toEqual([1, 999]);
    });
  });

  describe("deletePost", () => {
    it("should successfully delete post", async () => {
      const postId = 1;
      const ownerId = 1;

      const mock = jest.spyOn(pool, "query");
      mock.mockResolvedValueOnce({ rowCount: 1 });

      await expect(PostRepository.deletePost(postId, ownerId)).resolves.toBeUndefined();

      const [sql, params] = mock.mock.calls[0];
      const normalizedSQL = normalizeSQL(sql);
      expect(normalizedSQL).toContain("update posts set deleted_at = now()");
      expect(normalizedSQL).toContain("where id = $1 and user_id = $2");
      expect(params).toEqual([postId, ownerId]);
    });

    it("should return error if post not found", async () => {
      const postId = 2;
      const ownerId = 1;

      const mock = jest.spyOn(pool, "query");
      mock.mockResolvedValueOnce({ rowCount: 0 });

      await expect(PostRepository.deletePost(postId, ownerId)).rejects.toThrow("Post not found or already deleted");

      const [sql, params] = mock.mock.calls[0];
      const normalizedSQL = normalizeSQL(sql);
      expect(normalizedSQL).toContain("update posts set deleted_at = now()");
      expect(params).toEqual([postId, ownerId]);
    });
  });

  describe("viewPost", () => {
    it("should successfully register a view", async () => {
      const postId = 1;
      const userId = 1;

      const mock = jest.spyOn(pool, "query");
      mock.mockResolvedValueOnce({ rowCount: 1 });

      await expect(PostRepository.viewPost(postId, userId)).resolves.toBeUndefined();

      const [sql, params] = mock.mock.calls[0];
      const normalizedSQL = normalizeSQL(sql);
      expect(normalizedSQL).toContain("insert into views (post_id, user_id)");
      expect(params).toEqual([postId, userId]);
    });

    it("should throw error on SQL failure", async () => {
      const postId = 2;
      const userId = 1;

      const mock = jest.spyOn(pool, "query");
      mock.mockRejectedValueOnce(new Error("insert failed"));

      await expect(PostRepository.viewPost(postId, userId)).rejects.toThrow("insert failed");

      const [sql, params] = mock.mock.calls[0];
      const normalizedSQL = normalizeSQL(sql);
      expect(normalizedSQL).toContain("insert into views (post_id, user_id)");
      expect(params).toEqual([postId, userId]);
    });

    it("should throw already viewed error on unique constraint", async () => {
      const postId = 3;
      const userId = 1;

      const mock = jest.spyOn(pool, "query");
      mock.mockRejectedValueOnce(new Error('duplicate key value violates unique constraint "pk__views"'));

      await expect(PostRepository.viewPost(postId, userId)).rejects.toThrow("Post already viewed");
    });
  });

  describe("likePost", () => {
    it("should successfully like a post", async () => {
      const postId = 1;
      const userId = 1;

      const mock = jest.spyOn(pool, "query");
      mock.mockResolvedValueOnce({ rowCount: 1 });

      await expect(PostRepository.likePost(postId, userId)).resolves.toBeUndefined();

      const [sql, params] = mock.mock.calls[0];
      const normalizedSQL = normalizeSQL(sql);
      expect(normalizedSQL).toContain("insert into likes (post_id, user_id)");
      expect(params).toEqual([postId, userId]);
    });

    it("should return error if like fails", async () => {
      const postId = 2;
      const userId = 1;

      const mock = jest.spyOn(pool, "query");
      mock.mockRejectedValueOnce(new Error("insert failed"));

      await expect(PostRepository.likePost(postId, userId)).rejects.toThrow("insert failed");

      const [sql, params] = mock.mock.calls[0];
      const normalizedSQL = normalizeSQL(sql);
      expect(normalizedSQL).toContain("insert into likes (post_id, user_id)");
      expect(params).toEqual([postId, userId]);
    });

    it("should return 'already liked' error if constraint is violated", async () => {
      const postId = 3;
      const userId = 1;

      const mock = jest.spyOn(pool, "query");
      mock.mockRejectedValueOnce(new Error('duplicate key value violates unique constraint "pk__likes"'));

      await expect(PostRepository.likePost(postId, userId)).rejects.toThrow("Post already liked");
    });
  });

  describe("dislikePost", () => {
    it("should successfully remove a like from a post", async () => {
      const postId = 1;
      const userId = 1;

      const mock = jest.spyOn(pool, "query");
      mock.mockResolvedValueOnce({ rowCount: 1 });

      await expect(PostRepository.dislikePost(postId, userId)).resolves.toBeUndefined();

      const [sql, params] = mock.mock.calls[0];
      const normalizedSQL = normalizeSQL(sql);
      expect(normalizedSQL).toContain("delete from likes where post_id = $1 and user_id = $2");
      expect(params).toEqual([postId, userId]);
    });

    it("should return error if dislike fails", async () => {
      const postId = 2;
      const userId = 1;

      const mock = jest.spyOn(pool, "query");
      mock.mockRejectedValueOnce(new Error("delete failed"));

      await expect(PostRepository.dislikePost(postId, userId)).rejects.toThrow("delete failed");

      const [sql, params] = mock.mock.calls[0];
      const normalizedSQL = normalizeSQL(sql);
      expect(normalizedSQL).toContain("delete from likes where post_id = $1 and user_id = $2");
      expect(params).toEqual([postId, userId]);
    });

    it("should return error if like does not exist", async () => {
      const postId = 3;
      const userId = 1;

      const mock = jest.spyOn(pool, "query");
      mock.mockResolvedValueOnce({ rowCount: 0 });

      await expect(PostRepository.dislikePost(postId, userId)).rejects.toThrow("Post not found");

      const [sql, params] = mock.mock.calls[0];
      const normalizedSQL = normalizeSQL(sql);
      expect(normalizedSQL).toContain("delete from likes where post_id = $1 and user_id = $2");
      expect(params).toEqual([postId, userId]);
    });
  });
});
```

:::

Run the tests. If you did everything correctly, all tests will pass.

```bash
npm run test

> gophertalk-backend-express@0.1.0 test
> node --experimental-vm-modules node_modules/jest/bin/jest.js

(node:26001) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
 PASS  __tests__/repositories/postRepository.test.js
 PASS  __tests__/repositories/userRepository.test.js

Test Suites: 2 passed, 2 total
Tests:       30 passed, 30 total
Snapshots:   0 total
Time:        0.196 s, estimated 1 s
Ran all test suites.
```

## Section Summary

In this section, we have consistently developed two data access layers — the User Repository and the Post Repository, following the architectural principle of separation of concerns. We have:

- Implemented functions for basic database operations (create, read, update, delete).

- Used positional parameters in SQL queries to protect against SQL injection attacks.

- Supported flexible filters, pagination, and conditional queries (e.g., by `user_id`, `reply_to_id`, `text`).

- Handled all possible error cases, including "not found" scenarios and conflicts (e.g., duplicate likes).

- Wrote unit tests to ensure correctness of each repository method.

This approach makes the code clean, maintainable, and extensible. Now we are ready to move on to the next layer — the functional layer (services), where we will implement the application logic and data validation before passing it to the repositories.

## Developing the Functional Layer of a Web Application

In the previous section, we implemented the repository layer — direct access to the database. Now it's time to move on to the next architectural layer — the logic layer, also known as the service layer. This layer contains "services" — modules that implement the core behavior of the application.

**Why do we need a logic layer?**

The logic layer separates application logic from the specifics of data storage (repositories) and transport (such as HTTP). This approach allows us to:

- Increase code reusability — a service can be used from a controller or from a background task;

- Simplify testing — services can be tested independently from HTTP and the database;

- Improve code readability — each module has a clear responsibility;

- Simplify team collaboration — developers can work on services and controllers separately.

**Which services will we implement?**

In our GopherTalk application, we will implement three main services:

- `AuthService` — handles user registration, login, and token generation.

- `UserService` — manages users (search, update, delete).

- `PostService` — handles posts (create, retrieve, like, view, delete).

Each service will use the corresponding repository and, if needed, helper functions such as password hashing or token generation.

## Authorization service development

This service is responsible for user registration, login, and token pair generation. It interacts with the user repository and auxiliary utilities for working with passwords and JWT.

::: details What is JWT?

JSON Web Token (JWT) is an open standard (RFC 7519) that provides a compact and self-contained way to securely transfer information between parties in the form of a JSON object. The token is digitally signed, which allows you to verify the authenticity and integrity of the data. JWT consists of three parts: a header, a payload, and a signature, each of which is encoded in Base64Url and separated by dots.

JWT is a string that contains encoded user information and other data, signed with a secret key or a public/private key pair. This verifies that the token has not been tampered with and that the sender is who they claim to be.

**Advantages of JWT**

- **Self-sufficiency**: JWT contains all the necessary information inside itself, which allows you to verify the token locally without accessing a database or centralized session storage, improving performance and scalability.
- **Cross-platform**: JWT can be used in different programming languages ​​and environments, which is convenient for distributed systems.
- **Flexibility**: The token can store additional information, such as user roles, token expiration time, and other user data.
- **Single Sign-On (SSO) Friendly**: Due to its compact size and ability to be used across different domains, JWT is widely used for single sign-on.
- **Signature Security**: The digital signature ensures the integrity and authenticity of the data, preventing the token from being tampered with.

**JWT Disadvantages**

- **Lack of built-in revocation mechanism**: JWT does not support token revocation by default, which can be a problem if you need to revoke access immediately.
- **Leakage risk**: If the secret key or private signing key is compromised, an attacker can create fake tokens.
- **Complexity of session management**: Unlike classic session cookies, JWT requires additional logic to manage the session lifecycle and secure storage on the client.
- **Not always easier to use**: Despite its popularity, JWT is not always easier to implement and operate, especially for novice developers.

**Usage of JWT**

- **Authentication**: The most common scenario is when a user logs in and the server issues a JWT, which the client sends with each request to access protected resources.
- **Inter-service information exchange**: JWT is used to securely transfer information between different systems where it is important to verify the authenticity of the sender and the integrity of the data.
- **Single Sign-On (SSO)**: Due to its compactness and independence from a specific server, JWT is suitable for implementing single sign-on across multiple applications or domains.
- **Microservice architecture**: In distributed systems, JWT allows each service to independently verify user rights without a centralized session store.

**JWT consists of three parts, separated by dots (`.`):**

- **Header**
  Contains metadata about the token: the token type (usually "JWT") and the signature algorithm used (e.g. HS256, RS256). This is a JSON object encoded in Base64Url.

- **Payload**
  Contains claims - data that is passed in the token, such as user ID, roles, token lifetime, and other user data. Also a JSON object encoded in Base64Url.

- **Signature**
  A cryptographic signature that is created from the header and payload using a secret key or key pair. Allows you to verify the integrity and authenticity of the token.
  :::

In the `src` folder of the project, create a `services` folder, and in it a file `authService.js`, and place the following code there:

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

#### Method Description

**`login(dto)`**

- Searches for a user by name.

- Checks if the password is correct.

- Returns tokens if everything is correct.

**`register(dto)`**

- Hashes the password.

- Creates a new user.

- Returns tokens for the new user.

**`generateTokenPair(user)`**

- Generates two tokens:

  - access token — for quick authentication;

  - refresh token — to refresh the access token without re-login.

- Uses secrets and token lifetime from the configuration.

- Генерирует два токена:

  - access token — для быстрой аутентификации;

  - refresh token — для обновления access token без повторного входа.

- Использует секреты и время жизни токенов из конфигурации.

The authorization service (`AuthService`) uses environment variables to create JWT tokens. They allow you to flexibly configure security settings without changing the application code.

| Variable                | Current value                    | Example of another value    | Description                                                                                               |
| :---------------------- | :------------------------------- | :-------------------------- | :-------------------------------------------------------------------------------------------------------- |
| `ACCESS_TOKEN_EXPIRES`  | `1h`                             | `15m`, `2h`, `7d`           | Access token expiration date (lifetime). Specified in time format: minutes (`m`), hours (`h`), days (`d`) |
| `REFRESH_TOKEN_EXPIRES` | `24h`                            | `7d`, `30d`                 | Refresh token expiration date. Usually longer than access token                                           |
| `ACCESS_TOKEN_SECRET`   | `super_secret_access_token_key`  | `any_random_secure_key`     | Secret string for signing access tokens                                                                   |
| `REFRESH_TOKEN_SECRET`  | `super_secret_refresh_token_key` | `another_random_secure_key` | Secret string for signing refresh tokens                                                                  |

By default, the jsonwebtoken library uses the HS256 (HMAC + SHA-256) algorithm.
This is a symmetric algorithm: the same secret key is used to sign and verify the token.

Secret key requirements (`ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`):

- The secret must be long and random enough to ensure security.

- The recommended length is at least 32 characters.

- You cannot use simple words like password or 12345.

- A good practice is to generate the secret using special generators (for example, openssl rand -hex 32).

## Testing the authorization service

Let's write tests for `authService` right away to check its operation. To do this, create a `services` folder in the `__tests__` folder, and in it a file `authService.test.js`. Place the code below in it.

::: details Unit tests authService

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

Run the tests. If everything is done correctly, there will be no errors in the tests.

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

## User service development

The user service (`UserService`) is responsible for working with user data via the repository. Its tasks include getting a list of users, searching for a specific user by ID, updating user information (including password encryption), and deleting a user.

To implement it, create a file `src/userService.js` in the `services` directory and place the code there:

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

**getAllUsers(limit, offset)**

- Gets all users with pagination.

- Makes a request to the repository with the offset (`offset`) and limit (`limit`) parameters.

**getUserById(id)**

- Finds a user by their unique identifier.

**updateUser(id, userDto)**

- Updates the user data.

- If a new password is passed, it is hashed with `bcrypt` before being stored.

- The original password is removed from the object before being updated.

**deleteUser(id)**

- Deletes a user by their ID. Soft deletion is usually implemented at the repository level by setting the `deleted_at` field.

## User service testing

Also, let's write tests for `userService` right away to check its operation. To do this, create a file `userService.test.js` in the `__tests__/services` folder. Put the code below in it.

::: details Unit tests userService

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

Run the tests. If everything is done correctly, there will be no errors in the tests.

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

## Developing a post service

This service implements business logic for working with posts in the GopherTalk social network. The service serves as an intermediate layer between controllers and the repository, providing a convenient interface for working with publications.

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

- Gets a list of posts with support for filtering by author, post text, or parent post (`reply_to_id`). Delegates query execution to `PostRepository.getAllPosts`.

**`createPost(createDTO)`**

- Creates a new post in the system. Receives a DTO with the post data and calls `PostRepository.createPost` to save the record to the database.

**`deletePost(postId, ownerId)`**

- Deletes a user's post. Passes the post ID and owner to `PostRepository.deletePost`, where a soft delete occurs (setting `deleted_at`).

**`viewPost(postId, userId)`**

- Records the fact that a post has been viewed by a user. Calls `PostRepository.viewPost` to add a new record to the `views` table.

**`likePost(postId, userId)`**

- Allows the user to like a post. Calls `PostRepository.likePost` to save the like to the database.

**`dislikePost(postId, userId)`**

- Allows a user to remove their like from a post. Calls `PostRepository.dislikePost` to remove the like record.

## Testing a post service

Similarly, here we will immediately write tests for `userService` to check its operation. To do this, create a file `userService.test.js` in the `__tests__/services` folder. Place the code below in it.
::: details Unit-тесты userService

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

Run the tests. If everything is done correctly, there will be no errors in the tests.

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

## Section Summary

In this study question, we developed a business logic layer for three main entities: users, posts, and authentication.
Each service was implemented through a corresponding repository and performed its tasks without direct interaction with the database.

- `AuthService` is responsible for registering and authenticating users, creating a pair of tokens (access and refresh), and checking the password.

- `UserService` provides work with users: getting a list of all users, getting a user by ID, updating data and deleting users.

- `PostService` manages the creation, deletion, viewing of posts and user actions (like, dislike).

A clean architecture was followed:

- Repositories encapsulate work with the database.

- Services execute business logic and validate data.

- Interaction between layers occurs through interfaces and DTO structures.

Also, for each service, Jest tests were developed and adapted, which check both positive and negative scenarios for executing methods. This made it possible to verify the correctness of the business logic before the stage of integration with the real database.

Thus, the implemented structure lays a reliable foundation for further scaling and expansion of the project.

## Developing the Controller Layer of a Web Application

Before we can define routes in an Express application, we need to set up some middleware to handle user authentication.
Middleware in Express is functions that handle requests before passing them to final routes.

Create a `middleware` folder in the `src` folder, and in it an `auth.js` file, and place the following code in it:

```js
import jwt from "jsonwebtoken";

export function requestAuth(secret) {
  return function (req, res, next) {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.sendStatus(401);
    }

    const token = authHeader.substring(7);
    try {
      const claims = jwt.verify(token, secret);
      req.user = claims;
      next();
    } catch (err) {
      return res.sendStatus(401);
    }
  };
}

export function requestAuthSameId(secret) {
  return function (req, res, next) {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.sendStatus(401);
    }

    const token = authHeader.substring(7);
    try {
      const claims = jwt.verify(token, secret);
      const paramId = req.params.id;

      if (!paramId || isNaN(paramId)) {
        return next();
      }

      if (paramId !== claims.sub) {
        return res.sendStatus(401);
      }

      req.user = claims;
      next();
    } catch (err) {
      return res.sendStatus(401);
    }
  };
}
```

Our middleware performs a check for the JWT token in the request header:

- `requestAuth` — checks that the user is authenticated and signed with the correct token. If the check is successful, the user data is added to the request object (`req.user`).

- `requestAuthSameId` — additionally checks that the ID in the request parameters matches the ID embedded in the token, to protect against changing other people's data.

```mermaid
flowchart TD
  A[Client sends request] --> B{Is there an Authorization header?}
  B -- No --> C[Response 401 Unauthorized]
  B -- Yes --> D[Verify token]
  D -- Invalid token --> C
  D -- Valid token --> E{Middleware}

  E -- requestAuth --> F[Add req.user and pass to route]
  E -- requestAuthSameId --> G{ID in URL = ID in token?}

  G -- No --> C
  G -- Yes --> F
```

This middleware will help to centrally and securely check user access rights to protected routes.

## Developing an authorization controller

The authorization controller is responsible for processing user requests related to entering the system (`login`) and registering new users (` register`).
At this stage, the controller accepts HTTP checks, validates input data and delegates the business logic to the authentication service.

This approach helps to comply with the separation of responsibility between the levels of the application: controllers are responsible only for receiving and refunding data, and the processing logic is concentrated in services.

In the `src` folder, create the`Controllers' folder, and in it the file is`authController.js`, and place the following code there:

```js
import { AuthService } from "../services/authService.js";
import { validationResult } from "express-validator";

export const authController = {
  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
      }

      const loginDTO = req.body;
      const tokens = await AuthService.login(loginDTO);

      return res.status(200).json(tokens);
    } catch (error) {
      console.error("Login error:", error.message);
      return res.status(401).json({ error: error.message });
    }
  },

  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
      }

      const registerDTO = req.body;
      const tokens = await AuthService.register(registerDTO);

      return res.status(201).json(tokens);
    } catch (error) {
      console.error("Register error:", error.message);
      return res.status(401).json({ error: error.message });
    }
  },
};
```

**`login(req, res)`**

- Acceps user data: `user_name` and` password`.

- If the data is valid, the `login` method in the authentication service causes.

- With successful authentication, it returns a couple of tokens (`Access_token` and` Refresh_Token`).

- In the event of an error, it returns the corresponding HTTP status and an error message.

**`register(req, res)`**

- Accepts registration data: `user_name`,` password`, `password_confirm`,` first_name`, `last_name`.

- If the data is valid, it calls the `register` in the authentication service.

- With successful registration, it returns a couple of tokens for the new user.

- If registration has failed, sends an error message and the corresponding HTTP status.

Now the input data is not validated. To fix this, it is necessary to add validators - special objects that will monitor the correctness of the data that come to the server.

Create a `validators` folder in the `src` directory, and create an `authValidators.js` file in it. Place the following code in it:

```js
import { z } from "zod";

const usernameSchema = z
  .string()
  .min(5)
  .max(30)
  .regex(/^[a-zA-Z0-9_]+$/, "Must be alphanumeric or underscore")
  .regex(/^[^0-9]/, "Must start with a letter");

const passwordSchema = z
  .string()
  .min(5)
  .max(30)
  .regex(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])/, "Must contain letter, number and special character");

export const loginValidator = z.object({
  user_name: usernameSchema,
  password: passwordSchema,
});

export const registerValidator = z
  .object({
    user_name: usernameSchema,
    password: passwordSchema,
    password_confirm: passwordSchema,
    first_name: z
      .string()
      .min(1)
      .max(30)
      .regex(/^[\p{L}]+$/u, "Only letters allowed"),
    last_name: z
      .string()
      .min(1)
      .max(30)
      .regex(/^[\p{L}]+$/u, "Only letters allowed"),
  })
  .refine(data => data.password === data.password_confirm, {
    message: "Passwords must match",
    path: ["password_confirm"],
  });
```

This file contains validation schemes for the request body (`req.body`) when authorizing users.

Everything is built on the `zod` library - a modern and powerful tool for data validation in JavaScript and TypeScript.

```js
const usernameSchema = z
  .string()
  .min(5)
  .max(30)
  .regex(/^[a-zA-Z0-9_]+$/, "Must be alphanumeric or underscore")
  .regex(/^[^0-9]/, "Must start with a letter");
```

- A string between `5` and `30` characters long.

- Only letters, numbers, and underscores (`_`).

- The first letter must be a symbol, not a number.

```js
const passwordSchema = z
  .string()
  .min(5)
  .max(30)
  .regex(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])/, "Must contain letter, number and special character");
```

- A string from `5` to `30` characters long.

- Must contain:

  - at least one letter,

  - at least one digit,

  - at least one special character (`@`, `$`, `!`, `%`, `*`, `?`, `&`).

```js
export const loginValidator = z.object({
  user_name: usernameSchema,
  password: passwordSchema,
});
```

- Checks `user_name` and `password` when logging in.

```js
export const registerValidator = z
  .object({
    user_name: usernameSchema,
    password: passwordSchema,
    password_confirm: passwordSchema,
    first_name: z
      .string()
      .min(1)
      .max(30)
      .regex(/^[\p{L}]+$/u, "Only letters allowed"),
    last_name: z
      .string()
      .min(1)
      .max(30)
      .regex(/^[\p{L}]+$/u, "Only letters allowed"),
  })
  .refine(data => data.password === data.password_confirm, {
    message: "Passwords must match",
    path: ["password_confirm"],
  });
```

Checks:

- `user_name`, `password`, `password_confirm` (using the same schemes).

- `first_name` and `last_name` — strings from 1 to 30 characters long, letters only, supports any alphabets (`\p{L}` — Unicode letter symbols).

Additional check via `.refine()`:

- `password` and `password_confirm` must match, otherwise the error "Passwords must match" is returned.

This validator will be run via middleware. In the `src/middleware` folder, create a `validate.js` file and put the following code in it:

```js
export const validate = schema => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (err) {
    return res.status(422).json({
      errors: err.errors.map(e => ({
        path: e.path.join("."),
        message: e.message,
      })),
    });
  }
};
```

We've added a second middleware. Let's see how the incoming HTTP request will be processed now:

```mermaid
flowchart TD
  A[Client sends request] --> B{Authorization header present?}
  B -- No --> C[401 Unauthorized response]
  B -- Yes --> D[Verifying token]
  D -- Invalid token --> C
  D -- Valid token --> E{Middleware: Verifying authorization}

  E -- requestAuth --> F{Middleware: Validating request body}

  F -- Successful validation --> G[Passing request to controller]
  F -- Validation error --> H[422 Unprocessable Entity response]

  E -- requestAuthSameId --> I{ID in URL = ID in token?}

  I -- No --> C
  I -- Yes --> F
```

If the request does not require authorization (for example, during authorization or registration), then the request processing scheme will look like this:

```mermaid
flowchart TD
  A[Client sends request] --> B{Middleware: Validating request body}

  B -- Validation failed --> C[Response 422 Unprocessable Entity]
  B -- Validation successful --> D[Passing request to controller]
```

How do we connect all this? How will the express server understand that the client wants to log in and needs to validate the input data? In the previous lesson, in the `app.js` file, we specified our first endpoint for checking the connection to the database:

```js
...
app.get("/api/health-check", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).send("OK");
  } catch (err) {
    res.status(500).send("DB connection failed");
  }
});
...
```

You can follow the same path and write the rest of the routes in `app.js`. However, if the application grows, it will be a mess. Therefore, it is considered good practice to move the definition of routes to a separate file, which is what we will do.

In the `src` directory, create a `routes` folder, and in it a file `authRoutes.js`, and put the following code there:

```js
import express from "express";
import { AuthController } from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";
import { loginValidator, registerValidator } from "../validators/authValidators.js";

const router = express.Router();

router.post("/login", validate(loginValidator), AuthController.login);
router.post("/register", validate(registerValidator), AuthController.register);

export default router;
```

Next, you need to update `app.js` by adding two lines (highlighted in green):

```js
import dotenv from "dotenv";
import express from "express";
import { pool } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js"; // [!code ++]

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use("/api/auth", authRoutes); // [!code ++]

app.get("/api/health-check", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).send("OK");
  } catch (err) {
    res.status(500).send("DB connection failed");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
```

After that, you need to start the server. If everything is done correctly, it will start without errors:

```bash
npm run dev

> gophertalk-backend-express@0.1.0 dev
> nodemon src/app.js

[nodemon] 3.1.9
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: js,mjs,cjs,json
[nodemon] starting `node src/app.js`
Server is running on port 3000
```

После этого нужно запустить сервер. Если все сделано правильно, он запустится без ошибок:

```bash
npm run dev

> gophertalk-backend-express@0.1.0 dev
> nodemon src/app.js

[nodemon] 3.1.9
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: js,mjs,cjs,json
[nodemon] starting `node src/app.js`
Server is running on port 3000
```

To make sure everything works, let's try registering a user and then logging in.

![Postman Collection](./../../../../assets/databases/postman-collection.png)

In Postman, open the `register` request in the `auth` directory. We can test validation first. Let's remove the `first_name` field and add numbers to the `last_name` field.

![Invalid registration request](./../../../../assets/databases/postman-incorrect-register-request.png)

If we send a correct request, we will receive a pair of `access_token` and `refresh_token` in response.

![Valid registration request](./../../../../assets/databases/postman-correct-register-request.png)

Open the `Scripts` tab in the request panel in Postman.

![Scripts executed after a request](./../../../../assets/databases/postman-post-response-scripts.png)

This script reads the response from the server and sets variables from the Postman environment. That is, Postman "remembers" the tokens and can use them in other requests. You can see this if you open any request that requires authorization and go to the `Authorizaton` tab.

![Postman Authorization Tab](./../../../../assets/databases/postman-authorization-tab.png)

Here it is specified that Postman will substitute a line with our `Bearer <access_token>` in the `Authorization` header. Note that the `src/middleware/auth` file checks for the `Authorization` header with the value `Bearer <access_token>`.

Try to log in to the system yourself - via Postman, execute the `/login` request.

## Testing the authorization controller

In the `__tests__` directory, create a `controllers` directory, and in it a file `authController.test.js`, and put the code there:

::: details Unit tests authController

```js
import { expect, jest } from "@jest/globals";
import express from "express";
import request from "supertest";
import { AuthController } from "../../src/controllers/authController.js";
import { AuthService } from "../../src/services/authService.js";

const app = express();
app.use(express.json());
app.post("/api/auth/login", AuthController.login);
app.post("/api/auth/register", AuthController.register);

describe("AuthController", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/auth/login", () => {
    it("should successfully login", async () => {
      const tokens = { access_token: "access", refresh_token: "refresh" };
      const loginDTO = { user_name: "test_user", password: "test123!" };

      jest.spyOn(AuthService, "login").mockResolvedValueOnce(tokens);

      const res = await request(app).post("/api/auth/login").send(loginDTO);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(tokens);
      expect(AuthService.login).toHaveBeenCalledWith(loginDTO);
    });

    it("should return 401 if login fails", async () => {
      const loginDTO = { user_name: "test_user", password: "wrongpassword" };

      jest.spyOn(AuthService, "login").mockRejectedValueOnce(new Error("Wrong password"));

      const res = await request(app).post("/api/auth/login").send(loginDTO);

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Wrong password");
      expect(AuthService.login).toHaveBeenCalledWith(loginDTO);
    });
  });

  describe("POST /api/auth/register", () => {
    it("should successfully register", async () => {
      const tokens = { access_token: "access", refresh_token: "refresh" };
      const registerDTO = {
        user_name: "test_user",
        password: "test123!",
        password_confirm: "test123!",
        first_name: "John",
        last_name: "Doe",
      };

      jest.spyOn(AuthService, "register").mockResolvedValueOnce(tokens);

      const res = await request(app).post("/api/auth/register").send(registerDTO);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(tokens);
      expect(AuthService.register).toHaveBeenCalledWith(registerDTO);
    });

    it("should return 401 if registration fails", async () => {
      const registerDTO = {
        user_name: "test_user",
        password: "test123!",
        password_confirm: "test123!",
        first_name: "John",
        last_name: "Doe",
      };

      jest.spyOn(AuthService, "register").mockRejectedValueOnce(new Error("User already exists"));

      const res = await request(app).post("/api/auth/register").send(registerDTO);

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("User already exists");
      expect(AuthService.register).toHaveBeenCalledWith(registerDTO);
    });
  });
});
```

:::

If everything is done correctly, the tests will run successfully:

```bash
npm run test

> gophertalk-backend-express@0.1.0 test
> node --experimental-vm-modules node_modules/jest/bin/jest.js

(node:90459) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
 PASS  __tests__/services/authService.test.js
 PASS  __tests__/controllers/authController.test.js
 PASS  __tests__/services/userService.test.js
 PASS  __tests__/repositories/postRepository.test.js
 PASS  __tests__/repositories/userRepository.test.js
 PASS  __tests__/services/postService.test.js

Test Suites: 6 passed, 6 total
Tests:       58 passed, 58 total
Snapshots:   0 total
Time:        1.141 s
Ran all test suites.
```

## Developing a user controller

We will perform all actions in exactly the same way as `authController`.

In the `src/controllers` directory, create a file in `userController.js` and place the following code in it:

```js
import { UserService } from "../services/userService.js";

export class UserController {
  static async getAllUsers(req, res) {
    try {
      const limit = parseInt(req.query.limit, 10) || 10;
      const offset = parseInt(req.query.offset, 10) || 0;
      const users = await UserService.getAllUsers(limit, offset);
      res.status(200).json(users);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  static async getUserById(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(404).json({ message: "Invalid ID" });
      }
      const user = await UserService.getUserById(id);
      res.status(200).json(user);
    } catch (err) {
      res.status(404).json({ message: err.message });
    }
  }

  static async updateUser(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(404).json({ message: "Invalid ID" });
      }
      const dto = req.body;
      const updatedUser = await UserService.updateUser(id, dto);
      res.status(200).json(updatedUser);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  static async deleteUserById(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(404).json({ message: "Invalid ID" });
      }
      await UserService.deleteUser(id);
      res.status(204).send();
    } catch (err) {
      res.status(404).json({ message: err.message });
    }
  }
}
```

In the `src/validators` directory, create a `userValidators.js` file and put the following code in there:

```js
import { z } from "zod";

const usernameSchema = z
  .string()
  .min(5)
  .max(30)
  .regex(/^[a-zA-Z0-9_]+$/, "Must be alphanumeric or underscore")
  .regex(/^[^0-9]/, "Must start with a letter");

const passwordSchema = z
  .string()
  .min(5)
  .max(30)
  .regex(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])/, "Must contain letter, number and special character");

export const updateUserValidator = z
  .object({
    user_name: usernameSchema.optional(),
    password: passwordSchema.optional(),
    password_confirm: passwordSchema.optional(),
    first_name: z
      .string()
      .min(1)
      .max(30)
      .regex(/^[\p{L}]+$/u, "Only letters allowed")
      .optional(),
    last_name: z
      .string()
      .min(1)
      .max(30)
      .regex(/^[\p{L}]+$/u, "Only letters allowed")
      .optional(),
  })
  .refine(
    data => {
      if (data.password || data.password_confirm) {
        return data.password === data.password_confirm;
      }
      return true;
    },
    {
      message: "Passwords must match",
      path: ["password_confirm"],
    }
  );
```

Next, let's add routes. In the `src/routes` directory, create a `userRoutes.js` file and put the code there:

```js
import express from "express";
import { UserController } from "../controllers/userController.js";
import { validate } from "../middleware/validate.js";
import { updateUserValidator } from "../validators/userValidators.js";
import { requestAuth, requestAuthSameId } from "../middleware/auth.js";

const router = express.Router();

// Only authorized users
router.get("/", requestAuth(process.env.ACCESS_TOKEN_SECRET), UserController.getAllUsers);
router.get("/:id", requestAuth(process.env.ACCESS_TOKEN_SECRET), UserController.getUserById);

// The user can only update or delete himself.
router.put(
  "/:id",
  requestAuthSameId(process.env.ACCESS_TOKEN_SECRET),
  validate(updateUserValidator),
  UserController.updateUser
);
router.delete("/:id", requestAuthSameId(process.env.ACCESS_TOKEN_SECRET), UserController.deleteUserById);

export default router;
```

Next, you need to update `app.js` by adding two lines (highlighted in green):

```js
import dotenv from "dotenv";
import express from "express";
import { pool } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js"; // [!code ++]

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes); // [!code ++]

app.get("/api/health-check", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).send("OK");
  } catch (err) {
    res.status(500).send("DB connection failed");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
```

After that, you need to start the server. If everything is done correctly, it will start without errors:

```bash
npm run dev

> gophertalk-backend-express@0.1.0 dev
> nodemon src/app.js

[nodemon] 3.1.9
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: js,mjs,cjs,json
[nodemon] starting `node src/app.js`
Server is running on port 3000
```

Check the endpoints from the `users` folder in Postman yourself:

- `get all` - get all users
- `get by id` - get user info by `id`
- `delete` - delete user (you can only delete yourself; check what happens to the user record in the database)
- `update` - update user data (you can only update your own data)

## Testing the user controller

In the `__tests__/controllers` directory, create a file `userController.test.js` and put the following code in it:

::: details Unit tests userController

```js
import { expect, jest } from "@jest/globals";
import express from "express";
import request from "supertest";
import { UserController } from "../../src/controllers/userController.js";
import { validate } from "../../src/middleware/validate.js";
import { UserService } from "../../src/services/userService.js";
import { updateUserValidator } from "../../src/validators/userValidators.js";

const app = express();
app.use(express.json());

app.get("/api/users", UserController.getAllUsers);
app.get("/api/users/:id", UserController.getUserById);
app.put("/api/users/:id", validate(updateUserValidator), UserController.updateUser);
app.delete("/api/users/:id", UserController.deleteUserById);

describe("UserController", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/users", () => {
    it("should return 200 and list of users", async () => {
      const users = [{ id: 1, user_name: "test_user" }];
      jest.spyOn(UserService, "getAllUsers").mockResolvedValueOnce(users);

      const res = await request(app).get("/api/users?limit=10&offset=0").set("Authorization", "Bearer mockToken");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(users);
      expect(UserService.getAllUsers).toHaveBeenCalled();
    });

    it("should return 400 if service fails", async () => {
      jest.spyOn(UserService, "getAllUsers").mockRejectedValueOnce(new Error("Service error"));

      const res = await request(app).get("/api/users?limit=10&offset=0").set("Authorization", "Bearer mockToken");

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/users/:id", () => {
    it("should return 200 and a user", async () => {
      const user = { id: 1, user_name: "test_user" };
      jest.spyOn(UserService, "getUserById").mockResolvedValueOnce(user);

      const res = await request(app).get("/api/users/1").set("Authorization", "Bearer mockToken");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(user);
      expect(UserService.getUserById).toHaveBeenCalledWith(1);
    });

    it("should return 404 if id is invalid", async () => {
      const res = await request(app).get("/api/users/abc").set("Authorization", "Bearer mockToken");

      expect(res.status).toBe(404);
    });

    it("should return 404 if user not found", async () => {
      jest.spyOn(UserService, "getUserById").mockRejectedValueOnce(new Error("Not found"));

      const res = await request(app).get("/api/users/2").set("Authorization", "Bearer mockToken");

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/users/:id", () => {
    it("should return 200 and updated user", async () => {
      const updateDto = { first_name: "Updated", last_name: "User" };
      const updatedUser = { id: 1, user_name: "updated_user" };
      jest.spyOn(UserService, "updateUser").mockResolvedValueOnce(updatedUser);

      const res = await request(app).put("/api/users/1").set("Authorization", "Bearer mockToken").send(updateDto);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(updatedUser);
      expect(UserService.updateUser).toHaveBeenCalledWith(1, updateDto);
    });

    it("should return 404 if id is invalid", async () => {
      const res = await request(app).put("/api/users/abc").set("Authorization", "Bearer mockToken").send({});

      expect(res.status).toBe(404);
    });

    it("should return 422 if validation fails", async () => {
      const invalidDto = { user_name: "test" };

      const res = await request(app).put("/api/users/1").set("Authorization", "Bearer mockToken").send(invalidDto);

      expect(res.status).toBe(422);
    });

    it("should return 400 on service error", async () => {
      const updateDto = { first_name: "Updated", last_name: "User" };
      jest.spyOn(UserService, "updateUser").mockRejectedValueOnce(new Error("Service error"));

      const res = await request(app).put("/api/users/1").set("Authorization", "Bearer mockToken").send(updateDto);

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/users/:id", () => {
    it("should return 204 if user deleted", async () => {
      jest.spyOn(UserService, "deleteUser").mockResolvedValueOnce();

      const res = await request(app).delete("/api/users/1").set("Authorization", "Bearer mockToken");

      expect(res.status).toBe(204);
      expect(UserService.deleteUser).toHaveBeenCalledWith(1);
    });

    it("should return 404 if id is invalid", async () => {
      const res = await request(app).delete("/api/users/abc").set("Authorization", "Bearer mockToken");

      expect(res.status).toBe(404);
    });

    it("should return 404 if user not found", async () => {
      jest.spyOn(UserService, "deleteUser").mockRejectedValueOnce(new Error("Not found"));

      const res = await request(app).delete("/api/users/2").set("Authorization", "Bearer mockToken");

      expect(res.status).toBe(404);
    });
  });
});
```

:::

If everything is done correctly, the tests will run successfully:

```bash
npm run test

> gophertalk-backend-express@0.1.0 test
> node --experimental-vm-modules node_modules/jest/bin/jest.js

(node:109419) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
 PASS  __tests__/controllers/authController.test.js
 PASS  __tests__/controllers/userController.test.js
 PASS  __tests__/services/authService.test.js
 PASS  __tests__/services/userService.test.js
 PASS  __tests__/repositories/userRepository.test.js
 PASS  __tests__/repositories/postRepository.test.js
 PASS  __tests__/services/postService.test.js

Test Suites: 7 passed, 7 total
Tests:       70 passed, 70 total
Snapshots:   0 total
Time:        1.367 s
Ran all test suites.
```

## Developing a post controller

The last controller left to develop is `postController`.

In the `src/controllers` directory, create a file in `postController.js` and place the following code in it:

```js
import { PostService } from "../services/postService.js";

export class PostController {
  static async getAllPosts(req, res) {
    try {
      const userId = req.user.sub;
      const { limit = 10, offset = 0, reply_to_id = 0, owner_id = 0, search = "" } = req.query;

      const filterDTO = {
        user_id: Number(userId),
        limit: Number(limit),
        offset: Number(offset),
        reply_to_id: Number(reply_to_id),
        owner_id: Number(owner_id),
        search,
      };

      const posts = await PostService.getAllPosts(filterDTO);
      res.status(200).json(posts);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  static async createPost(req, res) {
    try {
      const userId = req.user.sub;
      const dto = req.body;
      dto.user_id = Number(userId);

      const post = await PostService.createPost(dto);
      res.status(201).json(post);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  static async deletePost(req, res) {
    try {
      const postId = Number(req.params.id);
      const userId = Number(req.user.sub);

      await PostService.deletePost(postId, userId);
      res.status(204).send();
    } catch (err) {
      res.status(404).json({ message: err.message });
    }
  }

  static async viewPost(req, res) {
    try {
      const postId = Number(req.params.id);
      const userId = Number(req.user.sub);

      await PostService.viewPost(postId, userId);
      res.status(201).send();
    } catch (err) {
      res.status(404).json({ message: err.message });
    }
  }

  static async likePost(req, res) {
    try {
      const postId = Number(req.params.id);
      const userId = Number(req.user.sub);

      await PostService.likePost(postId, userId);
      res.status(201).send();
    } catch (err) {
      res.status(404).json({ message: err.message });
    }
  }

  static async dislikePost(req, res) {
    try {
      const postId = Number(req.params.id);
      const userId = Number(req.user.sub);

      await PostService.dislikePost(postId, userId);
      res.status(204).send();
    } catch (err) {
      res.status(404).json({ message: err.message });
    }
  }
}
```

In the `src/validators` directory, create a `postValidators.js` file and put the following code in there:

```js
import { z } from "zod";

export const createPostValidator = z.object({
  text: z.string().min(1).max(280),
  reply_to_id: z
    .number()
    .optional()
    .nullable()
    .refine(val => val === undefined || val > 0, {
      message: "ReplyToID must be greater than 0",
    }),
});

export const filterPostValidator = z.object({
  search: z.string().optional(),
  owner_id: z.string().regex(/^\d+$/).optional(),
  user_id: z.string().regex(/^\d+$/).optional(),
  reply_to_id: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  offset: z.string().regex(/^\d+$/).optional(),
});
```

Next, let's add routes. In the `src/routes` directory, create a `postRoutes.js` file and put the code there:

```js
import express from "express";
import { PostController } from "../controllers/postController.js";
import { validate } from "../middleware/validate.js";
import { requestAuth, requestAuthSameId } from "../middleware/auth.js";
import { createPostValidator } from "../validators/postValidators.js";

const router = express.Router();

router.get("/", requestAuth(process.env.ACCESS_TOKEN_SECRET), PostController.getAllPosts);

router.post(
  "/",
  requestAuth(process.env.ACCESS_TOKEN_SECRET),
  validate(createPostValidator),
  PostController.createPost
);

router.delete("/:id", requestAuthSameId(process.env.ACCESS_TOKEN_SECRET), PostController.deletePost);

router.post("/:id/view", requestAuth(process.env.ACCESS_TOKEN_SECRET), PostController.viewPost);

router.post("/:id/like", requestAuth(process.env.ACCESS_TOKEN_SECRET), PostController.likePost);

router.post("/:id/dislike", requestAuth(process.env.ACCESS_TOKEN_SECRET), PostController.dislikePost);

export default router;
```

Next, you need to update `app.js` by adding two lines (highlighted in green):

```js
import dotenv from "dotenv";
import express from "express";
import { pool } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js"; // [!code ++]
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes); // [!code ++]
app.use("/api/users", userRoutes);

app.get("/api/health-check", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).send("OK");
  } catch (err) {
    res.status(500).send("DB connection failed");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
```

After that, you need to start the server. If everything is done correctly, it will start without errors:

```bash
npm run dev

> gophertalk-backend-express@0.1.0 dev
> nodemon src/app.js

[nodemon] 3.1.9
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: js,mjs,cjs,json
[nodemon] starting `node src/app.js`
Server is running on port 3000
```

Check the endpoints from the `users` folder in Postman yourself:

- `get all` - get all posts
- `delete` - delete a post (you can only delete your own post; check what happens to the post record in the database)
- `create` - create a post
- `like` - like
- `dislike` - remove a like
- `view` - view a post

## Testing the post controller

In the `__tests__/controllers` directory, create a file `postController.test.js` and put the following code in it:

::: details Unit tests postController

```js
import { expect, jest } from "@jest/globals";
import dotenv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { PostController } from "../../src/controllers/postController.js";
import { requestAuth } from "../../src/middleware/auth.js";
import { validate } from "../../src/middleware/validate.js";
import { PostService } from "../../src/services/postService.js";
import { createPostValidator } from "../../src/validators/postValidators.js";

dotenv.config();

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  const token = jwt.sign({ sub: "1" }, process.env.ACCESS_TOKEN_SECRET);
  req.headers.authorization = `Bearer ${token}`;
  requestAuth(process.env.ACCESS_TOKEN_SECRET)(req, res, next);
});

app.get("/api/posts", PostController.getAllPosts);
app.post("/api/posts", validate(createPostValidator), PostController.createPost);
app.delete("/api/posts/:id", PostController.deletePost);
app.post("/api/posts/:id/view", PostController.viewPost);
app.post("/api/posts/:id/like", PostController.likePost);
app.delete("/api/posts/:id/like", PostController.dislikePost);

describe("PostController", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/posts", () => {
    it("should fetch posts successfully", async () => {
      const posts = [{ id: 1, text: "Test post" }];
      jest.spyOn(PostService, "getAllPosts").mockResolvedValueOnce(posts);

      const res = await request(app).get("/api/posts?limit=10&offset=0");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(posts);
      expect(PostService.getAllPosts).toHaveBeenCalled();
    });

    it("should handle service error", async () => {
      jest.spyOn(PostService, "getAllPosts").mockRejectedValueOnce(new Error("Service error"));

      const res = await request(app).get("/api/posts?limit=10&offset=0");

      expect(res.status).toBe(400);
      expect(PostService.getAllPosts).toHaveBeenCalled();
    });
  });

  describe("POST /api/posts", () => {
    it("should create a post successfully", async () => {
      const post = { id: 1, text: "New post" };
      jest.spyOn(PostService, "createPost").mockResolvedValueOnce(post);

      const res = await request(app).post("/api/posts").send({ text: "New post" });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(post);
      expect(PostService.createPost).toHaveBeenCalled();
    });

    it("should handle validation error", async () => {
      const res = await request(app).post("/api/posts").send({});

      expect(res.status).toBe(422);
    });

    it("should handle service error", async () => {
      jest.spyOn(PostService, "createPost").mockRejectedValueOnce(new Error("Service error"));

      const res = await request(app).post("/api/posts").send({ text: "New post" });

      expect(res.status).toBe(400);
      expect(PostService.createPost).toHaveBeenCalled();
    });
  });

  describe("DELETE /api/posts/:id", () => {
    it("should delete post successfully", async () => {
      jest.spyOn(PostService, "deletePost").mockResolvedValueOnce();

      const res = await request(app).delete("/api/posts/1");

      expect(res.status).toBe(204);
      expect(PostService.deletePost).toHaveBeenCalled();
    });

    it("should handle invalid id", async () => {
      const res = await request(app).delete("/api/posts/abc");

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/posts/:id/view", () => {
    it("should view post successfully", async () => {
      jest.spyOn(PostService, "viewPost").mockResolvedValueOnce();

      const res = await request(app).post("/api/posts/1/view");

      expect(res.status).toBe(201);
      expect(PostService.viewPost).toHaveBeenCalled();
    });

    it("should handle invalid id", async () => {
      const res = await request(app).post("/api/posts/abc/view");

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/posts/:id/like", () => {
    it("should like post successfully", async () => {
      jest.spyOn(PostService, "likePost").mockResolvedValueOnce();

      const res = await request(app).post("/api/posts/1/like");

      expect(res.status).toBe(201);
      expect(PostService.likePost).toHaveBeenCalled();
    });

    it("should handle invalid id", async () => {
      const res = await request(app).post("/api/posts/abc/like");

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/posts/:id/like", () => {
    it("should dislike post successfully", async () => {
      jest.spyOn(PostService, "dislikePost").mockResolvedValueOnce();

      const res = await request(app).delete("/api/posts/1/like");

      expect(res.status).toBe(204);
      expect(PostService.dislikePost).toHaveBeenCalled();
    });

    it("should handle invalid id", async () => {
      const res = await request(app).delete("/api/posts/abc/like");

      expect(res.status).toBe(404);
    });
  });
});
```

:::

If everything is done correctly, the tests will run successfully:

```bash
npm run test

> gophertalk-backend-express@0.1.0 test
> node --experimental-vm-modules node_modules/jest/bin/jest.js

(node:47799) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
 PASS  __tests__/controllers/postController.test.js
 PASS  __tests__/services/authService.test.js
 PASS  __tests__/controllers/userController.test.js
 PASS  __tests__/services/userService.test.js
 PASS  __tests__/controllers/authController.test.js
 PASS  __tests__/repositories/postRepository.test.js
 PASS  __tests__/repositories/userRepository.test.js
 PASS  __tests__/services/postService.test.js

Test Suites: 8 passed, 8 total
Tests:       83 passed, 83 total
Snapshots:   0 total
Time:        0.967 s, estimated 1 s
Ran all test suites.
```

# Conclusion

As part of the lesson, an application program was developed - a server application on Express, simulating the work of the GopherTalk social network. During the work, special attention was paid to the applied use of databases: the creation, use, reading and modification of data occurred through services, and interaction with the database was carried out through a well-thought-out structure of controllers, services and repositories. Thanks to this, it became clear what place databases occupy in the architecture of information systems and how the interaction between different layers of the application is built.

The developed architecture turned out to be correct, logical and easily extensible: adding new entities, new routes or validation rules does not require significant changes in the existing code. The project is divided into layers: controllers are responsible for processing HTTP requests, services are responsible for business logic, and repositories are responsible for accessing data. Data validation before performing business operations is carried out through middleware, which makes the API reliable and resistant to errors at the input data level.

Further development paths for the application include:

- Optimizing SQL queries to improve performance, especially when working with large amounts of data (e.g. adding indexes, revising filters and joins).
- Implementing caching of frequently requested data (e.g. via Redis) to unload the database.
- Introducing asynchronous tasks for background event processing (e.g. processing likes or views).
- Improving query and error logging for easier system maintenance.
- Developing the test infrastructure: adding integration tests with a real database in Docker containers.

Thus, the work performed not only deepened the understanding of databases, but also provided practical experience in building real, scalable server applications.

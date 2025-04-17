# Developing the Repository Layer of a Web Application

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

# Developing the Functional Layer of a Web Application

# Developing the Controller Layer of a Web Application

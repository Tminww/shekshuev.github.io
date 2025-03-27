# Installing libraries and connecting PostgreSQL to the application

## Introduction

In this course, we will develop a web application using Node.js and a PostgreSQL database.
To interact with the database from our application, we will use the official [`pg`](https://www.npmjs.com/package/pg) library.

`node-postgres` (or simply `pg`) is a collection of Node.js modules designed for working with PostgreSQL.
It provides convenient tools for executing SQL queries, managing connections, and handling query results.

The library supports:

- callbacks, promises, and `async/await`;
- connection pooling;
- prepared statements;
- cursors;
- streaming query results;
- integration with C/C++;
- advanced PostgreSQL type parsing.

Just like PostgreSQL itself, `pg` offers a rich set of features. Its documentation helps you get started quickly and also includes guides for more advanced or edge-case scenarios.
Thanks to this, we’ll be able to leverage the full power of PostgreSQL directly from Node.js code — efficiently, flexibly, and without relying on an ORM.

## Basics of the `pg` Library API

The `pg` library provides several key interfaces for working with PostgreSQL.
In this section, we will cover three main components:

1. `Client` — direct connection to the database;
2. `Pool` — connection pool (the most commonly used option);
3. `Result` — the data structure returned after executing an SQL query.

---

### 1. `Client`: direct connection

The `Client` object allows you to establish a single explicit connection to a PostgreSQL database.
It is a low-level interface, useful for executing small one-time operations or manually managing transactions.

#### Example:

```js
import { Client } from "pg";

const client = new Client({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "secret",
  database: "mydb",
});

await client.connect();

const res = await client.query("SELECT NOW()");
console.log(res.rows[0]);

await client.end();
```

#### Features:

- Each connection is manually established using `connect()` and closed using `end()`.

- Used in scenarios where full control over the connection is required.

The `Client` object is created using the constructor `new Client(config: Config)`, which accepts the following parameters:

```js
type Config = {
  user?: string, // default process.env.PGUSER || process.env.USER
  password?: string or function, //default process.env.PGPASSWORD
  host?: string, // default process.env.PGHOST
  port?: number, // default process.env.PGPORT
  database?: string, // default process.env.PGDATABASE || user
  connectionString?: string, // e.g. postgres://user:password@host:5432/database
  ssl?: any, // passed directly to node.TLSSocket, supports all tls.connect options
  types?: any, // custom type parsers
  statement_timeout?: number, // number of milliseconds before a statement in query will time out, default is no timeout
  query_timeout?: number, // number of milliseconds before a query call will timeout, default is no timeout
  lock_timeout?: number, // number of milliseconds a query is allowed to be en lock state before it's cancelled due to lock timeout
  application_name?: string, // The name of the application that created this Client instance
  connectionTimeoutMillis?: number, // number of milliseconds to wait for connection, default is no timeout
  idle_in_transaction_session_timeout?: number // number of milliseconds before terminating any session with an open idle transaction, default is no timeout
}

```

### 2. `Pool`: connection pool (recommended approach)

The `Pool` object manages multiple connections to the database.
It is the most efficient and reliable way to connect in real-world web applications.

#### Example:

```js
import { Pool } from "pg";

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "secret",
  database: "mydb",
});

const result = await pool.query("SELECT * FROM users WHERE id = $1", [1]);
console.log(result.rows[0]);
```

#### Advantages:

- The pool automatically manages connections.

- Reuses already established connections.

- Suitable for high-load applications.

The connection pool is created using the constructor `new Pool(config: Config)`, which accepts the following parameters:

```js
type Config = {
  // all valid client config options are also valid here
  // in addition here are the pool specific configuration parameters:

  // number of milliseconds to wait before timing out when connecting a new client
  // by default this is 0 which means no timeout
  connectionTimeoutMillis?: number

  // number of milliseconds a client must sit idle in the pool and not be checked out
  // before it is disconnected from the backend and discarded
  // default is 10000 (10 seconds) - set to 0 to disable auto-disconnection of idle clients
  idleTimeoutMillis?: number

  // maximum number of clients the pool should contain
  // by default this is set to 10.
  max?: number

  // Default behavior is the pool will keep clients open & connected to the backend
  // until idleTimeoutMillis expire for each client and node will maintain a ref
  // to the socket on the client, keeping the event loop alive until all clients are closed
  // after being idle or the pool is manually shutdown with `pool.end()`.
  //
  // Setting `allowExitOnIdle: true` in the config will allow the node event loop to exit
  // as soon as all clients in the pool are idle, even if their socket is still open
  // to the postgres server.  This can be handy in scripts & tests
  // where you don't want to wait for your clients to go idle before your process exits.
  allowExitOnIdle?: boolean
}
```

The pool is initially created empty and will create new clients lazily as they are needed. Every field of the config object is entirely optional. The config passed to the pool is also passed to every client instance within the pool when the pool creates that client.

### 3. Result: the result of executing an SQL query

The `query(...)` method returns a result object with the following structure:

```js
{
  rows: Array<any>,         // array of result rows
  rowCount: number,         // number of rows
  command: string,          // type of SQL command (e.g., SELECT, UPDATE)
  fields: Array<FieldInfo>  // information about columns
}
```

#### Query example:

```js
import pg from "pg";
const { Pool } = pg;

const pool = new Pool();

const client = await pool.connect();
const result = await client.query({
  rowMode: "array",
  text: "SELECT 1 as one, 2 as two;",
});
console.log(result.fields[0].name); // one
console.log(result.fields[1].name); // two
console.log(result.rows); // [ [ 1, 2 ] ]
await client.end();
```

## Project structure

Create a directory named `gophertalk-backend-express`. Inside it, create a subdirectory called `src`, along with the files `.env`, `package.json`, and `README.md`.  
Inside the `src` directory, create the folders listed below and an empty `app.js` file.
Also create `__tests__` directory and its subdirectories.

```bash
gophertalk-backend-express/
├── src/
│   ├── controllers/       # Handles HTTP requests
│   ├── services/          # Business logic
│   ├── repositories/      # Database operations (SQL queries)
│   ├── routes/            # Route definitions
│   ├── middlewares/       # Common middlewares
│   ├── packages/          # Downloaded packages with dependencies
│   ├── config/            # Project configuration
│   ├── utils/             # Utility functions
│   └── app.js             # Application entry point
├── __tests__              # unit tests
│   ├── controllers/
│   ├── services/
│   └── repositories/
├── .env                   # Environment variables
├── package.json
└── README.md
```

## Initializing the project and installing dependencies

Place the following content into the `package.json` file:

```json
{
  "name": "gophertalk-backend-express",
  "version": "0.1.0",
  "type": "module",
  "main": "src/app.js",
  "scripts": {
    "dev": "nodemon src/app.js",
    "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js"
  },
  "dependencies": {
    "dotenv": "file:packages/dotenv-16.4.7.tgz",
    "express": "file:packages/express-4.21.2.tgz",
    "pg": "file:packages/pg-8.14.1.tgz"
  },
  "devDependencies": {
    "nodemon": "file:packages/nodemon-3.1.9.tgz",
    "jest": "file:packages/jest-29.7.0.tgz"
  }
}
```

The `package.json` file contains a JSON object with the following fields:

1. `"name": "gophertalk-backend-express"`- The name of the project. It usually matches the folder name and is used when publishing the package (if the project is published to npm).

2. `"version": "0.1.0"` - The project version in SemVer format: `major.minor.patch`.

3. `"type": "module"` - Specifies that the project uses ECMAScript modules (ESM) instead of CommonJS. This allows using `import` / `export` instead of `require`.

4. `"main": "src/app.js"` - The main entry point of the application.

5. `"scripts"` – Custom scripts:

   - `"dev": "nodemon src/app.js"` - Starts the application in development mode with automatic restarts on file changes (using `nodemon`).

   - `"test": "node --experimental-vm-modules node_modules/jest/bin/jest.js"` - Runs tests using Jest.  
     The `--experimental-vm-modules` flag enables support for ESM in Jest.

6. `"dependencies"` – Main runtime dependencies. All packages are installed locally via file references (`file:packages/...`) instead of from the internet. This is useful in offline environments or when using a local package repository.

   - `dotenv` – Loads environment variables from `.env` into `process.env`.
   - `express` – Main framework for building REST APIs.
   - `pg` – Official PostgreSQL client library for Node.js.

7. `"devDependencies"` – Development-only dependencies. These are not included in the production build.

   - `nodemon` – Automatically restarts the server on file changes.
   - `jest` – A testing framework for unit and integration tests.

Place the following packages into the `src/packages` folder:

- <a target="_blank" href="/databases/dotenv-16.4.7.tgz">dotenv</a>
- <a target="_blank" href="/databases/express-4.21.2.tgz">express</a>
- <a target="_blank" href="/databases/jest-29.7.0.tgz">jest</a>
- <a target="_blank" href="/databases/nodemon-3.1.9.tgz">nodemon</a>
- <a target="_blank" href="/databases/pg-8.14.1.tgz">pg</a>

After that, run the following command from the root of the project inside the `gophertalk-backend-express` directory:

```bash
npm install
```

## Setting Environment Variables

Using environment variables in a project allows you to separate sensitive and changeable settings (such as database connection parameters) from the main application code. This is important for several reasons.

First, security: credentials like usernames, passwords, host addresses, and database names should not be included in version control (e.g., Git) to avoid leaking sensitive data when publishing code. Environment variables can be stored in a `.env` file (which should be added to `.gitignore`) or set directly in the runtime environment (e.g., on a server or in CI/CD pipelines).

Second, flexibility and ease of configuration: you can deploy the application in different environments — locally, on a test server, or in production — without modifying the source code. It's enough to define environment variables specific to each environment.

Third, readability and scalability: configuration values are stored in one place, making them easier to change and document. This is especially important in team development and when working with multiple services and databases.

For development convenience, we use the `dotenv` package, which can load environment variables from a `.env` file. An example of such a file is shown below:

```bash
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=postgres
```

You should provide your own values.
You’ll need a running PostgreSQL server, a database inside it, and a user account with access to that database.

## Configuring the PostgreSQL Connection

Create a file named `db.js` in the `src/config` directory. Add the following content.

```js
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
```

Let's break down what this code does.

1. Importing libraries

   ```js
   import pg from "pg";
   import dotenv from "dotenv";
   ```

   - `pg` – a library for working with PostgreSQL in Node.js.
   - `dotenv` – a library that loads environment variables from a `.env` file into `process.env`.

2. Loading environment variables

   ```js
   dotenv.config();
   ```

   - Loads variables from the `.env` file into the global `process.env` object.
   - After that, you can use variables like `process.env.DB_HOST`.

3. Creating and exporting the connection pool

   ```js
   const { Pool } = pg;

   export const pool = new Pool({
     host: process.env.DB_HOST,
     port: process.env.DB_PORT,
     user: process.env.DB_USER,
     password: process.env.DB_PASSWORD,
     database: process.env.DB_NAME,
   });
   ```

   - A `pool` object is created and exported, which manages multiple connections to the database.
   - All configuration parameters are loaded from environment variables.

## Creating the main application file, starting the app, and testing the database connection

Place the following content into `src/app.js`

```js
import dotenv from "dotenv";
import express from "express";
import { pool } from "./db/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

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

This code represents a minimal server built with `express` that connects to a PostgreSQL database using `pg`. Let’s break it down:

1. Importing libraries

   ```js
   import dotenv from "dotenv";
   import express from "express";
   import { pool } from "./config/db.js";
   ```

   - `dotenv` is used to load environment variables from the `.env` file.
   - `express` is a framework for building web servers and REST APIs.
   - `pool` is the imported connection pool for PostgreSQL.

2. Loading environment variables

   ```js
   dotenv.config();
   ```

   It loads variables from the `.env` file into the `process.env` object.

3. Creating the app and defining the port

   ```js
   const app = express();
   const PORT = process.env.PORT || 3000;
   ```

   - `app` is an instance of the Express server.
   - `PORT` is the port the server will listen on (taken from `.env` or defaults to 3000).

4. Connecting middleware

   ```js
   app.use(express.json());
   ```

   This enables Express to automatically parse the body of incoming JSON requests (`req.body`).

   ::: details What is middleware
   A middleware is a function that is executed during the processing of an HTTP request — between receiving the request and sending the response.

   Middleware functions can:

   - modify the `req` (request) or `res` (response) object,
   - terminate the request (`res.send()`, etc.),
   - or pass control to the next middleware using `next()`.

   Middleware is commonly used for:

   - logging,
   - authentication,
   - data validation,
   - error handling,
   - JSON and form parsing (`express.json()`, `express.urlencoded()`),
   - and much more.

   Let's look at an example:

   ```mermaid
   flowchart TD
   A[Incoming HTTP request] --> B[Middleware - auth check]
   B -->|Authorized| C[Route handler]
   B -->|Unauthorized| D[401 Unauthorized]
   C --> E[200 OK]
   ```

   First, the client request reaches the middleware, which checks whether the user is authorized.  
   If authorization succeeds (e.g., the token is valid), the middleware passes control to the route handler, which processes the request and sends a response. In that case, the client receives a `200 OK`.

   If the user is not authorized (e.g., the token is missing or invalid), the middleware doesn't pass control further and immediately returns a `401 Unauthorized` response to indicate that access is denied.
   :::

5. Route `/api/health-check`

   - This is a technical `GET` route used to check the health of the server and database.
   - It sends a simple `SELECT 1` query to the database.
   - If the database responds, it returns `200 OK`; otherwise, `500 DB connection failed`.

   ::: details HTTP status codes
   HTTP status codes are divided into five categories, each with a specific purpose. Here are some of them:

   ### 🔵 1xx — Informational

   | Code | Description                                                                |
   | ---- | -------------------------------------------------------------------------- |
   | 100  | Continue — the server has received the headers and is waiting for the body |
   | 101  | Switching Protocols — e.g., switching to WebSocket                         |

   -

   ### 🟢 2xx — Success

   | Code | Description                                                                 |
   | ---- | --------------------------------------------------------------------------- |
   | 200  | OK — the request was successful                                             |
   | 201  | Created — a new resource was successfully created (typically for POST)      |
   | 204  | No Content — request succeeded but there is no response body (e.g., DELETE) |

   -

   ### 🟡 3xx — Redirection

   | Code | Description                                           |
   | ---- | ----------------------------------------------------- |
   | 301  | Moved Permanently — permanent redirection             |
   | 302  | Found — temporary redirection                         |
   | 304  | Not Modified — use the cached version of the resource |

   -

   ### 🔴 4xx — Client Errors

   | Code | Description                                                                            |
   | ---- | -------------------------------------------------------------------------------------- |
   | 400  | Bad Request — malformed request                                                        |
   | 401  | Unauthorized — authentication is required                                              |
   | 403  | Forbidden — access is denied, even if authenticated                                    |
   | 404  | Not Found — the requested resource does not exist                                      |
   | 409  | Conflict — a request conflict, such as trying to create a duplicate                    |
   | 422  | Unprocessable Entity — valid syntax but semantically invalid (e.g., failed validation) |

   -

   ### 🔴 5xx — Server Errors

   | Code | Description                                                          |
   | ---- | -------------------------------------------------------------------- |
   | 500  | Internal Server Error — unexpected server-side error                 |
   | 502  | Bad Gateway — invalid response from an upstream server               |
   | 503  | Service Unavailable — server is temporarily down (e.g., overloaded)  |
   | 504  | Gateway Timeout — timeout waiting for a response from another server |

   :::

   ::: details HTTP Methods
   HTTP methods define the type of action the client (such as a browser or frontend app) wants to perform on the server at a given URL. They are the foundation of REST APIs and allow for reading, creating, updating, and deleting resources.

   Each method has its own purpose and semantics, and using them correctly helps build logical, safe, and user-friendly APIs.

   | Method  | Description                                                                   | Idempotent | Safe   | Common use in REST       |
   | ------- | ----------------------------------------------------------------------------- | ---------- | ------ | ------------------------ |
   | GET     | Retrieve data from the server                                                 | ✅ Yes     | ✅ Yes | Reading resources        |
   | POST    | Send new data to the server (create a resource)                               | ❌ No      | ❌ No  | Creating resources       |
   | PUT     | Fully replace a resource                                                      | ✅ Yes     | ❌ No  | Full update of resources |
   | PATCH   | Partially update a resource                                                   | ❌ No      | ❌ No  | Partial update           |
   | DELETE  | Delete a resource                                                             | ✅ Yes     | ❌ No  | Deletion                 |
   | HEAD    | Same as GET, but returns only headers (useful for cache, availability checks) | ✅ Yes     | ✅ Yes | Availability checking    |
   | OPTIONS | Returns the allowed methods for a resource (commonly used for CORS preflight) | ✅ Yes     | ✅ Yes | Capability discovery     |

   If a method is idempotent, it means that calling it multiple times will produce the same result. For example:

   - `GET /users` will return the same user list every time.
   - `DELETE /user/5` deletes the user; repeated calls do nothing new if the user is already deleted.
   - `POST /users` is not idempotent — each call can create a new user.

   A safe HTTP method is one that does not alter the state of the server. It is used only to retrieve information and has no side effects like creating or changing data. For example:

   - `GET` is safe because it just reads data.
   - `POST` is not safe because it may create or update data.
     :::

6. Starting the server

   ```js
   app.listen(PORT, () => {
     console.log(`Server is running on port ${PORT}`);
   });
   ```

   This starts the server on the specified port and prints a message to the console.

To start the application, run the command:

```bash
npm run dev
```

If everything is set up correctly, you will see the following output in the console:

```bash
> gophertalk-backend-express@0.1.0 dev
> nodemon src/app.js

[nodemon] 3.1.9
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: js,mjs,cjs,json
[nodemon] starting `node src/app.js`
Server is running on port 3000
```

To verify that the database connection is successful, send a `GET` request to the following address `http://localhost:3000/api/health-check`

There are several ways to do this:

1. Using the `curl` utility

   In a second terminal (since the app is running in the first one), run:

   ```bash
   curl http://localhost:3000/api/health-check
   ```

   If the connection is successful, you will see the response `OK`. Otherwise, an error will appear in the application console.

2. Using a browser

   Open any browser and go to `http://localhost:3000/api/health-check`.  
   The browser will send a GET request. If everything is working correctly, you will see the text `OK`.

3. Using Postman software — more on this later.

# Postman essentials

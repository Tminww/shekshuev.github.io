# Installing libraries and connecting PostgreSQL and MongoDB to the application

## Introduction

In this course, we will develop a **web application using Node.js and a PostgreSQL database**.
To interact with the database from our application, we will use the official [`pg`](https://www.npmjs.com/package/pg) library.

**`node-postgres` (or simply `pg`)** is a collection of Node.js modules designed for working with PostgreSQL.
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
Thanks to this, we’ll be able to leverage **the full power of PostgreSQL directly from Node.js code** — efficiently, flexibly, and without relying on an ORM.

## Basics of the `pg` Library API

The `pg` library provides several key interfaces for working with PostgreSQL.
In this section, we will cover three main components:

1. `Client` — direct connection to the database;
2. `Pool` — connection pool (the most commonly used option);
3. `Result` — the data structure returned after executing an SQL query.

---

### 1. `Client`: direct connection

The `Client` object allows you to establish **a single explicit connection** to a PostgreSQL database.
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
import pg from 'pg'
const { Pool } = pg

const pool = new Pool()

const client = await pool.connect()
const result = await client.query({
  rowMode: 'array',
  text: 'SELECT 1 as one, 2 as two;',
})
console.log(result.fields[0].name) // one
console.log(result.fields[1].name) // two
console.log(result.rows) // [ [ 1, 2 ] ]
await client.end()
```

# Developing the client interaction interface

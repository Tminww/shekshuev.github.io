# ClickHouse Basics

ClickHouse is a columnar DBMS that does not have the overhead of working with wide tables with a large number of columns, which means it allows you to store data in a denormalized form.

### Where ClickHouse is used

ClickHouse works effectively in projects of any scale: from MVPs to analytical systems of large corporations. Used in:

- Financial technologies
- Scientific research
- Analytical services (marketing, marketplaces)
- The work of warehouses and production facilities (analysis of operations, metrics of facilities)

### ClickHouse is suitable for

- Quick queries on non-aggregated statistics
- Storing and reading logs
- SIEM - Information security and Security Event Management
- Storage and processing of denormalized data
- Storage of telemetry, metrics for clients and devices
- Storing statistics (for example, a data source in Grafana)

### When ClickHouse is not needed

- Complex JOIN queries between large tables (require a lot of memory and data transfer)
- Samples of individual rows with low latency
- OLTP load with frequent changes and real-time data updates

ClickHouse is designed to increase memory for caching frequently used data. For analytical queries with large amounts of data, the response time is shorter than for other databases.

## Key Features of ClickHouse

- **Column storage:** The data of each column is stored in a separate file. When reading, only the necessary columns are decompressed, which speeds up the work.
- **Vector engine:** processing data by vectors (pieces of columns) using SIMD instructions and efficient CPU caching.
- **Natural parallelization:** Large requests are automatically parallelized to all available server resources.
- **Working in single-node and cluster configurations:** allows you to scale data processing.
- **Scalability:** Adding new nodes to process petabytes of data.
- **Decentralization and fault tolerance:** Asynchronous multi-master replication with automatic data recovery.
- **OLAP-oriented:** real-time analytical data processing, without support for OLTP transactionality.

:::details What are SIMD instructions and why are they needed in ClickHouse

**SIMD** (Single Instruction, Multiple Data) is a technology in which a processor can perform the same operation on multiple data simultaneously.

### How it works

- Usually, the processor processes data one element at a time (for example, adds two numbers).
- With SIMD, the processor can, for example, add up 4 or 8 pairs of numbers at once in one command.
- This is achieved through special instructions and extended processor registers.

In ClickHouse, the use of SIMD instructions is especially important because of its columnar data storage structure. Since data is stored in columns, and analytical queries often require performing the same operation on a large number of values in one column (for example, filtering, aggregation), SIMD instructions can significantly speed up these calculations. Instead of the processor processing each value separately, SIMD allows it to perform a single operation on multiple values at once. For example, if you need to add two columns, each of which contains 1000 numbers, the processor will perform 1000 addition operations without SIMD. Using SIMD, when the processor can add, say, 8 pairs of numbers at the same time, the total number of operations will be reduced to 125, which significantly increases the processing speed.

:::

## ClickHouse operating modes

### One node (Single-node)

- Easy installation and launch of the service.
- Suitable if:
- No fault tolerance required
- No need for horizontal scaling
- The amount of data fits on one server
- CPU and RAM resources are sufficient for the load

### Cluster

- Requires ZooKeeper™ (3 or 5 nodes) or ClickHouse Keeper for coordination.
- ZooKeeper is a Java service coordinator from Apache.
- ClickHouse Keeper is a ZooKeeper alternative compatible with it.
- Stores cluster configuration, metadata, task queues, and information about replicated tables.
  Allows you to configure replication and sharding for scaling and increased fault tolerance.
- MPP support (executing a single query on multiple nodes at the same time).
- Replication and sharding can be used together or separately.

## Differences between ClickHouse and other DBMS

- Optimized for OLAP tasks, not OLTP.
- Column storage and vector processing of data.
- There is no support for real-time transactions.
- High performance for analytical queries on large amounts of data.

## Connection interfaces

ClickHouse supports two protocols:

1. **Native TCP**:

   - Used in the command line client and for server-to-server communication
   - Has less overhead
   - Implemented in C++, Go, Python

2. **HTTP**:

   - More versatile, implemented in almost all languages
   - More limited compared to the native interface
   - Has more overhead and lower performance

Both interfaces support TLS encryption.

## Tools for connecting

Officially supported:

- Console client
- JDBC driver
- ODBC driver
- C++ Client Library

For most programming languages, there are libraries that implement both Native and HTTP connections.

## Working with ClickHouse via DBeaver

DBeaver is a versatile tool with a graphical interface for working with various databases, including ClickHouse. To connect to ClickHouse via DBeaver:

1. **Installing DBeaver**:

   - Download and install DBeaver from the official website (dbeaver.io )
   - Available versions for Windows, macOS and Linux

2. **Creating a connection**:

   - Click "New Connection" in the menu or on the toolbar
   - Select "ClickHouse" from the list of available databases
   - Enter the connection parameters:
     - Host (ClickHouse server address)
     - Port (default 8123 for HTTP or 9000 for TCP)
     - Database (database name)
     - Username and password
   - Configure SSL/TLS for secure connection if necessary

## Creating tables in ClickHouse

As with most databases, ClickHouse logically groups tables into databases. Use the `CREATE DATABASE` command to create a new database in ClickHouse:

```sql
CREATE DATABASE IF NOT EXISTS helloworld
```

Similarly, use `CREATE TABLE` to define a new table. (If you do not specify a database name, the table will be in the `default` database.) The following table is called `my_first_table` in the 'helloworld` database:

```sql
CREATE TABLE helloworld.my_first_table
(
    user_id UInt32,
    message String,
    timestamp DateTime,
    metric Float32
)
ENGINE = MergeTree()
PRIMARY KEY (user_id, timestamp)
```

In the example above, `my_first_table` is a `MergeTree` table with four columns:

- `user_id': 32-bit unsigned integer

- `message': string data type `String`

- `timestamp': the `DateTime` value that represents a point in time

- `metric`: 32-bit floating point number

### A brief introduction to primary keys

Before proceeding, it is important to understand how primary keys work in ClickHouse (the implementation of primary keys may seem unexpected!):

> [!CAUTION] Attention
> Primary keys in ClickHouse **are not unique** for each row in the table

The primary key of the ClickHouse table determines how the data is sorted when writing to disk. Every 8,192 rows or 10 MB of data (called the `index granularity') creates an entry in the primary key index file. This concept of granularity creates a sparse index that fits easily into memory, and the granules are a strip of the smallest amount of column data that is processed during `SELECT`queries.

The primary key can be determined using the 'PRIMARY KEY`parameter. If you define a table without the specified`PRIMARY KEY', then the key becomes the tuple specified in the `ORDER BY` clause. If you specify both `PRIMARY KEY` and `ORDER BY', the primary key must be a prefix of the sort order.

The primary key is also a sorting key, which is a tuple of `(user_id, timestamp)'. Thus, the data stored in each column file will be sorted by `user_id', then by `timestamp'.

## Inserting data into ClickHouse

You can use the familiar `INSERT INTO TABLE` command from ClickHouse. Let's insert some data into the created table.

```sql
INSERT INTO helloworld.my_first_table (user_id, message, timestamp, metric) VALUES
    (101, 'Hello, ClickHouse!',                                 now(),       -1.0    ),
    (102, 'Insert a lot of rows per batch',                     yesterday(), 1.41421 ),
    (102, 'Sort your data based on your commonly-used queries', today(),     2.718   ),
    (101, 'Granules are the smallest chunks of data read',      now() + 5,   3.14159 )
```

To make sure that everything worked, we will run the following `SELECT` query:

```sql
SELECT * FROM helloworld.my_first_table
```

ClickHouse is **OLAP (Online Analytical Processing)** A system specifically designed for analytics and processing of large amounts of data with high speed and scalability. Due to its architecture, ClickHouse is capable of processing millions of line inserts per second. This high level of performance is achieved through parallel data processing and efficient column compression. However, unlike classic transactional databases, ClickHouse does not guarantee immediate data consistency: the system is focused on **eventual consistency** (consistency over time) and is optimized for operations involving primarily the addition of new data.

In contrast, **OLTP (Online Transaction Processing)** Databases such as PostgreSQL are designed to work with transactions and provide strict ACID guarantees. PostgreSQL, for example, implements the **MVCC (Multi-Version Concurrency Control)** mechanism, which allows processing parallel transactions and maintaining multiple versions of data simultaneously. Such databases are great for scenarios where instant data consistency and support for complex modification operations are important, but because of this, data insertion can be slower, especially with large volumes.

To maximize performance when inserting data into ClickHouse, it is important to take into account its features and adhere to certain recommendations. Following these rules allows you to avoid typical errors that may occur when trying to use ClickHouse in the same way as transactional OLTP databases, and to build an insertion process that is optimal for analytical workloads.

### Best practices for inserting data into ClickHouse

- **Insert in large batches**  
  Each `INSERT` creates a separate piece of data, so it is better to send fewer large batches (from 1,000 to 100,000 rows at a time) than many small ones. This reduces the load on the file system and improves performance.

- **Use asynchronous inserts for small batches**  
  If it is not possible to collect large batches on the client side (for example, in monitoring systems), use asynchronous ClickHouse inserts. In this mode, data is first buffered and then dumped into storage in one piece, which allows efficient aggregation of small inserts on the server.

- **Ensure that repeated inserts are idempotent**  
  ClickHouse inserts are idempotent by default: resending the same data does not lead to duplication if the order and content match. This is important for reliability in case of network failures.

- **Insert directly into MergeTree or replicated tables**  
  It is best to insert data immediately into MergeTree tables (or their replicated versions), distributing the load across sharded nodes. For distributed tables, it is recommended to enable `internal_replication=true'.

- **Use the native format for maximum performance**
  For the fastest inserts, use the ClickHouse native data format, which minimizes the overhead of parsing and conversion. The alternative is `RowBinary' (optimal for string format), and `JSONEachRow' - for fast integration, but with high parsing costs.

- **Use the official ClickHouse client**
  Official clients for popular languages support optimal insertion modes, including asynchronous inserts.

- **Use the HTTP interface if necessary**
  ClickHouse supports an HTTP interface for inserting and reading data, which is convenient for load balancing and integration with external systems. However, the native protocol is usually a bit faster.

- **Know the limitations of asynchronous inserts**  
  The data in the buffer is unavailable for requests until it is flushed to the main storage. Buffer reset parameters can be configured.

## Data sampling

ClickHouse supports similar SELECT queries that you are already familiar with. For example:

```sql
SELECT *
FROM helloworld.my_first_table
ORDER BY timestamp
```

## Data update

Use the `ALTER TABLE' command...UPDATE` to update the rows in the table:

```sql
ALTER TABLE [<database>.]<table> UPDATE <column> = <expression> WHERE <filter_expr>
```

`<expression>` is the new value for the column for which `<filter_expr>` is executed. The `<expression>` must have the same data type as the column, or be converted to the same data type using the 'CAST` operator. '<filter_expr>` should return the value `UInt8' (zero or not zero) for each row of data. Multiple 'UPDATE` `<column>` statements can be combined in a single `ALTER TABLE` command, separated by commas.

Example:

```sql
ALTER TABLE helloworld.my_first_table
UPDATE message = 'Updated message', metric = metric * 2
WHERE user_id = 102
```

## Deleting data

Use the `ALTER TABLE` command to delete rows:

```sql
ALTER TABLE [<database>.]<table> DELETE WHERE <filter_expr>
```

'<filter_expr>` should return the UInt8 value for each row of data.

Example:

```sql
ALTER TABLE helloworld.my_first_table
DELETE WHERE user_id = 101
```

## Easy removals

Another option to delete lines is to use the `DELETE FROM` command, which is called easy deletion. Deleted rows are immediately marked as deleted and automatically filtered from all subsequent queries, so you don't have to wait for parts to merge or use the `FINAL` keyword. Data cleanup occurs asynchronously in the background.

```sql
DELETE FROM [db.]table [ON CLUSTER cluster] [WHERE expr]
```

Example:

```sql
DELETE FROM helloworld.my_first_table
WHERE user_id = 102
```

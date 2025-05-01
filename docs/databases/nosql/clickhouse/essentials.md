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

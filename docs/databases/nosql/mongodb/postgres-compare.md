# Сравнение MongoDB и PostgreSQL

Давайте сравним возможности MongoDB и PostgreSQL при работе с вложенными и слабо структурированными данными на примере датасета Airbnb. Этот датасет представляет собой реальную выгрузку объявлений о сдаче жилья с отзывами, описаниями, информацией о владельцах, ценами и характеристиками объектов.

### Почему важен выбор СУБД для слабо структурированных данных

Традиционные реляционные базы данных, такие как PostgreSQL, предполагают строго типизированные схемы и нормализованные таблицы. Это делает их удобными для работы с транзакционными данными и аналитикой, но может стать узким местом при работе с иерархически организованными или гибко меняющимися структурами, такими как JSON-документы, вложенные массивы и динамичные поля.

MongoDB — это документо-ориентированная NoSQL-СУБД, которая позволяет хранить документы в формате BSON (JSON с расширениями). Благодаря отсутствию фиксированной схемы, MongoDB особенно хорошо справляется с вложенными структурами и позволяет эффективно агрегировать и фильтровать данные без необходимости нормализации.

### О датасете

Датасет представляет собой коллекцию документов, каждый из которых соответствует одному объявлению на Airbnb. Внутри каждого документа содержатся:

- Основные сведения об объекте (цена, тип жилья, местоположение и т.д.),
- Информация о хозяине,
- Массив отзывов, включая текст комментариев, авторов и даты,
- Наборы удобств и правил дома,
- Геокоординаты.

Файл JSON можно скачать по этой <a target="_blank" href="/datasets/listingsAndReviews.json.zip">ссылке</a>. Он представляет собой JSON Lines — по одному объявлению в строке, с вложенными полями. Для PostgreSQL эти же данные нормализованы, разбиты на три файла (т.е. три таблицы) и хаходятся по этой <a target="_blank" href="/datasets/listings.csv.zip">ссылке</a>.

# Назначение

Датасет подходит для демонстрации:

- Преимуществ работы с вложенными структурами в MongoDB,
- Необходимости нормализации и разделения данных в PostgreSQL,
- Сравнения удобства и производительности при выполнении типичных запросов: подсчётов, фильтрации, агрегаций.

### Цель сравнения

В ходе этого занятия мы:

- Сравним архитектуры MongoDB и PostgreSQL в контексте обработки JSON-подобных документов;
- Покажем, как одна и та же структура данных может быть представлена в MongoDB и нормализована в PostgreSQL;
- Оценим, насколько удобно и быстро выполнять аналитические запросы в каждой из систем;
- Выявим преимущества и ограничения каждой из СУБД при работе с подобными данными.

## Импорт данных

### PosgreSQL

Создайте таблицы

```sql
-- Пользователи
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    name TEXT
);

-- Объявления
CREATE TABLE listings (
    id BIGINT PRIMARY KEY,
    name TEXT,
    host_name TEXT,
    city TEXT,
    country TEXT,
    property_type TEXT,
    room_type TEXT,
    price NUMERIC
);

-- Отзывы
CREATE TABLE reviews (
    id BIGINT PRIMARY KEY,
    listing_id BIGINT REFERENCES listings(id),
    date TIMESTAMP,
    reviewer_id BIGINT REFERENCES users(id),
    comments TEXT
);
```

С помощью команды `COPY` переместите содержимое csv файлов в соответствующие таблицы:

```sql
COPY users(id, name)
FROM '/tmp/users.csv' DELIMITER ',' CSV HEADER;

COPY listings(id, name, host_name, city, country, property_type, room_type, price)
FROM '/tmp/listings.csv' DELIMITER ',' CSV HEADER;

COPY reviews(id, listing_id, date, reviewer_id, comments)
FROM '/tmp/reviews.csv' DELIMITER ',' CSV HEADER;
```

Обратите внимание, что нужно указать правильные пути к файлам `users.csv`, `listings.csv`, `reviews.csv`.

### MongoDB

Для копирования json в Mongo нужно моспользоваться утилитой `mongoimport`. В консоли выполните:

```bash
mongoimport --uri "mongodb://localhost:27017" --db airbnb --collection reviews --file "/tmp/listingsAndReviews.json"
```

Обратите внимание, что нужно указать правильный путь к файлу `listingsAndReviews.json`.

В случае успаешного копирования данных вывод в кончоли будет примерно таким:

```bash
<текущая_дата_и_время>	connected to: mongodb://localhost:27017
<текущая_дата_и_время>	5555 document(s) imported successfully. 0 document(s) failed to import.
```

Самостоятельно ознакомьтесь со структурой json.

## Подсчет количества объявлений, пользователей и отзывов.

В PostgreSQL для подсчета количества объявлений, пользователей и отзывов нужно просто вызвать `count(*)` для каждой из таблиц:

```sql
-- Количество пользователей
SELECT COUNT(*) FROM users;

-- Количество объявлений
SELECT COUNT(*) FROM listings;

-- Количество отзывов
SELECT COUNT(*) FROM reviews;
```

В MongoDB коллекция представляет собой набор объявлений (`listings`), в которых есть вложенная информация об отзывах и пользователях, оставивших их. Поэтому для подсчета количества объявлений необходимо просто посчитать количество документов в коллекции:

```javascript
db.reviews.countDocuments();
```

Для того, чтобы подсчитать количество отзывов и пользователей, необходимо использовать агрегации.

```javascript
// Количество отзывов (сумма длин всех массивов reviews)
db.listingsAndReviews.aggregate([
  { $project: { num_reviews: { $size: { $ifNull: ["$reviews", []] } } } },
  { $group: { _id: null, total_reviews: { $sum: "$num_reviews" } } },
]);

// Количество уникальных пользователей, оставивших отзывы
db.listingsAndReviews.aggregate([
  { $unwind: "$reviews" },
  { $group: { _id: "$reviews.reviewer_id" } },
  { $count: "unique_users" },
]);
```

### Поиск и фильтрация

Найти все объявления в Португалии с типом "Entire home/apt".

PostgreSQL:

```sql
SELECT *
FROM listings
WHERE country = 'Portugal'
  AND room_type = 'Entire home/apt';
```

MongoDB:

```javascript
db.reviews.find({
  "address.country": "Portugal",
  room_type: "Entire home/apt",
});
```

Найти пользователей, оставивших более 10 отзывов.

PostgreSQL:

```sql
SELECT u.id, u.name, COUNT(r.id) AS review_count
FROM users u
JOIN reviews r ON u.id = r.reviewer_id
GROUP BY u.id, u.name
HAVING COUNT(r.id) > 10
ORDER BY review_count DESC;
```

MongoDB:

```javascript
db.reviews.aggregate([
  { $unwind: "$reviews" },
  {
    $group: {
      _id: "$reviews.reviewer_id",
      name: { $first: "$reviews.reviewer_name" },
      review_count: { $sum: 1 },
    },
  },
  { $match: { review_count: { $gt: 10 } } },
  { $sort: { review_count: -1 } },
]);
```

## Агрегации

### Топ-10 городов по количеству объявлений

PostgreSQL:

```sql
SELECT city, COUNT(*) AS listing_count
FROM listings
GROUP BY city
ORDER BY listing_count DESC
LIMIT 10;
```

MongoDB:

```js
db.reviews.aggregate([
  {
    $match: { "address.market": { $exists: true, $ne: null } },
  },
  {
    $group: {
      _id: "$address.market",
      listing_count: { $sum: 1 },
    },
  },
  { $sort: { listing_count: -1 } },
  { $limit: 10 },
]);
```

### Самые популярные хозяева по количеству объявлений и отзывов

PostgreSQL:

```sql
SELECT
  l.host_name,
  COUNT(DISTINCT l.id) AS listings_count,
  COUNT(r.id) AS reviews_count
FROM listings l
LEFT JOIN reviews r ON l.id = r.listing_id
GROUP BY l.host_name
ORDER BY listings_count DESC, reviews_count DESC
LIMIT 10;
```

MongoDB:

```js
db.reviews.aggregate([
  {
    $match: {
      price: { $type: "decimal" },
      "reviews.0": { $exists: true },
      "address.market": { $exists: true, $ne: null },
    },
  },
  { $unwind: "$reviews" },
  {
    $match: {
      "reviews.comments": { $exists: true, $ne: null, $type: "string" },
    },
  },
  {
    $group: {
      _id: "$address.market",
      avg_price: { $avg: { $toDouble: "$price" } },
      avg_comment_length: { $avg: { $strLenCP: "$reviews.comments" } },
      reviews_count: { $sum: 1 },
    },
  },
  { $sort: { reviews_count: -1 } },
  { $limit: 10 },
]);
```

## Исследование производительности MongoDB и PostgreSQL при аналитических запросах

В этом задании вы сравните производительность MongoDB и PostgreSQL при выполнении одинаковых аналитических запросов на большом объёме данных (датасет Airbnb). Основная цель — оценить, как каждая СУБД справляется с реальными аналитическими сценариями при использовании вложенных данных (MongoDB) и нормализованных таблиц (PostgreSQL).

### Исходные данные

- В PostgreSQL данные нормализованы в три таблицы: `listings`, `users`, `reviews`.

- В MongoDB все данные хранятся в одном документе, включая вложенные массивы отзывов.

### Проведение эксперимента

Выполните запросы, приведенные выше. Далее проанализируйте их. Добавье индексы на соответсвтующие поля документа MongoDB и колонки таблиц PostgreSQL. Повторите измерения.

### Выводы по эксперименту

По результатам полученных данных написать выводы, в которых отразить:

- Какой запрос оказался самым тяжёлым для PostgreSQL? Для MongoDB? Почему?
- Какой эффект дало добавление индексов?
- Есть ли в результатах момент, когда MongoDB справлялась лучше? Почему?
- Насколько важно предварительное агрегирование или проектирование схемы?
- Можно ли считать MongoDB универсальной заменой PostgreSQL? Какие есть ограничения?
- Что бы вы предложили для оптимизации работы PostgreSQL на больших объёмах? Какие инструменты или настройки могли бы помочь?

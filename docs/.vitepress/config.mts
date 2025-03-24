import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Code | Ed",
  description: "Open source database and web development courses",
  themeConfig: {
    i18nRouting: true,
    socialLinks: [
      { icon: "github", link: "https://github.com/vuejs/vitepress" },
    ],
  },
  locales: {
    root: {
      label: "English",
      lang: "en",
      themeConfig: {
        nav: [
          { text: "Home", link: "/" },
          { text: "Databases", link: "/databases" },
        ],

        sidebar: [
          {
            text: "Databases",
            items: [
              {
                text: "Databases essentials",
                items: [
                  {
                    text: "Introduction to databases",
                    link: "/ru/databases/essentials/introduction",
                  },
                  {
                    text: "Relational data model",
                    link: "/ru/databases/essentials/relational-model",
                  },
                  {
                    text: "Entity-relationship model development",
                    link: "/ru/databases/essentials/erd",
                  },
                ],
              },
              {
                text: "SQL essentials",
                items: [
                  {
                    text: "SQL essentials",
                    link: "/ru/databases/sql/essentials",
                  },
                  {
                    text: "Data selection",
                    link: "/ru/databases/sql/single-table-select",
                  },
                  {
                    text: "PostgreSQL functions",
                    link: "/ru/databases/sql/functions",
                  },
                  {
                    text: "Multitable queries",
                    link: "/ru/databases/sql/multitable-select",
                  },
                  {
                    text: "Subqueries",
                    link: "/ru/databases/sql/subqueries",
                  },
                  {
                    text: "Table creation",
                    link: "/ru/databases/sql/create-table",
                  },
                  {
                    text: "Data modification",
                    link: "/ru/databases/sql/data-modification",
                  },
                  {
                    text: "Indexes, views and transactions",
                    link: "/ru/databases/sql/indexes-views-transactions",
                  },
                ],
              },
              {
                text: "PostgreSQL administration essentials",
                link: "/ru/databases/administration",
                items: [
                  {
                    text: "PostgreSQL data organization",
                    link: "/ru/databases/administration/essentials",
                  },
                  {
                    text: "PostgreSQL tooling",
                    link: "/ru/databases/administration/tooling",
                  },
                  {
                    text: "Database access control",
                    link: "/ru/databases/administration/access-control",
                  },
                  {
                    text: "Server configuration",
                    link: "/ru/databases/administration/configuration",
                  },
                ],
              },
              {
                text: "NoSQL databases",
                items: [
                  {
                    text: "NoSQL essentials",
                    link: "/ru/databases/nosql/essentials",
                  },
                  {
                    text: "Clickhouse essentials",
                    link: "/ru/databases/nosql/clickhouse",
                  },
                  {
                    text: "HBase essentials",
                    link: "/ru/databases/nosql/hbase",
                  },
                  {
                    text: "Mongodb essentials",
                    link: "/ru/databases/nosql/mongodb",
                  },
                  {
                    text: "SQL and NoSQL systems with large amount of data",
                    link: "/ru/databases/nosql/comparation",
                  },
                ],
              },
              {
                text: "Applications development",
                items: [
                  {
                    text: "Funcitons and triggers",
                    link: "/ru/databases/development/plpgsql",
                  },
                  {
                    text: "Python web application development",
                    link: "/ru/databases/development/database-connection",
                  },
                  {
                    text: "PostgreSQL CRUD from python",
                    link: "/ru/databases/development/postgres",
                  },
                  {
                    text: "Mongodb CRUD from python",
                    link: "/ru/databases/development/mongodb",
                  },
                ],
              },
            ],
          },
        ],
      },
    },
    ru: {
      label: "Russian",
      lang: "ru",
      link: "/ru",
      themeConfig: {
        nav: [
          { text: "Главная", link: "/ru" },
          { text: "Базы данных", link: "/ru/databases" },
        ],

        sidebar: [
          {
            text: "Базы данных",
            items: [
              {
                text: "Основы баз данных",
                items: [
                  {
                    text: "Введение в базы данных",
                    link: "/ru/databases/essentials/introduction",
                  },
                  {
                    text: "Реляционная модель данных",
                    link: "/ru/databases/essentials/relational-model",
                  },
                  {
                    text: "Разработка информационно-логической модели БД",
                    link: "/ru/databases/essentials/erd",
                  },
                ],
              },
              {
                text: "Основы языка SQL",
                items: [
                  {
                    text: "Основы языка SQL",
                    link: "/ru/databases/sql/essentials",
                  },
                  {
                    text: "Выборка данных",
                    link: "/ru/databases/sql/single-table-select",
                  },
                  {
                    text: "Встроенные функции СУБД PostgreSQL",
                    link: "/ru/databases/sql/functions",
                  },
                  {
                    text: "Многотабличные запросы",
                    link: "/ru/databases/sql/multitable-select",
                  },
                  {
                    text: "Подзапросы",
                    link: "/ru/databases/sql/subqueries",
                  },
                  {
                    text: "Разработка таблиц",
                    link: "/ru/databases/sql/create-table",
                  },
                  {
                    text: "Модификация данных",
                    link: "/ru/databases/sql/data-modification",
                  },
                  {
                    text: "Индексы, представления и транзакции",
                    link: "/ru/databases/sql/indexes-views-transactions",
                  },
                ],
              },
              {
                text: "Основы организации и администрирования СУБД PostgreSQL",
                items: [
                  {
                    text: "Организация данных в СУБД PostgreSQL",
                    link: "/ru/databases/administration/essentials",
                  },
                  {
                    text: "Работа со средствами администрирования СУБД PostgreSQL",
                    link: "/ru/databases/administration/tooling",
                  },
                  {
                    text: "Управление доступом к объектам БД",
                    link: "/ru/databases/administration/access-control",
                  },
                  {
                    text: "Конфигурирование сервера",
                    link: "/ru/databases/administration/configuration",
                  },
                ],
              },
              {
                text: "Нереляционные базы данных",
                items: [
                  {
                    text: "Основы NoSQL систем",
                    link: "/ru/databases/nosql/essentials",
                  },
                  {
                    text: "Работа с колоночной СУБД Clickhouse",
                    link: "/ru/databases/nosql/clickhouse",
                  },
                  {
                    text: "Работа с колоночной СУБД Hbase",
                    link: "/ru/databases/nosql/hbase",
                  },
                  {
                    text: "Работа с документной СУБД Mongodb",
                    link: "/ru/databases/nosql/mongodb",
                  },
                  {
                    text: "Работа с большими объемами данных в реляционных и нереляционных СУБД",
                    link: "/ru/databases/nosql/comparation",
                  },
                ],
              },
              {
                text: "Разработка прикладных программ",
                items: [
                  {
                    text: "Разработка функций и триггеров",
                    link: "/ru/databases/development/plpgsql",
                  },
                  {
                    text: "Разработка web-приложения на python",
                    link: "/ru/databases/development/database-connection",
                  },
                  {
                    text: "Вставка, редактирование и выборка данных в БД PostgreSQL из python",
                    link: "/ru/databases/development/postgres",
                  },
                  {
                    text: "Вставка, редактирование и выборка данных в БД Mongodb из python",
                    link: "/ru/databases/development/mongodb",
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  },
});

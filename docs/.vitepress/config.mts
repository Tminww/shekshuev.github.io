import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

// https://vitepress.dev/reference/site-config
export default withMermaid(
  defineConfig({
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
            { text: "Databases", link: "/databases/essentials/introduction" },
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
                      link: "/databases/essentials/introduction",
                    },
                    {
                      text: "Relational data model",
                      link: "/databases/essentials/relational-model",
                    },
                    {
                      text: "Entity-relationship model development",
                      link: "/databases/essentials/erd",
                    },
                  ],
                },
                {
                  text: "SQL essentials",
                  items: [
                    {
                      text: "SQL essentials",
                      link: "/databases/sql/essentials",
                    },
                    {
                      text: "Data selection",
                      link: "/databases/sql/single-table-select",
                    },
                    {
                      text: "PostgreSQL functions",
                      link: "/databases/sql/functions",
                    },
                    {
                      text: "Multitable queries",
                      link: "/databases/sql/multitable-select",
                    },
                    {
                      text: "Subqueries",
                      link: "/databases/sql/subqueries",
                    },
                    {
                      text: "Table creation",
                      link: "/databases/sql/create-table",
                    },
                    {
                      text: "Data modification",
                      link: "/databases/sql/data-modification",
                    },
                    {
                      text: "Indexes, views and transactions",
                      link: "/databases/sql/indexes-views-transactions",
                    },
                  ],
                },
                {
                  text: "PostgreSQL administration essentials",
                  items: [
                    {
                      text: "PostgreSQL data organization",
                      link: "/databases/administration/essentials",
                    },
                    {
                      text: "PostgreSQL tooling",
                      link: "/databases/administration/tooling",
                    },
                    {
                      text: "Database access control",
                      link: "/databases/administration/access-control",
                    },
                    {
                      text: "Server configuration",
                      link: "/databases/administration/configuration",
                    },
                  ],
                },
                {
                  text: "NoSQL databases",
                  items: [
                    {
                      text: "NoSQL essentials",
                      link: "/databases/nosql/essentials",
                    },
                    {
                      text: "Clickhouse",
                      items: [
                        {
                          text: "Essentials",
                          link: "/databases/nosql/clickhouse/essentials",
                        },
                        {
                          text: "Database structure",
                          link: "/databases/nosql/clickhouse/structure",
                        },
                        {
                          text: "Comparing to PostgreSQL",
                          link: "/databases/nosql/clickhouse/postgres-compare",
                        },
                      ],
                    },
                    {
                      text: "HBase essentials",
                      link: "/databases/nosql/hbase",
                    },
                    {
                      text: "MongoDB",
                      items: [
                        {
                          text: "Essentials",
                          link: "/databases/nosql/mongodb/essentials",
                        },
                        {
                          text: "CRUD and indexes",
                          link: "/databases/nosql/mongodb/crud-and-indexes",
                        },
                        {
                          text: "Transactions",
                          link: "/databases/nosql/mongodb/transactions",
                        },
                        {
                          text: "Comparing to PostgreSQL",
                          link: "/databases/nosql/mongodb/postgres-compare",
                        },
                      ],
                    },
                    {
                      text: "SQL and NoSQL systems with large amount of data",
                      link: "/databases/nosql/comparation",
                    },
                  ],
                },
                {
                  text: "Applications development",
                  items: [
                    {
                      text: "Funcitons and triggers",
                      link: "/databases/development/plpgsql",
                    },
                    {
                      text: "Python",
                      items: [
                        {
                          text: "Python web application development",
                          link: "/databases/development/python/database-connection",
                        },
                        {
                          text: "PostgreSQL CRUD from Python",
                          link: "/databases/development/python/postgres",
                        },
                        {
                          text: "Mongodb CRUD from Python",
                          link: "/databases/development/python/mongodb",
                        },
                      ],
                    },
                    {
                      text: "JavaScript",
                      items: [
                        {
                          text: "JavaScript web application development",
                          link: "/databases/development/js/database-connection",
                        },
                        {
                          text: "PostgreSQL CRUD from JavaScript",
                          link: "/databases/development/js/postgres",
                        },
                        {
                          text: "Mongodb CRUD from JavaScript",
                          link: "/databases/development/js/mongodb",
                        },
                      ],
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
            {
              text: "Базы данных",
              link: "/ru/databases/essentials/introduction",
            },
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
                      text: "Clickhouse",
                      items: [
                        {
                          text: "Основы",
                          link: "/ru/databases/nosql/clickhouse/essentials",
                        },
                        {
                          text: "Структура базы данных",
                          link: "/ru/databases/nosql/clickhouse/structure",
                        },
                        {
                          text: "Сравнение с PostgreSQL",
                          link: "/ru/databases/nosql/clickhouse/postgres-compare",
                        },
                      ],
                    },
                    {
                      text: "Работа с колоночной СУБД Hbase",
                      link: "/ru/databases/nosql/hbase",
                    },
                    {
                      text: "Работа с документной СУБД MongoDB",
                      items: [
                        {
                          text: "Основы",
                          link: "/ru/databases/nosql/mongodb/essentials",
                        },
                        {
                          text: "Создание, редактирование и удаление данных. Индексы",
                          link: "/ru/databases/nosql/mongodb/crud-and-indexes",
                        },
                        {
                          text: "Транзакции",
                          link: "/ru/databases/nosql/mongodb/transactions",
                        },
                        {
                          text: "Сравнение с PostgreSQL",
                          link: "/ru/databases/nosql/mongodb/postgres-compare",
                        },
                      ],
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
                      text: "Python",
                      items: [
                        {
                          text: "Разработка web-приложения на Python",
                          link: "/ru/databases/development/python/database-connection",
                        },
                        {
                          text: "Вставка, редактирование и выборка данных в БД PostgreSQL из Python",
                          link: "/ru/databases/development/python/postgres",
                        },
                        {
                          text: "Вставка, редактирование и выборка данных в БД Mongodb из Python",
                          link: "/ru/databases/development/python/mongodb",
                        },
                      ],
                    },
                    {
                      text: "JavaScript",
                      items: [
                        {
                          text: "Разработка web-приложения на JavaScript",
                          link: "/ru/databases/development/js/database-connection",
                        },
                        {
                          text: "Вставка, редактирование и выборка данных в БД PostgreSQL из JavaScript",
                          link: "/ru/databases/development/js/postgres",
                        },
                        {
                          text: "Вставка, редактирование и выборка данных в БД Mongodb из JavaScript",
                          link: "/ru/databases/development/js/mongodb",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    },
    vue: {
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith("pglite-"),
        },
      },
    },
    vite: {
      optimizeDeps: {
        exclude: ["@electric-sql/pglite"],
      },
    },
  })
);

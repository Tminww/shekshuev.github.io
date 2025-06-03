import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

// https://vitepress.dev/reference/site-config
export default withMermaid(
  defineConfig({
    title: "CS Docs",
    description: "Открытые занятия по компьютерным наукам",
    themeConfig: {
      i18nRouting: true,
      socialLinks: [
        { icon: "github", link: "https://github.com/vuejs/vitepress" },
      ],
      nav: [
        { text: "Главная", link: "/" },
        {
          text: "Базы данных",
          link: "/databases/essentials/introduction",
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
                  link: "/databases/essentials/introduction",
                },
                {
                  text: "Реляционная модель данных",
                  link: "/databases/essentials/relational-model",
                },
                {
                  text: "Разработка информационно-логической модели БД",
                  link: "/databases/essentials/erd",
                },
              ],
            },
            {
              text: "Основы языка SQL",
              items: [
                {
                  text: "Основы языка SQL",
                  link: "/databases/sql/essentials",
                },
                {
                  text: "Выборка данных",
                  link: "/databases/sql/single-table-select",
                },
                {
                  text: "Встроенные функции СУБД PostgreSQL",
                  link: "/databases/sql/functions",
                },
                {
                  text: "Многотабличные запросы",
                  link: "/databases/sql/multitable-select",
                },
                {
                  text: "Подзапросы",
                  link: "/databases/sql/subqueries",
                },
                {
                  text: "Разработка таблиц",
                  link: "/databases/sql/create-table",
                },
                {
                  text: "Модификация данных",
                  link: "/databases/sql/data-modification",
                },
                {
                  text: "Индексы, представления и транзакции",
                  link: "/databases/sql/indexes-views-transactions",
                },
              ],
            },
            {
              text: "Основы организации и администрирования СУБД PostgreSQL",
              items: [
                {
                  text: "Организация данных в СУБД PostgreSQL",
                  link: "/databases/administration/essentials",
                },
                {
                  text: "Работа со средствами администрирования СУБД PostgreSQL",
                  link: "/databases/administration/tooling",
                },
                {
                  text: "Управление доступом к объектам БД",
                  link: "/databases/administration/access-control",
                },
                {
                  text: "Конфигурирование сервера",
                  link: "/databases/administration/configuration",
                },
              ],
            },
            {
              text: "Нереляционные базы данных",
              items: [
                {
                  text: "Основы NoSQL систем",
                  link: "/databases/nosql/essentials",
                },
                {
                  text: "Clickhouse",
                  items: [
                    {
                      text: "Основы",
                      link: "/databases/nosql/clickhouse/essentials",
                    },
                    {
                      text: "Структура базы данных",
                      link: "/databases/nosql/clickhouse/structure",
                    },
                    {
                      text: "Сравнение с PostgreSQL",
                      link: "/databases/nosql/clickhouse/postgres-compare",
                    },
                  ],
                },
                {
                  text: "Работа с колоночной СУБД Hbase",
                  link: "/databases/nosql/hbase",
                },
                {
                  text: "Работа с документной СУБД MongoDB",
                  items: [
                    {
                      text: "Основы",
                      link: "/databases/nosql/mongodb/essentials",
                    },
                    {
                      text: "Создание, редактирование и удаление данных. Индексы",
                      link: "/databases/nosql/mongodb/crud-and-indexes",
                    },
                    {
                      text: "Транзакции",
                      link: "/databases/nosql/mongodb/transactions",
                    },
                    {
                      text: "Сравнение с PostgreSQL",
                      link: "/databases/nosql/mongodb/postgres-compare",
                    },
                  ],
                },
                {
                  text: "Работа с большими объемами данных в реляционных и нереляционных СУБД",
                  link: "/databases/nosql/comparation",
                },
              ],
            },
            {
              text: "Разработка прикладных программ",
              items: [
                {
                  text: "Разработка функций и триггеров",
                  link: "/databases/development/plpgsql",
                },
                {
                  text: "Python",
                  items: [
                    {
                      text: "Проектирование web-приложения для доступа к базе данных",
                      items: [
                        {
                          text: "Установка библиотек и подключение базы данных к приложению",
                          link: "/databases/development/python/design/database-connection",
                        },
                        {
                          text: "Основы работы в ПО Postman",
                          link: "/databases/development/python/design/postman",
                        },
                      ],
                    },
                    {
                      text: "Разработка web-приложения для доступа к базе данных",
                      items: [
                        {
                          text: "Разработка слоя репозиториев web-приложения",
                          link: "/databases/development/python/coding/repository",
                        },
                        {
                          text: "Разработка функционального слоя web-приложения",
                          link: "/databases/development/python/coding/service",
                        },
                        {
                          text: "Разработка слоя контроллеров web-приложения",
                          link: "/databases/development/python/coding/controller",
                        },
                      ],
                    },
                  ],
                },
                {
                  text: "JavaScript",
                  items: [
                    {
                      text: "Проектирование web-приложения для доступа к базе данных",
                      items: [
                        {
                          text: "Установка библиотек и подключение базы данных к приложению",
                          link: "/databases/development/js/design/database-connection",
                        },
                        {
                          text: "Основы работы в ПО Postman",
                          link: "/databases/development/js/design/postman",
                        },
                      ],
                    },
                    {
                      text: "Разработка web-приложения для доступа к базе данных",
                      items: [
                        {
                          text: "Разработка слоя репозиториев web-приложения",
                          link: "/databases/development/js/coding/repository",
                        },
                        {
                          text: "Разработка функционального слоя web-приложения",
                          link: "/databases/development/js/coding/service",
                        },
                        {
                          text: "Разработка слоя контроллеров web-приложения",
                          link: "/databases/development/js/coding/controller",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
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

# Файл для фронт разрабов

## Описание

Данный конфиг разворачивает полный инстанс бэкенда (API + DB + Redis)
для локальной разработки фронтенда.

## ТРЕБОВАНИЯ:

1. Положить актуальный файл .env в директорию с этим файлом
   (путь: ./infra/dev/.env).
2. Наличие Docker Desktop / Docker Engine.

## ЗАПУСК:

Выполните команду из корня проекта:

```sh
docker compose -f ./infra/dev/compose.dev.yaml --profile infra up --pull always --build -d -V
```

## ЧТО ВНУТРИ:

- API: http://localhost:3000
- Postgres: localhost:6000 (пароли и база берутся из .env)
- Redis: localhost:7000

## ОСОБЕННОСТИ:

- Авто-миграции: Приложение само накатит SQL-схему при старте.
- Healthchecks: Контейнер API не поднимется, пока DB и Redis
  не станут доступны (status: healthy).
- Изоляция: Используется выделенная сеть 'task-tracker-gateway'.

## RESET:

Если нужно полностью очистить базу и начать с нуля:

```sh
docker compose -f ./infra/dev/compose.dev.yaml --profile infra down -v
```

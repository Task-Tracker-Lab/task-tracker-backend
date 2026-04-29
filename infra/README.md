# Инфраструктура проекта

Данный каталог содержит конфигурации для локальной разработки и инструменты для нагрузочного тестирования.

## Модули инфраструктуры

### dev

Конфигурации Docker Compose для поднятия окружения разработки (базы данных, очереди, кеш).

Команда для запуска из корня проекта:

```sh
docker compose -f ./infra/dev/compose.dev.yaml --env-file .env --profile infra up --build -d -V
```

### k6

Сценарии нагрузочного и стресс-тестирования модулей API. Инструкции по установке и запуску находятся в infra/k6/README.md.

Команды запуска из **корня** **(../cwd)** проекта:

```sh
    pnpm run k6:all
    pnpm run k6:auth
    pnpm run k6:team
    pnpm run k6:projects
    pnpm run k6:user
    pnpm run k6:board
    pnpm run k6:tasks
    pnpm run k6:smoke
```

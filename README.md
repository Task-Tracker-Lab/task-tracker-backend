# Task Tracker Backend 🚀

Современная лёгкая open-source система управления IT-проектами (альтернатива Jira/Yandex Tracker). Бэкенд построен на высокопроизводительном стеке с упором на типизацию и скорость разработки.

**Статус:** `In Development`

## 🛠 Технологический стек

- **Runtime:** Node.js 22+ (pnpm)
- **Framework:** NestJS 11 (**Fastify**)
- **Database:** PostgreSQL + **Drizzle ORM**
- **Validation:** Zod
- **API:** Swagger (OpenAPI)
- **Infrastructure:** Docker (Multi-stage builds)
- **Testing:** Vitest

## ⚡ Quick Start

### 1. Окружение

Скопируйте пример файла окружения и настройте переменные (БД, API ключи DeepSeek):

```bash
cp .env.example .env
```

### 2. Запуск через Docker (Рекомендуется)

Проект полностью контейнеризирован:

```bash
docker-compose up --build
```

### 3. Локальный запуск

Если вы хотите запустить проект без Docker:

```bash
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm start:dev
```

## 📖 API Documentation

После запуска проекта документация доступна по адресу:

**http://localhost:3000/api/v1/docs**

> Note:
> Мы используем drizzle-zod для автоматической генерации схем. Это гарантирует, что документация в Swagger всегда на 100% соответствует реальной валидации запросов.

## 📂 Структура проекта

- src/ — основная бизнес-логика.
- libs/bootstrap — логика инициализации и настройки приложения.
- src/shared/entities — описание схем данных Drizzle.
- test/ — E2E и интеграционные тесты на Vitest.

## 🚀 Infrastructure

- CI/CD: Настроены GitHub Actions для автоматической проверки типов, линтинга и запуска тестов.
- Docker: Используются оптимизированные multi-stage образы для минимизации размера production-билда.

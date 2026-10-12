# Request Desk

![CI](https://github.com/cha1btw/request-desk/actions/workflows/ci.yml/badge.svg)

A small internal admin app where a small business manages incoming customer requests.
Staff log in, register clients, track each request from `new` to `done`, discuss it in comments,
and export the filtered list as CSV.

I built it as a portfolio project to show a complete full-stack JavaScript/TypeScript setup:
a React front end, a Nest.js REST API with PostgreSQL, Docker, automated tests and CI.

## What it does

- **Login** with email and password (JWT). Two roles: `admin` and `manager`. Only an admin can create users.
- **Clients**: name, email, phone. List and create.
- **Requests**: title, description, client, status (`new` / `in_progress` / `done`), created and updated time.
  Create, view, edit, change status.
- **Comments** on a request, with the author and time.
- **Filter and search**: filter the request list by status and search by client name. The filters live in the URL.
- **CSV export** of the list with the filters that are currently active.
- **Seed script** with one admin, two managers and sample clients, requests and comments.

Out of scope on purpose: payments, email or Telegram notifications, file uploads, deployment, i18n.

## Screenshots

> Screenshot placeholders. Add the images to `docs/screenshots/` and they will show up here.

| Login | Requests list |
| --- | --- |
| `docs/screenshots/login.png` | `docs/screenshots/requests-list.png` |

| Request details | Clients |
| --- | --- |
| `docs/screenshots/request-detail.png` | `docs/screenshots/clients.png` |

## Architecture

```
 Browser
    |
    |  http://localhost:5173
    v
+--------------------------+          +----------------------+          +--------------+
| web  (nginx)             |  /api/*  | api  (Nest.js)       |   SQL    | postgres     |
| serves the React build   | -------> | REST API, JWT auth   | -------> | users        |
| and forwards /api to api |          | port 3000            |          | clients      |
+--------------------------+          +----------------------+          | requests     |
                                                                        | comments     |
                                                                        +--------------+
```

The browser only talks to one address. The React app calls relative URLs like `/api/requests`;
nginx (in Docker) or the Vite dev server (in development) forwards them to the API, so no CORS setup is needed.

### Backend (`api/`)

One Nest module per area. Each has a controller, a service, DTOs and an entity.

| Module | What it does |
| --- | --- |
| `config` | Reads `.env` and validates it at startup. The app refuses to start if something required is missing. |
| `auth` | Login, `GET /auth/me`, the JWT guard, the roles guard and the `@Public()`, `@Roles()`, `@CurrentUser()` decorators. |
| `users` | List and create users (admin only). Passwords are hashed with bcrypt. |
| `clients` | List (with name search) and create clients. |
| `requests` | Requests and their comments, filters, CSV export. |
| `health` | `GET /api/health`, checks that the API can reach the database. |

How a request is processed:

1. The global `ValidationPipe` checks the body against the DTO and rejects unknown fields.
2. The global `AuthGuard` checks the JWT. Every route needs a token unless it is marked `@Public()`.
3. The global `RolesGuard` checks `@Roles(...)`. Routes without it are open to every logged-in user.
4. The controller calls a service, the service uses TypeORM repositories.

### Database

Schema changes are written as TypeORM migrations (`api/src/database/migrations`) and applied when the API starts.
`synchronize` is off, so TypeORM never changes the schema on its own.

| Table | Columns |
| --- | --- |
| `users` | `id`, `email` (unique), `password_hash`, `name`, `role` (`admin` / `manager`), `created_at` |
| `clients` | `id`, `name`, `email`, `phone`, `created_at` |
| `requests` | `id`, `title`, `description`, `status`, `client_id` -> clients (RESTRICT), `created_at`, `updated_at` |
| `comments` | `id`, `text`, `request_id` -> requests (CASCADE), `author_id` -> users, `created_at` |

### API endpoints

All routes are under `/api` and need `Authorization: Bearer <token>` unless marked public.

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| GET | `/health` | public | `{ "status": "ok", "db": "up" }`, or 503 if the database is down |
| POST | `/auth/login` | public | `{ email, password }` -> `{ accessToken, user }` |
| GET | `/auth/me` | any user | the current user |
| GET | `/users` | admin | list users |
| POST | `/users` | admin | create a user (`email`, `name`, `password`, `role`) |
| GET | `/clients?search=` | any user | list clients, optional name search |
| POST | `/clients` | any user | create a client |
| GET | `/requests?status=&clientName=` | any user | list requests, newest first |
| GET | `/requests/export?status=&clientName=` | any user | the same list as a CSV file |
| POST | `/requests` | any user | create a request |
| GET | `/requests/:id` | any user | one request with its client and comments |
| PATCH | `/requests/:id` | any user | change title, description, client or status |
| POST | `/requests/:id/comments` | any user | add a comment |

### Frontend (`web/`)

| Route | Page |
| --- | --- |
| `/login` | Login form |
| `/requests` | List, status filter, client search, CSV button |
| `/requests/new` | Create a request |
| `/requests/:id` | Details, edit, change status, comments |
| `/clients` | Client list and create form |

Every route except `/login` is wrapped in `ProtectedRoute`, which redirects to `/login` when there is no session.
The token is kept in `localStorage`. If the API answers 401 (expired token), the app logs out automatically.

## Tech stack

| Part | Technology |
| --- | --- |
| API | Nest.js 11, TypeScript, class-validator DTOs |
| Database | PostgreSQL 17, TypeORM with migrations |
| Auth | JWT (`@nestjs/jwt`), bcrypt password hashing, no Passport |
| Front end | React 19, Vite, TypeScript, React Router, plain CSS (no UI library) |
| Tests | Jest + supertest (API), Vitest + Testing Library (web) |
| Infra | Docker Compose (postgres, api, web), nginx, GitHub Actions |

### Decisions worth knowing

- **TypeORM over Prisma.** Entities are classes next to the module that owns them, which matches the Nest module layout.
  Prisma keeps the whole schema in one file and needs a code generation step.
- **Nest 11, not 12.** Nest 12 is ESM-only and does not work with Jest. I chose Jest and CommonJS to keep the test setup simple.
  Moving to Nest 12 (and Vitest) is on the list below.
- **No Passport.** The JWT guard is one short file that uses `@nestjs/jwt` directly, which is easier to read and explain.
- **Global guards.** A new controller is protected by default; opening a route is an explicit `@Public()`.
- **CSV is built on the server** from the same query as the list, so the export always matches the filters.
  Cells starting with `=`, `+`, `-` or `@` get a leading apostrophe so a spreadsheet does not run them as formulas.
- **Plain CSS and a small `useFetch` hook** instead of Tailwind and React Query: fewer moving parts for a small app.

## Run it

Requirements: Docker with Compose, and Node.js 24 if you want to run things outside Docker.

### Option 1: everything in Docker

```bash
cp .env.example .env
# open .env and set JWT_SECRET (for example: openssl rand -hex 32)

docker compose up --build
```

In a second terminal, load the demo data (once):

```bash
docker compose exec api node dist/database/seed.js
```

- Web app: http://localhost:5173
- API: http://localhost:3000/api/health

Demo users (the password is the `SEED_PASSWORD` value from your `.env`):

| Email | Role |
| --- | --- |
| `admin@example.com` | admin |
| `olena@example.com` | manager |
| `max@example.com` | manager |

Ports 3000, 5173 and 5432 must be free on your machine.

### Option 2: develop locally with hot reload

```bash
cp .env.example .env            # and set JWT_SECRET
docker compose up -d postgres   # only the database in Docker

# terminal 1: API on http://localhost:3000
cd api
npm ci
npm run seed                    # creates the demo data (safe to run again)
npm run start:dev

# terminal 2: web on http://localhost:5173
cd web
npm ci
npm run dev
```

The API reads the `.env` in the repository root. Vite forwards `/api` to `localhost:3000`.
Stop the `web` container first if it is running, because both use port 5173.

### Create a user (admin only)

There is no user management page yet, so use the API:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"<SEED_PASSWORD>"}'
# copy "accessToken" from the answer

curl -X POST http://localhost:3000/api/users \
  -H 'Authorization: Bearer <accessToken>' \
  -H 'Content-Type: application/json' \
  -d '{"email":"new@example.com","name":"New Manager","password":"at-least-8-chars","role":"manager"}'
```

## Run the tests

```bash
# API: unit tests (services, guards, CSV, env validation)
cd api && npm test

# API: e2e tests (login, creating a request, filters, CSV, admin-only routes)
docker compose up -d postgres   # from the repository root
cd api && npm run test:e2e

# Web: component and API client tests
cd web && npm test

# Lint, typecheck and build, in api/ and web/
npm run lint && npm run typecheck && npm run build
```

The e2e tests use a separate database, `request_desk_test`, which they create automatically.
They clear its tables at the start of each run and never touch your development data.

## Continuous integration

`.github/workflows/ci.yml` runs on every push and pull request with three jobs:

1. **API**: lint, typecheck, unit tests, e2e tests against a Postgres service container, build.
2. **Web**: lint, typecheck, tests, build.
3. **Docker**: `docker compose up --build --wait`, then checks the API and the web app respond.

## Environment variables

Copy `.env.example` to `.env`. Never commit `.env`; the example file contains placeholders only.

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `POSTGRES_USER` | yes | `request_desk` | Database user created by the postgres container |
| `POSTGRES_PASSWORD` | yes | `change-me` | Database password. Change it. |
| `POSTGRES_DB` | yes | `request_desk` | Database name |
| `POSTGRES_PORT` | no | `5432` | Port published on your machine |
| `PORT` | no | `3000` | Port of the API |
| `DATABASE_HOST` | yes | `localhost` | Database host. Docker Compose sets it to `postgres` for the api container. |
| `DATABASE_PORT` | no | `5432` | Database port |
| `DATABASE_USER` | yes | `request_desk` | Should match `POSTGRES_USER` |
| `DATABASE_PASSWORD` | yes | `change-me` | Should match `POSTGRES_PASSWORD` |
| `DATABASE_NAME` | yes | `request_desk` | Should match `POSTGRES_DB` |
| `JWT_SECRET` | yes | none | Secret used to sign tokens, at least 32 characters. Generate: `openssl rand -hex 32` |
| `JWT_EXPIRES_IN_SECONDS` | no | `28800` | Token lifetime (8 hours) |
| `SEED_PASSWORD` | for the seed | none | Password of the demo users, at least 8 characters. Development only. |
| `E2E_DATABASE_NAME` | no | `request_desk_test` | Database used by the e2e tests |

## Project structure

```
request-desk/
├── docker-compose.yml        postgres, api, web
├── .env.example              placeholder values only
├── .github/workflows/ci.yml  CI
├── api/                      Nest.js API
│   ├── src/                  config, auth, users, clients, requests, health, database (migrations, seed)
│   └── test/                 e2e tests
└── web/                      React app
    └── src/                  api client, auth, components, pages
```

## What I would improve next

- **Safer sessions.** Keep the token in an httpOnly cookie instead of `localStorage`, and add short-lived tokens with refresh.
- **Brute-force protection.** Rate-limit `/auth/login`.
- **Pagination.** The request and client lists return everything. Fine for a small business, not for thousands of rows.
- **User management page** for admins (today it is API only), plus password change and deactivating users.
- **Edit and delete** for clients and comments, and an activity history on requests.
- **Browser tests** (Playwright) for the main flow: login, create a request, export.
- **React Query** for caching and refetching instead of the small `useFetch` hook.
- **Upgrade to Nest 12 and Vitest** once the ESM-only setup is worth the migration.
- **Observability.** Structured logs and request IDs; a production deployment with HTTPS.

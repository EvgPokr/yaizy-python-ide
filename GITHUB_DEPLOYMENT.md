# Deployment & CI — YaizY Python IDE

Автоматизация деплоя через GitHub Actions.
Приложение развёртывается **контейнерами**: образы собираются в CI и публикуются в GHCR,
хост только тянет готовые образы и поднимает их через `docker compose`.

---

## Архитектура

```
git push (ветка)
      │
      ▼
GitHub Actions  ── lint-and-typecheck ──> build-and-push (backend/frontend/sandbox) ──> ghcr.io/evgpokr/yaizy-python-ide/*
      │
      ▼
deploy job ── SSH (deploy@<host>) ──> git pull ──> docker compose pull && up -d ──> curl /health
```

- **Код/CI** — репозиторий `EvgPokr/yaizy-python-ide`.
- **Образы** — приватный GHCR-неймспейс `ghcr.io/evgpokr/yaizy-python-ide/...` (push через `GITHUB_TOKEN`).
- **Pull-доступ** — аккаунт `yaizy-io` (наследует доступ к пакетам от репозитория, т.к. у него есть write).

---

## Общие файлы (для теста и прода)

| Файл | Назначение |
|---|---|
| `docker/Dockerfile.frontend` | Multi-stage: Vite build → `nginx:alpine` |
| `docker/nginx/templates/default.conf.template` | nginx-шаблон (envsubst), TLS-only 443, SPA + `/api` + WebSocket прокси |
| `docker/docker-compose.deploy.yml` | Общий pull-композ: `nginx` + `backend` + `sandbox` |
| `docker/.env` | Gitignored: `DOMAIN`, `IMAGE_TAG`, `REGISTRY` |
| `.dockerignore` | Исключения build-context |
| `.github/workflows/deploy-test.yml` | CI: lint → build+push → deploy |
| `backend/package.json` (+lock) | Удалён мёртвый `nodemailer` |
| `backend/.env.example` | Удалён SMTP-блок, актуальные переменные |

Каждое окружение определяется gitignored `docker/.env` (`DOMAIN` + `IMAGE_TAG`) и своим GitHub **Environment** (`test` / `prod`).

---

# TEST

**Хост:** `ide.test.yaizy.io` · **Ветка:** `test` · **Домен:** `https://ide.test.yaizy.io`

## Подготовка хоста (выполнено)

- **Docker Engine 25.0.3** + **Docker Compose v5.5.0** (Amazon Linux 2023).
- **TLS-сертификат** `ide.test.yaizy.io` (certbot, standalone) + `certbot-renew.timer` включён.
- **Пользователь `deploy`** (группа `docker`, SSH-ключ, key-only auth), владелец `/opt/python-ide`.
- Каталоги: `/opt/python-ide` (репо), `/tmp/python-sessions` (workspace сессий).

> Требуется write-доступ (пуш в `test`) у аккаунта `yaizy-io`.

## GitHub-настройки

### Environment `test` — Variables
| Name | Value |
|---|---|
| `HOST` | `ide.test.yaizy.io` |
| `HOST_USER` | `deploy` |
| `YAIZY_OAUTH_AUTHORIZE_URL` | `https://test-1.yaizy.io/api/auth2/oauth/authorize` |
| `YAIZY_OAUTH_TOKEN_URL` | `https://test-1.yaizy.io/api/auth2/oauth/token` |
| `YAIZY_OAUTH_REDIRECT_URI` | `https://ide.test.yaizy.io/api/auth/oauth/yaizy/callback` |
| `YAIZY_OAUTH_CLIENT_ID` | `python-ide` |
| `YAIZY_OAUTH_ISSUER` | `https://test-1.yaizy.io` |

### Environment `test` — Secrets
| Name | Значение |
|---|---|
| `SSH_PRIVATE_KEY` | приватный ключ пользователя `deploy` |
| `JWT_SECRET` | секрет локальных сессий (≥32 симв.) |
| `YAIZY_OAUTH_CLIENT_SECRET` | client secret из YaizY |
| `YAIZY_OAUTH_JWT_SECRET` | shared secret проверки OAuth-токена (HS256) |

### Repository level (общий для всех сред)
- **Variables:** `GHCR_USER=yaizy-io`
- **Secrets:** `GHCR_PULL_TOKEN` (PAT `yaizy-io`, `read:packages`)

---

# PROD

**Хост:** `108.61.203.222` · **Домен:** `https://ide.yaizy.io` · **Ветка для прод-деплоя:** не настроен (сейчас деплой только на тест по `test`)

> ⚠️ Прод ещё не развёрнут. Ниже — пошаговый план, как поднять по образцу теста.

## Подготовка хоста (шаги)

1. Установить **Docker Engine** + **Docker Compose v2** (аналог тестового стенда).
2. Выпустить **TLS-сертификат** для `ide.yaizy.io` (certbot HTTP-01 standalone) + включить `certbot-renew.timer`.
3. Создать **non-root пользователя `deploy`** (группа `docker`), владельца `/opt/python-ide`; настроить SSH-ключ.
4. Каталоги: `/opt/python-ide`, `/tmp/python-sessions`.
5. **Важно:** на проде уже могут быть данные студентов (`backend/data/python-ide.db`) и текущий systemd-сервис + host-nginx. Нужно:
   - остановить старый `python-ide` (systemd) и снять host-nginx с 80/443;
   - при первом подъёме — перенести/примонтировать существующую БД (см. ниже про volume), чтобы не потерять проекты/аккаунты.

> Текущий compose монтирует БД в **named volume** `python-ide-data` (`DB_DIR=/data`). Если на проде уже есть БД, временно поменяй на bind-монтирование существующего `backend/data` до миграции.

## GitHub-настройки

### Environment `prod` — Variables
| Name | Value |
|---|---|
| `HOST` | `108.61.203.222` |
| `HOST_USER` | `deploy` |
| `YAIZY_OAUTH_AUTHORIZE_URL` | `https://yaizy.io/api/auth2/oauth/authorize` |
| `YAIZY_OAUTH_TOKEN_URL` | `https://yaizy.io/api/auth2/oauth/token` |
| `YAIZY_OAUTH_REDIRECT_URI` | `https://ide.yaizy.io/api/auth/oauth/yaizy/callback` |
| `YAIZY_OAUTH_CLIENT_ID` | (client id прод-приложения) |
| `YAIZY_OAUTH_ISSUER` | `https://yaizy.io` |

### Environment `prod` — Secrets
| Name | Значение |
|---|---|
| `SSH_PRIVATE_KEY` | ключ `deploy` прод-хоста |
| `JWT_SECRET` | свой секрет локальных сессий (≥32 симв.) |
| `YAIZY_OAUTH_CLIENT_SECRET` | прод-овский client secret из YaizY |
| `YAIZY_OAUTH_JWT_SECRET` | прод-овский shared secret |

### Repository level (общий — уже настроен)
- `GHCR_USER=yaizy-io`, `GHCR_PULL_TOKEN` (PAT `read:packages`).

## Файл окружения на хосте

`docker/.env` (gitignored) на проде:
```env
DOMAIN=ide.yaizy.io
IMAGE_TAG=prod
# REGISTRY=ghcr.io/evgpokr/yaizy-python-ide
```

## Построение pipeline (TODO)

Нужен отдельный workflow (или параметризация текущего) для деплоя на прод:
- trigger: push в основную ветку (например `main`/`prod`) или вручную (`workflow_dispatch`);
- job-ы как в `deploy-test.yml`, но `environment: prod`;
- теги образов `prod` (`IMAGE_TAG=prod`), чтобы не затирать тестовые `test`.

---

## Как работает OAuth

Автологин через YaizY (Authorization Code + PKCE):
1. IDE без сессии редиректит на `/oauth/yaizy/login` → YaizY authorize.
2. Callback `GET /api/auth/oauth/yaizy/callback` с `code`.
3. Backend обменивает `code` на access-токен, проверяет HS256-подпись (`YAIZY_OAUTH_JWT_SECRET`), `issuer` (`YAIZY_OAUTH_ISSUER`), `audience` (`YAIZY_OAUTH_CLIENT_ID`).
4. Провизионит локального пользователя и отдаёт сессионный JWT через URL-fragment.

---

## Локальные команды

Сборка/проверка композа:
```bash
docker compose -f docker/docker-compose.deploy.yml config
```

Проверка YAML workflow:
```bash
ruby -ryaml -e "d=YAML.load_file('.github/workflows/deploy-test.yml'); puts 'OK'; puts d['jobs'].keys"
```

---

## Известные грабли

- **GHCR требует нижний регистр** в имени образа: `ghcr.io/evgpokr/...`, не `EvgPokr`.
- **`appleboy/ssh-action`** не имеет инпута `ignore_known_hosts` — не добавлять; проверка хоста через `fingerprint`.
- **`JsonWebTokenError: invalid signature`** при OAuth — секрет `YAIZY_OAUTH_JWT_SECRET` в GitHub ≠ секрету на стороне YaizY (shared secret).
- **Уведомления о фейлах** в workflow не отключаются (нет ключа `notify`); настраивается в Settings → Notifications → Actions.
- **Lint-ворнинги** `Unexpected any` в backend — не фейлят job (без `--max-warnings 0` в бэкенде).
- **Прод-БД**: при переезде примонтировать существующие данные, иначе студенты потеряют проекты/аккаунты.

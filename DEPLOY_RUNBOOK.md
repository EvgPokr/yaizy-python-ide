# Deploy Runbook (test + prod)

Этот документ описывает практические шаги:

- как раскатывать на `test`
- как деплоить на `prod`
- как сделать первый безопасный cutover прода на контейнеры

## Важно: active / reserve каталоги на prod

- `active` (текущий контейнерный деплой): `/home/deploy/python-ide-prod`
- `reserve` (старый standalone-каталог): `/opt/python-ide`

`deploy-prod.yml` работает только с `active` каталогом и не изменяет `reserve`.

## 1) Что должно быть в репозитории

- `docker/docker-compose.deploy.yml`
- `.github/workflows/deploy-test.yml`
- `.github/workflows/deploy-prod.yml`
- `docker/Dockerfile.frontend`
- `backend/Dockerfile`
- `docker/python-sandbox/Dockerfile`

Образы публикуются в GHCR:

- `ghcr.io/evgpokr/yaizy-python-ide/backend:<tag>`
- `ghcr.io/evgpokr/yaizy-python-ide/frontend:<tag>`
- `ghcr.io/evgpokr/yaizy-python-ide/sandbox:<tag>`

## 2) GitHub Environments

Нужно два Environment в GitHub: `test` и `prod`.

### Общие repository-level настройки

- Variable: `GHCR_USER` (обычно `yaizy-io`)
- Secret: `GHCR_PULL_TOKEN` (PAT с `read:packages`)

### Environment `test`

Variables:

- `HOST` (пример: `ide.test.yaizy.io`)
- `HOST_USER` (`deploy`)
- `YAIZY_OAUTH_AUTHORIZE_URL`
- `YAIZY_OAUTH_TOKEN_URL`
- `YAIZY_OAUTH_REDIRECT_URI` (`https://ide.test.yaizy.io/api/auth/oauth/yaizy/callback`)
- `YAIZY_OAUTH_CLIENT_ID`
- `YAIZY_OAUTH_ISSUER`

Secrets:

- `SSH_PRIVATE_KEY`
- `JWT_SECRET`
- `YAIZY_OAUTH_CLIENT_SECRET`
- `YAIZY_OAUTH_JWT_SECRET`

### Environment `prod`

Variables:

- `HOST` (`ide.yaizy.io`)
- `HOST_USER` (`deploy`)
- `YAIZY_OAUTH_AUTHORIZE_URL` (`https://yaizy.io/api/auth2/oauth/authorize`)
- `YAIZY_OAUTH_TOKEN_URL` (`https://yaizy.io/api/auth2/oauth/token`)
- `YAIZY_OAUTH_REDIRECT_URI` (`https://ide.yaizy.io/api/auth/oauth/yaizy/callback`)
- `YAIZY_OAUTH_CLIENT_ID`
- `YAIZY_OAUTH_ISSUER` (`https://yaizy.io`)

Secrets:

- `SSH_PRIVATE_KEY`
- `JWT_SECRET`
- `YAIZY_OAUTH_CLIENT_SECRET`
- `YAIZY_OAUTH_JWT_SECRET`

Рекомендуется включить protection rules для `prod` (required reviewers).

## 3) Раскатка на test

### Что нужно сделать

1. Убедиться, что изменения в ветке `test`.
2. `git push origin test`.
3. Дождаться workflow `Deploy test`.

### Что делает workflow

1. Lint + typecheck (frontend + backend)
2. Build/push образов с тегом `test`
3. SSH на test host
4. Обновление `backend/.env` и `docker/.env` (`DOMAIN=ide.test.yaizy.io`, `IMAGE_TAG=test`)
5. `docker compose pull && docker compose up -d`
6. Health check `https://ide.test.yaizy.io/health`

### Проверка после деплоя

- Открывается `https://ide.test.yaizy.io`
- `/health` возвращает `healthy`
- Работают авторизация, проекты, запуск Python-кода, WebSocket terminal/canvas

## 4) Деплой на prod (штатный, после cutover)

### Что нужно сделать

1. Смёржить изменения в `main`.
2. Дождаться workflow `Deploy prod`.

### Что делает workflow

1. Lint + typecheck
2. Build/push образов с тегом `prod`
3. SSH на prod host (`active`: `/home/deploy/python-ide-prod`)
4. Обновление `backend/.env` и `docker/.env` (`DOMAIN=ide.yaizy.io`, `IMAGE_TAG=prod`)
5. `docker compose pull && docker compose up -d`
6. Health check `https://ide.yaizy.io/health`

## 5) Первый cutover prod на контейнеры (one-time)

Используется только при переходе со старого standalone-запуска на контейнеры.

### Перед началом

1. Сделать backup БД с хоста:

```bash
scp deploy@ide.yaizy.io:/opt/python-ide/backend/data/python-ide.db \
  backend/data/python-ide.db.bkup
```

2. Проверить контрольную сумму и целостность SQLite (`PRAGMA integrity_check`).

### Cutover (вручную по SSH)

1. Остановить старый backend-процесс (tsx/node), убедиться что `:3001` свободен.
2. Остановить/отключить host nginx, чтобы освободить `:443`.
3. Скопировать БД в active-каталог:

```bash
mkdir -p /home/deploy/python-ide-prod/backend/data
cp -a /opt/python-ide/backend/data/python-ide.db /home/deploy/python-ide-prod/backend/data/python-ide.db
```

4. Запустить `Deploy prod` (через merge в `main` или `workflow_dispatch`) и дать ему поднять контейнеры.
5. Проверить `https://ide.yaizy.io/health` и базовый smoke.
Важно: backend в контейнере использует `DB_DIR=/data` и bind-mount `../backend/data:/data` внутри `active` каталога.

## 6) Rollback

Если после деплоя есть критическая проблема:

1. На хосте:

```bash
docker compose -f /home/deploy/python-ide-prod/docker/docker-compose.deploy.yml down
```

2. Вернуть предыдущую рабочую схему из `reserve` (`/opt/python-ide`) при необходимости.
3. При необходимости восстановить БД из backup.

## 7) Частые проблемы

- `docker compose up` падает из-за занятого `:443`: не остановлен host nginx.
- `/health` не проходит: не поднялся backend или не записались env переменные.
- OAuth `invalid signature`: неправильный `YAIZY_OAUTH_JWT_SECRET`.
- OAuth `invalid_client`: неверный `YAIZY_OAUTH_CLIENT_ID/SECRET` или redirect URI не в whitelist в auth service.

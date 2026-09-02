# ============================================================
#  YaizY Python IDE - Makefile
#  Dev-окружение полностью в Docker-контейнерах
# ============================================================

COMPOSE_DEV := docker compose -f docker/docker-compose.dev.yml

# Цвета вывода
C_RED    := \033[31m
C_GREEN  := \033[32m
C_YELLOW := \033[33m
C_BLUE   := \033[34m
C_CYAN   := \033[36m
C_END    := \033[0m
INFO     := $(C_BLUE)▸$(C_END)
OK       := $(C_GREEN)✔$(C_END)
WARN     := $(C_YELLOW)⚠$(C_END)

.PHONY: help env build build-backend build-frontend sandbox up up-d dev down logs \
        ps shell-backend shell-frontend reset clean

.DEFAULT_GOAL := help

help: ## Список всех команд
	@echo ""
	@echo "$(C_CYAN)YaizY Python IDE$(C_END) — dev через Docker Compose"
	@echo "============================================================"
	@echo ""
	@echo "  $(C_GREEN)Сборка:$(C_END)"
	@echo "    make build          Собрать все образы (backend + frontend + sandbox)"
	@echo "    make sandbox        Собрать только python-sandbox:latest"
	@echo ""
	@echo "  $(C_GREEN)Запуск (dev):$(C_END)"
	@echo "    make dev            Запустить стек в контейнерах (с логированием в терминал)"
	@echo "    make up             То же самое, но в фоне (detached)"
	@echo "    make down           Остановить и удалить контейнеры"
	@echo "    make logs           Смотреть логи всех сервисов"
	@echo "    make ps             Статус сервисов"
	@echo ""
	@echo "  $(C_GREEN)В контейнер:$(C_END)"
	@echo "    make shell-backend       bash в backend"
	@echo "    make shell-frontend      bash в frontend"
	@echo ""
	@echo "  $(C_GREEN)Сервис:$(C_END)"
	@echo "    make reset          Полный сброс (down + clean volumes)"
	@echo ""
	@echo "  $(C_GREEN)Обычный флоу:$(C_END)  make dev   (Ctrl-C для остановки)"
	@echo ""

# ------------------------------------------------------------
#  Сборка
# ------------------------------------------------------------

build: $(COMPOSE_DEV) build ## Собрать все образы (backend + frontend + sandbox)
	@printf "$(OK) Образы собраны\n"

build-backend: ## Собрать только backend-образ
	@printf "$(INFO) Сборка backend-образа...\n"
	@$(COMPOSE_DEV) build backend
	@printf "$(OK) Backend-образ собран\n"

build-frontend: ## Собрать production frontend-образ (nginx)
	docker build -f docker/Dockerfile.frontend -t yaizy-frontend:latest .
	@printf "$(OK) Frontend-образ собран\n"

sandbox: ## Собрать Docker-образ python-sandbox:latest
	@printf "$(INFO) Сборка Docker-образа python-sandbox:latest...\n"
	@cd docker/python-sandbox && docker build -t python-sandbox:latest .
	@printf "$(OK) Образ собран\n"

# ------------------------------------------------------------
#  Запуск dev-окружения
# ------------------------------------------------------------

env: ## Создать .env из env.example, если отсутствуют
	@if [ ! -f backend/.env ]; then \
		cp backend/env.example backend/.env && printf "$(OK) Создан backend/.env\n"; \
	else \
		printf "$(WARN) backend/.env уже существует — пропуск\n"; \
	fi

dev: env ## Запустить стек в контейнерах (логи в терминал, Ctrl-C для остановки)
	@printf "$(INFO) Запуск dev-окружения в контейнерах...\n"
	@printf "$(C_CYAN)  Frontend: $(C_END)http://localhost:5173\n"
	@printf "$(C_CYAN)  Backend:  $(C_END)http://localhost:3001/health\n"
	@$(MAKE) env
	@$(COMPOSE_DEV) up --build

up: env ## Запустить стек в фоне (detached)
	@printf "$(INFO) Запуск dev-окружения в фоне...\n"
	@$(MAKE) env
	@$(COMPOSE_DEV) up -d --build
	@printf "$(OK) Стек поднят. Frontend: http://localhost:5173 | Backend: http://localhost:3001/health\n"

down: ## Остановить и удалить контейнеры (volumes сохраняются)
	@printf "$(INFO) Остановка контейнеров...\n"
	@$(COMPOSE_DEV) down
	@printf "$(OK) Готово\n"

logs: ## Смотреть логи всех сервисов
	@$(COMPOSE_DEV) logs -f --tail 100

ps: ## Статус сервисов
	@$(COMPOSE_DEV) ps

shell-backend: ## bash в контейнере backend
	@$(COMPOSE_DEV) exec backend sh

shell-frontend: ## bash в контейнере frontend
	@$(COMPOSE_DEV) exec frontend sh

# ------------------------------------------------------------
#  Очистка
# ------------------------------------------------------------

reset: ## Полный сброс: down + удалить volumes и локальные образы
	@printf "$(WARN) Полный сброс (удалятся volumes и образы)...\n"
	@$(COMPOSE_DEV) down -v --rmi all
	@printf "$(OK) Готово\n"

clean: ## Удалить артефакты сборки на хосте
	@printf "$(INFO) Очистка артефактов...\n"
	@rm -rf dist backend/dist
	@printf "$(OK) Готово\n"

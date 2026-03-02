# 🪂 Деплой YaizY Python IDE на Fly.io

## ⚠️ ВАЖНО: Ограничение Fly.io

Fly.io **не поддерживает Docker-in-Docker** по умолчанию, что нужно для нашего проекта (создание Python sandbox контейнеров).

### ✅ Решение: Используем упрощенную версию

Мы можем задеплоить **только Frontend** на Fly.io для демонстрации, а Backend запустить локально или на VPS.

Или я могу переработать архитектуру для работы без Docker-in-Docker.

---

## 🚀 Быстрый деплой Frontend на Fly.io

### Шаг 1: Установка Fly CLI

**Mac:**
```bash
brew install flyctl
```

**Linux:**
```bash
curl -L https://fly.io/install.sh | sh
```

**Windows:**
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

### Шаг 2: Авторизация

```bash
flyctl auth login
```

Откроется браузер, войдите через GitHub.

### Шаг 3: Подготовка проекта

```bash
cd "/Users/personal/Desktop/Coursor apps/Python IDE"

# Соберите frontend
npm install
npm run build
```

### Шаг 4: Создайте fly.toml

Я создам этот файл ниже.

### Шаг 5: Деплой!

```bash
# Инициализация
flyctl launch --name yaizy-python-ide

# Выберите:
# Region: Amsterdam (ams) или Frankfurt (fra)
# PostgreSQL: No
# Redis: No

# Деплой
flyctl deploy

# Открыть
flyctl open
```

---

## 📝 Конфигурация fly.toml (Frontend only)

Создайте файл `fly.toml` в корне проекта (я создам его в следующем файле).

---

## 🎯 Рекомендация: Гибридный подход

### Вариант 1: Frontend на Fly.io + Backend локально

1. Frontend задеплоен на Fly.io → `https://yaizy-python-ide.fly.dev`
2. Backend работает локально → `http://localhost:3001`
3. Для работы нужно запускать backend локально

**Минусы**: Backend недоступен из интернета

### Вариант 2: Всё на Vultr VPS ($5-12/мес)

1. Полная поддержка Docker
2. Всё работает из коробки
3. Есть готовые скрипты деплоя

**Лучший вариант для production!**

### Вариант 3: Переработать архитектуру

Убрать Docker-in-Docker и использовать:
- Pyodide (Python в браузере)
- Или облегченный Python sandbox без Docker

---

## ❓ Что выбрать?

### Для демо/презентации:
→ Frontend на Fly.io (бесплатно)

### Для реального использования:
→ **Vultr/Hetzner VPS** (от $5/мес)

---

## 💡 Мое предложение:

Я могу помочь с:

1. **Деплой только Frontend на Fly.io** (быстро, но без backend функционала)
2. **Полный деплой на Vultr VPS** (10 минут, всё работает, есть готовый скрипт)
3. **Переработать проект** под Pyodide (долго, но будет работать везде)

**Какой вариант выбираете?** 

Для **полноценного рабочего IDE** рекомендую **Vultr** - быстрее всего настроить и дешевле ($5-6/мес).

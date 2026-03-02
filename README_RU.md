# YaizY Python Editor

**Современная браузерная Python IDE с настоящим терминалом**

---

## ✨ Возможности

- 🐍 **Полный Python 3.11** - Настоящий CPython без ограничений
- 💻 **Настоящий терминал** - PTY-терминал с поддержкой `input()`
- 🐢 **Turtle графика** - Встроенный canvas для рисования
- 📁 **Мультифайловые проекты** - Создание и управление несколькими файлами
- 🎨 **Современный UI** - Чистый интерфейс с подсветкой синтаксиса
- 🔒 **Безопасное выполнение** - Изолированные Docker контейнеры

---

## 🏗️ Архитектура

### **Frontend** (React + Vite + TypeScript)

- **Monaco Editor** - Редактор кода на основе VSCode
- **xterm.js** - Эмулятор терминала для вывода
- **Canvas Renderer** - Собственный рендерер для turtle графики

### **Backend** (Node.js + Express + Docker)

- **Управление сессиями** - Изолированное окружение для каждого пользователя
- **PTY Manager** - Настоящий псевдотерминал для выполнения Python
- **Docker контейнеры** - Песочница с CPython 3.11
- **WebSockets** - Двусторонняя связь в реальном времени

### **Python Sandbox** (Docker)

- **База**: `python:3.11-slim`
- **Библиотеки**: numpy, matplotlib, pillow
- **Безопасность**: Лимиты ресурсов, изоляция сети, непривилегированный пользователь
- **Особенности**: Собственный wrapper для turtle с рендерингом в браузере

---

## 🚀 Быстрый старт

### Требования

- Node.js 20+
- Docker Desktop
- npm или yarn

### 1. Установка зависимостей

```bash
# Frontend
npm install

# Backend
cd backend
npm install
cd ..
```

### 2. Сборка Docker образа

```bash
cd docker/python-sandbox
docker build -t python-sandbox:latest .
cd ../..
```

### 3. Запуск серверов разработки

```bash
# Терминал 1: Backend
cd backend
npm run dev

# Терминал 2: Frontend
npm run dev
```

### 4. Откройте в браузере

Перейдите на: **http://localhost:5173**

---

## 📖 Как это работает

### **Поток выполнения Python:**

1. **Пользователь пишет код** в Monaco Editor
2. **Frontend отправляет код** на backend через WebSocket
3. **Backend создает Docker контейнер** с Python 3.11
4. **PTY выполняет код** в изолированной среде
5. **Вывод передается обратно** через WebSocket в терминал xterm.js
6. **Команды turtle** рендерятся на HTML5 canvas

### **Поддержка input():**

- Настоящий PTY с правильной конфигурацией TTY
- `input()` работает точно как в консоли CPython
- Никаких браузерных промптов или обходных путей
- Полная поддержка текстовых игр и интерактивных программ

### **Turtle графика:**

- Собственный Python wrapper перехватывает команды turtle
- Команды сериализуются в JSON и отправляются на frontend
- JavaScript рендерер рисует на HTML5 canvas в реальном времени
- Плавная анимация с настраиваемой скоростью

---

## 🔧 Конфигурация

### Переменные окружения

**Frontend** (`.env`):

```env
VITE_BACKEND_URL=http://localhost:3001
```

**Backend** (`backend/.env`):

```env
PORT=3001
SESSION_TIMEOUT_MINUTES=30
DOCKER_IMAGE=python-sandbox:latest
DOCKER_MEMORY_LIMIT=256m
DOCKER_CPU_LIMIT=1
RATE_LIMIT_MAX_REQUESTS=1000
```

---

## 📁 Структура проекта

```
.
├── src/                      # Исходный код frontend
│   ├── components/           # React компоненты
│   │   ├── IDE/             # Компоненты layout IDE
│   │   ├── Terminal/        # Компонент терминала
│   │   └── Canvas/          # Canvas для turtle
│   ├── lib/                 # Утилиты
│   │   ├── backend/         # Клиент backend API
│   │   └── turtle/          # Рендерер turtle
│   └── store/               # Управление состоянием
│
├── backend/                  # Исходный код backend
│   └── src/
│       ├── services/        # Основные сервисы
│       │   ├── DockerManager.ts    # Операции с Docker
│       │   ├── PTYManager.ts       # Управление PTY
│       │   └── SessionManager.ts   # Жизненный цикл сессий
│       ├── websocket/       # Обработчики WebSocket
│       ├── routes/          # REST API роуты
│       └── middleware/      # Express middleware
│
├── docker/                   # Конфигурация Docker
│   └── python-sandbox/
│       ├── Dockerfile       # Образ Python sandbox
│       ├── turtle_wrapper.py  # Собственный модуль turtle
│       └── flush_input.py   # Wrapper для flush input()
│
├── public/                   # Статические ресурсы
└── *.md                     # Документация
```

---

## 🧪 Тестирование

```bash
# Запуск тестов
npm run test

# E2E тесты с Playwright
npm run test:e2e
```

---

## 🔒 Безопасность

- **Изоляция Docker** - Каждая сессия в отдельном контейнере
- **Лимиты ресурсов** - Ограничения CPU, памяти, количества процессов
- **Отключенная сеть** - Нет исходящих соединений из песочницы
- **Непривилегированный пользователь** - Python запускается от пользователя `student`
- **Rate limiting** - Лимиты на API и создание сессий
- **Защита от зависаний** - Автоматическая очистка сессий

---

## 📚 Документация

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Детальный обзор архитектуры
- **[BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md)** - Подробно о backend
- **[BACKEND_SETUP.md](./BACKEND_SETUP.md)** - Инструкции по установке
- **[TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)** - Руководство по тестированию
- **[CHANGELOG.md](./CHANGELOG.md)** - История версий

---

## 🛠️ Технологический стек

**Frontend:**

- React 18
- TypeScript
- Vite
- Monaco Editor
- xterm.js
- Zustand

**Backend:**

- Node.js
- Express
- WebSocket (ws)
- Dockerode
- TypeScript

**Инфраструктура:**

- Docker
- Python 3.11

---

## 📝 Лицензия

Private - YaizY © 2026

---

## 🤝 Поддержка

По вопросам и поддержке обращайтесь в команду YaizY.

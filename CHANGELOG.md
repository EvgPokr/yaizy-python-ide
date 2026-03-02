# Changelog

Все значимые изменения в проекте документируются в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/),
и проект следует [Semantic Versioning](https://semver.org/lang/ru/).

## [0.1.0] - 2026-03-01 (MVP)

### Добавлено
- Браузерная Python IDE с Pyodide
- Monaco Editor интеграция для редактирования кода
- Автоматический захват stdout/stderr при выполнении
- Дружелюбные объяснения ошибок для 9 типов:
  - SyntaxError (отступы, скобки, двоеточия)
  - NameError
  - TypeError
  - IndexError
  - ValueError
  - AttributeError
  - KeyError
  - ZeroDivisionError
  - ImportError
- Подсветка ошибочной строки в редакторе
- Система заданий с 4 типами требований:
  - outputContains (проверка вывода)
  - functionExists (наличие функции)
  - variableExists (наличие переменной)
  - maxLines (ограничение строк кода)
- Панель инструкций с прогрессивным раскрытием подсказок
- Файловая система (создание, удаление, переименование файлов)
- Автосохранение проектов в IndexedDB (fallback localStorage)
- Экспорт/импорт проектов в JSON
- Ресайзабельные панели (файлы, редактор, консоль, задания)
- Splash screen при загрузке Pyodide
- Timeout выполнения (10 сек)
- Кнопка остановки выполнения
- Keyboard shortcuts (Ctrl+Enter для запуска, Esc для остановки)
- Адаптивный дизайн (десктоп + планшет)
- Unit тесты для parsePythonError и checkTask
- E2E тесты (Playwright) для основных сценариев
- Примеры интеграции с React Router, Next.js App/Pages Router
- Документация (README, INTEGRATION, ARCHITECTURE)

### Технический стек
- React 18.2
- TypeScript 5.3
- Vite 5.0
- Pyodide 0.25.0
- Monaco Editor 0.45.0
- Zustand 4.5
- idb 8.0
- Vitest 1.2
- Playwright 1.41

### Известные ограничения MVP
- Выполнение Python блокирует UI (нет Web Worker в MVP)
- Только встроенные модули Python (нет numpy, pandas, etc.)
- Нет визуализации (matplotlib, turtle)
- Базовая проверка заданий (regex, не AST parsing)
- Один проект в хранилище (нет списка проектов)
- Нет темной темы
- Нет авторизации/облачного хранилища

### Безопасность
- Песочница WebAssembly (Pyodide)
- Без сетевого доступа из Python кода
- Без доступа к ОС
- Timeout выполнения
- Экранирование всех пользовательских вводов

## [Будущие версии]

### Планируется для v0.2.0
- [ ] Web Worker для выполнения Python (не блокировать UI)
- [ ] Поддержка matplotlib/seaborn графиков
- [ ] Turtle graphics модуль
- [ ] Темная тема
- [ ] Расширенная проверка заданий (AST parsing)
- [ ] Множество проектов в хранилище

### Планируется для v0.3.0
- [ ] Авторизация пользователей
- [ ] Облачное хранилище проектов
- [ ] API для управления заданиями
- [ ] Аналитика прогресса учеников
- [ ] Отладчик с брейкпоинтами

### Планируется для v1.0.0
- [ ] Мультиплеерное программирование (WebRTC)
- [ ] Code review mode
- [ ] AI-помощник для подсказок
- [ ] Интеграция с LMS (Moodle, Canvas)
- [ ] Мобильная версия (iOS/Android)

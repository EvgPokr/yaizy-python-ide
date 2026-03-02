# Архитектура Python IDE

## Обзор

Python IDE построена как самостоятельная страница React-приложения с использованием современных практик и инструментов.

## Технический стек

### Фронтенд
- **React 18** - UI библиотека с hooks и functional components
- **TypeScript** - строгая типизация
- **Vite** - сборщик (быстрый dev server, HMR)
- **Zustand** - state management (легковесная альтернатива Redux)

### Редактор и выполнение
- **Monaco Editor** - полнофункциональный редактор кода (от VS Code)
- **Pyodide** - Python 3.11 скомпилированный в WebAssembly
- **react-resizable-panels** - ресайз панелей

### Хранилище
- **IndexedDB** (через `idb`) - основное хранилище проектов
- **localStorage** - fallback для браузеров без IndexedDB

### Тестирование
- **Vitest** - unit тесты (fast, Vite-native)
- **Playwright** - e2e тесты

## Архитектурные решения

### 1. State Management (Zustand)

Выбор Zustand вместо Redux/Context API:
- ✅ Минималистичный API (меньше boilerplate)
- ✅ Отличная TypeScript поддержка
- ✅ Не требует Provider обертки
- ✅ Хорошая производительность

Store (`ideStore.ts`) содержит:
- Состояние проекта (файлы, активный файл)
- Execution state (isRunning, logs, errors)
- Task state (задание, результаты проверки)
- UI state (размеры панелей)

### 2. Pyodide Integration

**Почему Pyodide:**
- Полноценный Python в браузере (без сервера)
- Безопасность (песочница WebAssembly)
- Offline работа после первой загрузки

**Архитектура выполнения:**

```
User clicks "Run"
    ↓
useIDEStore.runCode()
    ↓
runPython(code, pyodide) in lib/pyodide/
    ↓
Pyodide.runPythonAsync()
    ↓
Capture stdout/stderr
    ↓
Return RunResult
    ↓
Store logs + parse errors
```

**Оптимизации:**
- Pyodide загружается с CDN (кэшируется браузером)
- Lazy initialization при первом открытии страницы
- Splash screen пока грузится

### 3. Error Parsing

**Проблема:** Python ошибки трудны для начинающих.

**Решение:** Парсинг и упрощение ошибок.

**Архитектура:**

```
Python Error String
    ↓
parsePythonError()
    ↓
- Extract type (SyntaxError, NameError, etc.)
- Extract line/column
- Extract snippet
- Match template from errorMessages.ts
    ↓
SimplifiedError
    ↓
ErrorPanel component
```

**Поддерживаемые типы:**
- SyntaxError (отступы, скобки, двоеточия)
- NameError (undefined variables)
- TypeError (type mismatches)
- IndexError (list bounds)
- ValueError, AttributeError, KeyError, etc.

### 4. Task System

**Требования:**
- Учитель должен легко создавать задания
- Автоматическая проверка без серверного кода
- Понятная обратная связь для учеников

**Архитектура:**

```
Task (JSON)
    ↓
InstructionPanel (display)
    ↓
User runs code
    ↓
checkTask(task, code, output)
    ↓
Check each requirement:
  - outputContains (regex)
  - functionExists (regex/AST)
  - variableExists (regex)
  - maxLines (count)
    ↓
TaskCheckResult
    ↓
Update UI with pass/fail
```

**Расширяемость:**
В будущем можно добавить:
- `callFunction` - вызов функции с параметрами
- `assertOutput` - точное совпадение вывода
- `useModule` - проверка импортов
- `complexity` - проверка сложности кода

### 5. Storage Strategy

**Требования:**
- Автосохранение (не терять работу)
- Работа offline
- Экспорт/импорт проектов

**Решение:**

```
Project changes
    ↓
Debounced save (2 sec)
    ↓
Try IndexedDB (primary)
    ↓ (if fails)
Try localStorage (fallback)
```

**IndexedDB vs localStorage:**
- IndexedDB: больше места (50+ MB), async, структурированные данные
- localStorage: меньше места (~5 MB), sync, только строки

**Формат экспорта:** JSON
```json
{
  "id": "...",
  "name": "My Project",
  "files": [...],
  "activeFileId": "...",
  "task": {...},
  "createdAt": "...",
  "updatedAt": "..."
}
```

### 6. Component Architecture

**Иерархия:**

```
PythonIDEPage (page)
    ↓
Layout (grid/panels)
    ├─ Header (controls)
    ├─ FilePanel (file tree)
    ├─ Editor (Monaco)
    │   └─ Tabs
    ├─ Console/ErrorPanel (tabs)
    │   ├─ Console (logs)
    │   └─ ErrorPanel (friendly errors)
    └─ InstructionPanel (tasks)
```

**Дизайн принципы:**
- Каждый компонент имеет единую ответственность
- Props-driven (не глобальное состояние в компонентах)
- Controlled components (state в store)

### 7. Styling Approach

**CSS Modules vs Global CSS:**
Выбрана глобальная таблица стилей (`ide.css`) потому что:
- IDE - это изолированная страница
- Не будет конфликтов с другими страницами сайта
- Проще кастомизировать через CSS переменные

**CSS Variables:**
```css
:root {
  --color-primary: #3b82f6;
  --spacing-md: 16px;
  ...
}
```

Легко изменить тему, переопределив переменные.

## Data Flow

### 1. Initialization Flow

```
App mount
    ↓
usePyodide() hook
    ↓ (parallel)
Load Pyodide from CDN
    +
Load project from storage
    ↓
Set in store
    ↓
Render Layout
```

### 2. Code Execution Flow

```
User types in Editor
    ↓
onChange → updateFileContent()
    ↓
Store update
    ↓
Debounced save to storage
```

```
User clicks Run
    ↓
runCode() in store
    ↓
Clear console
    ↓
runPython() with active file
    ↓
Pyodide.runPythonAsync()
    ↓
Capture stdout/stderr
    ↓
Parse errors (if any)
    ↓
Update store (logs, errors)
    ↓
Check task (if present)
    ↓
UI re-renders
```

### 3. File Management Flow

```
User creates file
    ↓
createFile() in store
    ↓
New ProjectFile object
    ↓
Add to project.files
    ↓
Set as active file
    ↓
Save to storage
    ↓
UI updates (FilePanel, Editor)
```

## Performance Considerations

### Bundle Size
- **Main bundle:** ~200 KB (React + Zustand + app code)
- **Monaco Editor:** ~2-3 MB (code-split, lazy loaded)
- **Pyodide:** ~6 MB (CDN, not in bundle)

### Optimizations
1. **Code splitting:** Monaco загружается динамически
2. **CDN offloading:** Pyodide с JSDelivr
3. **Debouncing:** Автосохранение через 2 сек
4. **Virtual scrolling:** Консоль (для больших выводов)

### Memory
- Pyodide: ~50-100 MB в RAM
- Monaco: ~20-30 MB
- Store: < 1 MB

## Security

### Sandboxing
- Pyodide работает в WebAssembly sandbox
- Нет доступа к file system хоста
- Нет network access из Python кода
- Ограничение выполнения (timeout 10 сек)

### XSS Protection
- Все пользовательские вводы экранируются
- React автоматически экранирует JSX
- Monaco Editor безопасен по умолчанию

### CORS
Для Pyodide нужны headers:
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

## Testing Strategy

### Unit Tests (Vitest)
Тестируем чистую логику:
- `parsePythonError.test.ts` - парсинг всех типов ошибок
- `checkTask.test.ts` - проверка всех типов требований

### E2E Tests (Playwright)
Тестируем пользовательские сценарии:
- Загрузка страницы
- Написание и запуск кода
- Просмотр ошибок
- Создание файлов
- Экспорт проекта

### Coverage Goals
- Unit tests: >80% для lib/
- E2E: основные happy paths

## Scalability & Future

### Возможные улучшения:

1. **Web Worker для Python**
   - Не блокировать main thread
   - Истинная остановка выполнения

2. **Расширенная проверка заданий**
   - AST parsing вместо regex
   - Unit тесты на Python стороне
   - Проверка производительности (time/memory)

3. **Визуализация**
   - matplotlib/seaborn graphs
   - turtle graphics
   - pandas DataFrames

4. **Collaboration**
   - WebRTC для парного программирования
   - Комментарии в коде
   - Code review mode

5. **Backend интеграция**
   - Облачное хранение проектов
   - Управление заданиями через CMS
   - Аналитика прогресса учеников

## Deployment

### Production Checklist
- ✅ Минификация и tree-shaking (Vite)
- ✅ Gzip/Brotli compression
- ✅ CDN для статики
- ✅ CORS headers для Pyodide
- ✅ Service Worker (опционально, для offline)

### Hosting Recommendations
- **Vercel** - отличная интеграция с Next.js
- **Netlify** - простой деплой, хорошие headers
- **Cloudflare Pages** - быстрый CDN
- **AWS S3 + CloudFront** - масштабируемость

## Monitoring

Рекомендуется отслеживать:
- Время загрузки Pyodide
- Ошибки выполнения Python
- Использование storage
- Производительность Monaco Editor

Инструменты:
- Sentry (error tracking)
- Google Analytics / Plausible (usage)
- Web Vitals (performance)

## Заключение

Архитектура спроектирована с фокусом на:
- **Простоту** - легко понять и расширить
- **Производительность** - быстрая загрузка и выполнение
- **Безопасность** - изоляция пользовательского кода
- **UX** - понятные ошибки, автосохранение, отзывчивый UI

Все решения документированы и обоснованы. Код следует best practices React и TypeScript.

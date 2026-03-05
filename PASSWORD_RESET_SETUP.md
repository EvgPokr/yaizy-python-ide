# Password Reset Setup Guide

Функционал восстановления пароля успешно добавлен. Для его работы на продакшн-сервере нужно настроить SMTP для отправки email.

## Что реализовано

### Backend
- ✅ Таблица `password_reset_tokens` в БД
- ✅ EmailService для отправки писем
- ✅ Эндпоинты `/api/auth/forgot-password` и `/api/auth/reset-password`
- ✅ Методы AuthService для работы с токенами

### Frontend
- ✅ Ссылка "Forgot password?" при ошибке логина
- ✅ ForgotPasswordDialog для ввода email
- ✅ ResetPasswordPage для ввода нового пароля
- ✅ Корпоративный дизайн (оранжево-синий градиент)

## Настройка SMTP на сервере

### Шаг 1: Получите SMTP credentials

#### Вариант A: Gmail (рекомендуется)
1. Войдите в Google Account: https://myaccount.google.com/
2. Security → 2-Step Verification (включите)
3. App passwords → Generate new
4. Выберите "Mail" и "Other" (название: YaizY Python IDE)
5. Скопируйте сгенерированный пароль (16 символов)

#### Вариант B: Другие провайдеры
- **SendGrid**: smtp.sendgrid.net:587
- **Mailgun**: smtp.mailgun.org:587
- **Amazon SES**: email-smtp.us-east-1.amazonaws.com:587

### Шаг 2: Настройте .env на сервере

```bash
ssh root@108.61.203.222
cd /opt/python-ide/backend

# Создайте или обновите .env файл
nano .env
```

Добавьте следующие переменные:

```env
# JWT Secret
JWT_SECRET=your-existing-secret

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM="YaizY Python IDE" <noreply@yaizy.io>

# Frontend URL
FRONTEND_URL=https://ide.yaizy.io
```

**Важно:** Замените:
- `your-email@gmail.com` → ваш Gmail
- `your-16-char-app-password` → App Password из шага 1
- `noreply@yaizy.io` → можно оставить или заменить на ваш email

### Шаг 3: Обновите код на сервере

```bash
# На сервере
cd /opt/python-ide
git pull
cd backend
npm install  # установит nodemailer
sudo systemctl restart python-ide-backend
```

### Шаг 4: Проверьте логи

```bash
journalctl -u python-ide-backend -f
```

При запуске должны увидеть:
```
✅ Database initialized
Server running on port 3001
```

## Тестирование

### 1. Проверьте, что таблица создана
```bash
sqlite3 /opt/python-ide/backend/data/python-ide.db
sqlite> .schema password_reset_tokens
```

Должно показать:
```sql
CREATE TABLE password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at INTEGER NOT NULL,
  used INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 2. Тест forgot-password endpoint
```bash
curl -X POST https://ide.yaizy.io/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### 3. Проверьте email
- Откройте ide.yaizy.io
- Попробуйте войти с неправильным паролем
- Нажмите "Forgot password?"
- Введите email (зарегистрированный в системе)
- Проверьте почту

Email должен содержать:
- Оранжево-синий градиент header
- Кнопку "Reset Password"
- Ссылку вида `https://ide.yaizy.io/reset-password/[токен]`

### 4. Протестируйте сброс пароля
- Перейдите по ссылке из email
- Введите новый пароль (дважды)
- Нажмите "Reset Password"
- Проверьте, что можете войти с новым паролем

## Возможные проблемы

### "Error: Invalid login: 535-5.7.8 Username and Password not accepted"
- Проверьте, что включили 2FA в Google Account
- Используйте App Password, а не обычный пароль
- SMTP_USER должен быть полный email (user@gmail.com)

### "Failed to send reset email"
- Проверьте логи: `journalctl -u python-ide-backend -n 50`
- Проверьте .env файл: `cat /opt/python-ide/backend/.env | grep SMTP`
- Убедитесь, что порт 587 открыт: `telnet smtp.gmail.com 587`

### "No account found with this email"
- Email должен быть зарегистрирован в системе
- Проверьте БД: `sqlite3 /opt/python-ide/backend/data/python-ide.db "SELECT email FROM users;"`
- При регистрации email является обязательным полем

### Token expired
- Токены действительны 1 час
- Проверьте время на сервере: `date`
- При необходимости измените время истечения в `AuthService.ts` (константа `expiresAt`)

## Безопасность

✅ Токены одноразовые (поле `used` в БД)  
✅ Токены истекают через 1 час  
✅ Минимальная длина пароля 6 символов  
✅ Email отправляется только зарегистрированным пользователям  
✅ SMTP credentials в .env (не в коде)  

## Дополнительные настройки

### Изменить время истечения токена
В `backend/src/services/AuthService.ts`:
```typescript
const expiresAt = now + (60 * 60 * 1000); // 1 hour
// Измените на 2 часа:
const expiresAt = now + (2 * 60 * 60 * 1000);
```

### Изменить дизайн email
В `backend/src/services/EmailService.ts` → метод `sendPasswordResetEmail()`

### Добавить rate limiting
Рекомендуется ограничить количество запросов forgot-password (например, 3 в час на email).

## Поддержка

Если возникли проблемы:
1. Проверьте логи backend
2. Проверьте .env конфигурацию
3. Убедитесь, что nodemailer установлен
4. Проверьте, что пользователь зарегистрирован с email

---
**Статус:** ✅ Готово к использованию  
**Версия:** 1.0  
**Дата:** 2026-03-05

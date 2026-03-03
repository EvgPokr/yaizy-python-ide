# 🔐 Настройка Google reCAPTCHA

## 1️⃣ Получение ключей reCAPTCHA

1. Перейдите на https://www.google.com/recaptcha/admin
2. Войдите в Google аккаунт
3. Нажмите **+** для создания нового сайта
4. Заполните форму:
   - **Label**: YaizY Python Editor
   - **reCAPTCHA type**: reCAPTCHA v2 → "I'm not a robot" Checkbox
   - **Domains**: 
     - `yourdomain.com` (ваш домен)
     - `108.61.203.222` (IP сервера для тестирования)
     - `localhost` (для локальной разработки)
   - Согласитесь с условиями
5. Нажмите **Submit**
6. Скопируйте **Site Key** и **Secret Key**

---

## 2️⃣ Настройка на сервере

### Backend (Secret Key):

На сервере создайте файл `.env`:

```bash
cd /opt/python-ide/backend
cat > .env << 'EOF'
# Google reCAPTCHA
RECAPTCHA_SECRET_KEY=ваш_secret_key_сюда

# JWT Secret (для безопасности токенов)
JWT_SECRET=замените_на_случайную_строку_минимум_32_символа

# Environment
NODE_ENV=production
PORT=3001
EOF

# Перезапустите backend
systemctl restart python-ide
```

### Frontend (Site Key):

Пересоберите frontend с переменной окружения:

```bash
cd /opt/python-ide

# Создайте .env для сборки
cat > .env << 'EOF'
VITE_RECAPTCHA_SITE_KEY=ваш_site_key_сюда
EOF

# Пересоберите
npm run build

# Перезапустите nginx
systemctl restart nginx
```

---

## 3️⃣ Тестовые ключи (для разработки)

Google предоставляет тестовые ключи, которые всегда проходят валидацию:

- **Site Key**: `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`
- **Secret Key**: `6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe`

⚠️ **Используйте только для тестирования! В production нужны настоящие ключи.**

---

## ✅ Проверка

После настройки:
1. Откройте сайт
2. Нажмите **Login → Register**
3. Должна появиться капча "I'm not a robot"
4. Заполните форму и зарегистрируйтесь

Без валидной капчи регистрация не пройдет! 🔒

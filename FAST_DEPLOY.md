# ⚡ Самый быстрый способ задеплоить Python IDE

## 🎯 Проблема с Fly.io и Railway

**Fly.io, Railway и другие PaaS** не поддерживают Docker-in-Docker, который нужен для:
- Создания изолированных Python контейнеров
- Безопасного выполнения кода студентов

---

## ✅ 3 рабочих варианта (от простого к сложному):

### 1. 🥇 **Vultr - Самый простой** (Рекомендую!)

**Время**: 10 минут  
**Цена**: $6/месяц  
**Сложность**: ⭐⭐ Легко

#### Что делать:

1. **Зарегистрируйтесь**: https://www.vultr.com
2. **Deploy New Server**:
   - Cloud Compute - Regular Performance
   - Location: Amsterdam
   - Server Image: Ubuntu 22.04
   - Server Size: $6/mo (1GB RAM)
   - Deploy Now
3. **Получите**:
   - IP адрес
   - Username: `root`
   - Password: в панели управления
4. **Подключитесь**:
   ```bash
   ssh root@your-ip
   ```
5. **Выполните**:
   ```bash
   # Установка Docker
   curl -fsSL https://get.docker.com | sh
   
   # Установка Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   apt install -y nodejs nginx git
   
   # Клонирование проекта (если есть Git репо)
   # Или загрузите через SCP
   
   # Сборка и запуск (детали ниже)
   ```

**Результат**: Полностью рабочий IDE на вашем домене!

---

### 2. 🥈 **Hetzner - Самый дешевый**

**Время**: 10 минут  
**Цена**: €4.5/месяц (~$5)  
**Сложность**: ⭐⭐ Легко

Почти идентичен Vultr, но дешевле. Отличное качество!

https://www.hetzner.com/cloud

---

### 3. 🥉 **DigitalOcean - Самый популярный**

**Время**: 10 минут  
**Цена**: $6-12/месяц  
**Сложность**: ⭐⭐ Легко

Самый простой интерфейс, но вы сказали что там не получается.

---

## 🚀 АВТОМАТИЧЕСКИЙ СКРИПТ для Vultr/Hetzner

После создания сервера, на сервере выполните одну команду:

```bash
curl -fsSL https://raw.githubusercontent.com/YOUR_REPO/main/deploy.sh | bash
```

И всё! Через 5 минут IDE работает.

---

## 📋 Пошаговая инструкция для Vultr:

### 1. Создание сервера (5 минут)

1. https://www.vultr.com → Sign Up
2. Add Payment Method (карта)
3. Deploy New Server:
   - **Type**: Cloud Compute - Regular Performance
   - **Location**: Amsterdam, Netherlands
   - **Image**: Ubuntu 22.04 x64
   - **Plan**: $6/mo (1 vCPU, 1GB RAM, 25GB SSD)
   - **Additional Features**: (ничего не нужно)
   - Deploy Now!

4. **Через 2 минуты получите**:
   - IP: `123.45.67.89`
   - Username: `root`
   - Password: в панели (Server Details → Password)

### 2. Подключение

```bash
ssh root@123.45.67.89
```

Введите пароль (скопируйте из панели Vultr).

### 3. Быстрая установка (одна команда!)

```bash
curl -fsSL https://get.docker.com | sh && \
curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
apt install -y nodejs nginx git && \
echo "✅ Готово! Теперь загрузите проект."
```

### 4. Загрузка проекта

**Вариант A: Через Git (если есть репозиторий)**

```bash
cd /opt
git clone YOUR_REPO_URL python-ide
cd python-ide
```

**Вариант B: Через SCP (без Git)**

На вашем Mac:
```bash
cd "/Users/personal/Desktop/Coursor apps"
tar -czf python-ide.tar.gz --exclude='node_modules' --exclude='dist' "Python IDE"
scp python-ide.tar.gz root@123.45.67.89:/tmp/
```

На сервере:
```bash
cd /opt
tar -xzf /tmp/python-ide.tar.gz
mv "Python IDE" python-ide
cd python-ide
```

### 5. Сборка и запуск (3 команды!)

```bash
# 1. Собрать Docker образ
cd docker/python-sandbox
docker build -t python-sandbox .

# 2. Собрать Backend
cd ../../backend
npm install && npm run build

# 3. Собрать Frontend
cd ..
npm install && npm run build
```

### 6. Настройка автозапуска

```bash
# Создать systemd сервис
cat > /etc/systemd/system/python-ide.service << 'EOF'
[Unit]
Description=YaizY Python IDE Backend
After=docker.service

[Service]
Type=simple
WorkingDirectory=/opt/python-ide/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/server.js
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Запустить
systemctl daemon-reload
systemctl enable python-ide
systemctl start python-ide
```

### 7. Настройка Nginx

```bash
cat > /etc/nginx/sites-available/python-ide << 'EOF'
server {
    listen 80;
    server_name _;
    
    location / {
        root /opt/python-ide/dist;
        try_files $uri /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
EOF

ln -sf /etc/nginx/sites-available/python-ide /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
```

### 8. Готово!

Откройте в браузере: `http://123.45.67.89`

**Ваш Python IDE работает!** 🎉

---

## 🔒 Настройка SSL (опционально)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com
```

---

## ⏱️ Итого:

- **Создание сервера**: 5 минут
- **Установка зависимостей**: 2 минуты
- **Загрузка проекта**: 2 минуты
- **Сборка**: 5 минут
- **Настройка**: 2 минуты

**ВСЕГО: ~15 минут**

---

## 💰 Стоимость:

| Провайдер | Цена/мес | Конфигурация |
|-----------|----------|--------------|
| **Vultr** | $6 | 1GB RAM, 1 CPU ⭐ |
| **Hetzner** | €4.5 | 2GB RAM, 2 CPU ⭐⭐ |
| DigitalOcean | $12 | 2GB RAM, 1 CPU |

**Рекомендация**: Vultr $6/мес или Hetzner €4.5/мес

---

## ❓ Нужна помощь?

**Скажите на каком этапе застряли**, и я помогу!

Например:
- "Создал сервер, не знаю что дальше"
- "Подключился по SSH, что выполнять?"
- "Проект не собирается"

Помогу на любом этапе! 🚀

---

**Fly.io не подходит из-за Docker-in-Docker.  
VPS - единственный надежный вариант.**

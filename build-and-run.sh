#!/bin/bash
# Автоматическая сборка и запуск YaizY Python IDE

set -e

echo "🚀 YaizY Python IDE - Сборка и запуск"
echo "======================================"

# 1. Сборка Docker образа
echo ""
echo "📦 Сборка Docker образа Python Sandbox..."
cd docker/python-sandbox
docker build -t python-sandbox:latest .
cd ../..
echo "✅ Docker образ собран"

# 2. Установка Backend зависимостей
echo ""
echo "🔧 Установка Backend зависимостей..."
cd backend
npm install
cd ..
echo "✅ Backend готов"

# 3. Сборка Frontend
echo ""
echo "🎨 Сборка Frontend..."
npm install
npm run build
echo "✅ Frontend собран"

# 4. Создание скрипта запуска
echo ""
echo "⚙️ Создание скрипта запуска..."
cat > start-backend.sh << 'SCRIPT_EOF'
#!/bin/bash
cd /opt/python-ide/backend
export NODE_ENV=production
export PORT=3001
exec node_modules/.bin/tsx src/server.ts
SCRIPT_EOF
chmod +x start-backend.sh

# 5. Настройка systemd
echo ""
echo "⚙️ Настройка автозапуска..."
cat > /etc/systemd/system/python-ide.service << EOF
[Unit]
Description=YaizY Python IDE Backend
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=$(pwd)
ExecStart=/bin/bash $(pwd)/start-backend.sh
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable python-ide
systemctl restart python-ide
sleep 3

echo ""
echo "📊 Проверка статуса Backend..."
systemctl status python-ide --no-pager -l || true

echo ""
echo "📝 Последние логи Backend..."
journalctl -u python-ide -n 20 --no-pager || true

echo ""
echo "✅ Backend запущен"

# 5. Настройка Nginx
echo ""
echo "🌐 Настройка Nginx..."
cat > /etc/nginx/sites-available/python-ide << EOF
# WebSocket upgrade map
map \$http_upgrade \$connection_upgrade {
    default upgrade;
    '' close;
}

server {
    listen 80;
    server_name _;
    
    # Frontend
    location / {
        root $(pwd)/dist;
        try_files \$uri \$uri/ /index.html;
    }
    
    # Backend API и WebSocket
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        
        # WebSocket headers
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \$connection_upgrade;
        
        # Standard proxy headers
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # WebSocket timeouts
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
        proxy_connect_timeout 10s;
        
        # Disable buffering for real-time communication
        proxy_buffering off;
    }
    
    location /health {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
    }
    
    client_max_body_size 10M;
}
EOF

ln -sf /etc/nginx/sites-available/python-ide /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
echo "✅ Nginx настроен"

# 6. Настройка Firewall
echo ""
echo "🔒 Настройка Firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
echo "✅ Firewall настроен"

# Готово!
echo ""
echo "════════════════════════════════════════"
echo "✅ Деплой завершен успешно!"
echo "════════════════════════════════════════"
echo ""
echo "🌐 Откройте в браузере:"
echo "   http://$(hostname -I | awk '{print $1}')"
echo ""
echo "📊 Проверить статус:"
echo "   systemctl status python-ide"
echo ""
echo "📝 Логи:"
echo "   journalctl -u python-ide -f"
echo ""
echo "🔄 Перезапустить:"
echo "   systemctl restart python-ide"
echo ""

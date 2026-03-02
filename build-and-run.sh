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

# 2. Сборка Backend
echo ""
echo "🔧 Сборка Backend..."
cd backend
npm install
npm run build
cd ..
echo "✅ Backend собран"

# 3. Сборка Frontend
echo ""
echo "🎨 Сборка Frontend..."
npm install
npm run build
echo "✅ Frontend собран"

# 4. Настройка systemd
echo ""
echo "⚙️ Настройка автозапуска..."
cat > /etc/systemd/system/python-ide.service << EOF
[Unit]
Description=YaizY Python IDE Backend
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
WorkingDirectory=$(pwd)/backend
Environment=NODE_ENV=production
Environment=PORT=3001
ExecStart=$(which node) dist/server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable python-ide
systemctl start python-ide
echo "✅ Backend запущен"

# 5. Настройка Nginx
echo ""
echo "🌐 Настройка Nginx..."
cat > /etc/nginx/sites-available/python-ide << EOF
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
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_cache_bypass \$http_upgrade;
        
        # Увеличиваем таймауты для WebSocket
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
    
    location /health {
        proxy_pass http://localhost:3001;
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

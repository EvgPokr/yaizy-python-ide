#!/bin/bash
# СКОПИРУЙТЕ И ВСТАВЬТЕ ЭТИ КОМАНДЫ НА СЕРВЕРЕ

echo "🚀 YaizY Python IDE - Автоматическая установка"
echo "=============================================="
echo ""

# Установка Docker
echo "📦 Установка Docker..."
curl -fsSL https://get.docker.com | sh

# Установка Node.js 18
echo "📦 Установка Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Установка Nginx и Git
echo "📦 Установка Nginx и Git..."
apt install -y nginx git

echo ""
echo "✅ Все зависимости установлены!"
echo ""
echo "Теперь ЗАГРУЗИТЕ ПРОЕКТ одним из способов:"
echo ""
echo "СПОСОБ 1: Через SCP (с вашего Mac)"
echo "  На Mac выполните:"
echo "  cd '/Users/personal/Desktop/Coursor apps'"
echo "  tar -czf python-ide.tar.gz --exclude='node_modules' --exclude='dist' 'Python IDE'"
echo "  scp python-ide.tar.gz root@$(hostname -I | awk '{print $1}'):/tmp/"
echo ""
echo "  Затем на сервере:"
echo "  cd /opt"
echo "  tar -xzf /tmp/python-ide.tar.gz"
echo "  mv 'Python IDE' python-ide"
echo "  cd python-ide"
echo ""
echo "СПОСОБ 2: Через Git (если есть репозиторий)"
echo "  cd /opt"
echo "  git clone YOUR_REPO_URL python-ide"
echo "  cd python-ide"
echo ""
echo "После загрузки проекта выполните:"
echo "  bash /opt/python-ide/build-and-run.sh"
echo ""

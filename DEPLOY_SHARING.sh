#!/bin/bash

echo "🚀 Deploying Project Sharing Feature"
echo "===================================="
echo ""

# Navigate to project directory
cd /opt/python-ide || exit 1

echo "📥 Step 1: Pull latest code..."
git pull || exit 1
echo "✅ Code updated"
echo ""

echo "📦 Step 2: Install backend dependencies..."
cd backend
npm install
cd ..
echo "✅ Backend dependencies ready"
echo ""

echo "🎨 Step 3: Install frontend dependencies..."
npm install
echo "✅ Frontend dependencies ready"
echo ""

echo "🔨 Step 4: Build frontend..."
npm run build || exit 1
echo "✅ Frontend built"
echo ""

echo "🔄 Step 5: Restart services..."
systemctl restart python-ide-backend
systemctl restart nginx
echo "✅ Services restarted"
echo ""

echo "⏳ Waiting for services to start..."
sleep 3
echo ""

echo "🔍 Step 6: Checking backend status..."
if systemctl is-active --quiet python-ide-backend; then
    echo "✅ Backend is running"
else
    echo "❌ Backend failed to start!"
    echo "Check logs: journalctl -u python-ide-backend -n 50"
    exit 1
fi
echo ""

echo "🔍 Step 7: Checking backend health..."
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Backend health check passed"
else
    echo "⚠️  Backend not responding yet (may still be starting)"
fi
echo ""

echo "🔍 Step 8: Checking Nginx..."
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx failed to start!"
    exit 1
fi
echo ""

echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "🎯 Next Steps:"
echo "1. Open your website in browser"
echo "2. Login as teacher"
echo "3. Open a project - you should see 🔗 Share button"
echo "4. Test sharing workflow (see SHARING_GUIDE.md)"
echo ""
echo "📚 Documentation:"
echo "- SHARING_GUIDE.md - User guide"
echo "- UPDATE_SHARING.md - Technical details"
echo ""
echo "🐛 Troubleshooting:"
echo "- Backend logs: journalctl -u python-ide-backend -f"
echo "- Nginx logs: tail -f /var/log/nginx/error.log"
echo "- Clear browser cache if Share button not visible"
echo ""

# 🔄 Update Instructions - Project Sharing Feature

## Overview

This update adds project sharing and forking functionality:
- Users can make projects public and share links
- Anyone can view and fork (copy) shared projects
- Works with or without login (guest mode)

---

## 🚀 Server Update (SSH to your server)

```bash
# 1. Navigate to project directory
cd /opt/python-ide

# 2. Pull latest changes
git pull

# 3. Install backend dependencies (if any new)
cd backend
npm install

# 4. Return to root
cd ..

# 5. Install frontend dependencies (if any new)
npm install

# 6. Build frontend
npm run build

# 7. Restart services
systemctl restart python-ide-backend
systemctl restart nginx

# 8. Check status
systemctl status python-ide-backend
```

---

## ✅ Verify Update

### 1. Check Backend
```bash
# View backend logs
journalctl -u python-ide-backend -f

# Should see:
# "Adding is_public column to projects table..." (if first time)
# "Adding forked_from column to projects table..." (if first time)
# "✅ Database initialized"
# "Server running on port 3001"
```

### 2. Check Frontend
- Open your website
- Login with any account
- Open a project
- You should see **"🔗 Share"** button in top-right

### 3. Test Sharing
1. **Make Project Public**
   - Click Share button
   - Toggle "Make project public"
   - Copy link

2. **Test Share Link**
   - Open link in incognito/private window
   - You should see "📖 Viewing shared project (read-only)"
   - Click "🔀 Fork to Edit"

3. **Test Fork**
   - With login: Fork saves to account
   - Without login: Fork opens in guest mode

---

## 🔧 Database Migration

The migration happens **automatically** on server restart!

### What Changes:
```sql
-- Adds two new columns to existing projects table:
ALTER TABLE projects ADD COLUMN is_public INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN forked_from TEXT;
```

### Existing Projects:
- All existing projects remain **private** (is_public = 0)
- No data is lost
- You can make them public later via UI

---

## 🐛 Troubleshooting

### Share Button Not Visible
```bash
# Clear browser cache
# Or hard reload: Ctrl+Shift+R (Cmd+Shift+R on Mac)
```

### Share Link Shows 404
```bash
# Check Nginx config includes new route
cat /etc/nginx/sites-available/python-ide

# Should have:
location / {
  try_files $uri $uri/ /index.html;
}

# If not, add it and reload:
nginx -t
systemctl reload nginx
```

### Database Migration Failed
```bash
# Check backend logs
journalctl -u python-ide-backend -n 50

# Manually check database
cd /opt/python-ide/backend
sqlite3 data/python-ide.db

# In SQLite:
.schema projects

# Should show is_public and forked_from columns
# If not, restart backend:
systemctl restart python-ide-backend
```

### Fork Creates Empty Project
- Check browser console for errors
- Verify backend is running: `systemctl status python-ide-backend`
- Check API logs: `journalctl -u python-ide-backend -f`

---

## 📁 New Files

### Backend
- `backend/src/routes/projects.ts` - Updated with fork endpoints
- `backend/src/services/ProjectService.ts` - Added fork logic
- `backend/src/db/database.ts` - Migration code

### Frontend
- `src/pages/SharedProjectPage.tsx` - Shared project view
- `src/pages/SharedProjectPage.css` - Styles
- `src/components/Share/ShareButton.tsx` - Share button
- `src/components/Share/ShareButton.css` - Styles
- `src/App.tsx` - Added /share/:projectId route

### Documentation
- `SHARING_GUIDE.md` - User guide
- `UPDATE_SHARING.md` - This file

---

## 🔐 Security Notes

- Public projects are **read-only** for viewers
- Only project owner can make project public/private
- Forking creates independent copies
- No data leaks - only public projects accessible via /share

---

## 📊 New API Endpoints

```
GET  /api/projects/public/:id    - View public project (no auth)
POST /api/projects/fork/:id      - Fork project (auth required)
PUT  /api/projects/:id            - Updated to include isPublic
```

---

## ⚙️ Configuration

No new environment variables required!  
All settings use existing configuration.

---

## 🎯 Quick Test Script

```bash
# Run this after update to verify:
cd /opt/python-ide

# 1. Check if backend is running
curl http://localhost:3001/health

# 2. Check if frontend is built
ls -la dist/

# 3. Check database columns
sqlite3 backend/data/python-ide.db "PRAGMA table_info(projects);"

# 4. Check Nginx config
nginx -t

# All should pass! ✅
```

---

## 📞 Support

If issues persist:
1. Check all logs: `journalctl -u python-ide-backend -n 100`
2. Verify file permissions: `ls -la /opt/python-ide`
3. Restart all services: `systemctl restart python-ide-backend nginx`
4. Check browser console for frontend errors (F12)

---

**Estimated Update Time**: 5-10 minutes  
**Downtime**: ~30 seconds (during restart)  
**Breaking Changes**: None  
**Rollback**: `git checkout <previous-commit>` + rebuild

---

Happy sharing! 🎓

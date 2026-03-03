# 🔧 Fix: Share Button Visibility

## Issue
Share button was not visible when opening saved projects.

## Fix Applied
- Moved Share button from fixed position to IDE Header
- Now appears next to Export/Import buttons
- Only shows when:
  - ✅ User is logged in
  - ✅ Editing a saved project (not guest mode)

---

## 🚀 Update on Server

```bash
ssh root@108.61.203.222

cd /opt/python-ide
git pull
npm install
npm run build
systemctl restart python-ide-backend
systemctl restart nginx
```

**Or use the auto-deploy script:**

```bash
cd /opt/python-ide
./DEPLOY_SHARING.sh
```

---

## ✅ How to Test

1. **Login to your account**
   ```
   Open your website → Login
   ```

2. **Go to My Projects**
   ```
   Click profile icon → "My Projects"
   ```

3. **Open any project**
   ```
   Click on a project to open it
   ```

4. **Look for Share button in Header**
   ```
   Top-right area, next to Export/Import buttons
   Should see: 🔗 Share
   ```

5. **Click Share button**
   ```
   - Toggle "Make project public"
   - Copy the share link
   - Should look like: https://your-domain.com/share/xxx-yyy-zzz
   ```

6. **Test the share link**
   ```
   - Open link in incognito/private window
   - Should see purple banner: "📖 Viewing shared project (read-only)"
   - Click "🔀 Fork to Edit"
   - If logged in: saves to your account
   - If not logged in: opens in guest mode
   ```

---

## 📍 Where is the Share Button?

```
+----------------------------------------------------------+
|  YaizY | Python Editor   [Run] [Clear]   [Share] [Export] [Import] [?] [Profile] |
+----------------------------------------------------------+
                                              ^^^^^^
                                        HERE! (when in saved project)
```

**Important Notes:**
- Share button **only shows** when editing a saved project
- Does **not show** on main page (guest mode)
- Does **not show** if not logged in

---

## 🐛 If Share Button Still Not Visible

### 1. Clear Browser Cache
```
Chrome/Edge: Ctrl+Shift+R (Cmd+Shift+R on Mac)
Firefox: Ctrl+F5 (Cmd+Shift+R on Mac)
```

### 2. Check Console for Errors
```
Press F12 → Console tab
Look for any red errors
```

### 3. Verify You're in Correct Mode
```
✅ Should see Share button:
- Logged in
- URL: /editor/some-project-id
- In "My Projects" → opened a project

❌ Won't see Share button:
- Not logged in
- URL: / (guest mode main page)
- URL: /projects (projects list page)
```

### 4. Check Backend Logs
```bash
ssh root@108.61.203.222
journalctl -u python-ide-backend -f
```

Look for:
```
✅ Database initialized
Server running on port 3001
```

---

## 📊 Technical Details

### New Store Created
```typescript
// src/store/projectMetaStore.ts
// Stores backend project metadata (is_public, user_id, etc.)
```

### Share Button Location
```typescript
// src/components/IDE/Header.tsx
// Conditionally renders ShareButton when projectMeta exists
```

### EditorPage Updates
```typescript
// src/pages/EditorPage.tsx
// Loads project and stores metadata in projectMetaStore
```

---

## 🎯 Expected Behavior

| Page | URL | Logged In? | Share Button? |
|------|-----|------------|---------------|
| Guest Mode | `/` | ❌ | ❌ |
| Guest Mode | `/` | ✅ | ❌ |
| Projects List | `/projects` | ✅ | ❌ |
| Edit Project | `/editor/:id` | ✅ | ✅ |
| View Shared | `/share/:id` | Any | ❌ (shows Fork instead) |

---

## ✅ Success Indicators

After update, you should:
1. See Share button when opening saved projects
2. Be able to make projects public
3. Copy share links
4. Open share links in other browsers
5. Fork shared projects

---

Need help? Check logs and browser console! 🚀

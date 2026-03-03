# 🔗 Project Sharing Guide

## Overview

Users can now share their Python projects with others! Anyone can view shared code and create their own copy (fork) to edit.

---

## 📚 How it Works

### For Project Owners (Sharing Your Work)

1. **Create a Project**
   - Login to your account
   - Go to "My Projects"
   - Create a new project or open an existing one

2. **Share the Project**
   - Click the **"🔗 Share"** button (top-right corner in editor)
   - Toggle **"Make project public"** checkbox
   - Copy the share link
   - Share the link with anyone!

3. **What Happens?**
   - Others can view your code (read-only)
   - Others can fork (copy) the project to edit their own version
   - Your original project remains unchanged

---

### For Other Users (Viewing Shared Projects)

#### Option 1: With Account (Recommended)
1. **View Shared Project**
   - Open the share link
   - You'll see the code in read-only mode

2. **Fork the Project**
   - Click **"🔀 Fork to Edit"** button
   - Give your copy a name
   - Click "Fork Project"
   - You'll be redirected to YOUR copy where you can edit freely!

3. **Your Fork is Saved**
   - Your forked project is saved in your account
   - Access it anytime from "My Projects"
   - Make changes without affecting the original version

#### Option 2: Without Account (Guest Mode)
1. **View and Fork**
   - Open the share link
   - Click **"🔀 Fork to Edit"**
   - The project opens in guest mode (uses browser storage)

2. **⚠️ Limitations**
   - Changes are only saved in your browser
   - If you clear browser data, your work is lost
   - **Recommendation**: Login to save permanently!

---

## 🎯 Use Cases

### 1. Collaborative Learning
```
User creates project → Shares link → Others fork & collaborate
```

### 2. Code Templates
```
User creates starter code → Others fork → Modify for their needs
```

### 3. Examples & Demos
```
User shares working examples → Others fork → Experiment safely
```

---

## 🔒 Privacy & Permissions

- **Public Projects**: Anyone with the link can view and fork
- **Private Projects** (default): Only you can access
- **Forks**: Each fork is independent - changes don't sync back
- **Original Safety**: Your original project cannot be modified by others

---

## 💡 Pro Tips

### For Project Owners:
- Make projects public only when ready to share
- Use descriptive project names
- Add comments in code to guide others
- You can see "forked_from" in database if needed

### For Everyone:
- Login before forking to save your work!
- Give your fork a unique name
- Original project link still works after forking

---

## 🚀 Example Workflow

1. **User creates "Python Basics Example"**
   ```python
   # TODO: Complete this function
   def greet(name):
       # Your code here
       pass
   ```

2. **User clicks Share → Makes public → Copies link**
   ```
   https://your-domain.com/share/abc-123-def
   ```

3. **Another user opens link → Sees code → Clicks Fork**

4. **They complete it in their fork:**
   ```python
   def greet(name):
       return f"Hello, {name}!"
   ```

5. **Their work is saved in their account!**

---

## 📊 Dashboard Features

### Projects Page
- See all your projects
- Indicator if project is public (🌐)
- Rename, delete, or open projects

### Shared Project View
- Purple banner shows it's read-only
- "Fork to Edit" always visible
- Run code to test before forking

---

## ❓ FAQ

**Q: Can others edit my original project?**  
A: No! Shared projects are read-only. Others can only fork (copy) them.

**Q: How many people can fork my project?**  
A: Unlimited! Each fork is independent.

**Q: Can I see who forked my project?**  
A: Not in the UI currently, but fork info is in the database (`forked_from` column).

**Q: Can I un-share a project?**  
A: Yes! Open Share dialog → Uncheck "Make project public".

**Q: What happens to existing forks if I un-share?**  
A: Existing forks remain accessible to their owners. New users can't access the original.

**Q: Can I fork my own project?**  
A: Yes! Useful for creating variations or backups.

---

## 🛠️ Technical Details

### API Endpoints
- `GET /api/projects/public/:id` - View public project
- `POST /api/projects/fork/:id` - Fork project
- `PUT /api/projects/:id` - Update project (including is_public)

### Database Schema
```sql
projects (
  ...
  is_public INTEGER DEFAULT 0,
  forked_from TEXT,
  ...
)
```

### Frontend Routes
- `/share/:projectId` - View shared project
- `/editor/:projectId` - Edit your own project
- `/projects` - Your projects list

---

## 🎓 Best Practices

1. **Clear Instructions**: Add comments in shared code
2. **Test First**: Run the code before sharing
3. **Descriptive Names**: Help others understand the project
4. **Version Control**: Keep a "template" version and a "working" version
5. **Privacy**: Only share when ready - check code for sensitive info

---

## 📝 Update Log

- **v1.0** - Initial release with sharing and forking
- Database migration automatic on server restart
- Guest mode forking supported

---

Need help? Contact your administrator or check the main README.

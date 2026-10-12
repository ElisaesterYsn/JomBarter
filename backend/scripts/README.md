# Admin Setup Scripts

## 📋 List All Users

View all registered users in your database:

```bash
cd backend
npm run list-users
```

**Output example:**
```
📋 Found 2 users:

1. 👤 John Doe (johndoe)
   Email:   john@example.com
   Role:    USER
   Status:  ✅ ACTIVE
   Joined:  1/15/2024

2. 👑 Admin User (admin)
   Email:   admin@example.com
   Role:    ADMIN
   Status:  ✅ ACTIVE
   Joined:  1/14/2024
```

---

## 👑 Set a User as Admin

Promote any user to admin role:

```bash
cd backend
npm run set-admin <email-or-username>
```

**Examples:**
```bash
# Using email
npm run set-admin john@example.com

# Using username
npm run set-admin johndoe
```

**Output example:**
```
✅ Successfully promoted user to admin!

   User Details:
   • Email:        john@example.com
   • Username:     johndoe
   • Display Name: John Doe
   • Role:         ADMIN
   • Status:       ACTIVE

   The user can now access the Admin Panel at /admin
```

---

## 🚀 Quick Start

### If you don't have any users yet:

1. **Start the backend and frontend:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run start:dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. **Register a new account:**
   - Go to http://localhost:3000/register
   - Create your account
   - Login

3. **Promote yourself to admin:**
   ```bash
   cd backend
   npm run list-users        # See your user details
   npm run set-admin your@email.com
   ```

4. **Access the Admin Panel:**
   - Click your profile dropdown in the top right
   - Click "Admin Panel"
   - You're in! 🎉

---

## 🔒 Security Notes

- Only users with `role: 'ADMIN'` can access `/admin/*` routes
- Non-admin users get redirected to home page
- Non-admin API calls to `/api/admin/*` return `403 Forbidden`
- Admins cannot suspend or ban themselves (safety guard)
- Suspended/banned users cannot login (JWT validation rejects them)

---

## 💡 Tips

- **Check who's admin:** Run `npm run list-users` to see roles
- **Multiple admins:** You can promote as many users as needed
- **First user:** Usually make the first registered user an admin
- **Remove admin:** Manually update in database or create a removal script if needed

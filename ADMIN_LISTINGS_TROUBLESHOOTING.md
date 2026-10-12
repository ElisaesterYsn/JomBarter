# Admin Listings - Troubleshooting "Cannot GET /api/admin/listings"

## Problem
The endpoint `/api/admin/listings` returns "Cannot GET /api/admin/listings" which means the route is not registered in NestJS.

## Solution Steps

### 1. Verify Backend Build
The TypeScript files need to be compiled:

```bash
cd backend
npm run build
```

**Expected output:** No errors, successful build

### 2. Restart Backend Server
The server needs to be restarted to load the new routes:

```bash
cd backend
# Stop the current server (Ctrl+C if running in terminal)
npm run start:dev
```

**Expected output:**
```
[Nest] LOG [NestFactory] Starting Nest application...
[Nest] LOG [InstanceLoader] AdminModule dependencies initialized
```

### 3. Verify Routes Are Loaded
Check the terminal output when the server starts. You should see:

```
[Nest] LOG [RoutesResolver] AdminController {/admin}:
[Nest] LOG [RouterExplorer] Mapped {/admin/dashboard, GET} route
[Nest] LOG [RouterExplorer] Mapped {/admin/users, GET} route
[Nest] LOG [RouterExplorer] Mapped {/admin/users/:id, GET} route
[Nest] LOG [RouterExplorer] Mapped {/admin/users/:id/status, PATCH} route
[Nest] LOG [RouterExplorer] Mapped {/admin/listings, GET} route
[Nest] LOG [RouterExplorer] Mapped {/admin/listings/:id, GET} route
[Nest] LOG [RouterExplorer] Mapped {/admin/listings/:id/status, PATCH} route
```

### 4. Test the Endpoint
Once the server is running, test with curl or the browser:

```bash
# Test without auth (should get 401)
curl http://localhost:3001/api/admin/listings

# Test with admin JWT token
curl -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  http://localhost:3001/api/admin/listings?page=1&limit=20
```

## Common Issues

### Issue 1: Old Build Files
**Symptom:** Routes still not found after restart
**Solution:**
```bash
cd backend
rm -rf dist/
npm run build
npm run start:dev
```

### Issue 2: TypeScript Compilation Errors
**Symptom:** Build fails with errors
**Solution:** Check the errors and fix them. Common issues:
- Missing imports
- Type mismatches
- Syntax errors

Run: `npm run build` and fix any errors shown

### Issue 3: Module Not Imported
**Symptom:** AdminModule routes don't load
**Solution:** Verify `AdminModule` is in `app.module.ts` imports array (it should already be there)

### Issue 4: Port Conflict
**Symptom:** Server won't start or old version still running
**Solution:**
```bash
# Find process using port 3001
lsof -i :3001  # or: netstat -ano | grep 3001

# Kill the process
kill -9 <PID>

# Start server again
npm run start:dev
```

## Verification Checklist

- [ ] Backend builds without errors (`npm run build`)
- [ ] Backend server restarted (`npm run start:dev`)
- [ ] Terminal shows route mapping for `/admin/listings`
- [ ] Can access `/api/admin/dashboard` (baseline test)
- [ ] Can access `/api/admin/listings` with admin token
- [ ] Frontend can fetch listings from admin panel

## Files to Verify

If routes still don't work, verify these files exist and have correct content:

1. **backend/src/admin/admin.controller.ts** - Contains `@Get('listings')` decorator
2. **backend/src/admin/admin.service.ts** - Contains `getListings()` method
3. **backend/src/admin/admin.module.ts** - Exports AdminController and AdminService
4. **backend/src/app.module.ts** - Imports AdminModule

## Quick Fix Command

Try this complete reset:

```bash
cd backend
rm -rf dist/ node_modules/.cache
npm run build
npm run start:dev
```

Then test in browser:
1. Login as admin user
2. Navigate to `/admin/listings`
3. Check browser Network tab for the API call
4. Should see 200 OK response with listings data

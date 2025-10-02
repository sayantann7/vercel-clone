# Quick Update Summary

## Changes Made

### 1. **Unified URL Pattern** ✅
- Both frontend and backend now use: `http://<id>.ziphub.site`
- Removed the separate `.api` subdomain for backends

### 2. **Updated Files**

#### `vercel-frontend/src/components/landing.tsx`
- Removed conditional URL logic
- Both project types now use the same URL pattern

#### `vercel-be-request-handler/src/index.ts`
- **Major Update**: Now serves BOTH backend and frontend deployments
- Logic:
  1. Check Redis for `backend-ports[id]`
  2. If found → Proxy to backend server
  3. If not found → Serve static files from S3
- Changed default port to 3000 (unified handler)

### 3. **How It Works Now**

```
Request: http://x8846.ziphub.site/
         ↓
Unified Handler checks: backend-ports[x8846]
         ↓
    ┌────┴─────┐
    ↓          ↓
  Found     Not Found
    ↓          ↓
 Backend    Frontend
 (Proxy)    (S3)
```

## What You Need to Do

### Option 1: Use Port 3000 (Recommended)

Update your nginx config to route `*.ziphub.site` to port **3000**:

```nginx
server {
    listen 80;
    server_name *.ziphub.site;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Then:
1. Stop the old `vercel-request-handler` (if running)
2. Rebuild `vercel-be-request-handler`: 
   ```bash
   cd vercel-be-request-handler
   tsc -b
   ```
3. Start it:
   ```bash
   node dist/index.js
   ```

### Option 2: Keep Port 3002

If you want to keep using port 3002:

1. Update nginx to point to 3002:
   ```nginx
   proxy_pass http://localhost:3002;
   ```

2. Change in `vercel-be-request-handler/src/index.ts`:
   ```typescript
   const PORT = process.env.PORT || 3002;
   ```

3. Rebuild and restart

## Testing

### Backend Deployment:
```bash
# Your backend is already working!
curl http://x8846.ziphub.site/
```

### Frontend Deployment:
```bash
# Deploy a frontend project and access at:
http://<frontend-id>.ziphub.site/
```

## Benefits

✅ Single URL pattern - easier to remember
✅ Automatic routing based on deployment type
✅ Cleaner user experience
✅ Simpler nginx configuration

---

**Ready to use!** Just rebuild and restart the unified handler.

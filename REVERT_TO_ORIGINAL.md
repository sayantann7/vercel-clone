# ✅ Reverted to Original Setup

## Changes Made

I've reverted back to the **original architecture** with separate URL patterns for frontend and backend deployments.

## Current Configuration

### URL Patterns:

- **Frontend**: `http://<id>.ziphub.site`
- **Backend**: `http://<id>.api.ziphub.site`

### Services:

1. **Frontend Request Handler** (`vercel-request-handler`)
   - Port: **3000**
   - Handles: Frontend static files from S3
   - Domain: `*.ziphub.site`

2. **Backend Request Handler** (`vercel-be-request-handler`)
   - Port: **3002**
   - Handles: Backend API proxying
   - Domain: `*.api.ziphub.site`

## Files Reverted

### 1. `vercel-frontend/src/components/landing.tsx`
```typescript
const deployedUrl = uploadId 
  ? projectType === 'backend' 
    ? `http://${uploadId}.api.ziphub.site` 
    : `http://${uploadId}.ziphub.site`
  : "";
```

### 2. `vercel-be-request-handler/src/index.ts`
- Back to **backend-only** handler
- Only proxies to backend servers
- Returns 404 if no backend port found
- Port: **3002**

## Nginx Configuration

You need **TWO** server blocks:

### Frontend (Port 3000):
```nginx
server {
    listen 80;
    server_name *.ziphub.site;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Backend (Port 3002):
```nginx
server {
    listen 80;
    server_name *.api.ziphub.site;
    
    location / {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Running Services

### All Required Services:

```bash
# 1. Upload Service (Port 3001)
cd vercel-upload-service
node dist/index.js

# 2. Frontend Deploy Service
cd vercel-deploy-service
node dist/index.js

# 3. Backend Deploy Service
cd vercel-be-deploy-service
node dist/index.js

# 4. Frontend Request Handler (Port 3000)
cd vercel-request-handler
node dist/index.js

# 5. Backend Request Handler (Port 3002)
cd vercel-be-request-handler
tsc -b && node dist/index.js

# 6. Frontend UI
cd vercel-frontend
npm run dev
```

## Testing

### Frontend Deployment:
1. Select "Frontend" in UI
2. Deploy a React/Vite project
3. Access at: `http://<id>.ziphub.site`

### Backend Deployment:
1. Select "Backend" in UI
2. Deploy a Node.js Express project
3. Access at: `http://<id>.api.ziphub.site`

### Your Current Backend:
- URL: `http://x8846.api.ziphub.site/`
- Should work as before ✅

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                    Client Requests                   │
└───────────────────┬─────────────────┬───────────────┘
                    │                 │
         ┌──────────▼────────┐    ┌──▼──────────────┐
         │ *.ziphub.site     │    │ *.api.ziphub.   │
         │                   │    │    site         │
         └──────────┬────────┘    └──┬──────────────┘
                    │                 │
         ┌──────────▼────────┐    ┌──▼──────────────┐
         │ Frontend Request  │    │ Backend Request │
         │ Handler :3000     │    │ Handler :3002   │
         └──────────┬────────┘    └──┬──────────────┘
                    │                 │
         ┌──────────▼────────┐    ┌──▼──────────────┐
         │ S3 Static Files   │    │ Backend Process │
         │ dist/<id>/        │    │ localhost:4xxx  │
         └───────────────────┘    └─────────────────┘
```

## What to Do Next

1. **Rebuild Backend Request Handler**:
   ```bash
   cd vercel-be-request-handler
   tsc -b
   ```

2. **Restart Backend Request Handler**:
   ```bash
   node dist/index.js
   ```

3. **Verify nginx configuration** has both server blocks

4. **Test your backend**:
   ```bash
   curl http://x8846.api.ziphub.site/
   ```

## Summary

✅ Frontend URL: `http://<id>.ziphub.site`
✅ Backend URL: `http://<id>.api.ziphub.site`
✅ Separate handlers on different ports
✅ Original architecture restored
✅ All services configured correctly

---

**Status**: Back to original setup! Your backend at `http://x8846.api.ziphub.site/` should work perfectly.

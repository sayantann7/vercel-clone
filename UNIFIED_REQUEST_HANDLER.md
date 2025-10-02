# Unified Request Handler - Updated Architecture

## Important Change: Single URL Pattern

Both frontend and backend deployments now use the **same URL pattern**: `http://<id>.ziphub.site`

The system automatically detects whether a deployment is backend or frontend and handles it accordingly.

## How It Works

### Request Flow:

```
Client Request: http://x8846.ziphub.site/
          ↓
Unified Request Handler (vercel-be-request-handler on port 3000)
          ↓
Check Redis: backend-ports[x8846]
          ↓
     ┌────┴────┐
     ↓         ↓
   Found    Not Found
     ↓         ↓
  Backend   Frontend
  (Proxy)   (S3 Static)
```

### Backend Detection Logic:

1. Extract project ID from subdomain
2. Check if `backend-ports` hash has an entry for this ID
3. **If found**: Proxy request to the running backend server
4. **If not found**: Serve static files from S3 (frontend deployment)

## Service Configuration

### Single Request Handler (Port 3000)

The `vercel-be-request-handler` now serves BOTH:
- **Backend deployments**: Proxies to running Node.js processes
- **Frontend deployments**: Serves static files from S3

**File**: `vercel-be-request-handler/src/index.ts`

### Nginx Configuration

Simple configuration - route ALL `*.ziphub.site` to port 3000:

```nginx
server {
    listen 80;
    server_name *.ziphub.site;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support for backend apps
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Examples

### Backend Deployment:
- Deploy ID: `x8846`
- Redis: `backend-ports[x8846] = "4298"`
- URL: `http://x8846.ziphub.site/`
- Handler: Proxies to `localhost:4298`

### Frontend Deployment:
- Deploy ID: `abc123`
- Redis: No entry in `backend-ports`
- URL: `http://abc123.ziphub.site/`
- Handler: Serves from S3 `dist/abc123/index.html`

## Services Setup

### Required Services:

1. **vercel-upload-service** (Port 3001)
   - Handles uploads for both frontend and backend

2. **vercel-deploy-service** (Background)
   - Builds frontend projects

3. **vercel-be-deploy-service** (Background)
   - Starts backend servers

4. **vercel-be-request-handler** (Port 3000) ← UNIFIED HANDLER
   - Handles ALL requests (backend + frontend)

5. **vercel-frontend** (UI)
   - User interface

### Deprecated Service:

- ~~vercel-request-handler~~ (No longer needed)
  - Functionality merged into `vercel-be-request-handler`

## Start Services

```bash
# Upload Service
cd vercel-upload-service
node dist/index.js

# Frontend Deploy Service
cd vercel-deploy-service
node dist/index.js

# Backend Deploy Service
cd vercel-be-deploy-service
node dist/index.js

# Unified Request Handler (handles both frontend & backend)
cd vercel-be-request-handler
node dist/index.js

# Frontend UI
cd vercel-frontend
npm run dev
```

## Benefits

✅ **Simplified routing**: Single domain pattern
✅ **Automatic detection**: No need to specify deployment type in URL
✅ **Backward compatible**: Existing deployments work without changes
✅ **Simpler nginx config**: One server block instead of two
✅ **User-friendly**: Users don't need to remember different URL patterns

## Testing

### Test Backend:
```bash
curl http://x8846.ziphub.site/
# Should proxy to backend server

curl http://x8846.ziphub.site/api/health
# Should hit backend API endpoint
```

### Test Frontend:
```bash
curl http://abc123.ziphub.site/
# Should serve static index.html from S3
```

## Troubleshooting

### 404 Error:
- Check if deployment exists in Redis (backend-ports or S3)
- Verify project ID is correct

### 502 Bad Gateway:
- Backend server crashed or not responding
- Check if backend process is running
- Verify port in Redis

### Static files not loading:
- Check S3 for `dist/<id>/` folder
- Verify frontend build completed
- Check S3 credentials

## Migration Notes

If you had the old separate handlers:
1. Stop `vercel-request-handler` (port 3000)
2. Update `vercel-be-request-handler` code
3. Change its port to 3000 (or update nginx to point to 3002)
4. Restart `vercel-be-request-handler`
5. Update nginx config to route all `*.ziphub.site` to the unified handler

---

**Status**: ✅ Updated to use single URL pattern for all deployments

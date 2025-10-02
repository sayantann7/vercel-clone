# Backend Deployment Setup Guide

This guide explains the changes made to support Node.js backend project deployment alongside frontend projects.

## Overview

The Vercel Clone now supports both **Frontend** and **Backend** project deployments:

- **Frontend Projects**: Static sites (React, Vue, etc.) that are built and served as static files
- **Backend Projects**: Node.js applications that run as persistent server processes

## Architecture Changes

### 1. Backend Deploy Service (`vercel-be-deploy-service`)

**Purpose**: Handles the deployment of Node.js backend applications

**Key Changes**:
- Listens to `backend-build-queue` Redis queue instead of `build-queue`
- Downloads project files from S3
- Installs npm dependencies
- Starts the Node.js server as a persistent process
- Dynamically assigns ports to each backend project (range: 4000-5000)
- Stores port mappings in Redis (`backend-ports` hash)
- Updates deployment status in `backend-status` Redis hash

**File**: `vercel-be-deploy-service/src/index.ts`
**Utility**: `vercel-be-deploy-service/src/utils.ts`

### 2. Backend Request Handler (`vercel-be-request-handler`)

**Purpose**: Routes incoming requests to the appropriate backend server

**Key Changes**:
- Acts as a reverse proxy
- Extracts project ID from subdomain (e.g., `abc123.api.ziphub.site`)
- Looks up the port from Redis (`backend-ports`)
- Proxies requests to `localhost:<port>`
- Handles WebSocket connections
- Provides error handling for unavailable backends

**File**: `vercel-be-request-handler/src/index.ts`
**Dependencies Added**:
- `redis` - For Redis client
- `http-proxy-middleware` - For reverse proxy functionality

### 3. Upload Service (`vercel-upload-service`)

**Purpose**: Handles both frontend and backend project uploads

**Key Changes**:
- Accepts `projectType` parameter in `/deploy` endpoint (`'frontend'` or `'backend'`)
- Routes to appropriate Redis queue:
  - Frontend → `build-queue` & `status` hash
  - Backend → `backend-build-queue` & `backend-status` hash
- `/status` endpoint now accepts `projectType` query parameter

**File**: `vercel-upload-service/src/index.ts`

### 4. Frontend (`vercel-frontend`)

**Purpose**: User interface for deploying projects

**Key Changes**:
- Added project type selector (Frontend/Backend toggle buttons)
- Passes `projectType` to deployment API
- Different URL patterns for deployed projects:
  - Frontend: `http://<id>.ziphub.site`
  - Backend: `http://<id>.api.ziphub.site`
- Polls correct status endpoint based on project type

**File**: `vercel-frontend/src/components/landing.tsx`

## Installation & Setup

### 1. Install Dependencies

For Backend Request Handler:
```bash
cd vercel-be-request-handler
npm install redis http-proxy-middleware
```

### 2. Build Services

Build all TypeScript services:
```bash
# Backend Deploy Service
cd vercel-be-deploy-service
npm run dev

# Backend Request Handler
cd vercel-be-request-handler
npm run dev

# Upload Service (if not already built)
cd vercel-upload-service
npm run dev

# Frontend (if not already built)
cd vercel-frontend
npm run dev
```

### 3. Configure DNS/Reverse Proxy

You'll need to configure your reverse proxy (nginx/Apache) to route:

- `*.ziphub.site` → Frontend Request Handler (port 3000)
- `*.api.ziphub.site` → Backend Request Handler (port 3002)

Example nginx configuration:
```nginx
# Frontend
server {
    listen 80;
    server_name *.ziphub.site;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Backend API
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

### 4. Start Services

Start all services (recommend using PM2 or similar process manager):

```bash
# Upload Service
cd vercel-upload-service
npm run dev

# Frontend Deploy Service
cd vercel-deploy-service
npm run dev

# Backend Deploy Service
cd vercel-be-deploy-service
npm run dev

# Frontend Request Handler
cd vercel-request-handler
npm run dev

# Backend Request Handler
cd vercel-be-request-handler
npm run dev

# Frontend UI
cd vercel-frontend
npm run dev
```

## How It Works

### Frontend Deployment Flow:
1. User selects "Frontend" and provides GitHub URL
2. Upload service clones repo, uploads to S3, pushes to `build-queue`
3. Frontend deploy service picks up, runs `npm install && npm run build`
4. Built files from `/dist` uploaded to S3 under `dist/<id>/`
5. Frontend request handler serves static files from S3

### Backend Deployment Flow:
1. User selects "Backend" and provides GitHub URL
2. Upload service clones repo, uploads to S3, pushes to `backend-build-queue`
3. Backend deploy service picks up, downloads from S3
4. Runs `npm install`, starts Node.js server on dynamic port (4000-5000)
5. Port mapping stored in Redis: `backend-ports[id] = port`
6. Backend request handler proxies requests to the running server

## Backend Project Requirements

For a backend project to deploy successfully:

1. Must have a `package.json` file
2. Must have an `index.js` file in the root (entry point)
3. Should respect the `PORT` environment variable:
   ```javascript
   const PORT = process.env.PORT || 3000;
   app.listen(PORT, () => {
       console.log(`Server running on port ${PORT}`);
   });
   ```
4. All dependencies must be in `package.json`

## Redis Data Structure

```
Keys:
- build-queue (list): Queue for frontend builds
- backend-build-queue (list): Queue for backend builds
- status (hash): Frontend deployment statuses
- backend-status (hash): Backend deployment statuses
- backend-ports (hash): Port mappings for backend projects
  Example: backend-ports["abc123"] = "4567"
```

## Troubleshooting

### Backend not accessible
1. Check if backend deploy service is running
2. Verify port in Redis: `redis-cli hget backend-ports <project-id>`
3. Check if process is running: Look for node process on that port
4. Check backend request handler logs

### Port conflicts
- Ports are assigned using a hash of the project ID (range 4000-5000)
- If you have >1000 projects, collisions may occur
- Consider expanding the port range in `utils.ts`

### Memory/Resource issues
- Each backend runs as a separate Node.js process
- Monitor system resources
- Consider implementing auto-scaling or process limits

## Future Enhancements

Potential improvements:
1. Health checks for backend services
2. Auto-restart on crashes
3. Environment variable management
4. Custom domain support
5. SSL/TLS termination
6. Load balancing for multiple instances
7. Container-based isolation (Docker)
8. Database connection management
9. Log aggregation and monitoring

## Files Modified/Created

### Modified:
- `vercel-be-deploy-service/src/index.ts`
- `vercel-be-deploy-service/src/utils.ts`
- `vercel-be-request-handler/src/index.ts`
- `vercel-be-request-handler/package.json`
- `vercel-upload-service/src/index.ts`
- `vercel-frontend/src/components/landing.tsx`

### Created:
- This documentation file

## Testing

### Test Frontend Deployment:
1. Select "Frontend" in the UI
2. Enter a React/Vue/Vite GitHub repo URL
3. Click "Start deployment"
4. Wait for "deployed" status
5. Access at `http://<id>.ziphub.site`

### Test Backend Deployment:
1. Select "Backend" in the UI
2. Enter a Node.js Express/Fastify GitHub repo URL
3. Click "Start deployment"
4. Wait for "deployed" status
5. Access at `http://<id>.api.ziphub.site`

Example backend repos for testing:
- Simple Express API
- REST API with multiple endpoints
- WebSocket server
- GraphQL server

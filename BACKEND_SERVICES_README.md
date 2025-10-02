# Backend Services - README

This directory contains the backend deployment infrastructure for Node.js applications.

## Services Overview

### 1. vercel-be-deploy-service
**Purpose:** Builds and starts Node.js backend applications

**Responsibilities:**
- Listens to `backend-build-queue` Redis queue
- Downloads project files from S3
- Runs `npm install` to install dependencies
- Starts Node.js server process
- Assigns dynamic port (4000-5000 range)
- Stores port mapping in Redis
- Updates deployment status

**Key Files:**
- `src/index.ts` - Main queue listener
- `src/utils.ts` - Server startup logic
- `src/aws.ts` - S3 download functions

### 2. vercel-be-request-handler
**Purpose:** Routes HTTP requests to deployed backend applications

**Responsibilities:**
- Acts as reverse proxy
- Extracts project ID from subdomain
- Looks up port from Redis
- Proxies requests to running backend
- Handles WebSocket connections
- Provides error responses

**Key Files:**
- `src/index.ts` - Proxy server
- `package.json` - Dependencies (redis, http-proxy-middleware)

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ HTTP Request to abc123.api.ziphub.site
       ▼
┌────────────────────────────┐
│ vercel-be-request-handler  │ (Port 3002)
│  - Extracts ID: abc123     │
│  - Gets port from Redis    │
└──────┬─────────────────────┘
       │ Proxy to localhost:4567
       ▼
┌──────────────────┐
│ Backend Process  │ (Port 4567)
│   (abc123)       │
└──────────────────┘
```

## Deployment Flow

```
1. User deploys via UI (Backend selected)
   ↓
2. Upload service → backend-build-queue
   ↓
3. vercel-be-deploy-service picks up
   ↓
4. Downloads from S3
   ↓
5. npm install
   ↓
6. Starts node index.js (PORT=4567)
   ↓
7. Saves to Redis: backend-ports[abc123] = 4567
   ↓
8. Updates: backend-status[abc123] = deployed
   ↓
9. Client requests: abc123.api.ziphub.site
   ↓
10. vercel-be-request-handler proxies to :4567
```

## Redis Keys Used

| Key | Type | Purpose | Example |
|-----|------|---------|---------|
| `backend-build-queue` | List | Queue of backend projects to deploy | ["abc123", "xyz789"] |
| `backend-status` | Hash | Deployment status | {"abc123": "deployed"} |
| `backend-ports` | Hash | Port mappings | {"abc123": "4567"} |

## Port Assignment

Ports are assigned deterministically based on project ID:
- Range: 4000-5000 (1000 possible backends)
- Algorithm: Hash of project ID modulo 1000

```typescript
function getPortForId(id: string): number {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = ((hash << 5) - hash) + id.charCodeAt(i);
    }
    return 4000 + Math.abs(hash % 1000);
}
```

## Backend Project Requirements

For successful deployment, backend projects must:

1. **Have `index.js` in root directory**
   ```
   project/
   ├── index.js        ← Entry point
   ├── package.json
   └── ...
   ```

2. **Respect PORT environment variable**
   ```javascript
   const PORT = process.env.PORT || 3000;
   app.listen(PORT);
   ```

3. **Declare all dependencies**
   ```json
   {
     "dependencies": {
       "express": "^4.18.2"
     }
   }
   ```

4. **No build step required** (runs `node index.js` directly)

## Environment Variables

### vercel-be-deploy-service
- Redis connection (username, password, host, port) - hardcoded

### vercel-be-request-handler
- Redis connection (username, password, host, port) - hardcoded
- `PORT` - Server port (default: 3002)

### Deployed Backends
- `PORT` - Assigned dynamically by deploy service

## Development

### Build:
```bash
# Backend Deploy Service
cd vercel-be-deploy-service
npm run dev

# Backend Request Handler
cd vercel-be-request-handler
npm run dev
```

### Run:
```bash
# Deploy Service (background worker)
cd vercel-be-deploy-service
node dist/index.js

# Request Handler (HTTP server)
cd vercel-be-request-handler
node dist/index.js
```

## Monitoring

### Check deployed backends:
```bash
# List all backend ports
redis-cli hgetall backend-ports

# Check specific backend
redis-cli hget backend-ports abc123

# Check status
redis-cli hget backend-status abc123
```

### Check running processes:
```bash
# Windows
netstat -ano | findstr "400"

# Linux
netstat -tulpn | grep "400"
```

### View logs:
- Console output from services
- PM2 logs if using PM2
- Check process stdout/stderr

## Troubleshooting

### Backend won't start
1. Check if `index.js` exists
2. Verify `package.json` is valid
3. Look at deploy service logs
4. Check npm install output

### Can't access deployed backend
1. Verify backend-ports in Redis
2. Check if process is running on that port
3. Test direct connection: `curl http://localhost:4567`
4. Check request handler logs
5. Verify reverse proxy configuration

### Port conflicts
1. Check for other services using the port
2. Kill conflicting process
3. Or expand port range in utils.ts

## Security Notes

⚠️ **Current limitations:**
- No process isolation
- No resource limits
- No code validation
- Full system access for backends

🔒 **Recommendations:**
- Use Docker containers
- Implement resource quotas
- Add code scanning
- Sandbox execution environment
- Implement rate limiting
- Add authentication

## Future Improvements

- [ ] Health checks
- [ ] Auto-restart on crash
- [ ] Process monitoring dashboard
- [ ] Resource limits (CPU/RAM)
- [ ] Docker containerization
- [ ] Environment variable management
- [ ] Custom domains
- [ ] SSL/TLS support
- [ ] Horizontal scaling
- [ ] Log aggregation

## Support

For detailed documentation:
- `BACKEND_DEPLOYMENT_SETUP.md` - Full setup guide
- `IMPLEMENTATION_SUMMARY.md` - Technical details
- `QUICK_START.md` - Getting started

## License

Same as main project

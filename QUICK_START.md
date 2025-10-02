# 🚀 Quick Start Guide - Backend Deployment

## Prerequisites
- Node.js installed
- Redis Cloud connected (already configured)
- All frontend deployment services working

## Step 1: Install Dependencies

Run the setup script:
```bash
setup-backend-deployment.bat
```

Or manually:
```bash
cd vercel-be-request-handler
npm install redis http-proxy-middleware
```

## Step 2: Build Services

```bash
# Backend Deploy Service
cd vercel-be-deploy-service
tsc -b

# Backend Request Handler
cd vercel-be-request-handler
tsc -b
```

## Step 3: Start Backend Services

### Option A: Using PM2 (Recommended)

```bash
# Backend Deploy Service
pm2 start "node dist/index.js" --name "be-deploy-service" --cwd "C:\Users\offic\Desktop\vercel-clone\vercel-be-deploy-service"

# Backend Request Handler
pm2 start "node dist/index.js" --name "be-request-handler" --cwd "C:\Users\offic\Desktop\vercel-clone\vercel-be-request-handler"

# Save PM2 configuration
pm2 save
```

### Option B: Manual (Development)

Terminal 1:
```bash
cd vercel-be-deploy-service
node dist/index.js
```

Terminal 2:
```bash
cd vercel-be-request-handler
node dist/index.js
```

## Step 4: Test Backend Deployment

1. **Deploy the example backend:**
   - Push `example-backend-project/` to GitHub
   - Or use any Express.js GitHub repo

2. **Open ZipHub Frontend:**
   - http://localhost:5173 (or your frontend URL)

3. **Deploy:**
   - Select "Backend" project type
   - Enter GitHub URL
   - Click "Start deployment"
   - Wait for "deployed" status

4. **Test the API:**
   ```bash
   # Replace <id> with your deployment ID
   curl http://<id>.api.ziphub.site/
   curl http://<id>.api.ziphub.site/api/health
   curl http://<id>.api.ziphub.site/api/users
   ```

## Step 5: Configure Reverse Proxy (Production)

### If using nginx:

Add to nginx config:
```nginx
# Backend API subdomain
server {
    listen 80;
    server_name *.api.ziphub.site;
    
    location / {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Reload nginx:
```bash
nginx -s reload
```

## Verification Checklist

- [ ] `vercel-be-deploy-service` running and listening to Redis
- [ ] `vercel-be-request-handler` running on port 3002
- [ ] Redis connection successful (check logs)
- [ ] Can deploy backend projects from UI
- [ ] Deployed backends accessible via subdomain
- [ ] Health endpoint working

## Common Issues

### Issue: "Cannot find module 'redis'"
**Solution:** Run `npm install` in `vercel-be-request-handler`

### Issue: Backend not starting
**Solution:** 
- Check `vercel-be-deploy-service` logs
- Verify project has `index.js`
- Check if `npm install` succeeded

### Issue: 502 Bad Gateway
**Solution:**
- Check if backend process is running: `netstat -ano | findstr :<port>`
- Verify port in Redis: `redis-cli hget backend-ports <id>`
- Check backend request handler logs

### Issue: Port already in use
**Solution:**
- Stop conflicting process
- Or modify port range in `vercel-be-deploy-service/src/utils.ts`

## Monitoring

### Check running backends:
```bash
# Check Redis for all backend ports
redis-cli hgetall backend-ports

# Check system processes
netstat -ano | findstr "400"
```

### View logs:
```bash
# PM2 logs
pm2 logs be-deploy-service
pm2 logs be-request-handler

# Or check console output if running manually
```

## What's Next?

1. ✅ Deploy a test backend project
2. ✅ Verify it's accessible
3. ✅ Try deploying multiple backends
4. ✅ Test with different types of Node.js apps (Express, Fastify, etc.)
5. 📚 Read `BACKEND_DEPLOYMENT_SETUP.md` for detailed docs
6. 🔧 Set up production reverse proxy configuration

## Need Help?

- Check `IMPLEMENTATION_SUMMARY.md` for technical details
- Review `BACKEND_DEPLOYMENT_SETUP.md` for architecture
- Check service logs for errors
- Verify Redis connectivity

---

**You're all set!** 🎉 Start deploying backend projects alongside your frontends.

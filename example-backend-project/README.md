# Example Backend Project

This is a simple Express.js backend project that can be deployed using ZipHub's backend deployment feature.

## Features

- Health check endpoint
- JSON API endpoints
- Echo endpoint for testing POST requests
- Respects PORT environment variable

## Endpoints

- `GET /` - Welcome message
- `GET /api/health` - Health check with uptime and memory info
- `GET /api/users` - Sample users list
- `POST /api/echo` - Echoes back the request body

## Local Testing

```bash
npm install
npm start
```

Server will run on port 3000 (or PORT environment variable if set).

## Deploy to ZipHub

1. Push this project to a GitHub repository
2. Open ZipHub frontend
3. Select "Backend" project type
4. Paste your GitHub repository URL
5. Click "Start deployment"
6. Once deployed, access your API at `http://<project-id>.api.ziphub.site`

## Testing Deployed API

```bash
# Health check
curl http://<project-id>.api.ziphub.site/api/health

# Get users
curl http://<project-id>.api.ziphub.site/api/users

# Echo endpoint
curl -X POST http://<project-id>.api.ziphub.site/api/echo \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello World"}'
```

## Requirements

- Node.js backend must have `index.js` as entry point
- Must respect `process.env.PORT` for the port
- All dependencies must be in `package.json`

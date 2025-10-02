import express from "express";
import dotenv from "dotenv";
import { createClient } from "redis";
import { createProxyMiddleware } from 'http-proxy-middleware';

dotenv.config();

const app = express();

// Connect to Redis to get port mappings
const redisClient = createClient({
    username: 'default',
    password: 'o2fs5b3mzpbhP8QAWQf9PpAJsgECJO5n',
    socket: {
        host: 'redis-10504.c212.ap-south-1-1.ec2.redns.redis-cloud.com',
        port: 10504
    }
});

redisClient.on('error', err => console.log('Redis Client Error', err));
redisClient.connect();

// Middleware to proxy requests to the appropriate backend server
app.use(async (req, res, next) => {
    try {
        const host = req.hostname;
        const id = host.split(".")[0];
        
        console.log(`Request for backend: ${id}, path: ${req.path}`);
        
        // Get the port for this backend from Redis
        const port = await redisClient.hGet('backend-ports', id);
        
        if (!port) {
            return res.status(404).json({ 
                error: 'Backend not found or not yet deployed',
                id: id 
            });
        }
        
        console.log(`Proxying to localhost:${port}`);
        
        // Create a proxy middleware on the fly
        const proxy = createProxyMiddleware({
            target: `http://localhost:${port}`,
            changeOrigin: true,
            ws: true, // Enable WebSocket proxying
            onError: (err, req, res) => {
                console.error(`Proxy error for ${id}:`, err);
                if (!res.headersSent) {
                    res.status(502).json({ 
                        error: 'Backend server unavailable',
                        details: err.message 
                    });
                }
            },
            onProxyReq: (proxyReq, req, res) => {
                console.log(`Proxying ${req.method} ${req.url} to port ${port}`);
            }
        });
        
        proxy(req, res, next);
    } catch (error: any) {
        console.error('Error handling request:', error);
        if (!res.headersSent) {
            res.status(500).json({ 
                error: 'Internal server error',
                details: error.message 
            });
        }
    }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Backend request handler listening on port ${PORT}`);
});
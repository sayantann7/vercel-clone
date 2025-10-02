import express from "express";
import dotenv from "dotenv";
import { createClient } from "redis";
import { createProxyMiddleware } from 'http-proxy-middleware';
import AWS from "aws-sdk";

dotenv.config();

const app = express();

// S3 Configuration for serving static files
const s3 = new AWS.S3({
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey,
    endpoint: process.env.endpoint
});

// Connect to Redis to get port mappings and check deployment type
const redisClient = createClient({
    username: 'default',
    password: 'o2fs5b3mzpbhP8QAWQf9PpAJsgECJO5n',
    socket: {
        host: 'redis-10504.c212.ap-south-1-1.ec2.redns.redis-cloud.com',
        port: 10504
    }
});

redisClient.on('error', (err: any) => console.log('Redis Client Error', err));
redisClient.connect();

// Unified middleware to handle both backend and frontend requests
app.use(async (req, res, next) => {
    try {
        const host = req.hostname;
        const id = host.split(".")[0];
        
        console.log(`Request for: ${id}, path: ${req.path}`);
        
        // Check if this is a backend deployment (has a port mapping)
        const port = await redisClient.hGet('backend-ports', id);
        
        if (port) {
            // This is a backend deployment - proxy the request
            console.log(`Backend detected - Proxying to localhost:${port}`);
            
            const proxy = createProxyMiddleware({
                target: `http://localhost:${port}`,
                changeOrigin: true,
                ws: true, // Enable WebSocket proxying
                onError: (err: any, req: any, res: any) => {
                    console.error(`Proxy error for ${id}:`, err);
                    if (!res.headersSent) {
                        res.status(502).json({ 
                            error: 'Backend server unavailable',
                            details: err.message 
                        });
                    }
                },
                onProxyReq: (proxyReq: any, req: any, res: any) => {
                    console.log(`Proxying ${req.method} ${req.url} to port ${port}`);
                }
            });
            
            return proxy(req, res, next);
        }
        
        // No backend port found - try to serve as static frontend
        console.log(`No backend found - Serving static files for ${id}`);
        
        let filePath = req.path;
        if (filePath === "/" || filePath === "") {
            filePath = "/index.html";
        }
        
        try {
            const contents = await s3.getObject({
                Bucket: "vercel",
                Key: `dist/${id}${filePath}`
            }).promise();
            
            const type = filePath.endsWith("html") ? "text/html" 
                : filePath.endsWith("css") ? "text/css" 
                : filePath.endsWith("js") ? "application/javascript"
                : "application/octet-stream";
            
            res.set("Content-Type", type);
            res.send(contents.Body);
        } catch (s3Error: any) {
            console.error(`S3 error for ${id}${filePath}:`, s3Error.code);
            if (s3Error.code === 'NoSuchKey') {
                res.status(404).json({ 
                    error: 'File not found',
                    id: id,
                    path: filePath
                });
            } else {
                res.status(404).json({ 
                    error: 'Deployment not found',
                    id: id,
                    message: 'Neither backend nor frontend deployment exists for this ID'
                });
            }
        }
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Unified request handler listening on port ${PORT}`);
});
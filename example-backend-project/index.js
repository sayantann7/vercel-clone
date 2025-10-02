const express = require('express');
const app = express();

// Use the PORT environment variable (provided by the deployment service)
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.json({ 
        message: 'Hello from ZipHub Backend!',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

app.get('/api/users', (req, res) => {
    res.json([
        { id: 1, name: 'John Doe' },
        { id: 2, name: 'Jane Smith' },
        { id: 3, name: 'Bob Johnson' }
    ]);
});

app.post('/api/echo', (req, res) => {
    res.json({
        received: req.body,
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

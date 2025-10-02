import { exec, spawn } from "child_process";
import path from "path";

// Store running backend processes
const runningProcesses = new Map<string, any>();

export function startBackendServer(id: string, publisher: any) {
    return new Promise((resolve, reject) => {
        const projectPath = path.join(__dirname, `output/${id}`);
        
        console.log(`Installing dependencies for ${id}...`);
        
        // First, install dependencies
        const installProcess = exec(`cd ${projectPath} && npm install`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Install error for ${id}:`, error);
                reject(error);
                return;
            }
            
            console.log(`Dependencies installed for ${id}, starting server...`);
            
            // Dynamically assign a port based on the project ID
            const port = getPortForId(id);
            
            // Start the backend server
            const serverProcess = spawn('node', ['index.js'], {
                cwd: projectPath,
                env: { ...process.env, PORT: port.toString() },
                detached: false,
                stdio: ['ignore', 'pipe', 'pipe']
            });
            
            serverProcess.stdout?.on('data', (data) => {
                console.log(`[${id}] stdout: ${data}`);
            });
            
            serverProcess.stderr?.on('data', (data) => {
                console.error(`[${id}] stderr: ${data}`);
            });
            
            serverProcess.on('error', (err) => {
                console.error(`Server process error for ${id}:`, err);
            });
            
            serverProcess.on('close', (code) => {
                console.log(`Server process for ${id} exited with code ${code}`);
                runningProcesses.delete(id);
            });
            
            // Store the process
            runningProcesses.set(id, { process: serverProcess, port });
            
            // Store port mapping in Redis
            publisher.hSet('backend-ports', id, port.toString()).catch((err: any) => {
                console.error(`Error setting port in Redis for ${id}:`, err);
            });
            
            // Give the server some time to start
            setTimeout(() => {
                console.log(`Backend server started for ${id} on port ${port}`);
                resolve("");
            }, 3000);
        });
    });
}

// Generate a port number based on the project ID (hash the ID to a port in range 4000-5000)
function getPortForId(id: string): number {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = ((hash << 5) - hash) + id.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
    }
    // Map to port range 4000-5000
    return 4000 + Math.abs(hash % 1000);
}

export function getRunningProcesses() {
    return runningProcesses;
}
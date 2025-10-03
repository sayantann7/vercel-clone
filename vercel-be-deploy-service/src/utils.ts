import { exec, spawn } from "child_process";
import path from "path";
import fs from "fs";

// Store running backend processes
const runningProcesses = new Map<string, any>();

export function startBackendServer(id: string, publisher: any, config: any = {}) {
    return new Promise((resolve, reject) => {
        const projectPath = path.join(__dirname, `output/${id}`);
        
        const installCommand = config.installCommand || 'npm install';
        const buildCommand = config.buildCommand || '';
        const runCommand = config.runCommand || 'npm start';
        const envVars = config.envVars || '';
        
        console.log(`Installing dependencies for ${id} with: ${installCommand}`);
        
        // Create .env file if environment variables are provided
        if (envVars) {
            const envFilePath = path.join(projectPath, '.env');
            fs.writeFileSync(envFilePath, envVars);
            console.log(`.env file created for ${id}`);
        }
        
        // First, install dependencies
        const installProcess = exec(`cd ${projectPath} && ${installCommand}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Install error for ${id}:`, error);
                reject(error);
                return;
            }
            
            console.log(`Dependencies installed for ${id}`);
            
            // Run build command if provided
            if (buildCommand && buildCommand.trim() !== '') {
                console.log(`Building project ${id} with: ${buildCommand}`);
                exec(`cd ${projectPath} && ${buildCommand}`, (buildError, buildStdout, buildStderr) => {
                    if (buildError) {
                        console.error(`Build error for ${id}:`, buildError);
                        reject(buildError);
                        return;
                    }
                    console.log(`Build completed for ${id}`);
                    startServer();
                });
            } else {
                startServer();
            }
            
            function startServer() {
                console.log(`Starting server for ${id} with: ${runCommand}`);
                
                // Dynamically assign a port based on the project ID
                const port = getPortForId(id);
                
                // Parse the run command
                const cmdParts = runCommand.split(' ');
                const mainCmd = cmdParts[0];
                const args = cmdParts.slice(1);
                
                // Parse environment variables from the envVars string
                const envObj: any = { ...process.env, PORT: port.toString() };
                if (envVars) {
                    envVars.split('\n').forEach((line: string) => {
                        const trimmed = line.trim();
                        if (trimmed && trimmed.includes('=')) {
                            const [key, ...valueParts] = trimmed.split('=');
                            envObj[key.trim()] = valueParts.join('=').trim();
                        }
                    });
                }
                
                // Start the backend server
                const serverProcess = spawn(mainCmd, args, {
                    cwd: projectPath,
                    env: envObj,
                    detached: false,
                    stdio: ['ignore', 'pipe', 'pipe'],
                    shell: true
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
            }
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
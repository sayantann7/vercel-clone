
import express from "express";
import cors from "cors";
import simpleGit from "simple-git";
import { generate } from "./utils.js";
import { getAllFiles } from "./file.js";
import path from "path";
import { uploadFile } from "./aws.js";
import { createClient } from "redis";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
console.log(process.env.endpoint);

console.log("---------------------TRYING TO CONNECT TO REDIS---------------------")

const publisher = createClient({
    username: 'default',
    password: 'o2fs5b3mzpbhP8QAWQf9PpAJsgECJO5n',
    socket: {
        host: 'redis-10504.c212.ap-south-1-1.ec2.redns.redis-cloud.com',
        port: 10504
    }
});

console.log("---------------------PUBLISHER---------------------")
console.log(publisher);

publisher.on('error', err => console.log('Redis Publisher Error', err));
await publisher.connect();

const subscriber = createClient({
    username: 'default',
    password: 'o2fs5b3mzpbhP8QAWQf9PpAJsgECJO5n',
    socket: {
        host: 'redis-10504.c212.ap-south-1-1.ec2.redns.redis-cloud.com',
        port: 10504
    }
});
subscriber.on('error', err => console.log('Redis Subscriber Error', err));

console.log("---------------------SUBSCRIBER---------------------")
console.log(subscriber);
console.log("---------------------SUBSCRIBER---------------------")

await subscriber.connect();

const app = express();
app.use(cors())
app.use(express.json());

app.post("/deploy", async (req, res) => {
    const repoUrl = req.body.repoUrl;
    const projectType = req.body.projectType || 'frontend'; // 'frontend' or 'backend'
    const envVars = req.body.envVars || '';
    const installCommand = req.body.installCommand || 'npm install';
    const buildCommand = req.body.buildCommand || '';
    const runCommand = req.body.runCommand || 'npm start';
    
    console.log(`Cloning ${projectType} repo:`, repoUrl);
    const id = generate();
    console.log("Generated id", id);
    await simpleGit().clone(repoUrl, path.join(__dirname, `output/${id}`));

    console.log("Cloned repo");

    const files = getAllFiles(path.join(__dirname, `output/${id}`));

    console.log("Starting to upload files for", id);

    console.log("Uploading files to S3...");

    await Promise.all(
        files.map(async file => {
            // Get path relative to the current directory
            let relativePath = path.relative(__dirname, file);
            // Convert Windows-style \ to POSIX-style /
            relativePath = relativePath.split(path.sep).join("/");

            await uploadFile(relativePath, file);
        })
    );

    console.log("Files uploaded to S3");

    await new Promise((resolve) => setTimeout(resolve, 10000));
    
    // Store configuration in Redis
    const config = {
        envVars,
        installCommand,
        buildCommand,
        runCommand,
        projectType
    };
    await publisher.hSet(`deploy-config:${id}`, config);
    
    // Push to appropriate queue based on project type
    if (projectType === 'backend') {
        await publisher.lPush("backend-build-queue", id);
        await publisher.hSet("backend-status", id, "uploaded");
        console.log(`Backend project ${id} queued for deployment`);
    } else {
        await publisher.lPush("build-queue", id);
        await publisher.hSet("status", id, "uploaded");
        console.log(`Frontend project ${id} queued for deployment`);
    }

    res.json({
        id: id,
        projectType: projectType
    });
});

app.get("/status", async (req, res) => {
    const id = req.query.id;
    const projectType = req.query.projectType || 'frontend';
    
    let response;
    if (projectType === 'backend') {
        response = await subscriber.hGet("backend-status", id as string);
    } else {
        response = await subscriber.hGet("status", id as string);
    }
    
    res.json({
        status: response
    });
});

app.listen(3001);
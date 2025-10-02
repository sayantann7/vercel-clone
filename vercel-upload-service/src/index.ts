
import express from "express";
import cors from "cors";
import simpleGit from "simple-git";
import { generate } from "./utils";
import { getAllFiles } from "./file";
import path from "path";
import { uploadFile } from "./aws";
import { createClient } from "redis";

require("dotenv").config();
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
    const id = generate(); // asd12
    await simpleGit().clone(repoUrl, path.join(__dirname, `output/${id}`));

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


    await new Promise((resolve) => setTimeout(resolve, 10000))
    publisher.lPush("build-queue", id);
    // INSERT => SQL
    // .create => 
    publisher.hSet("status", id, "uploaded");

    res.json({
        id: id
    })

});

app.get("/status", async (req, res) => {
    const id = req.query.id;
    const response = await subscriber.hGet("status", id as string);
    res.json({
        status: response
    })
})

app.listen(3001);
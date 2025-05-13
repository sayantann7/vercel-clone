
import express from "express";
import cors from "cors";
import simpleGit from "simple-git";
import { generate } from "./utils";
import { getAllFiles } from "./file";
import path from "path";
import { uploadFile } from "./aws";
import { createClient } from "redis";
const publisher = createClient();
publisher.connect();
require("dotenv").config();
console.log(process.env.endpoint);

const subscriber = createClient();
subscriber.connect();

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
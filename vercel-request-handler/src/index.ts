import express from "express";
import AWS from "aws-sdk";
import dotenv from "dotenv";

dotenv.config();

const s3 = new AWS.S3({
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey,
    endpoint: process.env.endpoint
});

const app = express();

app.get("/*", async (req, res) => {
    const host = req.hostname;

    const id = host.split(".")[0];
    const filePath = req.path;
    let updatedFilePath = filePath;

    if (filePath === "/" || filePath === "") {
        updatedFilePath = "/index.html";
    }

    const contents = await s3.getObject({
        Bucket: "vercel",
        Key: `dist/${id}${updatedFilePath}`
    }).promise();
    
    const type = updatedFilePath.endsWith("html") ? "text/html" : filePath.endsWith("css") ? "text/css" : "application/javascript"
    res.set("Content-Type", type);

    res.send(contents.Body);
})

app.listen(3000);
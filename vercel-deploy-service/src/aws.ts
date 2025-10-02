import AWS from "aws-sdk";
import fs from "fs";
import { get } from "http";
import path from "path";
require("dotenv").config();

const s3 = new AWS.S3({
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey,
    endpoint: process.env.endpoint
});

const uploadFile = async (fileName: string, localFilePath: string) => {
    const fileContent = fs.readFileSync(localFilePath);
    await s3.upload({
        Body: fileContent,
        Bucket: "vercel",
        Key: fileName,
    }).promise();
}

// output/asdasd
export async function downloadS3Folder(prefix: string) {
    const allFiles = await s3.listObjectsV2({
        Bucket: "vercel",
        Prefix: prefix
    }).promise();
    
    // 
    const allPromises = allFiles.Contents?.map(async ({Key}) => {
        return new Promise(async (resolve) => {
            if (!Key) {
                resolve("");
                return;
            }
            const finalOutputPath = path.join(__dirname, Key);
            const outputFile = fs.createWriteStream(finalOutputPath);
            const dirName = path.dirname(finalOutputPath);
            if (!fs.existsSync(dirName)){
                fs.mkdirSync(dirName, { recursive: true });
            }
            s3.getObject({
                Bucket: "vercel",
                Key
            }).createReadStream().pipe(outputFile).on("finish", () => {
                resolve("");
            })
        })
    }) || []
    console.log("Downloading",prefix,"from S3");

    await Promise.all(allPromises?.filter(x => x !== undefined));

    console.log("Downloaded",prefix,"from S3");
}

const getAllFiles = (folderPath: string) => {
    let response: string[] = [];

    const allFilesAndFolders = fs.readdirSync(folderPath);allFilesAndFolders.forEach(file => {
        const fullFilePath = path.join(folderPath, file);
        if(fullFilePath.includes(".git") && fs.statSync(fullFilePath).isDirectory()) return;
        if (fs.statSync(fullFilePath).isDirectory()) {
            response = response.concat(getAllFiles(fullFilePath))
        } else {
            response.push(fullFilePath);
        }
    });
    return response;
}

export async function copyFinalDist(id: string) {
  // 1) locate your dist folder
  const distRoot = path.join(__dirname, "output", id, "dist");
  const allFiles = getAllFiles(distRoot);

  // 2) upload in parallel, but properly await & normalize keys
  await Promise.all(
    allFiles.map(async filePath => {
      // a) make path relative to distRoot
      let rel = path.relative(distRoot, filePath);
      // b) normalize Windows "\" → POSIX "/"
      rel = rel.split(path.sep).join("/");
      // c) build the key you actually want
      const key = `dist/${id}/${rel}`;
      await uploadFile(key, filePath);
    })
  );
  console.log("Done uploading dist of", id,"to S3");
}
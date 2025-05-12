import { createClient } from "redis";
import { downloadS3Folder, copyFinalDist } from "./aws";
import { buildProject } from "./utils";

async function main() {
    const subscriber = createClient();
    await subscriber.connect();

    const publisher = createClient();
    await publisher.connect();
    while (1) {
        const res = await subscriber.brPop(
            'build-queue',
            0
        );
        console.log(res);
        if (res) {
            await downloadS3Folder(`output/${res.element}`);
            console.log("Building", res.element);
            await buildProject(res.element);
            await copyFinalDist(res.element);
            console.log("Copy completed, updating status...");
            const status = await publisher.hSet('status', res.element, 'deployed');
            console.log("Build status", status);
        }
    }
}
main();
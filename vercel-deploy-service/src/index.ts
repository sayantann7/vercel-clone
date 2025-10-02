import { createClient } from "redis";
import { downloadS3Folder, copyFinalDist } from "./aws";
import { buildProject } from "./utils";

async function main() {
    const subscriber = createClient({
        username: 'default',
        password: 'o2fs5b3mzpbhP8QAWQf9PpAJsgECJO5n',
        socket: {
            host: 'redis-10504.c212.ap-south-1-1.ec2.redns.redis-cloud.com',
            port: 10504
        }
    });
    subscriber.on('error', err => console.log('Redis Subscriber Error', err));
    await subscriber.connect();

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
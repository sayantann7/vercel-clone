import { createClient } from "redis";
import { downloadS3Folder } from "./aws";
import { startBackendServer } from "./utils";

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
            'backend-build-queue',
            0
        );
        console.log("Received backend build request:", res);
        if (res) {
            const id = res.element;
            try {
                await downloadS3Folder(`output/${id}`);
                console.log("Downloaded backend project", id);
                
                // Get configuration from Redis
                const config = await publisher.hGetAll(`deploy-config:${id}`);
                console.log("Configuration for", id, config);
                
                await startBackendServer(id, publisher, config);
                console.log("Backend server started for", id);
                
                await publisher.hSet('backend-status', id, 'deployed');
                console.log("Backend deployment completed for", id);
            } catch (error: any) {
                console.error("Error deploying backend", id, error);
                await publisher.hSet('backend-status', id, 'failed');
            }
        }
    }
}
main();
import { createClient } from "redis";

export const redisUrl = `redis://localhost:6379`;
const redisClient = createClient({
  url: redisUrl,
});

const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log("🟢 Redis client connected...");
  } catch (err: any) {
    console.log("🔴 " + err.message);
    setTimeout(connectRedis, 5000);
  }
};

connectRedis();

redisClient.on("error", (err) => console.log("🔴 " + err));

export default redisClient;

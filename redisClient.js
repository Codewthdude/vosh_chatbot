import { createClient } from "redis";

// ⚠️ Hardcoded config for dev/testing
const client = createClient({
  username: "default",
  password: "jM7e3yzGqTAXzU9OPYgcsPksbLsen1PK",
  socket: {
    host: "redis-18955.crce214.us-east-1-3.ec2.redns.redis-cloud.com",
    port: 18955,
  },
});

client.on("error", (err) => console.error("❌ Redis Client Error:", err));

await client.connect();
console.log("✅ Redis connected");

export default client;

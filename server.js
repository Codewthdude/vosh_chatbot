import express from "express";
import bodyParser from "body-parser";
import cors from "cors";   
import redisClient from "./services/redisClient.js";
import qClient from "./services/qdrantClient.js";
import chatRouter from "./routes/chat.js"; // <-- import your chat router

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Mount chat router under /chat
app.use("/chat", chatRouter);

// Health check
app.get("/", (req, res) => {
  res.send("🚀 Backend is running with Redis + Qdrant");
});

app.get("/redis-test", async (req, res) => {
  await redisClient.set("foo", "bar");
  const value = await redisClient.get("foo");
  res.send(`Redis test value: ${value}`);
});

app.get("/qdrant-test", async (req, res) => {
  const collections = await qClient.getCollections();
  res.json(collections);
});

app.listen(4000, () => {
  console.log("✅ Server running at http://localhost:4000");
});

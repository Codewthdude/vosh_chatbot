import express from "express";
import fetch from "node-fetch"; // Node <18 only
import { v4 as uuidv4 } from "uuid";
import redisClient from "../services/redisClient.js"; // consistent default import
import qClient from "../services/qdrantClient.js";

const router = express.Router();
const COLLECTION = "news";
const SESSION_TTL = 3600; // 1 hour

// Get session history
router.get("/history/:sessionId", async (req, res) => {
  try {
    const key = `session:${req.params.sessionId}:history`;
    const history = await redisClient.get(key);
    res.json({ history: history ? JSON.parse(history) : [] });
  } catch (err) {
    console.error("❌ Error in /history/:sessionId:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Query route
router.post("/query/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;

    if (!message) return res.status(400).json({ error: "message required" });

    // --- Step 1: Search Qdrant safely ---
    let context = "";
    try {
      const result = await qClient.search({
        collectionName: COLLECTION,
        vector: Array(768).fill(0.5), // placeholder embedding
        limit: 3,
        withPayload: true,
      });
      context = (result || []).map(r => r.payload?.content || "").join("\n---\n");
    } catch (err) {
      console.error("❌ Qdrant search error:", err);
    }

    // --- Step 2: Generate response via Gemini ---
    const API_KEY = "AIzaSyA9mouxHU23TZtioHm67Zh7ybgMBZYLYm0";
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

    const geminiPrompt = `Context:\n${context}\n\nUser:\n${message}`;

    const geminiRes = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: geminiPrompt }] }]
      }),
    });

    const geminiData = await geminiRes.json();
    if (!geminiRes.ok) {
      console.error("❌ Gemini API error:", geminiData);
      return res.status(500).json({ error: geminiData.error?.message || "Gemini API failed" });
    }

    const answer = geminiData.candidates[0].content.parts[0].text;

    // --- Step 3: Save to Redis ---
    const key = `session:${sessionId}:history`;
    const existing = await redisClient.get(key);
    const history = existing ? JSON.parse(existing) : [];
    history.push(
      { role: "user", text: message },
      { role: "assistant", text: answer }
    );
    await redisClient.set(key, JSON.stringify(history), { EX: SESSION_TTL });

    res.json({ answer });
  } catch (err) {
    console.error("❌ Error in /query/:sessionId:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

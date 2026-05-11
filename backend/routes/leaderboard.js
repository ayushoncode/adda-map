import express from "express";
import { db } from "../firebase-admin.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const period = req.query.period === "week" ? "weeklyScoutPoints" : "scoutPoints";
    const snapshot = await db.collection("users").orderBy(period, "desc").limit(10).get();
    if (snapshot.empty) {
      return res.json({ users: [], period: req.query.period || "alltime" });
    }

    const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return res.json({ users, period: req.query.period || "alltime" });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;

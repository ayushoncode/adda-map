import express from "express";
import { db } from "../firebase-admin.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const period = req.query.period === "week" ? "weekly" : "alltime";
    const sortBy = req.query.sort || (period === "weekly" ? "weeklyScoutPoints" : "scoutPoints");

    const snapshot = await db.collection("users").limit(100).get();
    if (snapshot.empty) {
      return res.json({ users: [], period, totalScouts: 0 });
    }

    let users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // In-memory sort by requested metric
    if (sortBy === "spots") {
      users.sort((a, b) => (Number(b.spotsCount) || 0) - (Number(a.spotsCount) || 0));
    } else if (sortBy === "reviews") {
      users.sort((a, b) => (Number(b.reviewsCount) || 0) - (Number(a.reviewsCount) || 0));
    } else if (period === "weekly") {
      users.sort((a, b) => (Number(b.weeklyScoutPoints || b.scoutPoints) || 0) - (Number(a.weeklyScoutPoints || a.scoutPoints) || 0));
    } else {
      users.sort((a, b) => (Number(b.scoutPoints) || 0) - (Number(a.scoutPoints) || 0));
    }

    return res.json({
      users: users.slice(0, 30),
      period,
      totalScouts: users.length,
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return res.json({ users: [], period: req.query.period || "alltime", totalScouts: 0 });
  }
});

export default router;

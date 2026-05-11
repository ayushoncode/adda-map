import express from "express";
import { db } from "../firebase-admin.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const snapshot = await db
      .collection("feed")
      .orderBy("timestamp", "desc")
      .limit(30)
      .get();

    const feed = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const spotIds = [...new Set(feed.map((item) => item.spotId).filter(Boolean))];
    const spotSnapshots = await Promise.all(spotIds.map((spotId) => db.collection("spots").doc(spotId).get()));
    const spotMap = Object.fromEntries(
      spotSnapshots
        .filter((spotSnap) => spotSnap.exists)
        .map((spotSnap) => [spotSnap.id, spotSnap.data()])
    );

    const enrichedFeed = feed.map((item) => {
      const spot = spotMap[item.spotId] || {};
      return {
        ...item,
        spotLat: Number(item.meta?.spotLat ?? spot.lat ?? NaN),
        spotLng: Number(item.meta?.spotLng ?? spot.lng ?? NaN),
        spotAddress: spot.address || "",
      };
    });
    return res.json({ feed: enrichedFeed });
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch feed" });
  }
});

export default router;

import express from "express";
import { db } from "../firebase-admin.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { spotId } = req.query;
    let query = db.collection("reviews").orderBy("timestamp", "desc");
    if (spotId) {
      query = db.collection("reviews").where("spotId", "==", spotId).orderBy("timestamp", "desc");
    }

    const snapshot = await query.limit(50).get();
    const reviews = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return res.json({ reviews });
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch reviews" });
  }
});

export default router;

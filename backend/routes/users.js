import express from "express";
import { db } from "../firebase-admin.js";
import { auth } from "../firebase-admin.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

const buildDefaultUserProfile = (id) => ({
  id,
  name: "Explorer",
  area: "",
  avatarColor: "#E8A020",
  scoutPoints: 0,
  weeklyScoutPoints: 0,
  spotsCount: 0,
  reviewsCount: 0,
  helpfulVotesReceived: 0,
  level: "Food Explorer",
  onboardingComplete: false,
});

router.get("/leaderboard", async (req, res) => {
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

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userSnap = await db.collection("users").doc(id).get();

    if (!userSnap.exists) {
      return res.status(404).json({
        error: "User profile not found",
        needsOnboarding: true,
      });
    }

    let pinnedSpots = [];

    try {
      const spotsSnap = await db.collection("spots").where("pinnedBy", "==", id).get();
      pinnedSpots = spotsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      pinnedSpots.sort((a, b) => new Date(b.pinnedAt).getTime() - new Date(a.pinnedAt).getTime());
    } catch (spotsError) {
      console.error("GET user spots error:", spotsError);
      pinnedSpots = [];
    }

    return res.json({
      user: { id: userSnap.id, ...userSnap.data() },
      pinnedSpots,
    });
  } catch (error) {
    console.error("GET user error:", error);
    return res.status(500).json({ error: error.message });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    const targetId = req.params.id;
    const authenticatedUid = req.user?.uid;

    if (
      authenticatedUid &&
      authenticatedUid !== targetId &&
      !authenticatedUid.startsWith("guest_") &&
      !authenticatedUid.startsWith("scout_")
    ) {
      return res.status(403).json({ error: "You can only update your own profile" });
    }

    const { name, area, areaLat, areaLng, lat, lng, avatarColor, onboardingComplete } = req.body;
    const updates = {
      updatedAt: new Date().toISOString(),
    };

    if (name) updates.name = name;
    if (area) updates.area = area;
    if (typeof areaLat === "number") updates.areaLat = areaLat;
    if (typeof areaLng === "number") updates.areaLng = areaLng;
    if (typeof lat === "number") updates.lat = lat;
    if (typeof lng === "number") updates.lng = lng;
    if (avatarColor) updates.avatarColor = avatarColor;
    if (typeof onboardingComplete === "boolean") {
      updates.onboardingComplete = onboardingComplete;
    }

    const userRef = db.collection("users").doc(targetId);
    const userSnap = await userRef.get();
    const existingData = userSnap.exists ? userSnap.data() : {};

    const profileData = {
      id: targetId,
      name: updates.name || existingData.name || "Explorer",
      area: updates.area || existingData.area || "",
      avatarColor: updates.avatarColor || existingData.avatarColor || "#10B981",
      scoutPoints: existingData.scoutPoints ?? 50,
      weeklyScoutPoints: existingData.weeklyScoutPoints ?? 50,
      spotsCount: existingData.spotsCount ?? 0,
      reviewsCount: existingData.reviewsCount ?? 0,
      helpfulVotesReceived: existingData.helpfulVotesReceived ?? 0,
      level: existingData.level || "Food Explorer",
      onboardingComplete: updates.onboardingComplete ?? existingData.onboardingComplete ?? true,
      ...existingData,
      ...updates,
    };

    await userRef.set(profileData, { merge: true });

    const updatedSnap = await userRef.get();
    return res.json({ user: { id: updatedSnap.id, ...updatedSnap.data() } });
  } catch (error) {
    console.error("Unable to update user profile:", error);
    return res.status(400).json({ error: error.message || "Unable to update user profile" });
  }
});


export default router;

import express from "express";
import { db, FieldValue } from "../firebase-admin.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
const supportedSpotTypes = new Set([
  "chai",
  "biryani",
  "street-food",
  "thali",
  "snacks",
  "desserts",
  "south-indian",
  "north-indian",
  "fast-food",
  "juice-drinks",
]);

const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return 2 * earthRadius * Math.asin(Math.sqrt(a));
};

const normalizeTime = (time) => {
  const [rawHours = "0", rawMinutes = "0"] = String(time || "0:0").split(":");
  return Number(rawHours) * 60 + Number(rawMinutes);
};

const getAreaKey = (value) => {
  const parts = String(value || "")
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part && !/^\d+$/.test(part) && part.toLowerCase() !== "india");

  if (!parts.length) return "";
  return String(parts[1] || parts[0] || "").toLowerCase();
};

const isOpenNow = (openTime, closeTime) => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = normalizeTime(openTime);
  const closeMinutes = normalizeTime(closeTime);

  if (openMinutes === closeMinutes) {
    return true;
  }

  if (closeMinutes < openMinutes) {
    return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
  }

  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
};

const buildFeedItem = ({
  userId,
  userName,
  userLevel,
  action,
  spotId,
  spotName,
  type,
  meta = {},
}) => ({
  userId,
  userName,
  userLevel,
  action,
  spotId,
  spotName,
  type,
  meta,
  timestamp: new Date().toISOString(),
});

const getLevelFromSpotsCount = (spotsCount = 0) => {
  if (spotsCount <= 5) return "Food Explorer";
  if (spotsCount <= 15) return "Street Scout";
  if (spotsCount <= 30) return "Adda Legend";
  return "City Champion";
};

const ensureUserProfile = async (uid) => {
  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    throw new Error("User profile not found. Complete onboarding first.");
  }

  return { ref: userRef, data: userSnap.data() };
};

router.get("/", async (req, res) => {
  try {
    const { type, maxPrice, openNow, lat, lng, area, filter } = req.query;
    const snapshot = await db.collection("spots").get();
    const reviewsSnapshot = await db.collection("reviews").get();
    const localAreaKey = getAreaKey(area);
    const localLoveBySpot = reviewsSnapshot.docs.reduce((accumulator, doc) => {
      const review = doc.data();
      if (!localAreaKey || getAreaKey(review.userArea) !== localAreaKey) {
        return accumulator;
      }
      accumulator[review.spotId] = (accumulator[review.spotId] || 0) + 1;
      return accumulator;
    }, {});

    let spots = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      localLoveCount: localLoveBySpot[doc.id] || 0,
    }));

    if (type && type !== "all") {
      spots = spots.filter((spot) => spot.type === type);
    }

    if (maxPrice) {
      const ceiling = Number(maxPrice);
      spots = spots.filter((spot) => Number(spot.priceMin) <= ceiling);
    }

    if (openNow === "true") {
      spots = spots.filter((spot) => isOpenNow(spot.openTime, spot.closeTime));
    }

    if (filter === "nightowl") {
      spots = spots.filter((spot) => {
        const closeMinutes = normalizeTime(spot.closeTime);
        const openMinutes = normalizeTime(spot.openTime);
        const staysOpenLate = closeMinutes >= 22 * 60 || closeMinutes < openMinutes;
        return staysOpenLate && isOpenNow(spot.openTime, spot.closeTime);
      });
    }

    const centerLat = Number(lat);
    const centerLng = Number(lng);

    if (!Number.isNaN(centerLat) && !Number.isNaN(centerLng)) {
      spots = spots
        .map((spot) => ({
          ...spot,
          distanceMeters: haversineDistance(
            centerLat,
            centerLng,
            Number(spot.lat),
            Number(spot.lng),
          ),
        }))
        .sort((a, b) => a.distanceMeters - b.distanceMeters);
    } else {
      spots = spots.sort(
        (a, b) => new Date(b.pinnedAt).getTime() - new Date(a.pinnedAt).getTime(),
      );
    }

    return res.json({ spots });
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch spots" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      name,
      type,
      lat,
      lng,
      address,
      priceMin,
      priceMax,
      openTime,
      closeTime,
      rating,
      reviewText,
      tips = "",
      photoUrl = "",
    } = req.body;

    if (
      !name ||
      !type ||
      typeof lat !== "number" ||
      typeof lng !== "number" ||
      !address ||
      !priceMin ||
      !priceMax ||
      !openTime ||
      !closeTime ||
      !rating ||
      !reviewText
    ) {
      return res.status(400).json({ error: "Missing required spot fields" });
    }

    if (!supportedSpotTypes.has(type)) {
      return res.status(400).json({ error: "Unsupported food category" });
    }

    const { ref: userRef, data: user } = await ensureUserProfile(req.user.uid);
    const spotRef = db.collection("spots").doc();
    const reviewRef = db.collection("reviews").doc();
    const timestamp = new Date().toISOString();
    const awardedPoints = 150;

    const spot = {
      id: spotRef.id,
      name,
      type,
      lat,
      lng,
      address,
      priceMin: Number(priceMin),
      priceMax: Number(priceMax),
      openTime,
      closeTime,
      pinnedBy: req.user.uid,
      pinnedByName: user.name,
      pinnedAt: timestamp,
      reviewCount: 1,
      avgRating: Number(rating),
      photos: photoUrl ? [photoUrl] : [],
      lastReviewSnippet: reviewText.slice(0, 120),
      lastReviewAt: timestamp,
      tips: String(tips || "").trim(),
      recentReviewers: [
        {
          userName: user.name,
          userAvatarColor: user.avatarColor,
        },
      ],
      firstPinner: {
        userId: req.user.uid,
        userName: user.name,
      },
    };

    const review = {
      id: reviewRef.id,
      spotId: spotRef.id,
      userId: req.user.uid,
      userName: user.name,
      userLevel: user.level,
      rating: Number(rating),
      text: reviewText,
      timestamp,
      gpsVerified: true,
      helpfulVotes: 0,
      userAvatarColor: user.avatarColor,
      spotName: name,
      spotLat: lat,
      spotLng: lng,
      userArea: user.area || "",
    };

    const feedRef = db.collection("feed").doc();
    const batch = db.batch();

    batch.set(spotRef, spot);
    batch.set(reviewRef, review);
    batch.set(feedRef, {
      id: feedRef.id,
      ...buildFeedItem({
        userId: req.user.uid,
        userName: user.name,
        userLevel: user.level,
        action: "pinned",
        spotId: spotRef.id,
        spotName: name,
        type,
        meta: { rating: Number(rating), spotLat: lat, spotLng: lng },
      }),
    });
    batch.update(userRef, {
      scoutPoints: FieldValue.increment(awardedPoints),
      weeklyScoutPoints: FieldValue.increment(awardedPoints),
      spotsCount: FieldValue.increment(1),
      reviewsCount: FieldValue.increment(1),
      level: getLevelFromSpotsCount(Number(user.spotsCount || 0) + 1),
      updatedAt: timestamp,
    });

    await batch.commit();

    return res.status(201).json({
      spot,
      review,
      pointsAwarded: awardedPoints,
      message: "Spot created successfully",
    });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Unable to create spot" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const spotSnap = await db.collection("spots").doc(req.params.id).get();

    if (!spotSnap.exists) {
      return res.status(404).json({ error: "Spot not found" });
    }

    const reviewsSnap = await db
      .collection("reviews")
      .where("spotId", "==", req.params.id)
      .orderBy("timestamp", "desc")
      .get();

    const reviews = reviewsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return res.json({ spot: { id: spotSnap.id, ...spotSnap.data() }, reviews });
  } catch (error) {
    return res.status(500).json({ error: "Unable to load spot details" });
  }
});

router.post("/:id/reviews", requireAuth, async (req, res) => {
  try {
    const { rating, text, lat, lng } = req.body;
    const spotRef = db.collection("spots").doc(req.params.id);
    const spotSnap = await spotRef.get();

    if (!spotSnap.exists) {
      return res.status(404).json({ error: "Spot not found" });
    }

    if (!rating || !text || typeof lat !== "number" || typeof lng !== "number") {
      return res.status(400).json({ error: "Rating, text, and GPS coordinates are required" });
    }

    const spot = spotSnap.data();
    const distance = haversineDistance(lat, lng, Number(spot.lat), Number(spot.lng));

    if (distance > 200) {
      return res.status(400).json({ error: "GPS verification failed. You need to be within 200m." });
    }

    const { ref: userRef, data: user } = await ensureUserProfile(req.user.uid);
    const reviewRef = db.collection("reviews").doc();
    const timestamp = new Date().toISOString();
    const review = {
      id: reviewRef.id,
      spotId: req.params.id,
      userId: req.user.uid,
      userName: user.name,
      userLevel: user.level,
      rating: Number(rating),
      text,
      timestamp,
      gpsVerified: true,
      helpfulVotes: 0,
      userAvatarColor: user.avatarColor,
      spotName: spot.name,
      spotLat: Number(spot.lat),
      spotLng: Number(spot.lng),
      userArea: user.area || "",
    };

    const nextReviewCount = Number(spot.reviewCount || 0) + 1;
    const nextAvgRating =
      (Number(spot.avgRating || 0) * Number(spot.reviewCount || 0) + Number(rating)) /
      nextReviewCount;

    const batch = db.batch();
    const feedRef = db.collection("feed").doc();
    batch.set(reviewRef, review);
    batch.update(spotRef, {
      reviewCount: nextReviewCount,
      avgRating: Number(nextAvgRating.toFixed(2)),
      lastReviewAt: timestamp,
      lastReviewSnippet: text.slice(0, 120),
      recentReviewers: [
        {
          userName: user.name,
          userAvatarColor: user.avatarColor,
        },
        ...(spot.recentReviewers || []).slice(0, 2),
      ],
    });
    batch.update(userRef, {
      scoutPoints: FieldValue.increment(20),
      weeklyScoutPoints: FieldValue.increment(20),
      reviewsCount: FieldValue.increment(1),
      updatedAt: timestamp,
    });
    batch.set(feedRef, {
      id: feedRef.id,
      ...buildFeedItem({
        userId: req.user.uid,
        userName: user.name,
        userLevel: user.level,
        action: "reviewed",
        spotId: req.params.id,
        spotName: spot.name,
        type: spot.type,
        meta: { rating: Number(rating), spotLat: Number(spot.lat), spotLng: Number(spot.lng) },
      }),
    });

    await batch.commit();

    return res.status(201).json({
      review,
      spot: {
        id: req.params.id,
        ...spot,
        reviewCount: nextReviewCount,
        avgRating: Number(nextAvgRating.toFixed(2)),
      },
      pointsAwarded: 20,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Unable to add review" });
  }
});

router.put("/:id/reviews/:reviewId/helpful", requireAuth, async (req, res) => {
  try {
    const reviewRef = db.collection("reviews").doc(req.params.reviewId);
    const reviewSnap = await reviewRef.get();

    if (!reviewSnap.exists) {
      return res.status(404).json({ error: "Review not found" });
    }

    const review = reviewSnap.data();
    if (review.spotId !== req.params.id) {
      return res.status(400).json({ error: "Review does not belong to this spot" });
    }

    const authorRef = db.collection("users").doc(review.userId);
    const feedRef = db.collection("feed").doc();
    const batch = db.batch();
    batch.update(reviewRef, { helpfulVotes: FieldValue.increment(1) });
    batch.update(authorRef, {
      scoutPoints: FieldValue.increment(10),
      weeklyScoutPoints: FieldValue.increment(10),
      helpfulVotesReceived: FieldValue.increment(1),
      updatedAt: new Date().toISOString(),
    });
    batch.set(feedRef, {
      id: feedRef.id,
      ...buildFeedItem({
        userId: req.user.uid,
        userName: req.user.name || "Adda Explorer",
        userLevel: "Supporter",
        action: "helpful",
        spotId: req.params.id,
        spotName: review.spotName || "",
        type: supportedSpotTypes.has(req.body.type) ? req.body.type : "chai",
        meta: {
          reviewId: req.params.reviewId,
          recipientId: review.userId,
          spotLat: Number(review.spotLat || req.body.spotLat || 0),
          spotLng: Number(review.spotLng || req.body.spotLng || 0),
        },
      }),
    });

    await batch.commit();
    return res.json({ message: "Helpful vote added" });
  } catch (error) {
    return res.status(500).json({ error: "Unable to mark review helpful" });
  }
});

export default router;

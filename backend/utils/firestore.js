import admin, { db } from '../firebase-admin.js';
import { getScoutLevel } from './helpers.js';

export async function ensureUserProfile(decodedUser) {
  const userRef = db.collection('users').doc(decodedUser.uid);
  const snapshot = await userRef.get();
  if (snapshot.exists) return snapshot.data();

  const nextUser = {
    id: decodedUser.uid,
    name: decodedUser.name || decodedUser.email?.split('@')[0] || 'Adda User',
    email: decodedUser.email || '',
    area: '',
    avatarColor: '#E8A020',
    scoutPoints: 0,
    weeklyScoutPoints: 0,
    spotsCount: 0,
    reviewsCount: 0,
    helpfulVotes: 0,
    level: 'Food Explorer',
    onboardingComplete: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await userRef.set(nextUser);
  return nextUser;
}

export async function incrementUserStats(userId, updates = {}, points = 0, deltas = {}) {
  const userRef = db.collection('users').doc(userId);
  const snapshot = await userRef.get();
  const current = snapshot.exists ? snapshot.data() : { spotsCount: 0 };
  const nextSpotsCount = (current.spotsCount || 0) + (deltas.spotsCount || 0);

  await userRef.set(
    {
      ...updates,
      scoutPoints: admin.firestore.FieldValue.increment(points),
      weeklyScoutPoints: admin.firestore.FieldValue.increment(points),
      level: getScoutLevel(nextSpotsCount),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}

export async function createFeedItem(payload) {
  const ref = db.collection('feed').doc();
  const item = {
    id: ref.id,
    ...payload,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  };
  await ref.set(item);
  return item;
}

export async function enrichSpot(spot) {
  const reviewsSnapshot = await db
    .collection('reviews')
    .where('spotId', '==', spot.id)
    .orderBy('timestamp', 'desc')
    .limit(20)
    .get();

  const reviews = reviewsSnapshot.docs.map((doc) => doc.data());
  return {
    ...spot,
    reviews,
    latestReviewSnippet: reviews[0]?.text || '',
    latestReviewAt: reviews[0]?.timestamp?.toDate?.()?.toISOString() || null,
    lastReviewers: reviews.slice(0, 3).map((review) => ({
      userId: review.userId,
      userName: review.userName,
      avatarColor: review.avatarColor
    }))
  };
}

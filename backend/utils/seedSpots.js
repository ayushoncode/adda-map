import { db } from "../firebase-admin.js";

const seedSpots = [
  {
    name: "Third Wave Chai Corner",
    type: "chai",
    lat: 12.9346,
    lng: 77.6113,
    address: "80 Feet Road, Koramangala, Bengaluru",
    priceMin: 15,
    priceMax: 40,
    openTime: "06:30",
    closeTime: "23:00",
    avgRating: 4.5,
    reviewCount: 8,
    tips: "Strong ginger chai and bun maska after sunset.",
  },
  {
    name: "Late Night Biryani Adda",
    type: "biryani",
    lat: 12.9368,
    lng: 77.6204,
    address: "5th Block, Koramangala, Bengaluru",
    priceMin: 90,
    priceMax: 220,
    openTime: "12:00",
    closeTime: "01:00",
    avgRating: 4.6,
    reviewCount: 14,
    tips: "Best for dum biryani and extra salan.",
  },
  {
    name: "Campus Kulhad Stop",
    type: "chai",
    lat: 12.9281,
    lng: 77.6261,
    address: "Near Jyoti Nivas College Road, Koramangala, Bengaluru",
    priceMin: 20,
    priceMax: 35,
    openTime: "07:00",
    closeTime: "22:30",
    avgRating: 4.3,
    reviewCount: 5,
    tips: "Kulhad chai with crisp samosas in the evening.",
  },
  {
    name: "Empire Lane Biryani Point",
    type: "biryani",
    lat: 12.9309,
    lng: 77.6149,
    address: "1st Cross, Koramangala, Bengaluru",
    priceMin: 110,
    priceMax: 260,
    openTime: "11:30",
    closeTime: "23:45",
    avgRating: 4.4,
    reviewCount: 11,
    tips: "Chicken biryani sells out fast after 9 PM.",
  },
  {
    name: "Silk Board Tea Bench",
    type: "chai",
    lat: 12.9177,
    lng: 77.6238,
    address: "Silk Board Junction Service Road, Bengaluru",
    priceMin: 10,
    priceMax: 25,
    openTime: "05:30",
    closeTime: "21:30",
    avgRating: 4.1,
    reviewCount: 6,
    tips: "Quick stop for cutting chai before office runs.",
  },
  {
    name: "Midnight Matka Biryani",
    type: "biryani",
    lat: 12.9399,
    lng: 77.6286,
    address: "6th Block, Koramangala, Bengaluru",
    priceMin: 140,
    priceMax: 280,
    openTime: "18:00",
    closeTime: "02:00",
    avgRating: 4.7,
    reviewCount: 9,
    tips: "Order the matka biryani if you want the smoky finish.",
  },
  {
    name: "Forum Filter Chai",
    type: "chai",
    lat: 12.9341,
    lng: 77.6102,
    address: "Near Forum South End Road, Koramangala, Bengaluru",
    priceMin: 18,
    priceMax: 45,
    openTime: "08:00",
    closeTime: "22:00",
    avgRating: 4.2,
    reviewCount: 7,
    tips: "Masala chai and toast are a safe combo here.",
  },
  {
    name: "BTM Dum Biryani Hub",
    type: "biryani",
    lat: 12.9162,
    lng: 77.6108,
    address: "Stage 2, BTM Layout, Bengaluru",
    priceMin: 100,
    priceMax: 240,
    openTime: "11:00",
    closeTime: "00:00",
    avgRating: 4.3,
    reviewCount: 13,
    tips: "Their raita is actually worth adding.",
  },
  {
    name: "Indiranagar Evening Chai Cart",
    type: "chai",
    lat: 12.9712,
    lng: 77.6412,
    address: "100 Feet Road, Indiranagar, Bengaluru",
    priceMin: 15,
    priceMax: 30,
    openTime: "16:00",
    closeTime: "23:30",
    avgRating: 4.4,
    reviewCount: 10,
    tips: "Go after 7 PM for the liveliest crowd.",
  },
  {
    name: "Church Street Biryani House",
    type: "biryani",
    lat: 12.9757,
    lng: 77.6055,
    address: "Church Street, Bengaluru",
    priceMin: 130,
    priceMax: 300,
    openTime: "12:30",
    closeTime: "23:59",
    avgRating: 4.5,
    reviewCount: 12,
    tips: "Rich masala, generous portions, and good for groups.",
  },
];

const buildSeedSpot = (ref, spot, index) => {
  const pinnedAt = new Date(Date.now() - (seedSpots.length - index) * 60 * 60 * 1000).toISOString();

  return {
    id: ref.id,
    ...spot,
    pinnedBy: "system-seed",
    pinnedByName: "Adda Map",
    pinnedAt,
    photos: [],
    lastReviewSnippet: spot.tips,
    lastReviewAt: pinnedAt,
    recentReviewers: [],
    firstPinner: {
      userId: "system-seed",
      userName: "Adda Map",
    },
  };
};

export async function seedIfEmpty() {
  const existingSnapshot = await db.collection("spots").limit(1).get();

  if (!existingSnapshot.empty) {
    console.log("Firestore already has spots. Skipping seed.");
    return 0;
  }

  for (const [index, spot] of seedSpots.entries()) {
    const ref = db.collection("spots").doc();
    const payload = buildSeedSpot(ref, spot, index);
    await ref.set(payload);
    console.log(`Seeded spot ${index + 1}/${seedSpots.length}: ${payload.name}`);
  }

  return seedSpots.length;
}

# Adda Map

Adda Map is a full-stack neighborhood food discovery app for chai and biryani lovers. This repo includes a React + Vite frontend, an Express backend, Firebase Auth with Google login, Firestore for live shared data, Firebase Storage for photos, Leaflet/OpenStreetMap for maps, and deploy-ready setup notes for Vercel + Railway.

## Stack

- Frontend: React, Vite, Axios, Leaflet, React Leaflet
- Backend: Node.js, Express, Firebase Admin SDK
- Auth: Firebase Auth with Google sign-in
- Database: Firestore
- Storage: Firebase Storage
- Hosting: Vercel for `frontend`, Railway for `backend`

## Folder Structure

```text
adda-map/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── api.js
│   │   ├── firebase.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── styles.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── middleware/
│   ├── routes/
│   ├── firebase-admin.js
│   ├── index.js
│   └── package.json
├── firestore.rules
├── storage.rules
├── .env.example
└── README.md
```

## Firestore Collections

### `spots/{spotId}`

```json
{
  "id": "spot_doc_id",
  "name": "Usman Biryani",
  "type": "biryani",
  "lat": 12.9279,
  "lng": 77.6271,
  "address": "Koramangala, Bangalore",
  "priceMin": 80,
  "priceMax": 120,
  "openTime": "11:00",
  "closeTime": "01:00",
  "pinnedBy": "firebase_uid",
  "pinnedByName": "Ayush",
  "pinnedAt": "2026-05-11T10:00:00.000Z",
  "reviewCount": 12,
  "avgRating": 4.6,
  "photos": ["https://..."],
  "lastReviewSnippet": "Go after 11:30 PM for the freshest batch.",
  "lastReviewAt": "2026-05-11T10:00:00.000Z",
  "recentReviewers": [{ "userName": "Ayush", "userAvatarColor": "#E8A020" }],
  "firstPinner": { "userId": "firebase_uid", "userName": "Ayush" }
}
```

### `reviews/{reviewId}`

```json
{
  "id": "review_doc_id",
  "spotId": "spot_doc_id",
  "spotName": "Usman Biryani",
  "userId": "firebase_uid",
  "userName": "Ayush",
  "userLevel": "Chai Scout",
  "rating": 5,
  "text": "Solid biryani, especially late evening.",
  "timestamp": "2026-05-11T10:00:00.000Z",
  "gpsVerified": true,
  "helpfulVotes": 3,
  "userAvatarColor": "#1D9E75"
}
```

### `users/{userId}`

```json
{
  "id": "firebase_uid",
  "name": "Ayush",
  "area": "Koramangala, Bangalore",
  "avatarColor": "#E8A020",
  "scoutPoints": 210,
  "weeklyScoutPoints": 110,
  "spotsCount": 4,
  "reviewsCount": 6,
  "helpfulVotesReceived": 8,
  "level": "Chai Scout",
  "onboardingComplete": true,
  "updatedAt": "2026-05-11T10:00:00.000Z"
}
```

### `feed/{feedId}`

```json
{
  "id": "feed_doc_id",
  "userId": "firebase_uid",
  "userName": "Ayush",
  "userLevel": "Chai Scout",
  "action": "pinned",
  "spotId": "spot_doc_id",
  "spotName": "Usman Biryani",
  "timestamp": "2026-05-11T10:00:00.000Z",
  "type": "biryani",
  "meta": { "rating": 5 }
}
```

## API Summary

- `GET /api/spots`
- `POST /api/spots`
- `GET /api/spots/:id`
- `POST /api/spots/:id/reviews`
- `PUT /api/spots/:id/reviews/:reviewId/helpful`
- `GET /api/feed`
- `GET /api/leaderboard?period=week|alltime`
- `GET /api/users/:id`
- `PUT /api/users/:id`

## Setup

1. Create a Firebase project and enable:
   - Google Authentication
   - Firestore
   - Firebase Storage
2. Copy `.env.example` to `.env` at the repo root and replace the placeholder values.
3. Install frontend dependencies:

```bash
cd frontend
npm install
```

4. Install backend dependencies:

```bash
cd backend
npm install
```

5. Run the backend:

```bash
cd backend
npm run dev
```

6. Run the frontend:

```bash
cd frontend
npm run dev
```

## Firebase Rules

- Deploy Firestore rules from [firestore.rules](/Users/ayush/Desktop/CHAISPOT/firestore.rules)
- Deploy Storage rules from [storage.rules](/Users/ayush/Desktop/CHAISPOT/storage.rules)

## Deployment

### Frontend to Vercel

1. Import the `frontend` directory into Vercel.
2. Set:
   - `VITE_API_URL`
   - `VITE_FIREBASE_CONFIG`
3. Build command: `npm run build`
4. Output directory: `dist`

### Backend to Railway

1. Import the `backend` directory into Railway.
2. Set:
   - `PORT`
   - `FRONTEND_URL`
   - `FIREBASE_SERVICE_ACCOUNT`
3. Start command: `npm start`

## Notes

- The frontend uses state-based routing in `App.jsx`; no `react-router` is required.
- Every authenticated API request attaches a Firebase ID token through Axios interceptors.
- Helpful votes, new spots, and new reviews write feed events automatically.
- GPS review validation is enforced in the backend using a 100 meter Haversine check.

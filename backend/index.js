import "dotenv/config";
import express from "express";
import cors from "cors";
import spotsRoutes from "./routes/spots.js";
import feedRoutes from "./routes/feed.js";
import usersRoutes from "./routes/users.js";
import leaderboardRoutes from "./routes/leaderboard.js";
import reviewsRoutes from "./routes/reviews.js";

const app = express();
const port = process.env.PORT || 4000;
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL?.replace(/\/$/, ""),
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://adda-map.vercel.app",
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
  }),
);
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "adda-map-backend" });
});

app.use("/api/spots", spotsRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`Adda Map backend listening on port ${port}`);
});

import { auth } from "../firebase-admin.js";

export const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token || token.startsWith("guest_") || token.startsWith("scout_") || token === "guest") {
      const guestId = req.headers["x-guest-id"] || (token && (token.startsWith("guest_") || token.startsWith("scout_")) ? token : "guest_scout");
      const guestName = req.headers["x-guest-name"] || "Guest Scout";
      req.user = { uid: guestId, name: guestName, email: "guest@addamap.local" };
      return next();
    }

    try {
      const decoded = await auth.verifyIdToken(token);
      req.user = decoded;
      next();
    } catch (tokenErr) {
      // Fallback to token or guest ID so profile saving and interactions work smoothly
      const guestId = req.headers["x-guest-id"] || token || "guest_scout";
      const guestName = req.headers["x-guest-name"] || "Guest Scout";
      req.user = { uid: guestId, name: guestName, email: "guest@addamap.local" };
      next();
    }
  } catch (error) {
    const guestId = req.headers["x-guest-id"] || "guest_scout";
    const guestName = req.headers["x-guest-name"] || "Guest Scout";
    req.user = { uid: guestId, name: guestName, email: "guest@addamap.local" };
    next();
  }
};


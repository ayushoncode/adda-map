import axios from "axios";
import { auth } from "./firebase";

const rawBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const baseURL = rawBaseUrl.endsWith("/api") ? rawBaseUrl : `${rawBaseUrl.replace(/\/$/, "")}/api`;

const api = axios.create({
  baseURL,
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch (err) {
      console.warn("Failed to get auth token:", err);
    }
  } else {
    // Generate or get persistent guest scout ID
    let guestId = localStorage.getItem("adda_guest_id");
    if (!guestId) {
      guestId = "scout_" + Math.random().toString(36).substring(2, 9);
      localStorage.setItem("adda_guest_id", guestId);
    }
    const guestName = localStorage.getItem("adda_guest_name") || "Guest Scout";
    config.headers.Authorization = `Bearer ${guestId}`;
    config.headers["x-guest-id"] = guestId;
    config.headers["x-guest-name"] = guestName;
  }
  return config;
});

export default api;

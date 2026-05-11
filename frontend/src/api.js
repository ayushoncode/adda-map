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
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

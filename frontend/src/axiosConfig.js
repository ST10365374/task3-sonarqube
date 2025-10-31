// frontend/src/axiosConfig.js
import axios from "axios";
import { API_BASE } from "./config";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // ✅ include cookies (for JWT + CSRF)
});

// Automatically attach CSRF token for POST, PUT, DELETE
api.interceptors.request.use(
  async (config) => {
    const methodsRequiringCsrf = ["post", "put", "delete"];
    if (methodsRequiringCsrf.includes(config.method)) {
      try {
        const csrfRes = await axios.get(`${API_BASE}/api/csrf-token`, {
          withCredentials: true,
        });
        config.headers["CSRF-Token"] = csrfRes.data.csrfToken;
      } catch (err) {
        console.error("❌ Failed to fetch CSRF token:", err);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;

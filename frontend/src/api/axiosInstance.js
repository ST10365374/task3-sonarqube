// frontend/src/api/axiosInstance.js
import axios from "axios";
import { API_BASE } from "../config"; // ensure API_BASE = "https://localhost:5001"

const axiosInstance = axios.create({
  baseURL: API_BASE,  // e.g. "https://localhost:5001"
  withCredentials: true, // send cookies
});

export default axiosInstance;

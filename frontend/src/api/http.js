import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const http = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // IMPORTANT: enables jwt cookie
  headers: {
    "Content-Type": "application/json",
  },
});

export default http;

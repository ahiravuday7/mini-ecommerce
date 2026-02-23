import http from "./http";

export const register = (payload) => http.post("/api/auth/register", payload);
export const login = (payload) => http.post("/api/auth/login", payload);
export const logout = () => http.post("/api/auth/logout");
export const me = () => http.get("/api/auth/me");

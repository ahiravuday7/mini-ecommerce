import http from "./http";

export const fetchAdminDashboard = () => http.get("/api/admin/dashboard");

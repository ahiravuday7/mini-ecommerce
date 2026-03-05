import http from "./http";

export const fetchAdminUsers = (params = {}) =>
  http.get("/api/admin/users", { params });

export const fetchAdminUserDetails = (id) => http.get(`/api/admin/users/${id}`);

export const fetchAdminUserOrders = (id, params = {}) =>
  http.get(`/api/admin/users/${id}/orders`, { params });

export const setAdminUserBlockStatus = (id, isBlocked) =>
  http.patch(`/api/admin/users/${id}/block`, { isBlocked });

export const deleteAdminUser = (id) => http.delete(`/api/admin/users/${id}`);

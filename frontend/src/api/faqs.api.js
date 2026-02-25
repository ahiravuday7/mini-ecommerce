import http from "./http";

// public
export const fetchFaqs = (params) => http.get("/api/faqs", { params });

// admin
export const adminFetchFaqs = (params) =>
  http.get("/api/admin/faqs", { params });
export const adminCreateFaq = (payload) => http.post("/api/admin/faqs", payload);
export const adminUpdateFaq = (id, payload) =>
  http.put(`/api/admin/faqs/${id}`, payload);
export const adminToggleFaq = (id) => http.patch(`/api/admin/faqs/${id}/toggle`);
export const adminDeleteFaq = (id) => http.delete(`/api/admin/faqs/${id}`);

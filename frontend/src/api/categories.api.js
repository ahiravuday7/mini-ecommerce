import http from "./http";

export const fetchCategories = (params) => http.get("/api/categories", { params });

// admin
export const createCategory = (payload) => http.post("/api/categories", payload);
export const updateCategory = (id, payload) =>
  http.put(`/api/categories/${id}`, payload);
export const deleteCategory = (id) => http.delete(`/api/categories/${id}`);

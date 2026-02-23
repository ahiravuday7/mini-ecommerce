import http from "./http";

export const fetchProducts = (params) => http.get("/api/products", { params });
export const fetchProductById = (id) => http.get(`/api/products/${id}`);

// admin
export const createProduct = (payload) => http.post("/api/products", payload);
export const updateProduct = (id, payload) =>
  http.put(`/api/products/${id}`, payload);
export const deleteProduct = (id) => http.delete(`/api/products/${id}`);

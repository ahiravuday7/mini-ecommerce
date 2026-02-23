import http from "./http";

export const getCart = () => http.get("/api/cart");
export const addToCart = (payload) => http.post("/api/cart/add", payload);
export const updateCartItem = (payload) =>
  http.put("/api/cart/update", payload);
export const removeFromCart = (productId) =>
  http.delete(`/api/cart/remove/${productId}`);
export const clearCart = () => http.delete("/api/cart/clear");

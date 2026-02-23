import http from "./http";

export const placeOrder = (payload) => http.post("/api/orders", payload);
export const getMyOrders = () => http.get("/api/orders/my");
export const getOrderById = (id) => http.get(`/api/orders/${id}`);

// admin
export const getAllOrders = () => http.get("/api/orders");

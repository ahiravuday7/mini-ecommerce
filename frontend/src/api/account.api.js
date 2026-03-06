import http from "./http";

export const getMyAccount = () => http.get("/api/account");
export const updateMyProfile = (payload) =>
  http.put("/api/account/profile", payload);
export const updateMyShippingAddress = (payload) =>
  http.put("/api/account/shipping-address", payload);
export const deleteMyAccount = (payload) =>
  http.delete("/api/account", { data: payload });

import API from "./axios";

export const registerUser  = (data) => API.post("/auth/register", data);
export const loginUser     = (data) => API.post("/auth/login", data);
export const loginVisitor  = (data) => API.post("/auth/visitor", data);
export const loginAdmin    = (data) => API.post("/auth/admin", data);

export const getMenu        = (category) => API.get(`/menu${category ? `?category=${category}` : ""}`);
export const addMenuItem    = (data)     => API.post("/menu", data);
export const deleteMenuItem = (id)       => API.delete(`/menu/${id}`);
export const updateQuantity = (id, qty)  => API.put(`/menu/${id}/quantity`, { quantity: qty });
export const toggleItem     = (id)       => API.put(`/menu/${id}/toggle`);

export const placeOrder    = (data)         => API.post("/orders", data);
export const getMyOrders   = ()             => API.get("/orders/my");
export const getAllOrders   = ()             => API.get("/orders");
export const updateStatus  = (id, status)   => API.put(`/orders/${id}/status`, { status });
export const getQueueCount = ()             => API.get("/orders/queue");

export const raiseComplaint        = (data)         => API.post("/complaints", data);
export const getMyComplaints       = ()             => API.get("/complaints/my");
export const getAllComplaints       = ()             => API.get("/complaints");
export const replyComplaint        = (id, reply)    => API.put(`/complaints/${id}/reply`, { reply });
export const updateComplaintStatus = (id, status)   => API.put(`/complaints/${id}/status`, { status });

export const getDashboard = ()           => API.get("/analytics/dashboard");
export const getPeakHours = ()           => API.get("/analytics/peak");
export const getRevenue   = (from, to)   => API.get(`/analytics/revenue?from=${from}&to=${to}`);
export const updateMenuItem = (id, data) => API.put(`/menu/${id}`, data);
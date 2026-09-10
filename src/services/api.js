import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  const clientId = sessionStorage.getItem("clientId");
  const lastActive = sessionStorage.getItem("lastActive");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  if (clientId && !config.url.includes("/auth")) {
    config.headers["x-client-id"] = clientId;
    config.headers["x-last-active"] = lastActive;
  }

  return config;
});


export default api;

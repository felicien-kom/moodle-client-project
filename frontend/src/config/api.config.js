export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1",
  timeout: 15_000, // ms

  endpoints: {
    login: "/auth/login/",
    register: "/auth/register/",
    logout: "/auth/logout/",
    refresh: "/auth/token/refresh/",
  },

  storage: {
    accessToken: "access_token",
    refreshToken: "refresh_token",
  },

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};
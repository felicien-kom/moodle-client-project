export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1",
  timeout: 90_000,

  endpoints: {
    login:    "/auth/login/",
    register: "/auth/profiles/",
    profiles: "/auth/profiles/",
    logout:   "/auth/logout/",
    me:       "/auth/me/",
  },

  storage: {
    token: "access_token",
    moodleUser: "moodle_user",
  },

  headers: {
    "Content-Type": "application/json",
    Accept:         "application/json",
  },
};
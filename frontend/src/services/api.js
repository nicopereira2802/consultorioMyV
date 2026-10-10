import axios from "axios";

const API_URL = import.meta.env.DEV
  ? "http://localhost:3000/api"
  : "https://api.espaciocuatrovientos.com/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

/* api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}); */

/* api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const token = localStorage.getItem("token");

        const { data } = await axios.post(
          "http://localhost:3000/api/usuarios/refreshToken",
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        localStorage.setItem("token", data.token);

        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
); */

export default api;

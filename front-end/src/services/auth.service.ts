import axiosInstance from "../api/axios";

export const authService = {
  async login(credentials: { login: string; password: string; type: string }) {
    const response = await axiosInstance.post("/login", credentials);
    return response.data;
  },

  async logout() {
    await axiosInstance.post("/logout");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
  },

  async me() {
    const response = await axiosInstance.get("/me");
    return response.data;
  },
};

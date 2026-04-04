const BASE_URL = "http://localhost/projectPhp/clothes-shop/back-end/api";
import { authUtils } from '../utils/auth.js';

export const authApi = {
  login: async (email, password) => {
    try {
      const res = await fetch(`${BASE_URL}/auth/login.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      return await res.json();
    } catch (error) {
      console.error("Lỗi api login:", error);
      return { status: false, message: "Không thể kết nối máy chủ" };
    }
  },
  register: async (data) => {
    try {
      const res = await fetch(`${BASE_URL}/auth/register.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (error) {
      console.error("Lỗi api Register:", error);
      return { status: false, message: "Không thể kết nối máy chủ" };
    }
  },
  logout: async () => {
    try {
      const token = authUtils.getToken();

      const res = await fetch(`${BASE_URL}/auth/logout.php`, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
        },
      });

      return await res.json();
    } catch (error) {
      console.error("Lỗi api logout:", error);
      return { status: false, message: "Không thể kết nối máy chủ" };
    }
  },
};

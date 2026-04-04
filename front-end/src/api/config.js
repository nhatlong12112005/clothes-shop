export const BASE_URL = 'http://localhost/projectPhp/clothes-shop/back-end/api';
import { authUtils } from '../utils/auth.js';

/**
 * Hàm chung để gọi API với Fetch
 * @param {string} endpoint - Đường dẫn API (ví dụ: '/category/getCate.php')
 * @param {object} options - Cấu hình fetch (method, body, headers...)
 * @returns {Promise<any>}
 */
export async function fetchAPI(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  // Lấy token từ localStorage (qua authUtils để tự nhận diện admin hay user)
  const token = authUtils.getToken() || '';

  // Header mặc định (nếu không có)
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json().catch(() => null);
    
    if (!response.ok) {
      if (response.status === 401 && window.location.pathname !== '/login.html') {
          // Xử lý tự động out ra nếu hết hạn Token
          localStorage.removeItem(authUtils.getTokenKey());
          localStorage.removeItem(authUtils.getUserKey());
          alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          window.location.href = '/clothes-shop/front-end/src/user/account/login.html';
      }
      throw new Error((data && data.message) ? data.message : `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`Lỗi khi gọi API ${endpoint}:`, error);
    throw error;
  }
}

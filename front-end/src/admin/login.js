import { authApi } from '../api/authApi.js';
import { authUtils } from '../utils/auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('adminLoginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value.trim();
      const result = await authApi.login(email, password);
      if (result.status) {
        authUtils.setAuth(result.user, result.token);
        if (authUtils.isAdmin()) {
          window.location.href = './index.html';
        } else {
          alert('Tài khoản này không có quyền quản trị.');
        }
      } else {
        alert(result.message || 'Đăng nhập thất bại');
      }
    });
  }
});

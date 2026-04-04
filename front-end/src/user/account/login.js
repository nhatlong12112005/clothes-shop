import "../../utils/header.js";
import { authApi } from "../../api/authApi.js";
import { authUtils } from "../../utils/auth.js";
import { loadCategories, renderCategory } from "../../api/category.js";

document.addEventListener('DOMContentLoaded', async () => {
  // Tải danh mục cho Header
  const categories = await loadCategories();
  renderCategory(categories, "dropdownMenu");

  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    const result = await authApi.login(email, password);


    if (result.status) {
      // lưu user + token
      authUtils.setAuth(result.user, result.token);

      alert("Đăng nhập thành công");

      window.location.href = "../index.html";
    } else {
      alert(result.message || "Sai email hoặc mật khẩu");
    }
  });
}
});

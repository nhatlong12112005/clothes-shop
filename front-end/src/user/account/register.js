import "../../utils/header.js";
import { authApi } from "../../api/authApi.js";
import { loadCategories, renderCategory } from "../../api/category.js";

document.addEventListener('DOMContentLoaded', async () => {
  // Tải danh mục cho Header
  const categories = await loadCategories();
  renderCategory(categories, "dropdownMenu");

  const registerForm = document.getElementById("registerForm");

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = {
      username: document.getElementById("username").value.trim(),
      email: document.getElementById("email").value.trim(),
      phone: document.getElementById("tel").value.trim(),
      address: document.getElementById("address").value.trim(),
      password: document.getElementById("password").value.trim(),
    };
    const result = await authApi.register(data);
    if (result.status) {
      alert("Đăng ký thành công! Vui lòng đăng nhập");
      window.location.href = "login.html";
    } else {
      alert(result.status || "Đăng ký thất bại");
    }
  });
}
});

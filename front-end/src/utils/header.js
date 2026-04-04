import { authUtils } from './auth.js';

const user = JSON.parse(localStorage.getItem("user_info"));

const usernameEl = document.getElementById("username");
const userBtn = document.getElementById("userBtn");
const userMenu = document.getElementById("userMenu");
const dropdownBtn = document.getElementById("dropdownBtn");
const dropdownMenu = document.getElementById("dropdownMenu");

if (user && userBtn && usernameEl) {
  // hiển thị tên user
  usernameEl.textContent = user.username || user.email;
  // mở dropdown User
  userBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    userMenu.classList.toggle("hidden");
    if(dropdownMenu) dropdownMenu.classList.add("hidden");
  });
} else if (userBtn) {
  // Thay thế icon user bằng các liên kết đăng nhập/đăng ký rõ ràng
  const authContainer = document.createElement("div");
  authContainer.className = "flex items-center gap-3 text-sm font-semibold";
  authContainer.innerHTML = `
    <a href="/clothes-shop/front-end/src/user/account/login.html" class="hover:text-blue-600 transition">Đăng nhập</a>
    <span class="text-gray-300">|</span>
    <a href="/clothes-shop/front-end/src/user/account/register.html" class="hover:text-blue-600 transition">Đăng ký</a>
  `;
  
  // Thay thế nút user icon cũ bằng authContainer
  userBtn.parentNode.replaceChild(authContainer, userBtn);
}

// mở dropdown Danh mục
if (dropdownBtn && dropdownMenu) {
  dropdownBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle("hidden");
    if(userMenu) userMenu.classList.add("hidden");
  });
}

// click ngoài đóng dropdown
document.addEventListener("click", (e) => {
  if (userBtn && userMenu && !userBtn.contains(e.target) && !userMenu.contains(e.target)) {
    userMenu.classList.add("hidden");
  }
  if (dropdownBtn && dropdownMenu && !dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
    dropdownMenu.classList.add("hidden");
  }
});

// logout - dùng authUtils để nhất quán với hệ thống auth
window.logout = function () {
  authUtils.logout();
};

// Cập nhật số lượng giỏ hàng trên Header
export function updateCartBadge(count) {
  const badge = document.getElementById("cartBadgeCount");
  if(badge) {
    badge.textContent = count;
    badge.classList.toggle('hidden', count === 0);
  }
}

// Auto-fetch cart count on page load
if (user && (user.id || user.user_id)) {
  const checkCartCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost/projectPhp/clothes-shop/back-end/api/cart/list.php?user_id=${user.id || user.user_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.status && data.data) {
        let totalCount = 0;
        data.data.forEach(i => totalCount += parseInt(i.quantity));
        updateCartBadge(totalCount);
      }
    } catch(e) {
      console.error("Lỗi lấy giỏ hàng ban đầu:", e);
    }
  };
  checkCartCount();
}

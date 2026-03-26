import { authUtils } from "./auth.js";

if (!authUtils.isLoggedIn() || !authUtils.isAdmin()) {
  alert("Bạn không có quyền truy cập trang này!");
  window.location.replace(
    "/clothes-shop/front-end/src/user/account/login.html",
  );
}

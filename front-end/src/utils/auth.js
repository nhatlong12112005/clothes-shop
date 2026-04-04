export const authUtils = {
  isAdminPage: () => window.location.pathname.includes('/admin'),
  
  getUserKey: () => authUtils.isAdminPage() ? "admin_user_info" : "user_info",
  getTokenKey: () => authUtils.isAdminPage() ? "admin_token" : "token",

  setAuth: (user, token) => {
    localStorage.setItem(authUtils.getUserKey(), JSON.stringify(user));
    localStorage.setItem(authUtils.getTokenKey(), token);
  },

  getUser: () => {
    const user = localStorage.getItem(authUtils.getUserKey());
    return user ? JSON.parse(user) : null;
  },

  getToken: () => {
    return localStorage.getItem(authUtils.getTokenKey());
  },

  logout: () => {
    localStorage.removeItem(authUtils.getUserKey());
    localStorage.removeItem(authUtils.getTokenKey());
    if (authUtils.isAdminPage()) {
      window.location.href = "/clothes-shop/front-end/src/admin/login.html";
    } else {
      window.location.href = "/clothes-shop/front-end/src/user/index.html";
    }
  },

  isLoggedIn: () => {
    return !!localStorage.getItem(authUtils.getTokenKey());
  },

  isAdmin: () => {
    const user = authUtils.getUser();
    return user && user.role === "admin";
  },
};

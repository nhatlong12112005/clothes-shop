const USER_KEY = "user_info";
const TOKEN_KEY = "token";

export const authUtils = {
  setAuth: (user, token) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(TOKEN_KEY, token);
  },

  getUser: () => {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },

  logout: () => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = "/clothes-shop/front-end/src/user/index.html";
  },

  isLoggedIn: () => {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  isAdmin: () => {
    const user = authUtils.getUser();
    return user && user.role === "admin";
  },
};

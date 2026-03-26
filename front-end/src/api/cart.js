import { fetchAPI } from './config.js';

export async function getCartList(userId) {
  try {
    const res = await fetchAPI(`/cart/list.php?user_id=${userId}`);
    return res;
  } catch(e) {
    console.error("Lỗi lấy danh sách giỏ hàng:", e);
    throw e;
  }
}

export async function addToCart(data) {
  try {
    const res = await fetchAPI('/cart/addtToCart.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return res;
  } catch(e) {
    console.error("Lỗi thêm vào giỏ hàng:", e);
    throw e;
  }
}

export async function updateCart(data) {
  try {
    const res = await fetchAPI('/cart/update.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return res;
  } catch(e) {
    console.error("Lỗi cập nhật giỏ hàng:", e);
    throw e;
  }
}

export async function deleteCartItem(data) {
  try {
    const res = await fetchAPI('/cart/delete.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return res;
  } catch(e) {
    console.error("Lỗi xoá giỏ hàng:", e);
    throw e;
  }
}

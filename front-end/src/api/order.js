import { fetchAPI } from './config.js';

export async function getOrders(params = "") {
  try {
    let url = '/order/list.php';
    if (params) url += "?" + params;
    const res = await fetchAPI(url);
    return res;
  } catch(e) {
    console.error("Lỗi lấy danh sách đơn hàng:", e);
    throw e;
  }
}

export async function getOrderDetail(orderId) {
  try {
    const res = await fetchAPI(`/order/detail.php?order_id=${orderId}`);
    return res;
  } catch(e) {
    console.error("Lỗi lấy chi tiết đơn hàng:", e);
    throw e;
  }
}

export async function createOrder(data) {
  try {
    const res = await fetchAPI('/order/createOrder.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res;
  } catch(e) {
    console.error("Lỗi tạo đơn hàng:", e);
    throw e;
  }
}

export async function updateOrderStatus(data) {
  try {
    const res = await fetchAPI('/order/update-status.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res;
  } catch(e) {
    console.error("Lỗi cập nhật trạng thái đơn hàng:", e);
    throw e;
  }
}

export async function cancelOrder(orderId, userId) {
  try {
    const res = await fetchAPI('/order/cancelOrder.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId, user_id: userId })
    });
    return res;
  } catch(e) {
    console.error("Lỗi hủy đơn hàng:", e);
    throw e;
  }
}

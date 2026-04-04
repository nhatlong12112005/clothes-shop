import '../utils/header.js';
import { getOrders, getOrderDetail, cancelOrder } from '../api/order.js';
import { loadCategories, renderCategory } from '../api/category.js';

let ordersData = [];
let currentUserId = null;

document.addEventListener('DOMContentLoaded', async () => {
  const categories = await loadCategories();
  renderCategory(categories, "dropdownMenu");

  const userInfo = JSON.parse(localStorage.getItem('user_info'));
  if (!userInfo) {
    alert("Vui lòng đăng nhập.");
    window.location.href = "./account/login.html";
    return;
  }

  currentUserId = userInfo.id || userInfo.user_id;
  await loadOrders(currentUserId);

  // Polling every 5 seconds for real-time order status updates
  setInterval(() => {
    loadOrders(currentUserId, true);
  }, 5000);
});

async function loadOrders(userId, isPolling = false) {
  try {
    const res = await getOrders(`user_id=${userId}`);
    if (res.status && res.data) {
      const newData = Array.isArray(res.data) ? res.data : (res.data.data || []);
      
      // If polling, check if there's any difference in status or length before re-rendering
      if (isPolling) {
        let hasChanges = false;
        if (newData.length !== ordersData.length) {
            hasChanges = true;
        } else {
            for (let i = 0; i < newData.length; i++) {
                if (newData[i].status !== ordersData[i].status) {
                    hasChanges = true;
                    break;
                }
            }
        }
        
        if (!hasChanges) return; // Ignore if no changes
      }

      ordersData = newData;
      renderOrders();
    } else {
      if (!isPolling) document.getElementById("ordersContainer").innerHTML = `<tr><td colspan="5" class="py-10 text-center text-red-500">Chưa có đơn hàng nào</td></tr>`;
    }
  } catch (err) {
    if (!isPolling) document.getElementById("ordersContainer").innerHTML = `<tr><td colspan="5" class="py-10 text-center text-red-500">Lỗi lấy dữ liệu</td></tr>`;
  }
}

function getStatusBadge(status) {
    switch (status) {
        case 'pending': return '<span class="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Chờ xử lý</span>';
        case 'processing': return '<span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Đang xử lý</span>';
        case 'shipped': return '<span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Đang giao hàng</span>';
        case 'completed': return '<span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Hoàn thành</span>';
        case 'cancelled': return '<span class="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Đã hủy</span>';
        default: return `<span class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">${status}</span>`;
    }
}

function renderOrders() {
  const container = document.getElementById("ordersContainer");
  if (ordersData.length === 0) {
    container.innerHTML = `<tr><td colspan="5" class="py-10 text-center text-gray-500">Bạn chưa mua đơn hàng nào.</td></tr>`;
    return;
  }

  container.innerHTML = ordersData.map(order => {
    const canCancel = order.status === 'pending' || order.status === 'processing';
    const cancelBtn = canCancel
      ? `<button onclick="cancelOrderById(${order.id})" class="text-sm border border-red-500 text-red-500 px-4 py-2 rounded-lg hover:bg-red-500 hover:text-white transition whitespace-nowrap ml-2">
           <i class="fa-solid fa-xmark mr-1"></i>Hủy đơn
         </button>`
      : '';
    return `
      <tr class="border-b border-gray-100 text-sm md:text-base hover:bg-gray-50 transition">
        <td class="py-4 font-medium opacity-80">#${order.id}</td>
        <td class="py-4 text-gray-600">${new Date(order.order_date).toLocaleString('vi-VN')}</td>
        <td class="py-4 font-bold text-black">${Number(order.total_price).toLocaleString('vi-VN')}đ</td>
        <td class="py-4">${getStatusBadge(order.status)}</td>
        <td class="py-4 text-center">
            <button onclick="viewOrderDetail(${order.id})" class="text-sm border border-black px-4 py-2 rounded-lg hover:bg-black hover:text-white transition whitespace-nowrap">
              Xem chi tiết
            </button>
            ${cancelBtn}
        </td>
      </tr>
    `;
  }).join('');
}

// Hàm global để nút Xem chi tiết gọi
window.viewOrderDetail = async function(orderId) {
    try {
        const res = await getOrderDetail(orderId);
        if(res.status && res.data) {
            renderModal(res.data);
            document.getElementById('orderDetailModal').classList.remove('hidden');
            document.getElementById('orderDetailModal').classList.add('flex');
        } else {
            alert("Lỗi tải chi tiết đơn hàng");
        }
    } catch(e) {
        alert("Lỗi kết nối. Vui lòng thử lại sau.");
        console.error(e);
    }
}

function renderModal(orderData) {
    document.getElementById('modalOrderId').textContent = `#${orderData.id}`;
    document.getElementById('modalShipName').textContent = orderData.shipping_name || orderData.username;
    document.getElementById('modalShipPhone').textContent = orderData.shipping_phone || "N/A";
    document.getElementById('modalShipAddress').textContent = orderData.shipping_address || "N/A";
    document.getElementById('modalOrderDate').textContent = new Date(orderData.order_date).toLocaleString('vi-VN');
    document.getElementById('modalTotal').textContent = Number(orderData.total_price).toLocaleString('vi-VN') + 'đ';

    const itemsList = document.getElementById('modalItemsList');
    if(!orderData.items || orderData.items.length === 0) {
        itemsList.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-gray-500">Không có mặt hàng nào.</td></tr>`;
        return;
    }

    itemsList.innerHTML = orderData.items.map(item => {
        const price = Number(item.price_at_purchase);
        const total = price * item.quantity;
        return `
            <tr>
                <td class="py-3 px-3">
                    <p class="font-medium text-black line-clamp-1">${item.product_name}</p>
                    <p class="text-xs text-gray-500">${item.color || 'N/A'}, ${item.size || 'N/A'}</p>
                </td>
                <td class="py-3 px-3 text-gray-600 font-medium">${item.quantity}</td>
                <td class="py-3 px-3 text-right font-medium text-black">${total.toLocaleString('vi-VN')}đ</td>
            </tr>
        `;
    }).join('');
}

// Hủy đơn hàng
window.cancelOrderById = async function(orderId) {
    if (!confirm(`Bạn có chắc muốn hủy đơn hàng #${orderId} không?`)) return;

    try {
        const res = await cancelOrder(orderId, currentUserId);
        if (res.status) {
            alert(res.message || 'Đơn hàng đã được hủy thành công.');
            await loadOrders(currentUserId);
        } else {
            alert(res.message || 'Không thể hủy đơn hàng.');
        }
    } catch(e) {
        alert('Lỗi kết nối. Vui lòng thử lại.');
        console.error(e);
    }
};

// Đóng modal
document.getElementById('btnCloseModal').addEventListener('click', () => {
    document.getElementById('orderDetailModal').classList.add('hidden');
    document.getElementById('orderDetailModal').classList.remove('flex');
});

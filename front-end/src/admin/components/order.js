import { getOrders, updateOrderStatus } from '../../api/order.js';
import { updateAdminUrl, getAdminUrlParams } from '../utils/urlSync.js';

export async function renderOrderManager(container) {
  container.innerHTML = `
    <h1 class="text-[24px] font-bold text-primary mb-4">Quản lý Đơn hàng</h1>
    
    <div class="w-full flex justify-between items-center mb-4">
      <div class="flex space-x-2">
        <select id="statusFilter" class="border px-3 py-2 rounded focus:outline-none">
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ xử lý (Pending)</option>
          <option value="processing">Đang xử lý (Processing)</option>
          <option value="shipped">Đang giao (Shipped)</option>
          <option value="completed">Hoàn thành (Completed)</option>
          <option value="cancelled">Đã hủy (Cancelled)</option>
        </select>
        <button id="btnFilterOrder" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">Lọc</button>
      </div>
    </div>

    <div class="w-full overflow-x-auto shadow-md rounded-lg">
      <table class="w-full text-left bg-white border-collapse">
        <thead class="bg-gray-100 border-b">
          <tr>
            <th class="py-3 px-6 font-semibold">Mã ĐH</th>
            <th class="py-3 px-6 font-semibold">Khách hàng</th>
            <th class="py-3 px-6 font-semibold">Tổng tiền</th>
            <th class="py-3 px-6 font-semibold">Trạng thái</th>
            <th class="py-3 px-6 font-semibold">Ngày tạo</th>
            <th class="py-3 px-6 font-semibold text-center">Hành động</th>
          </tr>
        </thead>
        <tbody id="orderTableBody">
          <tr><td colspan="6" class="text-center py-4">Đang tải dữ liệu...</td></tr>
        </tbody>
      </table>
    </div>
    <div id="orderPagination" class="flex flex-wrap justify-center mt-4 space-x-2"></div>

    <!-- Modal Xem Chi Tiết -->
    <div id="orderDetailModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg w-full max-w-3xl shadow-xl flex flex-col max-h-[90vh]">
        <div class="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
          <h2 class="text-xl font-bold">Chi tiết Đơn hàng <span id="viewModalOrderId" class="text-red-600"></span></h2>
          <button id="btnCloseDetailModal" class="text-gray-400 hover:text-black">
            <i class="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>
        
        <div class="p-6 overflow-y-auto flex-1">
          <!-- Thông tin giao hàng -->
          <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 text-sm">
              <p class="mb-2"><strong class="inline-block w-24">Người nhận:</strong> <span id="viewModalShipName"></span></p>
              <p class="mb-2"><strong class="inline-block w-24">Số ĐT:</strong> <span id="viewModalShipPhone"></span></p>
              <p class="mb-2"><strong class="inline-block w-24">Địa chỉ:</strong> <span id="viewModalShipAddress"></span></p>
              <p><strong class="inline-block w-24">Ngày đặt:</strong> <span id="viewModalOrderDate"></span></p>
          </div>

          <!-- Bảng sản phẩm -->
          <table class="w-full text-left border-collapse">
              <thead class="bg-gray-100 border border-gray-200">
                  <tr>
                      <th class="py-2 px-4 font-semibold text-gray-700">Sản phẩm</th>
                      <th class="py-2 px-4 font-semibold text-gray-700 w-20 text-center">SL</th>
                      <th class="py-2 px-4 font-semibold text-gray-700 w-32 text-right">Thành tiền</th>
                  </tr>
              </thead>
              <tbody id="viewModalItemsList" class="border border-gray-200 border-t-0 text-sm">
                  <!-- Items go here -->
              </tbody>
          </table>
          
          <div class="mt-4 text-right">
              <p class="text-lg font-bold">Tổng cộng: <span id="viewModalTotal" class="text-red-600"></span></p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Cập nhật Trạng thái -->
    <div id="orderModal" class="fixed inset-0 bg-black bg-opacity-50 hidden flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg w-96 shadow-xl w-[400px]">
        <h2 class="text-xl font-bold mb-4">Cập nhật đơn hàng <span id="modalOrderId" class="text-blue-600"></span></h2>
        
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2">Trạng thái mới</label>
          <select id="newOrderStatus" class="shadow border rounded w-full py-2 px-3 text-black bg-white leading-tight focus:outline-none focus:shadow-outline">
            <option value="pending" class="text-black bg-white">Chờ xử lý</option>
            <option value="processing" class="text-black bg-white">Đang xử lý</option>
            <option value="shipped" class="text-black bg-white">Đang giao hàng</option>
            <option value="completed" class="text-black bg-white">Hoàn thành</option>
            <option value="cancelled" class="text-black bg-white">Đã hủy</option>
          </select>
        </div>
        
        <div class="flex justify-end space-x-2">
          <button id="btnCancelOrderUpdate" class="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded">Hủy</button>
          <button id="btnSaveOrderUpdate" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Cập nhật</button>
        </div>
      </div>
    </div>
  `;

  // Initialize from URL parameters
  const urlParams = getAdminUrlParams();
  const initStatus = urlParams.get('status') || '';
  const initPage = parseInt(urlParams.get('page')) || 1;
  document.getElementById('statusFilter').value = initStatus;
  await loadOrders(initPage);
  bindOrderEvents();
}

let activeOrderId = null;

async function loadOrders(page = 1) {
  const status = document.getElementById('statusFilter').value;
  const tbody = document.getElementById('orderTableBody');
  try {
    let params = [];
    if (status) params.push(`status=${status}`);
    params.push(`page=${page}`);
    
    const res = await getOrders(params.join('&'));
    if (res.status && res.data) {
      const orderList = Array.isArray(res.data) ? res.data : (res.data.data || []);
      renderOrderTable(orderList);
      if (res.pagination) {
        renderOrderPagination(res.pagination);
      // Update URL to reflect current filters and page
      const params = [];
      if (status) params.push(`status=${encodeURIComponent(status)}`);
      params.push(`page=${page}`);
      updateAdminUrl(params);
      }
    } else {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-red-500">Không có dữ liệu đơn hàng</td></tr>`;
    }
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-red-500">Lỗi kết nối máy chủ</td></tr>`;
  }
}

function renderOrderPagination(pagination) {
  const container = document.getElementById('orderPagination');
  if (!container) return;
  if (!pagination) {
    container.innerHTML = '';
    return;
  }
  
  let html = '';
  const currentPage = pagination.current_page;
  const totalPages = pagination.total_pages;

  if (currentPage > 1) {
    html += `<button class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded" onclick="window.loadOrdersPage(${currentPage - 1})">Trước</button>`;
  }

  for (let i = 1; i <= totalPages; i++) {
    if (i === currentPage) {
      html += `<button class="px-3 py-1 bg-blue-500 text-white rounded">${i}</button>`;
    } else {
      html += `<button class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded" onclick="window.loadOrdersPage(${i})">${i}</button>`;
    }
  }

  if (currentPage < totalPages) {
    html += `<button class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded" onclick="window.loadOrdersPage(${currentPage + 1})">Sau</button>`;
  }

  container.innerHTML = html;
}

// Gắn hàm vào window để gọi từ onclick
window.loadOrdersPage = function(page) {
  if (window.adminSetPageHash) window.adminSetPageHash('qldh', page);
  loadOrders(page);
};

function renderOrderTable(orders) {
  const tbody = document.getElementById('orderTableBody');
  if (!orders || orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4">Chưa có đơn hàng nào</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(o => {
    let statusClass = "bg-gray-200 text-gray-800";
    let statusText = o.status;
    
    switch(o.status) {
      case 'pending': statusClass = "bg-yellow-100 text-yellow-800"; statusText = "Chờ xử lý"; break;
      case 'processing': statusClass = "bg-blue-100 text-blue-800"; statusText = "Đang xử lý"; break;
      case 'shipped': statusClass = "bg-indigo-100 text-indigo-800"; statusText = "Đang giao"; break;
      case 'completed': statusClass = "bg-green-100 text-green-800"; statusText = "Hoàn thành"; break;
      case 'cancelled': statusClass = "bg-red-100 text-red-800"; statusText = "Đã hủy"; break;
    }

    return `
    <tr class="border-b hover:bg-gray-50">
      <td class="py-3 px-6 font-semibold">#${o.id}</td>
      <td class="py-3 px-6">${o.username || o.fullname || 'Khách vãng lai'}</td>
      <td class="py-3 px-6 font-bold text-red-600">${Number(o.total_price).toLocaleString()}đ</td>
      <td class="py-3 px-6">
        <span class="px-3 py-1 rounded-full text-xs font-semibold ${statusClass}">${statusText}</span>
      </td>
      <td class="py-3 px-6 text-sm text-gray-500">${new Date(o.order_date).toLocaleDateString('vi-VN')}</td>
      <td class="py-3 px-6 text-center space-x-1">
        <button class="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs btn-update-status" data-id="${o.id}" data-status="${o.status}" title="Cập nhật">
            <i class="fa-solid fa-pen-to-square pointer-events-none"></i>
        </button>
        <button class="border border-black hover:bg-black hover:text-white px-2 py-1 rounded text-xs transition btn-view-detail" data-id="${o.id}" title="Xem chi tiết">
            <i class="fa-solid fa-eye pointer-events-none"></i>
        </button>
      </td>
    </tr>
  `}).join('');
}

function bindOrderEvents() {
  const modalUpdate = document.getElementById('orderModal');
  const modalDetail = document.getElementById('orderDetailModal');
  const modalStatusSelect = document.getElementById('newOrderStatus');
  
  // Lọc
  document.getElementById('btnFilterOrder').addEventListener('click', () => {
    loadOrders(1);
  });

  // Ủy quyền sự kiện mở modal
  document.getElementById('orderTableBody').addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-update-status')) {
      activeOrderId = e.target.getAttribute('data-id');
      const currentStatus = e.target.getAttribute('data-status');
      
      if (['completed', 'cancelled'].includes(currentStatus)) {
        alert("Đơn hàng này đã kết thúc, không thể thay đổi trạng thái.");
        return;
      }

      document.getElementById('modalOrderId').textContent = `#${activeOrderId}`;
      
      // Xây dựng danh sách trạng thái cho phép theo thứ tự
      const allStatuses = [
        { val: 'pending', text: 'Chờ xử lý' },
        { val: 'processing', text: 'Đang xử lý' },
        { val: 'shipped', text: 'Đang giao hàng' },
        { val: 'completed', text: 'Hoàn thành' },
        { val: 'cancelled', text: 'Đã hủy' }
      ];

      const statusOrder = ['pending', 'processing', 'shipped', 'completed'];
      const currentIdx = statusOrder.indexOf(currentStatus);

      let optionsHtml = '';
      allStatuses.forEach(st => {
        // Cho phép 'cancelled' bất kỳ lúc nào nếu chưa hoàn thành/hủy
        if (st.val === 'cancelled') {
           optionsHtml += `<option value="${st.val}" class="text-black bg-white">${st.text}</option>`;
           return;
        }
        
        // Trạng thái tuyến tính: chỉ cho phép Cùng trạng thái hiện tại (để hủy thao tác) HOẶC Bước tiếp theo
        const targetIdx = statusOrder.indexOf(st.val);
        if (targetIdx === currentIdx || targetIdx === currentIdx + 1) {
           optionsHtml += `<option value="${st.val}" class="text-black bg-white">${st.text}</option>`;
        }
      });

      modalStatusSelect.innerHTML = optionsHtml;
      modalStatusSelect.value = currentStatus;
      
      modalUpdate.classList.remove('hidden');
    }

    if (e.target.classList.contains('btn-view-detail')) {
        const orderId = e.target.getAttribute('data-id');
        openDetailModal(orderId);
    }
  });

  // Hủy
  document.getElementById('btnCancelOrderUpdate').addEventListener('click', () => {
    modalUpdate.classList.add('hidden');
    activeOrderId = null;
  });

  // Đóng Detail Modal
  document.getElementById('btnCloseDetailModal').addEventListener('click', () => {
    modalDetail.classList.add('hidden');
    modalDetail.classList.remove('flex');
  });

  // Lưu cập nhật
  document.getElementById('btnSaveOrderUpdate').addEventListener('click', async () => {
    if (!activeOrderId) return;
    const newStatus = modalStatusSelect.value;

    try {
      const res = await updateOrderStatus({
        order_id: activeOrderId,
        status: newStatus
      });

      if (res.status) {
        alert("Cập nhật trạng thái thành công!");
        modalUpdate.classList.add('hidden');
        loadOrders(1); // Tải lại trang 1
      } else {
        alert("Lỗi: " + res.message);
      }
    } catch(err) {
      alert("Lỗi kết nối");
    }
  });
}

// Function mở popup chi tiết bằng API
import { getOrderDetail } from '../../api/order.js';

async function openDetailModal(orderId) {
    try {
        const res = await getOrderDetail(orderId);
        if(res.status && res.data) {
            renderDetailModal(res.data);
            const modalDetail = document.getElementById('orderDetailModal');
            modalDetail.classList.remove('hidden');
            modalDetail.classList.add('flex');
        } else {
            alert("Lỗi tải chi tiết đơn hàng");
        }
    } catch(e) {
        alert("Lỗi kết nối. Vui lòng thử lại sau.");
        console.error(e);
    }
}

function renderDetailModal(orderData) {
    document.getElementById('viewModalOrderId').textContent = `#${orderData.id}`;
    document.getElementById('viewModalShipName').textContent = orderData.shipping_name || orderData.username;
    document.getElementById('viewModalShipPhone').textContent = orderData.shipping_phone || "Không có";
    document.getElementById('viewModalShipAddress').textContent = orderData.shipping_address || "Không có";
    document.getElementById('viewModalOrderDate').textContent = new Date(orderData.order_date).toLocaleString('vi-VN');
    document.getElementById('viewModalTotal').textContent = Number(orderData.total_price).toLocaleString('vi-VN') + 'đ';

    const itemsList = document.getElementById('viewModalItemsList');
    if(!orderData.items || orderData.items.length === 0) {
        itemsList.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-gray-500">Đơn hàng không có sản phẩm.</td></tr>`;
        return;
    }

    itemsList.innerHTML = orderData.items.map(item => {
        const price = Number(item.price_at_purchase);
        const total = price * item.quantity;
        return `
            <tr class="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td class="py-3 px-4">
                    <p class="font-medium text-black line-clamp-1">${item.product_name}</p>
                    <p class="text-xs text-gray-500">${item.color || 'N/A'} - ${item.size || 'N/A'}</p>
                </td>
                <td class="py-3 px-4 text-center text-gray-800 font-medium">${item.quantity}</td>
                <td class="py-3 px-4 text-right font-medium text-red-600">${total.toLocaleString('vi-VN')}đ</td>
            </tr>
        `;
    }).join('');
}

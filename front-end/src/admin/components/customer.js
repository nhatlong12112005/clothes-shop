import { getUsers, toggleUserStatus, addUser, updateUser } from '../../api/user.js';
import { updateAdminUrl, getAdminUrlParams } from '../utils/urlSync.js';

export async function renderCustomerManager(container) {
  container.innerHTML = `
    <h1 class="text-[24px] font-bold text-primary mb-4">Quản lý Khách hàng</h1>
    
    <div class="w-full flex justify-between items-center mb-4">
      <div class="flex space-x-2">
        <input type="text" id="searchCustomerInput" placeholder="Tìm tên/email/SĐT..." class="border px-3 py-2 rounded focus:outline-none w-64">
        <button id="btnSearchCustomer" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">Tìm</button>
      </div>
      <button id="btnAddCustomer" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">+ Thêm Khách hàng</button>
    </div>

    <div class="w-full overflow-x-auto shadow-md rounded-lg">
      <table class="w-full text-left bg-white border-collapse">
        <thead class="bg-gray-100 border-b">
          <tr>
            <th class="py-3 px-6 font-semibold">ID</th>
            <th class="py-3 px-6 font-semibold">Tài khoản / Họ tên</th>
            <th class="py-3 px-6 font-semibold">Email</th>
            <th class="py-3 px-6 font-semibold">Số điện thoại</th>
            <th class="py-3 px-6 font-semibold">Địa chỉ</th>
            <th class="py-3 px-6 font-semibold text-center">Trạng thái (Active)</th>
            <th class="py-3 px-6 font-semibold text-center">Thao tác</th>
          </tr>
        </thead>
        <tbody id="customerTableBody">
          <tr><td colspan="6" class="text-center py-4">Đang tải dữ liệu...</td></tr>
        </tbody>
      </table>
    </div>
    <div id="customerPagination" class="flex flex-wrap justify-center mt-4 space-x-2"></div>

    <!-- Modal Thêm/Sửa Khách hàng -->
    <div id="customerModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 hidden">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div class="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
          <h2 class="text-xl font-bold text-gray-800" id="customerModalTitle">Thêm Khách Hàng</h2>
          <button type="button" id="closeCustomerModal" class="text-gray-400 hover:text-red-500 font-bold text-2xl leading-none">&times;</button>
        </div>
        <form id="customerForm" class="p-6">
          <input type="hidden" id="customerId" value="">
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">Tài khoản (Username) *</label>
              <input type="text" id="customerUsername" required class="shadow border rounded w-full py-2 px-3 text-gray-700">
            </div>
            <div id="passwordContainer">
              <label class="block text-sm font-bold text-gray-700 mb-1">Mật khẩu *</label>
              <input type="password" id="customerPassword" class="shadow border rounded w-full py-2 px-3 text-gray-700">
            </div>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-bold text-gray-700 mb-1">Email *</label>
            <input type="email" id="customerEmail" required class="shadow border rounded w-full py-2 px-3 text-gray-700">
          </div>
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">Số điện thoại</label>
              <input type="text" id="customerPhone" class="shadow border rounded w-full py-2 px-3 text-gray-700">
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">Loại tài khoản</label>
              <select id="customerRole" class="shadow border rounded w-full py-2 px-3 text-gray-700">
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-bold text-gray-700 mb-1">Địa chỉ</label>
            <textarea id="customerAddress" class="shadow border rounded w-full py-2 px-3 text-gray-700"></textarea>
          </div>
          <div class="flex justify-end pt-4 border-t">
            <button type="button" id="btnCancelCustomer" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2">Hủy</button>
            <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded shadow">Lưu</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Initialize from URL parameters
  const urlParams = getAdminUrlParams();
  const initKeyword = urlParams.get('keyword') || '';
  const initPage = parseInt(urlParams.get('page')) || 1;
  document.getElementById('searchCustomerInput').value = initKeyword;
  await loadCustomers(initPage);
  bindCustomerEvents();
}

async function loadCustomers(page = 1) {
  const keyword = document.getElementById('searchCustomerInput').value;
  const tbody = document.getElementById('customerTableBody');
  try {
    let params = [];
    if (keyword) params.push(`keyword=${encodeURIComponent(keyword)}`);
    params.push(`page=${page}`);
    const res = await getUsers(params.join('&'));
    
    if (res.status && res.data) {
      const userList = Array.isArray(res.data) ? res.data : (res.data.data || []);
      renderCustomerTable(userList);
      if (res.pagination) {
        renderCustomerPagination(res.pagination);
      // Update URL to reflect current search and page
      const params = [];
      if (keyword) params.push(`keyword=${encodeURIComponent(keyword)}`);
      params.push(`page=${page}`);
      updateAdminUrl(params);
      }
    } else {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-red-500">Không có dữ liệu (Hoặc bạn chưa đăng nhập với quyền Admin)</td></tr>`;
    }
  } catch (error) {
    if (error.message && error.message.includes("403")) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-red-500">Bạn không có quyền truy cập dữ liệu này. Vui lòng đăng nhập bằng tài khoản Admin.</td></tr>`;
    } else if (error.message && error.message.includes("401")) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-red-500">Token hết hạn hoặc chưa đăng nhập. Vui lòng đăng nhập lại.</td></tr>`;
    } else {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-red-500">Lỗi kết nối máy chủ</td></tr>`;
    }
  }
}

function renderCustomerPagination(pagination) {
  const container = document.getElementById('customerPagination');
  if (!container) return;
  if (!pagination) {
    container.innerHTML = '';
    return;
  }
  
  let html = '';
  const currentPage = pagination.current_page;
  const totalPages = pagination.total_pages;

  if (currentPage > 1) {
    html += `<button class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded" onclick="window.loadCustomersPage(${currentPage - 1})">Trước</button>`;
  }

  for (let i = 1; i <= totalPages; i++) {
    if (i === currentPage) {
      html += `<button class="px-3 py-1 bg-blue-500 text-white rounded">${i}</button>`;
    } else {
      html += `<button class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded" onclick="window.loadCustomersPage(${i})">${i}</button>`;
    }
  }

  if (currentPage < totalPages) {
    html += `<button class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded" onclick="window.loadCustomersPage(${currentPage + 1})">Sau</button>`;
  }

  container.innerHTML = html;
}

// Gắn hàm vào window để gọi từ onclick
window.loadCustomersPage = function(page) {
  if (window.adminSetPageHash) window.adminSetPageHash('qlkh', page);
  loadCustomers(page);
};

function renderCustomerTable(users) {
  const tbody = document.getElementById('customerTableBody');
  if (!users || users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4">Chưa có khách hàng nào</td></tr>`;
    return;
  }

  // Lọc chỉ lấy những người dùng có role là user hoặc hiển thị tất cả
  tbody.innerHTML = users.map(u => `
    <tr class="border-b hover:bg-gray-50">
      <td class="py-3 px-6">${u.id}</td>
      <td class="py-3 px-6 font-medium">${u.username || 'Chưa thiết lập'} ${u.role==='admin' ? '<span class="text-xs text-red-500">(Admin)</span>' : ''}</td>
      <td class="py-3 px-6">${u.email}</td>
      <td class="py-3 px-6">${u.phone || 'N/A'}</td>
      <td class="py-3 px-6 text-sm text-gray-500">${u.address || 'N/A'}</td>
      <td class="py-3 px-6 text-center">
        ${u.is_active == 1 
          ? '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">Hoạt động</span>' 
          : '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">Đã khóa</span>'
        }
      </td>
      <td class="py-3 px-6 text-center">
         <button class="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded text-sm font-medium mr-1 btn-edit-customer" data-user='${JSON.stringify(u).replace(/'/g, "&#39;")}'>Sửa</button>
         <button class="px-3 py-1 rounded text-sm font-medium ${u.is_active == 1 ? 'bg-red-100 hover:bg-red-200 text-red-700' : 'bg-green-100 hover:bg-green-200 text-green-700'} btn-toggle-status" data-id="${u.id}" data-status="${u.is_active == 1 ? 0 : 1}">
            ${u.is_active == 1 ? 'Khóa' : 'Mở khóa'}
         </button>
      </td>
    </tr>
  `).join('');
}

function bindCustomerEvents() {
  document.getElementById('btnSearchCustomer').addEventListener('click', () => {
    loadCustomers(1);
  });

  const modal = document.getElementById('customerModal');
  const form = document.getElementById('customerForm');
  
  // Mở modal Thêm
  document.getElementById('btnAddCustomer').addEventListener('click', () => {
    document.getElementById('customerModalTitle').textContent = 'Thêm Tài Khoản';
    document.getElementById('customerId').value = '';
    form.reset();
    document.getElementById('passwordContainer').style.display = 'block';
    document.getElementById('customerPassword').setAttribute('required', 'required');
    modal.classList.remove('hidden');
  });

  // Đóng modal
  const closeModal = () => modal.classList.add('hidden');
  document.getElementById('closeCustomerModal').addEventListener('click', closeModal);
  document.getElementById('btnCancelCustomer').addEventListener('click', closeModal);

  // Mở modal Sửa & Toggle Status
  document.getElementById('customerTableBody').addEventListener('click', async (e) => {
    const btnEdit = e.target.closest('.btn-edit-customer');
    if (btnEdit) {
       const u = JSON.parse(btnEdit.getAttribute('data-user'));
       document.getElementById('customerModalTitle').textContent = `Sửa Tài Khoản #${u.id}`;
       document.getElementById('customerId').value = u.id;
       document.getElementById('customerUsername').value = u.username || '';
       document.getElementById('customerEmail').value = u.email || '';
       document.getElementById('customerPhone').value = u.phone || '';
       document.getElementById('customerRole').value = u.role || 'customer';
       document.getElementById('customerAddress').value = u.address || '';
       
       document.getElementById('passwordContainer').style.display = 'none';
       document.getElementById('customerPassword').removeAttribute('required');
       modal.classList.remove('hidden');
    }

    const btnToggle = e.target.closest('.btn-toggle-status');
    if (btnToggle) {
       const id = btnToggle.getAttribute('data-id');
       const status = btnToggle.getAttribute('data-status');
       const actionText = status == 1 ? "mở khóa" : "khóa";
       
       if (confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản này?`)) {
          try {
             const res = await toggleUserStatus({ id: id, status: status });
             if (res.status === true) {
                loadCustomers(1);
             } else {
                alert(res.message || "Lỗi cập nhật trạng thái");
             }
          } catch(err) {
             alert("Lỗi kết nối máy chủ");
          }
       }
    }
  });

  // Submit form Thêm/Sửa
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('customerId').value;
    
    const payload = {
       username: document.getElementById('customerUsername').value,
       email: document.getElementById('customerEmail').value,
       phone: document.getElementById('customerPhone').value,
       role: document.getElementById('customerRole').value,
       address: document.getElementById('customerAddress').value
    };

    if (id) {
       payload.id = id;
    } else {
       payload.password = document.getElementById('customerPassword').value;
    }

    try {
       const res = id ? await updateUser(payload) : await addUser(payload);

       if (res.status === true || res.status === 'success') {
          closeModal();
          loadCustomers(1);
       } else {
          alert(res.message || "Lỗi lưu dữ liệu");
       }
    } catch(err) {
       alert("Lỗi kết nối máy chủ");
    }
  });
}

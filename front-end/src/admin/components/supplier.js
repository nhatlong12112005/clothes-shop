import { getSuppliers, addSupplier, updateSupplier, deleteSupplier } from '../../api/supplier.js';
import { updateAdminUrl, getAdminUrlParams } from '../utils/urlSync.js';

export async function renderSupplierManager(container) {
  // Initialize state from URL parameters
  const urlParams = getAdminUrlParams();
  const pageParam = parseInt(urlParams.get('page'));
  const searchParam = urlParams.get('q');
  
  let initPage = 1;
  let initSearch = '';
  if (!isNaN(pageParam) && pageParam > 0) initPage = pageParam;
  if (searchParam) initSearch = searchParam;

  container.innerHTML = `
    <h1 class="text-[24px] font-bold text-primary mb-4">Quản lý Nhà cung cấp (Suppliers)</h1>
    
    <div class="w-full flex justify-between items-center mb-4">
      <div class="flex space-x-2">
        <input type="text" id="searchSupInput" placeholder="Tìm tên, sđt..." class="border px-3 py-2 rounded focus:outline-none w-64">
        <button id="btnSearchSup" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">Tìm</button>
      </div>
      <button id="btnAddSup" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
        + Thêm nhà cung cấp
      </button>
    </div>

    <div class="w-full overflow-x-auto shadow-md rounded-lg">
      <table class="w-full text-left bg-white border-collapse">
        <thead class="bg-gray-100 border-b">
          <tr>
            <th class="py-3 px-6 font-semibold w-16">ID</th>
            <th class="py-3 px-6 font-semibold">Tên NCC</th>
            <th class="py-3 px-6 font-semibold">Số điện thoại</th>
            <th class="py-3 px-6 font-semibold">Địa chỉ</th>
            <th class="py-3 px-6 font-semibold text-center w-32">Hành động</th>
          </tr>
        </thead>
        <tbody id="supTableBody">
          <tr><td colspan="5" class="text-center py-4">Đang tải dữ liệu...</td></tr>
        </tbody>
      </table>
    </div>
    <div id="supplierPagination" class="flex justify-center mt-4 space-x-2"></div>

    <!-- Modal Thêm/Sửa Supplier -->
    <div id="supModal" class="fixed inset-0 bg-black bg-opacity-50 hidden flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg w-[500px] shadow-xl">
        <h2 id="supModalTitle" class="text-xl font-bold mb-4">Thêm Nhà cung cấp</h2>
        <form id="supForm">
          <input type="hidden" id="supId" name="id">
          
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">Tên NCC *</label>
            <input type="text" id="supName" name="name" required class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">Số điện thoại</label>
            <input type="text" id="supPhone" name="contact" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
          </div>
          
          <div class="mb-6">
            <label class="block text-gray-700 text-sm font-bold mb-2">Địa chỉ</label>
            <input type="text" id="supAddress" name="address" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
          </div>
          
          <div class="flex justify-end space-x-2">
            <button type="button" id="btnCancelSup" class="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded">Hủy</button>
            <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Lưu</button>
          </div>
        </form>
      </div>
    </div>
  `;

  if (initSearch) {
    document.getElementById('searchSupInput').value = initSearch;
  }
  await loadSuppliers(initPage);
  bindSupplierEvents();
}

async function loadSuppliers(page = 1) {
  const keyword = document.getElementById('searchSupInput').value;
  const tbody = document.getElementById('supTableBody');
  try {
    let params = [];
    if (keyword) params.push(`q=${encodeURIComponent(keyword)}`);
    params.push(`page=${page}`);
    
    const res = await getSuppliers(params.join('&'));
    if (res.status && res.data) {
      const supList = Array.isArray(res.data) ? res.data : (res.data.data || []);
      renderSupplierTable(supList);
      if (res.pagination) {
        renderSupplierPagination(res.pagination);
      }
    } else {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">Lỗi lấy dữ liệu</td></tr>`;
    }
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">Lỗi kết nối máy chủ</td></tr>`;
  }
}

function renderSupplierPagination(pagination) {
  const container = document.getElementById('supplierPagination');
  if (!container) return;
  if (!pagination) {
    container.innerHTML = '';
    return;
  }
  
  let html = '';
  const currentPage = pagination.current_page;
  const totalPages = pagination.total_pages;

  if (currentPage > 1) {
    html += `<button class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded" onclick="window.loadSuppliersPage(${currentPage - 1})">Trước</button>`;
  }

  for (let i = 1; i <= totalPages; i++) {
    if (i === currentPage) {
      html += `<button class="px-3 py-1 bg-blue-500 text-white rounded">${i}</button>`;
    } else {
      html += `<button class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded" onclick="window.loadSuppliersPage(${i})">${i}</button>`;
    }
  }

  if (currentPage < totalPages) {
    html += `<button class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded" onclick="window.loadSuppliersPage(${currentPage + 1})">Sau</button>`;
  }

  container.innerHTML = html;
}

// Gắn hàm vào window để gọi từ onclick
window.loadSuppliersPage = function(page) { updateAdminUrl([`q=${encodeURIComponent(document.getElementById('searchSupInput').value.trim())}`, `page=${page}`]); if (window.adminSetPageHash) window.adminSetPageHash('listsupplier', page); loadSuppliers(page, document.getElementById('searchSupInput').value.trim()); };

function renderSupplierTable(suppliers) {
  const tbody = document.getElementById('supTableBody');
  if (!suppliers || suppliers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4">Chưa có nhà cung cấp nào</td></tr>`;
    return;
  }

  tbody.innerHTML = suppliers.map(s => `
    <tr class="border-b hover:bg-gray-50">
      <td class="py-3 px-6 text-gray-500">${s.id}</td>
      <td class="py-3 px-6 font-medium text-gray-800">${s.name}</td>
      <td class="py-3 px-6">${s.phone || ''}</td>
      <td class="py-3 px-6 truncate max-w-[200px]" title="${s.address || ''}">${s.address || ''}</td>
      <td class="py-3 px-6 text-center flex justify-center space-x-2">
        <button class="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-sm btn-edit-sup" data-sup='${JSON.stringify(s).replace(/'/g, "&apos;")}'>Sửa</button>
        <button class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm btn-del-sup" data-id="${s.id}">Xóa</button>
      </td>
    </tr>
  `).join('');
}

function bindSupplierEvents() {
  const modal = document.getElementById('supModal');
  const form = document.getElementById('supForm');
  const modalTitle = document.getElementById('supModalTitle');

  // Tìm
  document.getElementById('btnSearchSup').addEventListener('click', () => {
    const keyword = document.getElementById('searchSupInput').value.trim();
    updateAdminUrl([`q=${encodeURIComponent(keyword)}`, `page=1`]);
    loadSuppliers(1, keyword);
  });
  document.getElementById('searchSupInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const keyword = e.target.value.trim();
      updateAdminUrl([`q=${encodeURIComponent(keyword)}`, `page=1`]);
      loadSuppliers(1, keyword);
    }
  });

  // Mở modal Thêm
  document.getElementById('btnAddSup').addEventListener('click', () => {
    modalTitle.textContent = 'Thêm Nhà cung cấp';
    form.reset();
    document.getElementById('supId').value = '';
    modal.classList.remove('hidden');
  });

  // Đóng modal
  document.getElementById('btnCancelSup').addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  // Gửi Form (Thêm/Sửa)
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const id = formData.get('id');
    const endpoint = id ? '/suppliers/updateSuppliers.php' : '/suppliers/addSuppliers.php';

    try {
      const res = id ? await updateSupplier(formData) : await addSupplier(formData);
      if (res.status === true || res.status === 'success') {
        alert("Lưu thành công!");
        modal.classList.add('hidden');
        loadSuppliers(1);
      } else {
        alert(res.message || "Lưu thất bại.");
      }
    } catch (err) {
      alert("Lỗi kết nối.");
    }
  });

  // Sửa/Xóa trong bảng
  document.getElementById('supTableBody').addEventListener('click', async (e) => {
    if (e.target.classList.contains('btn-edit-sup')) {
      const s = JSON.parse(e.target.getAttribute('data-sup'));
      modalTitle.textContent = 'Sửa Nhà cung cấp';
      
      document.getElementById('supId').value = s.id;
      document.getElementById('supName').value = s.name;
      document.getElementById('supPhone').value = s.phone || '';
      document.getElementById('supAddress').value = s.address || '';

      modal.classList.remove('hidden');
    }

    if (e.target.classList.contains('btn-del-sup')) {
      const id = e.target.getAttribute('data-id');
      if (confirm('Bạn có chắc chắn muốn xóa nhà cung cấp này không? Việc này có thể ảnh hưởng phiếu nhập liên quan.')) {
        try {
          const formData = new FormData();
          formData.append('id', id);
          const res = await deleteSupplier(formData);
          if (res.status === true || res.status === 'success') {
            loadSuppliers();
          } else {
            alert(res.message || "Không thể xóa");
          }
        } catch (err) {
          alert('Lỗi kết nối');
        }
      }
    }
  });
}

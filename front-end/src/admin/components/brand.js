import { fetchAPI } from '../../api/config.js';
import { updateAdminUrl, getAdminUrlParams } from '../utils/urlSync.js';

export async function renderBrandManager(container) {
  container.innerHTML = `
    <h1 class="text-[24px] font-bold text-primary mb-4">Quản lý Thương hiệu (Brand)</h1>
    
    <div class="w-full flex justify-between items-center mb-4">
      <div class="flex space-x-2">
        <input type="text" id="searchBrandInput" placeholder="Tìm tên thương hiệu..." class="border px-3 py-2 rounded focus:outline-none w-64">
        <button id="btnSearchBrand" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">Tìm</button>
      </div>
      <button id="btnAddBrand" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
        + Thêm thương hiệu
      </button>
    </div>

    <div class="w-full overflow-x-auto shadow-md rounded-lg">
      <table class="w-full text-left bg-white border-collapse">
        <thead class="bg-gray-100 border-b">
          <tr>
            <th class="py-3 px-6 font-semibold w-24">ID</th>
            <th class="py-3 px-6 font-semibold">Tên thương hiệu</th>
            <th class="py-3 px-6 font-semibold text-center w-48">Hành động</th>
          </tr>
        </thead>
        <tbody id="brandTableBody">
          <tr><td colspan="3" class="text-center py-4">Đang tải dữ liệu...</td></tr>
        </tbody>
      </table>
    </div>
    <div id="brandPagination" class="flex justify-center mt-4 space-x-2"></div>

    <!-- Modal Thêm/Sửa Brand -->
    <div id="brandModal" class="fixed inset-0 bg-black bg-opacity-50 hidden flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg w-96 shadow-xl w-[400px]">
        <h2 id="brandModalTitle" class="text-xl font-bold mb-4">Thêm Thương hiệu</h2>
        <form id="brandForm">
          <input type="hidden" id="brandId" name="id">
          
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">Tên thương hiệu *</label>
            <input type="text" id="brandName" name="name" required class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="Nhập tên">
          </div>
          
          <div class="flex justify-end space-x-2">
            <button type="button" id="btnCancelBrand" class="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded">Hủy</button>
            <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Lưu</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Initialize from URL parameters
  const urlParams = getAdminUrlParams();
  const initPage = parseInt(urlParams.get('page')) || 1;
  const initKeyword = urlParams.get('q') || '';
  document.getElementById('searchBrandInput').value = initKeyword;
  await loadBrands(initPage);
  bindBrandEvents();
}

async function loadBrands(page = 1) {
  const keyword = document.getElementById('searchBrandInput').value;
  const tbody = document.getElementById('brandTableBody');
  try {
    const url = keyword ? `/brand/getBrand.php?q=${encodeURIComponent(keyword)}&page=${page}` : `/brand/getBrand.php?page=${page}`;
    const res = await fetchAPI(url);
    if (res.status && res.data) {
      const brandList = Array.isArray(res.data) ? res.data : (res.data.data || []);
      renderBrandTable(brandList);
      if (res.pagination) {
        renderBrandPagination(res.pagination);
      // Update URL to reflect current filters and page
      updateAdminUrl([`q=${encodeURIComponent(keyword)}`, `page=${page}`]);
      }
    } else {
      tbody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-red-500">Lỗi cấu trúc dữ liệu</td></tr>`;
    }
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-red-500">Lỗi kết nối máy chủ</td></tr>`;
  }
}

function renderBrandPagination(pagination) {
  const container = document.getElementById('brandPagination');
  if (!container) return;
  if (!pagination) {
    container.innerHTML = '';
    return;
  }
  
  let html = '';
  const currentPage = pagination.current_page;
  const totalPages = pagination.total_pages;

  if (currentPage > 1) {
    html += `<button class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded" onclick="window.loadBrandsPage(${currentPage - 1})">Trước</button>`;
  }

  for (let i = 1; i <= totalPages; i++) {
    if (i === currentPage) {
      html += `<button class="px-3 py-1 bg-blue-500 text-white rounded">${i}</button>`;
    } else {
      html += `<button class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded" onclick="window.loadBrandsPage(${i})">${i}</button>`;
    }
  }

  if (currentPage < totalPages) {
    html += `<button class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded" onclick="window.loadBrandsPage(${currentPage + 1})">Sau</button>`;
  }

  container.innerHTML = html;
}

// Gắn hàm vào window để gọi từ onclick
window.loadBrandsPage = function(page) {
  if (window.adminSetPageHash) window.adminSetPageHash('listbrand', page);
  loadBrands(page);
};

function renderBrandTable(brands) {
  const tbody = document.getElementById('brandTableBody');
  if (!brands || brands.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" class="text-center py-4">Chưa có thương hiệu nào</td></tr>`;
    return;
  }

  tbody.innerHTML = brands.map(b => `
    <tr class="border-b hover:bg-gray-50">
      <td class="py-3 px-6 text-gray-500">${b.id}</td>
      <td class="py-3 px-6 font-medium text-gray-800">${b.name}</td>
      <td class="py-3 px-6 text-center">
        <button class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm btn-edit-brand mr-2" data-id="${b.id}" data-name="${b.name}">Sửa</button>
        <button class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm btn-del-brand" data-id="${b.id}">Xóa</button>
      </td>
    </tr>
  `).join('');
}

function bindBrandEvents() {
  const modal = document.getElementById('brandModal');
  const form = document.getElementById('brandForm');
  const modalTitle = document.getElementById('brandModalTitle');

  // Tìm
  document.getElementById('btnSearchBrand').addEventListener('click', () => {
    loadBrands(1);
  });

  // Mở modal Thêm
  document.getElementById('btnAddBrand').addEventListener('click', () => {
    modalTitle.textContent = 'Thêm Thương hiệu';
    form.reset();
    document.getElementById('brandId').value = '';
    modal.classList.remove('hidden');
  });

  // Đóng modal
  document.getElementById('btnCancelBrand').addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  // Gửi Form (Thêm/Sửa)
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const id = formData.get('id');
    const endpoint = id ? '/brand/updateBrand.php' : '/brand/addBrand.php';

    try {
      const res = await fetchAPI(endpoint, {
        method: 'POST',
        body: formData
      });
      if (res.status === true || res.status === 'success') {
        alert("Thành công!");
        modal.classList.add('hidden');
        loadBrands(1);
      } else {
        alert(res.message || "Lưu thất bại.");
      }
    } catch (err) {
      alert("Lỗi kết nối.");
    }
  });

  // Sửa/Xóa trong bảng
  document.getElementById('brandTableBody').addEventListener('click', async (e) => {
    if (e.target.classList.contains('btn-edit-brand')) {
      const id = e.target.getAttribute('data-id');
      const name = e.target.getAttribute('data-name');
      modalTitle.textContent = 'Sửa Thương hiệu';
      document.getElementById('brandId').value = id;
      document.getElementById('brandName').value = name;
      modal.classList.remove('hidden');
    }

    if (e.target.classList.contains('btn-del-brand')) {
      const id = e.target.getAttribute('data-id');
      if (confirm('Bạn có chắc chắn muốn xóa thương hiệu này không?')) {
        try {
          const formData = new FormData();
          formData.append('id', id);
          const res = await fetchAPI('/brand/deleteBrand.php', {
            method: 'POST',
            body: formData
          });
          if (res.status === true || res.status === 'success') {
            loadBrands();
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

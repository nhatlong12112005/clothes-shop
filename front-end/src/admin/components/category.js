import { fetchAPI } from '../../api/config.js';
import { updateAdminUrl, getAdminUrlParams } from '../utils/urlSync.js';

export async function renderCategoryManager(container) {
  container.innerHTML = `
    <h1 class="text-[24px] font-bold text-primary mb-4">Quản lý Danh mục</h1>
    
    <div class="w-full flex justify-end mb-4">
      <button id="btnAddCategory" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
        + Thêm danh mục
      </button>
    </div>

    <div class="w-full overflow-x-auto shadow-md rounded-lg">
      <table class="w-full text-left bg-white border-collapse">
        <thead class="bg-gray-100 border-b">
          <tr>
            <th class="py-3 px-6 font-semibold">ID</th>
            <th class="py-3 px-6 font-semibold">Tên danh mục</th>
            <th class="py-3 px-6 font-semibold text-center">Hành động</th>
          </tr>
        </thead>
        <tbody id="categoryTableBody">
          <tr><td colspan="3" class="text-center py-4">Đang tải dữ liệu...</td></tr>
        </tbody>
      </table>
    </div>
    <div id="categoryPagination" class="flex justify-center mt-4 space-x-2"></div>

    <!-- Modal Thêm/Sửa Danh Mục -->
    <div id="categoryModal" class="fixed inset-0 bg-black bg-opacity-50 hidden flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg w-96 shadow-xl">
        <h2 id="modalTitle" class="text-xl font-bold mb-4">Thêm Danh Mục</h2>
        <input type="hidden" id="categoryId">
        
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2">Tên danh mục</label>
          <input type="text" id="categoryName" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="Nhập tên danh mục">
        </div>
        
        <div class="flex justify-end space-x-2">
          <button id="btnCancel" class="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded">
            Hủy
          </button>
          <button id="btnSave" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Lưu
          </button>
        </div>
      </div>
    </div>
  `;

  // Gọi API lấy dữ liệu
  // Initialize from URL parameters
  const urlParams = getAdminUrlParams();
  const initPage = parseInt(urlParams.get('page')) || 1;
  await loadCategories(initPage);
  bindEvents();
}

async function loadCategories(page = 1) {
  const tbody = document.getElementById('categoryTableBody');
  try {
    const res = await fetchAPI(`/category/getCate.php?page=${page}`);
    if (res.status && res.data) {
      const cateList = Array.isArray(res.data) ? res.data : (res.data.data || []);
      renderTable(cateList);
      if (res.pagination) {
        renderCategoryPagination(res.pagination);
      // Update URL to reflect current page
      updateAdminUrl([`page=${page}`]);
      }
    } else {
      tbody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-red-500">Lỗi lấy dữ liệu</td></tr>`;
    }
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-red-500">Lỗi kết nối máy chủ</td></tr>`;
  }
}

function renderCategoryPagination(pagination) {
  const container = document.getElementById('categoryPagination');
  if (!container) return;
  if (!pagination) {
    container.innerHTML = '';
    return;
  }
  
  let html = '';
  const currentPage = pagination.current_page;
  const totalPages = pagination.total_pages;

  if (currentPage > 1) {
    html += `<button class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded" onclick="window.loadCategoriesPage(${currentPage - 1})">Trước</button>`;
  }

  for (let i = 1; i <= totalPages; i++) {
    if (i === currentPage) {
      html += `<button class="px-3 py-1 bg-blue-500 text-white rounded">${i}</button>`;
    } else {
      html += `<button class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded" onclick="window.loadCategoriesPage(${i})">${i}</button>`;
    }
  }

  if (currentPage < totalPages) {
    html += `<button class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded" onclick="window.loadCategoriesPage(${currentPage + 1})">Sau</button>`;
  }

  container.innerHTML = html;
}

// Gắn hàm vào window để gọi từ onclick
window.loadCategoriesPage = function(page) {
  if (window.adminSetPageHash) window.adminSetPageHash('listdm', page);
  loadCategories(page);
};

function renderTable(categories) {
  const tbody = document.getElementById('categoryTableBody');
  if (categories.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" class="text-center py-4">Chưa có danh mục nào</td></tr>`;
    return;
  }

  tbody.innerHTML = categories.map(c => `
    <tr class="border-b hover:bg-gray-50">
      <td class="py-3 px-6">${c.id}</td>
      <td class="py-3 px-6">${c.name}</td>
      <td class="py-3 px-6 text-center">
        <button class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded mr-2 btn-edit" data-id="${c.id}" data-name="${c.name}">Sửa</button>
        <button class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded btn-delete" data-id="${c.id}">Xóa</button>
      </td>
    </tr>
  `).join('');
}

function bindEvents() {
  const modal = document.getElementById('categoryModal');
  const modalTitle = document.getElementById('modalTitle');
  const inputId = document.getElementById('categoryId');
  const inputName = document.getElementById('categoryName');
  
  // Nút Thêm
  document.getElementById('btnAddCategory').addEventListener('click', () => {
    modalTitle.textContent = 'Thêm Danh Mục';
    inputId.value = '';
    inputName.value = '';
    modal.classList.remove('hidden');
  });

  // Nút Hủy
  document.getElementById('btnCancel').addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  // Nút Lưu
  document.getElementById('btnSave').addEventListener('click', async () => {
    const name = inputName.value.trim();
    const id = inputId.value;
    
    if (!name) {
      alert("Vui lòng nhập tên danh mục!");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', name);
      
      let endpoint = '/category/addCategory.php';
      if (id) {
        endpoint = '/category/updateCate.php';
        formData.append('id', id);
      }

      const res = await fetchAPI(endpoint, {
        method: 'POST',
        body: formData
      });

      if (res.status === "success" || res.status === true) {
        alert("Lưu thành công!");
        modal.classList.add('hidden');
        await loadCategories(); // Tải lại bảng
      } else {
        alert(res.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      alert("Lỗi kết nối!");
    }
  });

  // Nút Sửa & Nút Xóa (Ủy quyền sự kiện cho phần tử cha)
  document.getElementById('categoryTableBody').addEventListener('click', async (e) => {
    // Sửa
    if (e.target.classList.contains('btn-edit')) {
      const id = e.target.getAttribute('data-id');
      const name = e.target.getAttribute('data-name');
      modalTitle.textContent = 'Sửa Danh Mục';
      inputId.value = id;
      inputName.value = name;
      modal.classList.remove('hidden');
    }
    
    // Xóa
    if (e.target.classList.contains('btn-delete')) {
      const id = e.target.getAttribute('data-id');
      if (confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
        try {
          const formData = new FormData();
          formData.append('id', id);
          const res = await fetchAPI('/category/deleteCategory.php', {
            method: 'POST',
            body: formData
          });

          if (res.status === "success" || res.status === true) {
            alert("Xóa thành công!");
            await loadCategories();
          } else {
            alert(res.message || "Không thể xóa");
          }
        } catch (error) {
          alert("Lỗi kết nối!");
        }
      }
    }
  });
}

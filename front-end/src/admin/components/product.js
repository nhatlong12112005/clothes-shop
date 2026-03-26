import { getCategories } from '../../api/category.js';
import { getBrands } from '../../api/brand.js';
import { getProducts, getProductDetail, addProduct, updateProduct, deleteProduct } from '../../api/product.js';
export async function renderProductManager(container) {
  container.innerHTML = `
    <h1 class="text-[24px] font-bold text-primary mb-4">Quản lý Sản phẩm</h1>
    
    <div class="w-full flex justify-between items-center mb-4">
      <div class="flex space-x-2">
        <input type="text" id="searchInput" placeholder="Tìm kiếm sản phẩm..." class="border px-3 py-2 rounded focus:outline-none">
        
        <select id="filterCategory" class="border px-3 py-2 rounded focus:outline-none">
          <option value="">Tất cả danh mục</option>
        </select>
        
        <select id="filterBrand" class="border px-3 py-2 rounded focus:outline-none">
          <option value="">Tất cả thương hiệu</option>
        </select>

        <button id="btnSearch" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">Lọc</button>
      </div>
      <button id="btnAddProduct" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
        + Thêm sản phẩm
      </button>
    </div>

    <div class="w-full overflow-x-auto shadow-md rounded-lg">
      <table class="w-full text-left bg-white border-collapse">
        <thead class="bg-gray-100 border-b">
          <tr>
            <th class="py-3 px-6 font-semibold w-16">ID</th>
            <th class="py-3 px-6 font-semibold w-24">Hình ảnh</th>
            <th class="py-3 px-6 font-semibold">Tên sản phẩm</th>
            <th class="py-3 px-6 font-semibold">Danh mục</th>
            <th class="py-3 px-6 font-semibold">Giá / Lượt bán</th>
            <th class="py-3 px-6 font-semibold text-center w-32">Hành động</th>
          </tr>
        </thead>
        <tbody id="productTableBody">
          <tr><td colspan="6" class="text-center py-4">Đang tải dữ liệu...</td></tr>
        </tbody>
      </table>
    </div>
    <div id="productPagination" class="flex flex-wrap justify-center mt-4 space-x-2"></div>

    <!-- Modal Thêm/Sửa Sản Phẩm (Đơn giản hóa) -->
    <div id="productModal" class="fixed inset-0 bg-black bg-opacity-50 hidden flex items-center justify-center z-50 overflow-y-auto pt-10 pb-10">
      <div class="bg-white p-6 rounded-lg w-[600px] shadow-xl my-auto">
        <h2 id="productModalTitle" class="text-xl font-bold mb-4">Thêm Sản Phẩm</h2>
        <form id="productForm" onsubmit="return false;">
          <input type="hidden" id="prodId" name="id">
          
          <div class="grid grid-cols-2 gap-4">
            <div class="mb-4">
              <label class="block text-gray-700 text-sm font-bold mb-2">Tên SP *</label>
              <input type="text" id="prodName" name="name" required class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
            </div>
            
            <div class="mb-4">
              <label class="block text-gray-700 text-sm font-bold mb-2">Danh mục *</label>
              <select id="prodCategory" name="category_id" required class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                <option value="">Chọn danh mục</option>
              </select>
            </div>
            
            <!-- GIÁ VÀ LỢI NHUẬN -->
            <div class="mb-4 grid grid-cols-2 gap-4">
              <div>
                <label class="block text-gray-700 text-sm font-bold mb-2">Giá nhập (Tham khảo) <span class="text-xs text-gray-500">(Chỉ báo)</span></label>
                <input type="text" disabled value="Theo lô nhập kho" class="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-100 text-gray-500 cursor-not-allowed">
              </div>
              <div>
                <label class="block text-gray-700 text-sm font-bold mb-2">Giá bán đề xuất (VNĐ)*</label>
                <input type="number" step="1000" id="prodProposedPrice" name="proposed_price" required placeholder="Ví dụ: 250000" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
              </div>
              <div>
                <label class="block text-gray-700 text-sm font-bold mb-2">Tỷ suất LN mong muốn (%) *</label>
                <input type="number" step="0.01" id="prodProfitRate" name="profit_rate" required class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
              </div>
            </div>
            
             <div class="mb-4">
              <label class="block text-gray-700 text-sm font-bold mb-2">Thương hiệu *</label>
              <select id="prodBrand" name="brand_id" required class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                <option value="">Chọn thương hiệu</option>
              </select>
            </div>
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">Mô tả sản phẩm</label>
            <textarea id="prodDesc" name="description" rows="3" class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
          </div>

          <!-- Khu vực Nhóm Màu (Mỗi màu có ảnh và các kích cỡ) -->
          <div class="mb-4 border border-gray-200 p-4 rounded bg-gray-50">
            <div class="flex justify-between items-center mb-2">
              <label class="block text-gray-700 text-sm font-bold">Quản lý Màu sắc & Biến thể</label>
              <button type="button" id="btnAddColorGroup" class="bg-indigo-500 hover:bg-indigo-600 text-white px-2 py-1 rounded text-xs">+ Thêm màu sắc</button>
            </div>
            <div id="colorGroupsContainer" class="space-y-6">
               <!-- Các nhóm màu sẽ được render vào đây -->
            </div>
          </div>
          
          <div class="flex justify-end space-x-2 mt-4">
            <button type="button" id="btnCancelProduct" class="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded">Hủy</button>
            <button type="submit" id="btnSaveProduct" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Lưu</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Load filter options
  await loadCategoryOptions();
  await loadBrandOptions();

  // Apply filters from URL query string if present
  const urlParams = new URLSearchParams(window.location.search);
  const kw = urlParams.get('keyword') || '';
  const cateId = urlParams.get('category_id') || '';
  const brandId = urlParams.get('brand_id') || '';
  if (kw) document.getElementById('searchInput').value = kw;
  if (cateId) document.getElementById('filterCategory').value = cateId;
  if (brandId) document.getElementById('filterBrand').value = brandId;

  // Load products with page from URL (default 1)
  const page = parseInt(urlParams.get('page')) || 1;
  await loadProducts(page);

  bindProductEvents();
}

async function loadCategoryOptions() {
  const selectModal = document.getElementById('prodCategory');
  const selectFilter = document.getElementById('filterCategory');
  try {
    const res = await getCategories();
    if (res.status && res.data) {
      const opts = res.data.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
      if (selectModal) selectModal.innerHTML = '<option value="">Chọn danh mục</option>' + opts;
      if (selectFilter) selectFilter.innerHTML = '<option value="">Tất cả danh mục</option>' + opts;
    }
  } catch (error) {
    console.error("Lỗi lấy danh mục:", error);
  }
}

async function loadBrandOptions() {
  const selectModal = document.getElementById('prodBrand');
  const selectFilter = document.getElementById('filterBrand');
  try {
    const res = await getBrands();
    if (res.status && res.data) {
      const opts = res.data.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
      if (selectModal) selectModal.innerHTML = '<option value="">Chọn thương hiệu</option>' + opts;
      if (selectFilter) selectFilter.innerHTML = '<option value="">Tất cả thương hiệu</option>' + opts;
    }
  } catch (error) {
    console.error("Lỗi lấy thương hiệu:", error);
  }
}

async function loadProducts(page = 1) {
  const tbody = document.getElementById('productTableBody');
  const kw = document.getElementById('searchInput') ? document.getElementById('searchInput').value : '';
  const cateId = document.getElementById('filterCategory') ? document.getElementById('filterCategory').value : '';
  const brandId = document.getElementById('filterBrand') ? document.getElementById('filterBrand').value : '';

  try {
    let params = [];
    if (kw) params.push(`keyword=${encodeURIComponent(kw)}`);
    if (cateId) params.push(`category_id=${encodeURIComponent(cateId)}`);
    if (brandId) params.push(`brand_id=${encodeURIComponent(brandId)}`);
    params.push(`page=${page}`);

    // Update URL query string to reflect current filters and page
    const queryString = params.join('&');
    const newUrl = `${window.location.pathname}?${queryString}${window.location.hash}`;
    history.replaceState(null, '', newUrl);

    const res = await getProducts(queryString);
    if (res.status && res.data) {
      renderProductTable(res.data);
      if (res.pagination) {
        renderProductPagination(res.pagination);
      }
    } else {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-red-500">Không có dữ liệu</td></tr>`;
    }
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-red-500">Lỗi kết nối máy chủ</td></tr>`;
  }
}

function renderProductPagination(pagination) {
  const container = document.getElementById('productPagination');
  if (!container) return;
  if (!pagination) {
    container.innerHTML = '';
    return;
  }

  let html = '';
  const currentPage = pagination.current_page;
  const totalPages = pagination.total_pages;

  if (currentPage > 1) {
    html += `<button class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded" onclick="window.loadProductsPage(${currentPage - 1})">Trước</button>`;
  }

  for (let i = 1; i <= totalPages; i++) {
    if (i === currentPage) {
      html += `<button class="px-3 py-1 bg-blue-500 text-white rounded">${i}</button>`;
    } else {
      html += `<button class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded" onclick="window.loadProductsPage(${i})">${i}</button>`;
    }
  }

  if (currentPage < totalPages) {
    html += `<button class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded" onclick="window.loadProductsPage(${currentPage + 1})">Sau</button>`;
  }

  container.innerHTML = html;
}

// Gắn hàm vào window để gọi từ onclick
window.loadProductsPage = function (page) {
  if (window.adminSetPageHash) window.adminSetPageHash('listsp', page);
  loadProducts(page);
};

function renderProductTable(products) {
  const tbody = document.getElementById('productTableBody');
  if (!products || products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4">Chưa có sản phẩm nào</td></tr>`;
    return;
  }

  tbody.innerHTML = products.map(p => {
    const rawImg = p.image || p.main_image;
    const imgUrl = rawImg
      ? (rawImg.startsWith('http') || rawImg.startsWith('data:') ? rawImg : `../image/${rawImg}`)
      : 'https://ui-avatars.com/api/?name=SP&background=random&color=fff&size=50';

    return `
    <tr class="border-b hover:bg-gray-50">
      <td class="py-3 px-6">${p.id}</td>
      <td class="py-3 px-6">
        <img src="${imgUrl}" alt="${p.name}" class="w-12 h-12 object-cover rounded shadow-sm">
      </td>
      <td class="py-3 px-6 font-medium max-w-xs truncate" title="${p.name}">${p.name}</td>
      <td class="py-3 px-6">${p.category_name || p.category_id || 'N/A'}</td>
      <td class="py-3 px-6 text-sm">
        <div class="font-semibold text-green-600">${Number(p.min_price || p.price || 0).toLocaleString()}đ</div>
        <div class="text-gray-500">Đã bán: ${p.sold_count || 0}</div>
      </td>
      <td class="py-3 px-6 text-center space-y-1">
        <button class="bg-yellow-500 hover:bg-yellow-600 text-white w-full py-1 rounded text-sm btn-edit-prod" data-product='${JSON.stringify(p).replace(/'/g, "&apos;")}'>Sửa</button>
        <button class="bg-red-500 hover:bg-red-600 text-white w-full py-1 rounded text-sm btn-del-prod" data-id="${p.id}">Xóa</button>
      </td>
    </tr>
  `;
  }).join('');
}

function bindProductEvents() {
  const modal = document.getElementById('productModal');
  const form = document.getElementById('productForm');
  const modalTitle = document.getElementById('productModalTitle');

  // Tìm kiếm & Lọc
  document.getElementById('btnSearch').addEventListener('click', () => {
    loadProducts(1);
  });

  // Mở modal Thêm
  document.getElementById('btnAddProduct').addEventListener('click', () => {
    modalTitle.textContent = 'Thêm Sản Phẩm';
    form.reset();
    document.getElementById('prodId').value = '';

    // Reset container
    const colorGroupsContainer = document.getElementById('colorGroupsContainer');
    colorGroupsContainer.innerHTML = '';
    addColorGroupRow('', '', 1); // dòng đầu tiên làm ảnh chính

    modal.classList.remove('hidden');
  });

  // Đóng modal
  document.getElementById('btnCancelProduct').addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  // Thêm Color Group
  document.getElementById('btnAddColorGroup').addEventListener('click', () => {
    addColorGroupRow();
  });

  // Xóa Color Group và tính năng liên quan bên trong Color Group
  document.getElementById('colorGroupsContainer').addEventListener('click', (e) => {
    // Xóa màu
    if (e.target.closest('.btn-remove-color-group')) {
      e.preventDefault();
      e.target.closest('.color-group-row').remove();
    }
    // Thêm kích cỡ cho màu này
    if (e.target.closest('.btn-add-size')) {
      e.preventDefault();
      const sizesContainer = e.target.closest('.color-group-row').querySelector('.sizes-container');
      addSizeRow(sizesContainer);
    }
    // Xóa kích cỡ
    if (e.target.closest('.btn-remove-size')) {
      e.preventDefault();
      e.target.closest('.size-row').remove();
    }
  });

  function addColorGroupRow(color = '', imageUrl = '', isMain = 0, existingImageId = '') {
    const container = document.getElementById('colorGroupsContainer');
    const groupId = Date.now() + Math.floor(Math.random() * 1000); // Unique ID for inputs
    const row = document.createElement('div');
    row.className = 'color-group-row border border-indigo-200 p-3 rounded bg-white relative';

    const isChecked = isMain == 1 || container.children.length === 0 ? 'checked' : '';
    const imgSrc = imageUrl ? imageUrl : 'https://ui-avatars.com/api/?name=Ảnh&background=f3f4f6&color=9ca3af&size=80';

    row.innerHTML = `
      <div class="flex items-start space-x-4 mb-3">
        <!-- Chứa hình ảnh -->
        <div class="w-24 h-24 shrink-0 border rounded overflow-hidden bg-gray-100 flex items-center justify-center relative">
          <img src="${imgSrc}" class="img-preview w-full h-full object-cover">
        </div>
        
        <!-- Chứa thông tin nhóm màu -->
        <div class="flex-1 space-y-2">
          <input type="hidden" class="cg-existing-image-id" value="${existingImageId}">
          <input type="hidden" class="cg-existing-url" value="${imageUrl}">
          
          <div class="flex items-center space-x-2">
            <input type="text" placeholder="Tên Màu sắc (vd: Đen)" value="${color}" class="cg-color shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline font-bold text-indigo-700" required>
            <button type="button" class="bg-red-500 hover:bg-red-600 text-white rounded px-3 py-2 btn-remove-color-group" title="Xóa màu này">X</button>
          </div>

          <div class="flex items-center space-x-4">
            <input type="file" accept="image/*" class="cg-img-file text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 w-1/2">
            
            <label class="flex items-center space-x-1 whitespace-nowrap text-sm cursor-pointer">
              <input type="radio" name="main_image_radio" class="cg-img-main focus:ring-blue-500 w-4 h-4" value="1" ${isChecked}>
              <span class="font-medium text-blue-600">Chọn làm ảnh bìa chính</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Khu vực Size của màu này -->
      <div class="pl-28">
        <div class="flex justify-between items-center mb-1">
          <span class="text-sm font-semibold text-gray-600">Các kích cỡ của màu này:</span>
          <button type="button" class="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-2 py-1 rounded text-xs btn-add-size">+ Thêm Size</button>
        </div>
        <div class="sizes-container space-y-2">
           <!-- Render sizes here -->
        </div>
      </div>
    `;

    // Preview img on change
    const fileInput = row.querySelector('.cg-img-file');
    const preview = row.querySelector('.img-preview');
    fileInput.addEventListener('change', function (e) {
      if (e.target.files && e.target.files[0]) {
        preview.src = URL.createObjectURL(e.target.files[0]);
        row.querySelector('.cg-existing-url').value = ''; // clear existing url if new file selected
      }
    });

    container.appendChild(row);
    return row.querySelector('.sizes-container');
  }

  function addSizeRow(container, size = '', variantId = '') {
    const row = document.createElement('div');
    row.className = 'flex items-center space-x-2 size-row';
    row.innerHTML = `
      <input type="hidden" class="sz-variant-id" value="${variantId}">
      <input type="text" placeholder="Kích cỡ (vd: XL, 42)" value="${size}" class="sz-name shadow appearance-none border border-gray-300 rounded w-[200px] py-1.5 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-indigo-500" required>
      <button type="button" class="bg-gray-200 hover:bg-red-500 hover:text-white text-gray-600 rounded px-2 py-1 text-sm btn-remove-size" title="Xóa size này">X</button>
    `;
    container.appendChild(row);
  }

  // Lưu form (Thêm/Sửa) bằng Submit Form (Hỗ trợ nhấn Enter)
  document.getElementById('btnSaveProduct').addEventListener('click', async (e) => {
    e.preventDefault();

    const form = document.getElementById('productForm');
    const modal = document.getElementById('productModal');

    const btnSave = document.getElementById('btnSaveProduct');
    const originalText = btnSave.innerHTML;
    btnSave.innerHTML = "Đang lưu...";
    btnSave.disabled = true;

    const formData = new FormData(form);
    const id = formData.get('id');
    const isUpdate = !!id;

    const colorGroupRows = document.querySelectorAll('.color-group-row');
    const colorsData = [];
    let mainColorIndex = 0;
    let hasImage = false;

    if (colorGroupRows.length === 0) {
      alert("Vui lòng thêm ít nhất 1 màu sắc cho sản phẩm!");
      btnSave.innerHTML = originalText;
      btnSave.disabled = false;
      return;
    }

    colorGroupRows.forEach((row, index) => {
      const colorName = row.querySelector('.cg-color').value.trim();
      const existingImageId = row.querySelector('.cg-existing-image-id').value;
      const existingUrl = row.querySelector('.cg-existing-url').value;
      const isMain = row.querySelector('.cg-img-main').checked;
      const fileInput = row.querySelector('.cg-img-file');

      if (isMain) mainColorIndex = index;

      const colorObj = {
        color: colorName,
        existing_image_id: existingImageId,
        existing_url: existingUrl,
        is_main: isMain ? 1 : 0,
        sizes: []
      };

      const sizeRows = row.querySelectorAll('.size-row');
      sizeRows.forEach(szRow => {
        const vId = szRow.querySelector('.sz-variant-id').value;
        const sizeName = szRow.querySelector('.sz-name').value.trim();
        if (sizeName) {
          colorObj.sizes.push({ id: vId, size: sizeName, status: 1 });
        }
      });

      colorsData.push(colorObj);

      if (fileInput.files.length > 0) {
        formData.append('image_files[]', fileInput.files[0]);
        hasImage = true;
      } else {
        formData.append('image_files[]', new Blob());
        if (existingUrl) hasImage = true;
      }
    });

    if (!hasImage) {
      alert("Vui lòng có ít nhất 1 hình ảnh!");
      btnSave.innerHTML = originalText;
      btnSave.disabled = false;
      return;
    }

    let hasSizes = colorsData.every(c => c.sizes.length > 0);
    if (!hasSizes) {
      alert("Mỗi màu phải có ít nhất 1 size!");
      btnSave.innerHTML = originalText;
      btnSave.disabled = false;
      return;
    }

    formData.append('colors', JSON.stringify(colorsData));
    formData.append('main_image_index', mainColorIndex);

    const proposed_price = document.getElementById('prodProposedPrice').value;
    const profitRate = document.getElementById('prodProfitRate').value;

    formData.append('proposed_price', proposed_price);
    formData.append('profit_rate', profitRate);

    try {
      const res = isUpdate
        ? await updateProduct(formData)
        : await addProduct(formData);

      if (res.status === true || res.status === "success") {
        alert("Lưu thành công!");
        modal.classList.add('hidden');
        loadProducts(1);
      } else {
        alert("Lỗi: " + (res.message || "Không thể lưu"));
      }
    } catch (error) {
      alert("Lỗi kết nối!");
    } finally {
      btnSave.innerHTML = originalText;
      btnSave.disabled = false;
    }
  });
  // Gắn sự kiện Sửa/Xóa trong bảng
  document.getElementById('productTableBody').addEventListener('click', async (e) => {
    if (e.target.classList.contains('btn-edit-prod')) {
      const pData = JSON.parse(e.target.getAttribute('data-product'));
      modalTitle.textContent = 'Sửa Sản Phẩm';

      // Điền data vào form
      document.getElementById('prodId').value = pData.id || '';
      document.getElementById('prodName').value = pData.name || '';
      document.getElementById('prodCategory').value = pData.category_id || '';
      document.getElementById('prodProfitRate').value = pData.profit_rate || '20';
      document.getElementById('prodProposedPrice').value = pData.proposed_price || '0';
      document.getElementById('prodBrand').value = pData.brand_id || '';
      document.getElementById('prodDesc').value = pData.description || '';

      // Tải và hiển thị dữ liệu màu & kích cỡ
      const colorGroupsContainer = document.getElementById('colorGroupsContainer');
      colorGroupsContainer.innerHTML = '<div class="text-sm text-gray-500 py-2">Đang tải dữ liệu...</div>';

      modal.classList.remove('hidden');

      try {
        const detailRes = await getProductDetail(pData.id);
        colorGroupsContainer.innerHTML = '';

        if (detailRes.status && detailRes.data) {
          const productData = detailRes.data;

          if (productData.colors && productData.colors.length > 0) {
            productData.colors.forEach((cData, index) => {
              const sizesContainer = addColorGroupRow(cData.color, cData.image_url, cData.is_main, cData.image_id);
              if (cData.sizes && cData.sizes.length > 0) {
                cData.sizes.forEach(sz => {
                  addSizeRow(sizesContainer, sz.size, sz.id);
                });
              } else {
                addSizeRow(sizesContainer);
              }
            });
          } else {
            const sizeContainer = addColorGroupRow('', '', 1);
            addSizeRow(sizeContainer);
          }

        } else {
          const sizeContainer = addColorGroupRow('', '', 1);
          addSizeRow(sizeContainer);
        }
      } catch (err) {
        colorGroupsContainer.innerHTML = '';
        const sizeContainer = addColorGroupRow('', '', 1);
        addSizeRow(sizeContainer);
      }
    }

    if (e.target.classList.contains('btn-del-prod')) {
      const id = e.target.getAttribute('data-id');
      if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này không? Tất cả dữ liệu liên quan có thể bị xóa.')) {
        try {
          const formData = new FormData();
          formData.append('id', id);

          const res = await deleteProduct(id);

          if (res.status === true || res.status === "success") {
            alert("Xóa thành công!");
            loadProducts(1);
          } else {
            alert("Lỗi: " + (res.message || "Không thể xóa"));
          }
        } catch (error) {
          alert("Lỗi kết nối khi xóa");
        }
      }
    }
  });
}

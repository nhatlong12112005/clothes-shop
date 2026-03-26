import { getInventory } from '../../api/inventory.js';
import { updateAdminUrl, getAdminUrlParams } from '../utils/urlSync.js';

const THRESHOLD_KEY = 'inv_low_stock_threshold';
const PAGE_SIZE = 10; // số sản phẩm (đã nhóm) mỗi trang

// Module-level cache
let groupedProductsCache = []; // array of [productName, variants[]]
let filteredCache     = [];   // after status + search filter
let currentPageInv    = 1;
let currentThreshold  = 10;
let currentStatusFilter = 'all'; // 'all' | 'out' | 'low' | 'ok'
let currentSearchFilter = '';

export async function renderInventoryManager(container) {
  // Initialize state from URL parameters
  const urlParams = getAdminUrlParams();
  const pageParam = parseInt(urlParams.get('page'));
  const statusParam = urlParams.get('status');
  const searchParam = urlParams.get('q');
  const thresholdParam = urlParams.get('threshold');
  if (!isNaN(pageParam) && pageParam > 0) currentPageInv = pageParam;
  if (statusParam) currentStatusFilter = statusParam;
  if (searchParam) {
    currentSearchFilter = searchParam;
    document.getElementById('invSearchInput').value = searchParam;
  }
  if (thresholdParam) {
    const th = parseInt(thresholdParam);
    if (!isNaN(th)) {
      currentThreshold = th;
      document.getElementById('lowStockThreshold').value = th;
      localStorage.setItem('inv_low_stock_threshold', th);
    }
  }
  const savedThreshold = localStorage.getItem(THRESHOLD_KEY) || 10;
  currentThreshold = parseInt(savedThreshold);

  container.innerHTML = `
    <h1 class="text-[24px] font-bold text-primary mb-4">Quản lý Tồn Kho</h1>
    
    <div class="w-full flex justify-between items-center mb-4 flex-wrap gap-2">
      <p class="text-gray-600">Tổng tồn kho theo từng sản phẩm. Nhấn <strong>Xem chi tiết</strong> để xem từng biến thể.</p>
      <div class="flex items-center gap-2 bg-yellow-50 border border-yellow-300 rounded px-3 py-2">
        <label class="text-sm font-semibold text-yellow-800">🔔 Ngưỡng cảnh báo hết hàng:</label>
        <input type="number" id="lowStockThreshold" value="${savedThreshold}" min="0" class="border border-yellow-400 rounded px-2 py-1 w-20 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500">
        <button id="btnSetThreshold" class="bg-yellow-500 hover:bg-yellow-600 text-white text-sm px-3 py-1 rounded font-bold">Lưu</button>
      </div>
    </div>

    <!-- Bộ lọc -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <input id="invSearchInput" type="text" placeholder="🔍 Tìm theo tên sản phẩm..."
        class="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 w-64">
      <select id="invStatusFilter" class="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400">
        <option value="all">Tất cả trạng thái</option>
        <option value="out">🔴 Hết hàng</option>
        <option value="low">🟡 Sắp hết hàng</option>
        <option value="ok">🟢 Bình thường</option>
      </select>
      <button id="btnInvReset" class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded text-sm">Reset</button>
      <span id="invFilterCount" class="text-sm text-gray-500"></span>
    </div>

    <div class="w-full overflow-x-auto shadow-md rounded-lg">
      <table class="w-full text-left bg-white border-collapse">
        <thead class="bg-gray-100 border-b">
          <tr>
            <th class="py-3 px-6 font-semibold">Tên Sản phẩm</th>
            <th class="py-3 px-6 font-semibold w-44 text-center">Tổng tồn kho</th>
            <th class="py-3 px-6 font-semibold w-44 text-center">Trạng thái</th>
            <th class="py-3 px-6 font-semibold w-40 text-center">Tác vụ</th>
          </tr>
        </thead>
        <tbody id="inventoryTableBody">
          <tr><td colspan="4" class="text-center py-4">Đang tải dữ liệu...</td></tr>
        </tbody>
      </table>
    </div>
    <div id="inventoryPagination" class="flex flex-wrap justify-center mt-4 gap-2"></div>
  `;

  document.getElementById('btnSetThreshold').addEventListener('click', () => {
    const val = parseInt(document.getElementById('lowStockThreshold').value);
    if (isNaN(val) || val < 0) { alert('Ngưỡng không hợp lệ'); return; }
    currentThreshold = val;
    localStorage.setItem(THRESHOLD_KEY, val);
    alert(`Đã lưu ngưỡng cảnh báo: ${val} sản phẩm`);
    // Re-render current page with new threshold
    renderPage(currentPageInv);
  });

  await loadAllInventory();

  // Bind filter events
  document.getElementById('invStatusFilter').addEventListener('change', () => {
    currentStatusFilter = document.getElementById('invStatusFilter').value;
    updateAdminUrl([`status=${encodeURIComponent(currentStatusFilter)}`, `page=${currentPageInv}`, `q=${encodeURIComponent(currentSearchFilter)}`, `threshold=${currentThreshold}`]);
    applyFilters();
  });
  document.getElementById('invSearchInput').addEventListener('input', () => {
    currentSearchFilter = document.getElementById('invSearchInput').value.trim().toLowerCase();
    updateAdminUrl([`status=${encodeURIComponent(currentStatusFilter)}`, `page=${currentPageInv}`, `q=${encodeURIComponent(currentSearchFilter)}`, `threshold=${currentThreshold}`]);
    applyFilters();
  });
  document.getElementById('btnInvReset').addEventListener('click', () => {
    document.getElementById('invStatusFilter').value = 'all';
    document.getElementById('invSearchInput').value = '';
    currentStatusFilter = 'all';
    currentSearchFilter = '';
    updateAdminUrl([`status=all`, `page=1`, `threshold=${currentThreshold}`]);
    applyFilters();
  });
}

// Fetch all variant rows once, build groupedProductsCache
async function loadAllInventory() {
  const tbody = document.getElementById('inventoryTableBody');
  try {
    const firstRes = await getInventory('page=1&limit=200');
    if (!firstRes.status || !firstRes.data) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-red-500">Lỗi lấy dữ liệu tồn kho</td></tr>`;
      return;
    }

    let allItems = [...firstRes.data];

    if (firstRes.pagination && firstRes.pagination.total_pages > 1) {
      const totalPages = firstRes.pagination.total_pages;
      const fetches = [];
      for (let p = 2; p <= totalPages; p++) {
        fetches.push(getInventory(`page=${p}&limit=200`));
      }
      const results = await Promise.all(fetches);
      results.forEach(r => { if (r.status && r.data) allItems = allItems.concat(r.data); });
    }

    // Group by product_name → array of entries for stable ordering
    const map = {};
    allItems.forEach(inv => {
      const name = inv.product_name || 'Không xác định';
      if (!map[name]) map[name] = [];
      map[name].push(inv);
    });
    groupedProductsCache = Object.entries(map); // [[name, variants[]], ...]

    currentPageInv = 1;
    applyFilters();
  } catch(error) {
    document.getElementById('inventoryTableBody').innerHTML =
      `<tr><td colspan="4" class="text-center py-4 text-red-500">Lỗi kết nối máy chủ</td></tr>`;
  }
}

// Filter groupedProductsCache → filteredCache then paginate
function applyFilters() {
  filteredCache = groupedProductsCache.filter(([productName, variants]) => {
    // Search filter
    if (currentSearchFilter && !productName.toLowerCase().includes(currentSearchFilter)) return false;

    // Status filter based on total stock
    if (currentStatusFilter !== 'all') {
      const totalStock = variants.reduce((s, v) => s + parseInt(v.stock || 0), 0);
      if (currentStatusFilter === 'out'  && totalStock > 0) return false;
      if (currentStatusFilter === 'low'  && (totalStock <= 0 || totalStock > currentThreshold)) return false;
      if (currentStatusFilter === 'ok'   && totalStock <= currentThreshold) return false;
    }
    return true;
  });

  // Update count label
  const countEl = document.getElementById('invFilterCount');
  if (countEl) {
    countEl.textContent = currentStatusFilter === 'all' && !currentSearchFilter
      ? `${filteredCache.length} sản phẩm`
      : `Tìm thấy ${filteredCache.length} / ${groupedProductsCache.length} sản phẩm`;
  }

  currentPageInv = 1;
  renderPage(1);
}

// Render one page of grouped products
function renderPage(page) {
  currentPageInv = page;
  const totalPages = Math.ceil(filteredCache.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const pageItems = filteredCache.slice(start, start + PAGE_SIZE);

  renderGroupedInventory(pageItems);
  renderPagination(page, totalPages);
}

function getStatusBadge(qty, threshold) {
  if (qty <= 0)
    return `<span class="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">Hết hàng</span>`;
  if (qty <= threshold)
    return `<span class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">⚠️ Sắp hết (&lt; ${threshold + 1})</span>`;
  return `<span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Bình thường</span>`;
}

function renderGroupedInventory(pageItems) {
  const tbody = document.getElementById('inventoryTableBody');
  if (!pageItems || pageItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4">Chưa có dữ liệu tồn kho</td></tr>`;
    return;
  }

  let html = '';
  pageItems.forEach(([productName, variants], idx) => {
    const totalStock = variants.reduce((sum, v) => sum + parseInt(v.stock || 0), 0);
    const alertVariants = variants.filter(v => parseInt(v.stock || 0) <= currentThreshold);
    const outVariants   = variants.filter(v => parseInt(v.stock || 0) <= 0);

    let rowClass = '';
    if (outVariants.length === variants.length) rowClass = 'bg-red-50';
    else if (alertVariants.length > 0) rowClass = 'bg-yellow-50';

    const detailRowId = `inv-detail-${currentPageInv}-${idx}`;

    const variantRows = variants.map(inv => {
      const qty = parseInt(inv.stock || 0);
      let varClass = '';
      if (qty <= 0) varClass = 'bg-red-50';
      else if (qty <= currentThreshold) varClass = 'bg-yellow-50';
      return `
        <tr class="border-b text-sm ${varClass}">
          <td class="py-2 px-6 pl-10 text-gray-500 italic">Biến thể #${inv.variant_id}</td>
          <td class="py-2 px-6 text-gray-700">${inv.color || 'N/A'}</td>
          <td class="py-2 px-6 text-gray-700">${inv.size || 'N/A'}</td>
          <td class="py-2 px-6 text-center font-bold ${qty <= currentThreshold ? 'text-red-600' : 'text-green-600'}">${qty}</td>
          <td class="py-2 px-6 text-center">${getStatusBadge(qty, currentThreshold)}</td>
        </tr>`;
    }).join('');

    const variantHeader = `
      <tr class="bg-gray-200 text-xs uppercase text-gray-500">
        <td class="py-2 px-6 pl-10 font-semibold">Biến thể</td>
        <td class="py-2 px-6 font-semibold">Màu sắc</td>
        <td class="py-2 px-6 font-semibold">Kích cỡ</td>
        <td class="py-2 px-6 text-center font-semibold">Tồn kho</td>
        <td class="py-2 px-6 text-center font-semibold">Trạng thái</td>
      </tr>`;

    html += `
      <tr class="border-b hover:bg-gray-50 ${rowClass} cursor-pointer" onclick="window.toggleInventoryDetail('${detailRowId}')">
        <td class="py-3 px-6 font-semibold text-gray-800">
          <span class="inline-flex items-center gap-2">
            <i id="icon-${detailRowId}" class="fa-solid fa-chevron-right text-xs text-gray-400 transition-transform duration-200"></i>
            ${productName}
          </span>
        </td>
        <td class="py-3 px-6 text-center text-lg font-bold ${totalStock <= currentThreshold ? 'text-red-600' : 'text-green-600'}">${totalStock}</td>
        <td class="py-3 px-6 text-center">${getStatusBadge(totalStock, currentThreshold)}</td>
        <td class="py-3 px-6 text-center">
          <button onclick="event.stopPropagation(); window.toggleInventoryDetail('${detailRowId}')"
            class="text-xs border border-blue-500 text-blue-600 px-3 py-1 rounded hover:bg-blue-500 hover:text-white transition whitespace-nowrap">
            <i class="fa-solid fa-list-ul mr-1"></i>Chi tiết (${variants.length})
          </button>
        </td>
      </tr>
      <tr id="${detailRowId}" class="hidden">
        <td colspan="4" class="p-0">
          <table class="w-full border-collapse">
            ${variantHeader}
            ${variantRows}
          </table>
        </td>
      </tr>`;
  });

  tbody.innerHTML = html;
}

function renderPagination(cur, total) {
  const container = document.getElementById('inventoryPagination');
  if (!container) return;
  if (total <= 1) { container.innerHTML = ''; return; }

  let html = '';
  if (cur > 1)
    html += `<button class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded" onclick="window.goInventoryPage(${cur - 1})">Trước</button>`;
  for (let i = 1; i <= total; i++) {
    html += i === cur
      ? `<button class="px-3 py-1 bg-blue-500 text-white rounded">${i}</button>`
      : `<button class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded" onclick="window.goInventoryPage(${i})">${i}</button>`;
  }
  if (cur < total)
    html += `<button class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded" onclick="window.goInventoryPage(${cur + 1})">Sau</button>`;

  container.innerHTML = html;
}

window.goInventoryPage = function(page) { updateAdminUrl([`status=${encodeURIComponent(currentStatusFilter)}`, `page=${page}`, `q=${encodeURIComponent(currentSearchFilter)}`, `threshold=${currentThreshold}`]); renderPage(page); };

window.toggleInventoryDetail = function(rowId) {
  const row  = document.getElementById(rowId);
  const icon = document.getElementById(`icon-${rowId}`);
  if (!row) return;
  const isHidden = row.classList.contains('hidden');
  row.classList.toggle('hidden', !isHidden);
  if (icon) icon.style.transform = isHidden ? 'rotate(90deg)' : 'rotate(0deg)';
};

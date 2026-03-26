import { getPricingReport } from '../../api/report.js';
import { updateAdminUrl, getAdminUrlParams } from '../utils/urlSync.js';

const PAGE_SIZE = 10;

let allDataCache   = [];  // raw rows from API
let groupedCache   = [];  // [[productName, rows[]], ...]
let filteredGroups = [];  // after search filter
let currentPage    = 1;

export async function renderPricingManager(container) {
  // Initialize state from URL parameters
  const urlParams = getAdminUrlParams();
  const pageParam = parseInt(urlParams.get('page'));
  const searchParam = urlParams.get('q');
  let initPage = 1;
  let initSearch = '';
  if (!isNaN(pageParam) && pageParam > 0) initPage = pageParam;
  if (searchParam) initSearch = searchParam;

  container.innerHTML = `
    <h1 class="text-[24px] font-bold text-primary mb-4">Quản lý Giá bán</h1>
    <p class="text-gray-500 mb-4">Giá vốn, tỉ lệ lợi nhuận và giá bán theo từng sản phẩm. Nhấn <strong>Xem chi tiết</strong> để xem từng lô/biến thể.</p>

    <div class="mb-4 flex items-center gap-3">
      <input id="pricingSearch" type="text" placeholder="Tìm theo tên sản phẩm..."
        class="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 w-64">
      <button id="btnPricingSearch" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm">Tìm</button>
      <button id="btnPricingReset"  class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm">Reset</button>
    </div>

    <div class="w-full overflow-x-auto shadow-md rounded-lg">
      <table class="w-full text-left bg-white border-collapse text-sm">
        <thead class="bg-gray-100 border-b">
          <tr>
            <th class="py-3 px-4 font-semibold">Sản phẩm</th>
            <th class="py-3 px-4 font-semibold text-right">Giá bán</th>
            <th class="py-3 px-4 font-semibold text-center">Tổng tồn kho</th>
            <th class="py-3 px-4 font-semibold text-center w-40">Tác vụ</th>
          </tr>
        </thead>
        <tbody id="pricingTableBody">
          <tr><td colspan="4" class="text-center py-4">Đang tải dữ liệu...</td></tr>
        </tbody>
      </table>
    </div>
    <div id="pricingPagination" class="flex flex-wrap justify-center mt-4 gap-2"></div>
  `;

  try {
    const res = await getPricingReport();
    if (res.status && res.data) {
      allDataCache = res.data;
      buildGroups(allDataCache);
      
      if (initSearch) {
        document.getElementById('pricingSearch').value = initSearch;
        const lower = initSearch.toLowerCase();
        filteredGroups = groupedCache.filter(([name]) => name.toLowerCase().includes(lower));
      } else {
        filteredGroups = groupedCache;
      }
      renderPage(initPage);
    } else {
      document.getElementById('pricingTableBody').innerHTML =
        `<tr><td colspan="4" class="text-center py-4 text-red-500">Chưa có dữ liệu</td></tr>`;
    }
  } catch(e) {
    document.getElementById('pricingTableBody').innerHTML =
      `<tr><td colspan="4" class="text-center py-4 text-red-500">Lỗi kết nối</td></tr>`;
  }

  document.getElementById('btnPricingSearch').addEventListener('click', () => {
    const kw = document.getElementById('pricingSearch').value.trim();
    updateAdminUrl([`q=${encodeURIComponent(kw)}`, `page=1`]);
    applySearch(kw);
  });
  document.getElementById('pricingSearch').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const kw = e.target.value.trim();
      updateAdminUrl([`q=${encodeURIComponent(kw)}`, `page=1`]);
      applySearch(kw);
    }
  });
  document.getElementById('btnPricingReset').addEventListener('click', () => {
    document.getElementById('pricingSearch').value = '';
    updateAdminUrl([`page=1`]);
    applySearch('');
  });
}

function buildGroups(data) {
  const map = {};
  data.forEach(r => {
    const name = r.product_name || 'Không xác định';
    if (!map[name]) map[name] = [];
    map[name].push(r);
  });
  groupedCache = Object.entries(map);
}

function applySearch(kw) {
  currentPage = 1;
  if (kw) {
    const lower = kw.toLowerCase();
    filteredGroups = groupedCache.filter(([name]) => name.toLowerCase().includes(lower));
  } else {
    filteredGroups = groupedCache;
  }
  renderPage(1);
}

function renderPage(page) {
  currentPage = page;
  const total = Math.ceil(filteredGroups.length / PAGE_SIZE);
  const slice = filteredGroups.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  renderGroupedPricing(slice);
  renderPagination(page, total);
}

function renderGroupedPricing(pageItems) {
  const tbody = document.getElementById('pricingTableBody');
  if (!pageItems || pageItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-gray-500">Không có dữ liệu</td></tr>`;
    return;
  }

  let html = '';
  pageItems.forEach(([productName, rows], idx) => {
    const totalQty    = rows.reduce((s, r) => s + parseInt(r.quantity_remaining || 0), 0);
    const sellPrices  = rows.map(r => parseFloat(r.sell_price || 0)).filter(p => p > 0);
    const minPrice    = sellPrices.length ? Math.min(...sellPrices) : 0;
    const maxPrice    = sellPrices.length ? Math.max(...sellPrices) : 0;

    const priceText = minPrice === maxPrice
      ? `${minPrice.toLocaleString('vi-VN')}đ`
      : `${minPrice.toLocaleString('vi-VN')}đ – ${maxPrice.toLocaleString('vi-VN')}đ`;

    const qtyClass = totalQty <= 0 ? 'text-red-600 font-bold'
                   : totalQty <= 10 ? 'text-yellow-600 font-bold'
                   : 'text-green-600';

    const detailRowId = `pricing-detail-${currentPage}-${idx}`;

    // Build detail sub-rows (one per batch row)
    const detailRows = rows.map(r => {
      const importPrice = parseFloat(r.import_price || 0);
      const sellPrice   = parseFloat(r.sell_price || 0);
      const profit      = sellPrice - importPrice;
      const profitPct   = parseFloat(r.profit_rate || 0);
      const qty         = parseInt(r.quantity_remaining || 0);
      const qtyC        = qty <= 0 ? 'text-red-600 font-bold' : qty <= 10 ? 'text-yellow-600 font-bold' : 'text-green-600';
      return `
        <tr class="border-b text-xs bg-gray-50 hover:bg-gray-100">
          <td class="py-2 px-4 pl-8 text-gray-500">Lô #${r.batch_id}</td>
          <td class="py-2 px-4 text-gray-600">${r.color || 'N/A'}</td>
          <td class="py-2 px-4 text-gray-600">${r.size || 'N/A'}</td>
          <td class="py-2 px-4 text-right">${importPrice.toLocaleString('vi-VN')}đ</td>
          <td class="py-2 px-4 text-right text-gray-500">${profitPct}%</td>
          <td class="py-2 px-4 text-right font-bold text-blue-700">
            ${sellPrice.toLocaleString('vi-VN')}đ
            <span class="text-xs text-green-600 font-normal">(+${profit.toLocaleString('vi-VN')}đ)</span>
          </td>
          <td class="py-2 px-4 text-center ${qtyC}">${qty}</td>
          <td class="py-2 px-4 text-gray-500">${r.batch_date ? new Date(r.batch_date).toLocaleDateString('vi-VN') : 'N/A'}</td>
        </tr>`;
    }).join('');

    const detailHeader = `
      <tr class="bg-gray-200 text-xs uppercase text-gray-500">
        <td class="py-2 px-4 pl-8 font-semibold">Lô</td>
        <td class="py-2 px-4 font-semibold">Màu</td>
        <td class="py-2 px-4 font-semibold">Size</td>
        <td class="py-2 px-4 font-semibold text-right">Giá nhập</td>
        <td class="py-2 px-4 font-semibold text-right">Tỉ lệ LN</td>
        <td class="py-2 px-4 font-semibold text-right">Giá bán</td>
        <td class="py-2 px-4 font-semibold text-center">Còn lại</td>
        <td class="py-2 px-4 font-semibold">Ngày nhập</td>
      </tr>`;

    html += `
      <tr class="border-b hover:bg-gray-50 cursor-pointer" onclick="window.togglePricingDetail('${detailRowId}')">
        <td class="py-3 px-4 font-semibold text-gray-800">
          <span class="inline-flex items-center gap-2">
            <i id="icon-${detailRowId}" class="fa-solid fa-chevron-right text-xs text-gray-400 transition-transform duration-200"></i>
            ${productName}
          </span>
        </td>
        <td class="py-3 px-4 text-right font-bold text-blue-700">${priceText}</td>
        <td class="py-3 px-4 text-center font-bold ${qtyClass}">${totalQty}</td>
        <td class="py-3 px-4 text-center">
          <button onclick="event.stopPropagation(); window.togglePricingDetail('${detailRowId}')"
            class="text-xs border border-blue-500 text-blue-600 px-3 py-1 rounded hover:bg-blue-500 hover:text-white transition whitespace-nowrap">
            <i class="fa-solid fa-list-ul mr-1"></i>Chi tiết (${rows.length})
          </button>
        </td>
      </tr>
      <tr id="${detailRowId}" class="hidden">
        <td colspan="4" class="p-0">
          <table class="w-full border-collapse">
            ${detailHeader}
            ${detailRows}
          </table>
        </td>
      </tr>`;
  });

  tbody.innerHTML = html;
}

function renderPagination(cur, total) {
  const container = document.getElementById('pricingPagination');
  if (!container) return;
  if (total <= 1) { container.innerHTML = ''; return; }

  let html = '';
  if (cur > 1)
    html += `<button class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded" onclick="window.goPricingPage(${cur - 1})">Trước</button>`;
  for (let i = 1; i <= total; i++) {
    html += i === cur
      ? `<button class="px-3 py-1 bg-blue-500 text-white rounded">${i}</button>`
      : `<button class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded" onclick="window.goPricingPage(${i})">${i}</button>`;
  }
  if (cur < total)
    html += `<button class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded" onclick="window.goPricingPage(${cur + 1})">Sau</button>`;

  container.innerHTML = html;
}

window.goPricingPage = function(page) { updateAdminUrl([`q=${encodeURIComponent(document.getElementById('pricingSearch').value.trim())}`, `page=${page}`]); renderPage(page); };

window.togglePricingDetail = function(rowId) {
  const row  = document.getElementById(rowId);
  const icon = document.getElementById(`icon-${rowId}`);
  if (!row) return;
  const isHidden = row.classList.contains('hidden');
  row.classList.toggle('hidden', !isHidden);
  if (icon) icon.style.transform = isHidden ? 'rotate(90deg)' : 'rotate(0deg)';
};

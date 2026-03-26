import { getDashboardReport, getStockReport } from '../../api/report.js';

export async function renderDashboard(container) {
  // Mặc định lấy tháng hiện tại
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  container.innerHTML = `
    <h1 class="text-[24px] font-bold text-primary mb-4 text-left w-full">Thống kê / Dashboard</h1>

    <!-- Tabs -->
    <div class="flex border-b mb-6">
      <button id="tabOverview" class="py-2 px-4 border-b-2 border-blue-500 font-semibold text-blue-600">📊 Tổng quan</button>
      <button id="tabStockReport" class="py-2 px-4 border-b-2 border-transparent font-semibold text-gray-500 hover:text-gray-700">📦 Báo cáo Nhập-Xuất</button>
    </div>

    <!-- Tab Overview -->
    <div id="viewOverview">
      <div class="w-full flex flex-wrap gap-4 items-end mb-6 bg-white p-4 rounded-lg shadow-sm border">
        <div>
          <label class="text-sm text-gray-500 block mb-1">Từ ngày</label>
          <input type="date" id="dateFrom" value="${firstDay}" class="border px-3 py-2 rounded focus:outline-none">
        </div>
        <div>
          <label class="text-sm text-gray-500 block mb-1">Đến ngày</label>
          <input type="date" id="dateTo" value="${lastDay}" class="border px-3 py-2 rounded focus:outline-none">
        </div>
        <button id="btnFilterDashboard" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium">Lọc dữ liệu</button>
      </div>
      <div class="w-full grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <h3 class="text-gray-500 text-sm font-semibold uppercase">Đơn hoàn thành</h3>
          <p class="text-3xl font-bold mt-2" id="metricOrders">...</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <h3 class="text-gray-500 text-sm font-semibold uppercase">Doanh thu</h3>
          <p class="text-3xl font-bold mt-2 text-green-600" id="metricRevenue">...</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow-md border-l-4 border-indigo-500">
          <h3 class="text-gray-500 text-sm font-semibold uppercase">Lợi nhuận gộp</h3>
          <p class="text-3xl font-bold mt-2 text-indigo-600" id="metricProfit">...</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
          <h3 class="text-gray-500 text-sm font-semibold uppercase">Sản phẩm đã bán</h3>
          <p class="text-3xl font-bold mt-2" id="metricProducts">...</p>
        </div>
      </div>
      <div class="w-full bg-white p-6 rounded-lg shadow-md border">
        <h2 class="text-lg font-bold mb-4">Top 5 Sản phẩm bán chạy nhất</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead class="bg-gray-50 border-b">
              <tr>
                <th class="py-3 px-4 font-semibold text-gray-600">ID</th>
                <th class="py-3 px-4 font-semibold text-gray-600">Tên sản phẩm</th>
                <th class="py-3 px-4 font-semibold text-gray-600">Đã bán</th>
                <th class="py-3 px-4 font-semibold text-gray-600">Doanh thu</th>
                <th class="py-3 px-4 font-semibold text-gray-600">Lợi nhuận gộp</th>
              </tr>
            </thead>
            <tbody id="topProductsBody">
              <tr><td colspan="5" class="text-center py-4 text-gray-500">Đang tải...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Tab Báo cáo nhập-xuất -->
    <div id="viewStockReport" class="hidden">
      <div class="w-full flex flex-wrap gap-4 items-end mb-6 bg-white p-4 rounded-lg shadow-sm border">
        <div>
          <label class="text-sm text-gray-500 block mb-1">Từ ngày</label>
          <input type="date" id="stockFrom" value="${firstDay}" class="border px-3 py-2 rounded focus:outline-none">
        </div>
        <div>
          <label class="text-sm text-gray-500 block mb-1">Đến ngày</label>
          <input type="date" id="stockTo" value="${lastDay}" class="border px-3 py-2 rounded focus:outline-none">
        </div>
        <button id="btnFilterStock" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-medium">Xem báo cáo</button>
      </div>

      <!-- Nhập kho -->
      <div class="bg-white p-6 rounded-lg shadow-md border mb-6">
        <h2 class="text-lg font-bold mb-4 text-blue-700">📥 Tổng nhập kho (theo lô)</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-sm">
            <thead class="bg-blue-50 border-b">
              <tr>
                <th class="py-2 px-4">Sản phẩm</th>
                <th class="py-2 px-4">Màu</th>
                <th class="py-2 px-4">Size</th>
                <th class="py-2 px-4">Lô #</th>
                <th class="py-2 px-4 text-right">SL nhập</th>
                <th class="py-2 px-4 text-right">Giá trị nhập</th>
                <th class="py-2 px-4">Ngày nhập</th>
              </tr>
            </thead>
            <tbody id="importReportBody">
              <tr><td colspan="7" class="text-center py-4 text-gray-400">Chọn khoảng ngày và nhấn Xem báo cáo</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Xuất kho -->
      <div class="bg-white p-6 rounded-lg shadow-md border">
        <h2 class="text-lg font-bold mb-4 text-red-700">📤 Tổng xuất kho (đơn hoàn thành)</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-sm">
            <thead class="bg-red-50 border-b">
              <tr>
                <th class="py-2 px-4">Sản phẩm</th>
                <th class="py-2 px-4">Màu</th>
                <th class="py-2 px-4">Size</th>
                <th class="py-2 px-4 text-right">SL xuất</th>
                <th class="py-2 px-4 text-right">Doanh thu</th>
              </tr>
            </thead>
            <tbody id="exportReportBody">
              <tr><td colspan="5" class="text-center py-4 text-gray-400">Chọn khoảng ngày và nhấn Xem báo cáo</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  await loadDashboardData(firstDay, lastDay);

  // Tab switching
  document.getElementById('tabOverview').addEventListener('click', () => {
    switchDashTab('tabOverview', 'viewOverview', 'tabStockReport', 'viewStockReport');
  });
  document.getElementById('tabStockReport').addEventListener('click', () => {
    switchDashTab('tabStockReport', 'viewStockReport', 'tabOverview', 'viewOverview');
  });

  document.getElementById('btnFilterDashboard').addEventListener('click', () => {
    const from = document.getElementById('dateFrom').value;
    const to = document.getElementById('dateTo').value;
    if(!from || !to) { alert('Vui lòng chọn đầy đủ ngày'); return; }
    loadDashboardData(from, to);
  });

  document.getElementById('btnFilterStock').addEventListener('click', () => {
    const from = document.getElementById('stockFrom').value;
    const to   = document.getElementById('stockTo').value;
    loadStockReport(from, to);
  });
}

function switchDashTab(activeId, showId, inactiveId, hideId) {
  document.getElementById(activeId).classList.replace('border-transparent', 'border-blue-500');
  document.getElementById(activeId).classList.replace('text-gray-500', 'text-blue-600');
  document.getElementById(inactiveId).classList.replace('border-blue-500', 'border-transparent');
  document.getElementById(inactiveId).classList.replace('text-blue-600', 'text-gray-500');
  document.getElementById(showId).classList.remove('hidden');
  document.getElementById(hideId).classList.add('hidden');
}

async function loadStockReport(from, to) {
  const importBody = document.getElementById('importReportBody');
  const exportBody = document.getElementById('exportReportBody');
  importBody.innerHTML = `<tr><td colspan="7" class="text-center py-4">Đang tải...</td></tr>`;
  exportBody.innerHTML = `<tr><td colspan="5" class="text-center py-4">Đang tải...</td></tr>`;
  try {
    const res = await getStockReport(from, to);
    if (res.status) {
      const imp = res.import || [];
      const exp = res.export || [];
      importBody.innerHTML = imp.length === 0
        ? `<tr><td colspan="7" class="text-center py-4 text-gray-400">Không có dữ liệu nhập kho</td></tr>`
        : imp.map(r => `
          <tr class="border-b hover:bg-gray-50">
            <td class="py-2 px-4 font-medium">${r.product_name}</td>
            <td class="py-2 px-4">${r.color||'N/A'}</td>
            <td class="py-2 px-4">${r.size||'N/A'}</td>
            <td class="py-2 px-4 text-gray-500">#${r.batch_id}</td>
            <td class="py-2 px-4 text-right font-bold text-blue-700">${r.total_imported}</td>
            <td class="py-2 px-4 text-right">${Number(r.total_import_value).toLocaleString()}đ</td>
            <td class="py-2 px-4 text-gray-500 text-xs">${new Date(r.import_date).toLocaleDateString('vi-VN')}</td>
          </tr>`).join('');
      exportBody.innerHTML = exp.length === 0
        ? `<tr><td colspan="5" class="text-center py-4 text-gray-400">Không có dữ liệu xuất kho</td></tr>`
        : exp.map(r => `
          <tr class="border-b hover:bg-gray-50">
            <td class="py-2 px-4 font-medium">${r.product_name}</td>
            <td class="py-2 px-4">${r.color||'N/A'}</td>
            <td class="py-2 px-4">${r.size||'N/A'}</td>
            <td class="py-2 px-4 text-right font-bold text-red-600">${r.total_exported}</td>
            <td class="py-2 px-4 text-right">${Number(r.total_export_value).toLocaleString()}đ</td>
          </tr>`).join('');
    }
  } catch(e) {
    importBody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-red-500">Lỗi kết nối</td></tr>`;
    exportBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">Lỗi kết nối</td></tr>`;
  }
}

async function loadDashboardData(from, to) {
  try {
    const res = await getDashboardReport(from, to);
    if (res.status && res.data) {
      // Update metrics
      document.getElementById('metricOrders').textContent = res.data.total_orders;
      document.getElementById('metricRevenue').textContent = Number(res.data.total_revenue).toLocaleString() + 'đ';
      document.getElementById('metricProfit').textContent = Number(res.data.total_profit).toLocaleString() + 'đ';
      document.getElementById('metricProducts').textContent = res.data.total_products_sold;

      // Update Top Products
      const tbody = document.getElementById('topProductsBody');
      const tops = res.data.top_products;
      
      if (!tops || tops.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-500">Không có dữ liệu trong khoảng thời gian này</td></tr>`;
      } else {
        tbody.innerHTML = tops.map(p => `
          <tr class="border-b hover:bg-gray-50">
            <td class="py-3 px-4 text-gray-600">${p.id}</td>
            <td class="py-3 px-4 font-medium text-gray-800">${p.name}</td>
            <td class="py-3 px-4 text-orange-600 font-bold">${p.total_sold}</td>
            <td class="py-3 px-4 text-green-600 font-semibold">${Number(p.total_revenue).toLocaleString()}đ</td>
            <td class="py-3 px-4 text-indigo-600 font-bold">${Number(p.total_profit).toLocaleString()}đ</td>
          </tr>
        `).join('');
      }
    }
  } catch (error) {
    document.getElementById('topProductsBody').innerHTML = `<tr><td colspan="4" class="text-center py-4 text-red-500">Lỗi không thể tải dữ liệu thống kê.</td></tr>`;
  }
}

import { getReceipts, getReceiptDetail, addReceipt, updateReceipt, completeReceipt } from '../../api/receipt.js';
import { updateAdminUrl, getAdminUrlParams } from '../utils/urlSync.js';
import { getSuppliers } from '../../api/supplier.js';
import { getProducts, getProductDetail } from '../../api/product.js';

let currentReceiptItems = [];
let editReceiptId = null; // ID phiếu đang sửa (null = tạo mới)

export async function renderReceiptManager(container) {
  // Initialize pagination from URL
  const urlParams = getAdminUrlParams();
  const pageParam = parseInt(urlParams.get('page'));
  const initPage = (!isNaN(pageParam) && pageParam > 0) ? pageParam : 1;
  container.innerHTML = `
    <h1 class="text-[24px] font-bold text-primary mb-4">Quản lý Nhập hàng</h1>
    
    <!-- Tab Navigation -->
    <div class="w-full flex border-b mb-6">
      <button id="tabList" class="py-2 px-4 border-b-2 border-blue-500 font-semibold text-blue-600 focus:outline-none">
        Lịch sử Nhập hàng
      </button>
      <button id="tabCreate" class="py-2 px-4 border-b-2 border-transparent font-semibold text-gray-500 hover:text-gray-700 focus:outline-none">
        + Tạo / Sửa Phiếu Nhập
      </button>
    </div>

    <!-- Tab 1: Danh sách -->
    <div id="viewList" class="w-full block">
      <div class="w-full overflow-x-auto shadow-md rounded-lg">
        <table class="w-full text-left bg-white border-collapse">
          <thead class="bg-gray-100 border-b">
            <tr>
              <th class="py-3 px-4 font-semibold w-20">Mã</th>
              <th class="py-3 px-4 font-semibold">Nhà cung cấp</th>
              <th class="py-3 px-4 font-semibold">Tổng tiền</th>
              <th class="py-3 px-4 font-semibold">Ngày tạo</th>
              <th class="py-3 px-4 font-semibold text-center">Trạng thái</th>
              <th class="py-3 px-4 font-semibold text-center">Hành động</th>
            </tr>
          </thead>
          <tbody id="receiptTableBody">
            <tr><td colspan="6" class="text-center py-4">Đang tải dữ liệu...</td></tr>
          </tbody>
        </table>
      </div>
      <div id="receiptPagination" class="flex flex-wrap justify-center mt-4 space-x-2"></div>
    </div>

    <!-- Tab 2: Tạo/Sửa phiếu nhập -->
    <div id="viewCreate" class="w-full hidden">
      <div class="bg-white p-6 shadow-md rounded-lg border">
        <h2 id="receiptFormTitle" class="text-xl font-bold mb-4">Tạo Phiếu Nhập Mới (Lưu nháp)</h2>
        
        <div class="mb-6">
          <label class="block text-gray-700 font-bold mb-2">Chọn Nhà cung cấp *</label>
          <select id="receiptSupplier" class="shadow border rounded w-full md:w-1/2 py-2 px-3 text-gray-700 focus:outline-none">
            <option value="">-- Click để chọn nhà cung cấp --</option>
          </select>
        </div>

        <hr class="mb-6">
        <h3 class="text-lg font-bold mb-2">Chi tiết mặt hàng nhập</h3>
        
        <!-- Form Add Item -->
        <div class="bg-gray-50 p-4 rounded border mb-4 flex flex-col md:flex-row md:space-x-4 items-end">
          <div class="flex-1 w-full md:w-1/3 mb-2 md:mb-0">
            <label class="block text-xs font-bold text-gray-700">Sản phẩm *</label>
            <select id="itemProductId" class="shadow border rounded w-full py-2 px-3 text-gray-700 text-sm">
               <option value="">-- Chọn sản phẩm --</option>
            </select>
          </div>
          <div class="flex-1 w-full md:w-1/3 mb-2 md:mb-0">
            <label class="block text-xs font-bold text-gray-700">Biến thể (Màu, Size) *</label>
            <select id="itemVariantId" class="shadow border rounded w-full py-2 px-3 text-gray-700 text-sm">
               <option value="">-- Chọn sản phẩm trước --</option>
            </select>
          </div>
          <div class="w-full md:w-32 mb-2 md:mb-0">
            <label class="block text-xs font-bold text-gray-700">Số lượng *</label>
            <input type="number" id="itemQty" class="shadow border rounded w-full py-2 px-3 text-gray-700" min="1" value="1">
          </div>
          <div class="w-full md:w-48 mb-2 md:mb-0">
            <label class="block text-xs font-bold text-gray-700">Đơn giá nhập *</label>
            <input type="number" id="itemPrice" class="shadow border rounded w-full py-2 px-3 text-gray-700" min="0">
          </div>
          <button id="btnAddItemToReceipt" type="button" class="w-full md:w-auto bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded mt-4 md:mt-0">
            Thêm &darr;
          </button>
        </div>

        <!-- Bảng Items -->
        <table class="w-full text-left bg-white border mb-6">
          <thead class="bg-gray-100 border-b">
            <tr>
              <th class="py-2 px-4 font-semibold text-sm">Sản phẩm / Biến thể</th>
              <th class="py-2 px-4 font-semibold text-sm">Số lượng</th>
              <th class="py-2 px-4 font-semibold text-sm">Đơn giá</th>
              <th class="py-2 px-4 font-semibold text-sm">Thành tiền</th>
              <th class="py-2 px-4 font-semibold text-sm text-center">Xóa</th>
            </tr>
          </thead>
          <tbody id="receiptItemsBody">
            <tr><td colspan="5" class="text-center py-4 text-gray-500">Chưa có sản phẩm nào</td></tr>
          </tbody>
        </table>

        <!-- Submit -->
        <div class="flex justify-between items-center border-t pt-4 gap-2 flex-wrap">
          <div class="text-xl font-bold text-gray-800">TỔNG CỘNG: <span id="receiptTotalDisplay" class="text-red-600">0đ</span></div>
          <div class="flex gap-2">
            <button id="btnSaveDraft" class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded shadow">
              💾 Lưu Nháp
            </button>
            <button id="btnSubmitReceipt" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded shadow">
              ✅ Hoàn Tất & Nhập Kho
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Chi tiết phiếu nhập -->
    <div id="receiptDetailModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 hidden">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div class="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
          <h2 class="text-xl font-bold text-gray-800" id="receiptModalTitle">Chi tiết Phiếu Nhập #</h2>
          <button type="button" onclick="closeReceiptDetailModal()" class="text-gray-400 hover:text-red-500 font-bold text-2xl leading-none">&times;</button>
        </div>
        <div class="p-6 overflow-y-auto flex-1 text-sm text-gray-700">
           <div class="grid grid-cols-2 gap-4 mb-4" id="receiptModalInfo"></div>
           <h3 class="font-bold text-gray-800 mb-2">Danh sách mặt hàng nhập</h3>
           <table class="w-full text-left border bg-white mb-2">
             <thead class="bg-gray-100 border-b">
               <tr>
                 <th class="py-2 px-3">Sản phẩm (Biến thể)</th>
                 <th class="py-2 px-3 text-right">SL</th>
                 <th class="py-2 px-3 text-right">Đơn giá nhập</th>
                 <th class="py-2 px-3 text-right">Thành tiền</th>
               </tr>
             </thead>
             <tbody id="receiptModalItemsBody">
               <tr><td colspan="4" class="text-center py-4">Đang tải...</td></tr>
             </tbody>
           </table>
           <div class="text-right font-bold text-lg text-red-600 mt-4" id="receiptModalTotal"></div>
        </div>
      </div>
    </div>
  `;

  await loadReceipts(initPage);
  await loadSuppliersIntoSelect();
  await loadProductsIntoSelect();

  // Xử lý Tabs
  const tabList = document.getElementById('tabList');
  const tabCreate = document.getElementById('tabCreate');
  const viewList = document.getElementById('viewList');
  const viewCreate = document.getElementById('viewCreate');

  tabList.addEventListener('click', () => {
    activateTab(tabList, tabCreate, viewList, viewCreate);
    editReceiptId = null;
    currentReceiptItems = [];
    document.getElementById('receiptFormTitle').textContent = 'Tạo Phiếu Nhập Mới (Lưu nháp)';
    renderReceiptItemsTable();
    loadReceipts(1);
  });

  tabCreate.addEventListener('click', () => {
    activateTab(tabCreate, tabList, viewCreate, viewList);
  });

  bindReceiptCreationEvents();
}

function activateTab(activeBtn, inactiveBtn, showEl, hideEl) {
  activeBtn.classList.replace('border-transparent', 'border-blue-500');
  activeBtn.classList.replace('text-gray-500', 'text-blue-600');
  inactiveBtn.classList.replace('border-blue-500', 'border-transparent');
  inactiveBtn.classList.replace('text-blue-600', 'text-gray-500');
  showEl.classList.replace('hidden', 'block');
  hideEl.classList.replace('block', 'hidden');
}

async function loadReceipts(page = 1) {
  const tbody = document.getElementById('receiptTableBody');
  try {
    const res = await getReceipts(`page=${page}`);
    if (res.status && res.data) {
      const arr = Array.isArray(res.data) ? res.data : (res.data.data || []);
      if (arr.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-gray-500">Chưa có phiếu nhập nào</td></tr>`;
        return;
      }
      tbody.innerHTML = arr.map(r => {
        const isDraft = r.status === 'draft';
        const statusBadge = isDraft
          ? `<span class="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">Nháp</span>`
          : `<span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Hoàn thành</span>`;
        const actions = isDraft
          ? `<button class="bg-orange-400 hover:bg-orange-500 text-white px-2 py-1 rounded text-xs btn-edit-receipt" data-id="${r.id}">Sửa</button>
             <button class="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs btn-complete-receipt" data-id="${r.id}">Hoàn thành</button>`
          : `<button class="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-xs text-gray-700" onclick="window.showReceiptDetail(${r.id})">Xem</button>`;
        return `
        <tr class="border-b hover:bg-gray-50">
          <td class="py-3 px-4 text-gray-500 font-medium">#${r.id}</td>
          <td class="py-3 px-4 text-gray-800">${r.supplier_name || 'N/A'}</td>
          <td class="py-3 px-4 font-bold text-green-600">${Number(r.total_amount).toLocaleString()}đ</td>
          <td class="py-3 px-4 text-gray-500">${new Date(r.import_date).toLocaleString('vi-VN')}</td>
          <td class="py-3 px-4 text-center">${statusBadge}</td>
          <td class="py-3 px-4 text-center space-x-1">${actions}</td>
        </tr>`;
      }).join('');

      // Bind draft actions
      tbody.querySelectorAll('.btn-edit-receipt').forEach(btn => {
        btn.addEventListener('click', () => openEditReceipt(btn.dataset.id));
      });
      tbody.querySelectorAll('.btn-complete-receipt').forEach(btn => {
        btn.addEventListener('click', () => handleCompleteReceipt(btn.dataset.id));
      });

      if (res.pagination) renderReceiptPagination(res.pagination);
    }
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-red-500">Lỗi lấy danh sách phiếu nhập</td></tr>`;
  }
}

async function openEditReceipt(receiptId) {
  const tabCreate = document.getElementById('tabCreate');
  const tabList = document.getElementById('tabList');
  const viewCreate = document.getElementById('viewCreate');
  const viewList = document.getElementById('viewList');
  activateTab(tabCreate, tabList, viewCreate, viewList);

  editReceiptId = receiptId;
  document.getElementById('receiptFormTitle').textContent = `Sửa Phiếu Nhập #${receiptId} (Nháp)`;
  currentReceiptItems = [];
  renderReceiptItemsTable();

  // Load chi tiết phiếu để điền sẵn
  try {
    const res = await getReceiptDetail(receiptId);
    if (res.status && res.data) {
      const items = res.data.items || [];
      items.forEach(item => {
        currentReceiptItems.push({
          variant_id: item.variant_id,
          name: `${item.product_name} (${item.color || 'N/A'} - ${item.size || 'N/A'})`,
          quantity: parseInt(item.quantity_imported),
          import_price: parseFloat(item.import_price),
        });
      });
      renderReceiptItemsTable();
    }
  } catch (e) { }
}

async function handleCompleteReceipt(receiptId) {
  if (!confirm(`Bạn có chắc muốn hoàn thành phiếu #${receiptId}? Kho sẽ được cộng thêm số lượng tương ứng.`)) return;
  try {
    const res = await completeReceipt(receiptId);
    if (res.status) {
      alert(res.message);
      loadReceipts(1);
    } else {
      alert('Lỗi: ' + res.message);
    }
  } catch (e) {
    alert('Lỗi kết nối');
  }
}

function renderReceiptPagination(pagination) {
  const container = document.getElementById('receiptPagination');
  if (!container || !pagination) { if (container) container.innerHTML = ''; return; }
  const { page: curPage, current_page: curPageAlt, total_pages: total } = pagination;
  const cur = curPage || curPageAlt || 1;
  let html = '';
  if (cur > 1) html += `<button class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded" onclick="window.loadReceiptsPage(${cur - 1})">Trước</button>`;
  for (let i = 1; i <= total; i++) {
    html += i === cur
      ? `<button class="px-3 py-1 bg-blue-500 text-white rounded">${i}</button>`
      : `<button class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded" onclick="window.loadReceiptsPage(${i})">${i}</button>`;
  }
  if (cur < total) html += `<button class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded" onclick="window.loadReceiptsPage(${cur + 1})">Sau</button>`;
  container.innerHTML = html;
}
window.loadReceiptsPage = function(page) {
  updateAdminUrl([`page=${page}`]);
  if (window.adminSetPageHash) window.adminSetPageHash('receipt', page);
  loadReceipts(page);
};

async function loadSuppliersIntoSelect() {
  try {
    const res = await getSuppliers();
    if (res.status && res.data) {
      const arr = Array.isArray(res.data) ? res.data : (res.data.data || []);
      document.getElementById('receiptSupplier').innerHTML +=
        arr.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    }
  } catch (e) { }
}

async function loadProductsIntoSelect() {
  try {
    const res = await getProducts('limit=1000');
    if (res.status && res.data) {
      const arr = Array.isArray(res.data) ? res.data : [];
      document.getElementById('itemProductId').innerHTML +=
        arr.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    }
  } catch (e) { }
}

function renderReceiptItemsTable() {
  const tbody = document.getElementById('receiptItemsBody');
  if (currentReceiptItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-500">Chưa có sản phẩm nào</td></tr>`;
    document.getElementById('receiptTotalDisplay').textContent = "0đ";
    return;
  }
  let total = 0;
  tbody.innerHTML = currentReceiptItems.map((item, index) => {
    const subtotal = item.quantity * item.import_price;
    total += subtotal;
    return `
      <tr class="border-b">
        <td class="py-2 px-4 max-w-xs truncate" title="${item.name}">${item.name}</td>
        <td class="py-2 px-4">${item.quantity}</td>
        <td class="py-2 px-4">${Number(item.import_price).toLocaleString()}đ</td>
        <td class="py-2 px-4 font-semibold text-orange-600">${Number(subtotal).toLocaleString()}đ</td>
        <td class="py-2 px-4 text-center">
          <button type="button" class="text-red-500 hover:text-red-700 font-bold btn-del-item" data-index="${index}">X</button>
        </td>
      </tr>`;
  }).join('');
  document.getElementById('receiptTotalDisplay').textContent = Number(total).toLocaleString() + 'đ';
}

function bindReceiptCreationEvents() {
  const selectProd = document.getElementById('itemProductId');
  const selectVar = document.getElementById('itemVariantId');

  selectProd.addEventListener('change', async (e) => {
    const pId = e.target.value;
    selectVar.innerHTML = '<option value="">-- Đang tải... --</option>';
    if (!pId) { selectVar.innerHTML = '<option value="">-- Chọn sản phẩm trước --</option>'; return; }
    try {
      const res = await getProductDetail(pId);
      if (res.status && res.data && res.data.colors) {
        let optionsHTML = '';
        res.data.colors.forEach(c => {
          (c.sizes || []).forEach(s => {
            optionsHTML += `<option value="${s.id}">Màu: ${c.color || 'N/A'} - Size: ${s.size || 'N/A'}</option>`;
          });
        });
        selectVar.innerHTML = optionsHTML
          ? '<option value="">-- Chọn biến thể --</option>' + optionsHTML
          : '<option value="">(Sản phẩm không có biến thể)</option>';
      }
    } catch (err) { selectVar.innerHTML = '<option value="">-- Lỗi --</option>'; }
  });

  document.getElementById('btnAddItemToReceipt').addEventListener('click', () => {
    const vId = selectVar.value;
    const qty = parseInt(document.getElementById('itemQty').value);
    const price = parseFloat(document.getElementById('itemPrice').value);
    const pName = selectProd.options[selectProd.selectedIndex]?.text;
    const vName = selectVar.options[selectVar.selectedIndex]?.text;
    if (!vId || isNaN(qty) || qty <= 0 || isNaN(price) || price < 0) {
      alert("Vui lòng chọn biến thể, số lượng > 0 và đơn giá hợp lệ.");
      return;
    }
    const existing = currentReceiptItems.findIndex(i => i.variant_id == vId);
    if (existing > -1) {
      currentReceiptItems[existing].quantity += qty;
      currentReceiptItems[existing].import_price = price;
    } else {
      currentReceiptItems.push({ variant_id: vId, name: `${pName} (${vName})`, quantity: qty, import_price: price });
    }
    selectVar.value = ''; document.getElementById('itemQty').value = '1'; document.getElementById('itemPrice').value = '';
    renderReceiptItemsTable();
  });

  document.getElementById('receiptItemsBody').addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-del-item')) {
      currentReceiptItems.splice(e.target.dataset.index, 1);
      renderReceiptItemsTable();
    }
  });

  // Lưu nháp
  document.getElementById('btnSaveDraft').addEventListener('click', async () => {
    await submitReceipt(false);
  });

  // Hoàn tất nhập kho
  document.getElementById('btnSubmitReceipt').addEventListener('click', async () => {
    await submitReceipt(true);
  });
}

async function submitReceipt(shouldComplete) {
  const supId = document.getElementById('receiptSupplier').value;
  if (!supId) { alert("Vui lòng chọn nhà cung cấp."); return; }
  if (currentReceiptItems.length === 0) { alert("Phiếu nhập phải có ít nhất 1 mặt hàng."); return; }

  try {
    let res;
    if (editReceiptId) {
      // Sửa phiếu draft hiện có
      res = await updateReceipt({ receipt_id: editReceiptId, supplier_id: supId, items: currentReceiptItems });
    } else {
      // Tạo mới
      res = await addReceipt({ supplier_id: supId, items: currentReceiptItems });
    }

    if (!res.status) { alert(res.message || "Lỗi tạo phiếu nhập."); return; }

    const newReceiptId = res.receipt_id || editReceiptId;

    if (shouldComplete) {
      // Hoàn thành ngay
      const completeRes = await completeReceipt(newReceiptId);
      if (completeRes.status) {
        alert("Phiếu nhập đã hoàn thành! Kho đã được cập nhật.");
      } else {
        alert("Lỗi hoàn thành: " + completeRes.message);
      }
    } else {
      alert(`Đã lưu nháp phiếu nhập #${newReceiptId}. Bạn có thể sửa rồi hoàn thành sau.`);
    }

    // Reset
    editReceiptId = null;
    currentReceiptItems = [];
    renderReceiptItemsTable();
    document.getElementById('receiptFormTitle').textContent = 'Tạo Phiếu Nhập Mới (Lưu nháp)';
    document.getElementById('tabList').click();
  } catch (err) {
    alert("Lỗi kết nối khi gửi phiếu nhập");
  }
}

// Modal chi tiết
window.showReceiptDetail = async function (id) {
  const modal = document.getElementById('receiptDetailModal');
  const title = document.getElementById('receiptModalTitle');
  const info = document.getElementById('receiptModalInfo');
  const tbody = document.getElementById('receiptModalItemsBody');
  const totEl = document.getElementById('receiptModalTotal');
  modal.classList.remove('hidden');
  title.textContent = `Chi tiết Phiếu Nhập #${id}`;
  info.innerHTML = `Đang tải...`;
  tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4">Đang tải...</td></tr>`;
  totEl.textContent = '';
  try {
    const res = await getReceiptDetail(id);
    if (res.status && res.data) {
      const infoData = res.data.receipt_info;
      const itemsData = res.data.items || [];
      const isDraft = infoData.status === 'draft';
      info.innerHTML = `
        <div><b>Nhà cung cấp:</b> ${infoData.supplier_name || 'N/A'}</div>
        <div><b>Ngày nhập:</b> ${new Date(infoData.import_date).toLocaleString('vi-VN')}</div>
        <div><b>Trạng thái:</b> ${isDraft ? '<span class="text-yellow-600 font-bold">Nháp</span>' : '<span class="text-green-600 font-bold">Hoàn thành</span>'}</div>`;
      tbody.innerHTML = itemsData.length === 0
        ? `<tr><td colspan="4" class="text-center py-4">Phiếu trống</td></tr>`
        : itemsData.map(i => `
          <tr class="border-b">
            <td class="py-2 px-3"><div class="font-semibold">${i.product_name}</div><div class="text-xs text-gray-500">Màu: ${i.color || 'N/A'} | Size: ${i.size || 'N/A'}</div></td>
            <td class="py-2 px-3 text-right">${i.quantity_imported}</td>
            <td class="py-2 px-3 text-right">${Number(i.import_price).toLocaleString()}đ</td>
            <td class="py-2 px-3 text-right text-orange-600 font-medium">${Number(i.quantity_imported * i.import_price).toLocaleString()}đ</td>
          </tr>`).join('');
      totEl.textContent = `TỔNG CỘNG: ${Number(infoData.total_amount).toLocaleString()}đ`;
    } else {
      info.innerHTML = `<div class="text-red-500">${res.message || 'Lỗi tải chi tiết'}</div>`;
    }
  } catch (e) {
    info.innerHTML = `<div class="text-red-500">Lỗi kết nối</div>`;
  }
};
window.closeReceiptDetailModal = () => document.getElementById('receiptDetailModal').classList.add('hidden');

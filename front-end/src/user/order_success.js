import { getOrderDetail } from '../api/order.js';
import { loadCategories, renderCategory } from '../api/category.js';
import '../utils/header.js';

document.addEventListener('DOMContentLoaded', async () => {
  const categories = await loadCategories();
  renderCategory(categories, 'dropdownMenu');

  const params    = new URLSearchParams(window.location.search);
  const orderId   = params.get('order_id');

  if (!orderId) {
    window.location.href = './index.html';
    return;
  }

  document.getElementById('displayOrderId').textContent = '#' + orderId;

  try {
    const res = await getOrderDetail(orderId);
    if (!res.status || !res.data) {
      document.getElementById('orderSummaryCard').innerHTML =
        `<p class="text-red-500 text-center py-6">Không thể tải thông tin đơn hàng.</p>`;
      return;
    }
    renderSuccess(res.data);
  } catch(e) {
    document.getElementById('orderSummaryCard').innerHTML =
      `<p class="text-red-500 text-center py-6">Lỗi kết nối máy chủ.</p>`;
  }
});

function renderSuccess(order) {
  // Shipping info
  document.getElementById('oShipName').textContent    = order.shipping_name    || order.username || '—';
  document.getElementById('oShipPhone').textContent   = order.shipping_phone   || '—';
  document.getElementById('oShipAddress').textContent = order.shipping_address || '—';

  // Payment
  const pm = order.payment_method;
  const pmNames = { cash: 'Thanh toán khi nhận hàng (COD)', transfer: 'Chuyển khoản ngân hàng', online: 'Thanh toán trực tuyến' };
  document.getElementById('oPaymentMethod').textContent = pmNames[pm] || pm || '—';

  // Show bank info if transfer
  if (pm === 'transfer') {
    document.getElementById('successBankInfo').classList.remove('hidden');
    document.getElementById('successOrderIdBankRef').textContent = '#' + order.id;
  }

  // Items
  const itemsList = document.getElementById('orderItemsList');
  if (!order.items || order.items.length === 0) {
    itemsList.innerHTML = `<p class="text-sm text-gray-400">Không có sản phẩm.</p>`;
  } else {
    itemsList.innerHTML = order.items.map(item => {
      const price = Number(item.price_at_purchase || 0);
      const qty   = parseInt(item.quantity || 1);
      const total = price * qty;
      let imgUrl  = item.image || '';
      if (imgUrl && !imgUrl.startsWith('http') && !imgUrl.startsWith('data:')) {
        imgUrl = '../image/' + imgUrl;
      }
      return `
      <div class="flex items-center gap-3 border-b pb-3">
        <div class="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
          ${imgUrl ? `<img src="${imgUrl}" alt="${item.product_name}" class="w-full h-full object-cover">` : '<div class="w-full h-full bg-gray-200"></div>'}
        </div>
        <div class="flex-1">
          <p class="font-medium text-sm line-clamp-1">${item.product_name}</p>
          <p class="text-xs text-gray-500">${item.color || 'N/A'} - ${item.size || 'N/A'} × ${qty}</p>
        </div>
        <div class="font-bold text-sm text-red-600">${total.toLocaleString('vi-VN')}đ</div>
      </div>`;
    }).join('');
  }

  // Total
  document.getElementById('oTotal').textContent = Number(order.total_price || 0).toLocaleString('vi-VN') + 'đ';
}

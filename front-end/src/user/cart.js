import '../utils/header.js';
import { fetchAPI } from '../api/config.js';
import { loadCategories, renderCategory } from '../api/category.js';
import { updateCartBadge } from '../utils/header.js';

let cartData = [];

document.addEventListener('DOMContentLoaded', async () => {
  const categories = await loadCategories();
  renderCategory(categories, "dropdownMenu");

  const user = JSON.parse(localStorage.getItem('user_info'));
  if (!user) {
    document.getElementById("cartItemsContainer").innerHTML = `
      <div class="text-center py-10">
        <p class="text-gray-500 mb-4">Vui lòng đăng nhập để xem giỏ hàng</p>
        <a href="./account/login.html" class="inline-block px-6 py-2 bg-black text-white rounded">Đăng nhập</a>
      </div>
    `;
    document.getElementById("btnProceedCheckout").disabled = true;
    return;
  }

  await loadCart(user.id || user.user_id);
});

async function loadCart(userId) {
  try {
    const res = await fetchAPI(`/cart/list.php?user_id=${userId}`);
    if (res.status && res.data) {
      cartData = Array.isArray(res.data) ? res.data : [];
      renderCartItems();
    } else {
      document.getElementById("cartItemsContainer").innerHTML = `<p class="text-center py-10 text-red-500">Lỗi tải giỏ hàng</p>`;
    }
  } catch (err) {
    document.getElementById("cartItemsContainer").innerHTML = `<p class="text-center py-10 text-red-500">Lỗi kết nối Server</p>`;
  }
}

function renderCartItems() {
  const container = document.getElementById("cartItemsContainer");
  const subtotalEl = document.getElementById("summarySubtotal");
  const totalEl = document.getElementById("summaryTotal");
  const totalItemsEl = document.getElementById("summaryTotalItems");
  const checkoutBtn = document.getElementById("btnProceedCheckout");

  if (cartData.length === 0) {
    container.innerHTML = `
      <div class="text-center py-10">
        <p class="text-gray-500 mb-4">Giỏ hàng của bạn đang trống</p>
        <a href="./index.html" class="inline-block px-6 py-2 border border-black rounded hover:bg-black hover:text-white transition">Tiếp tục mua sắm</a>
      </div>
    `;
    subtotalEl.textContent = '0đ';
    totalEl.textContent = '0đ';
    totalItemsEl.textContent = '0';
    checkoutBtn.disabled = true;
    updateCartBadge(0);
    return;
  }

  let totalValue = 0;
  let totalItems = 0;

  container.innerHTML = cartData.map(item => {
    // Bind from actual API response:
    const price = item.unit_price ? Math.round(Number(item.unit_price)) : 0;
    const qty = parseInt(item.quantity) || 1;
    const stock = parseInt(item.stock) || 0;
    const name = item.product_name || "Sản phẩm";
    const outOfStockStr = !item.is_available ? `<span class="text-xs text-red-500 block mt-1">Đã hết hàng cho số lượng yêu cầu</span>` : '';
    
    let imgUrl = item.image || "https://via.placeholder.com/150";
    if (!imgUrl.startsWith('http') && !imgUrl.startsWith('data:')) {
      imgUrl = "../image/" + imgUrl;
    }

    const subtotal = price * qty;
    totalValue += subtotal;
    totalItems += qty;

    return `
      <div class="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-100 last:border-0 last:pb-0">
        <a href="./product_detail.html?id=${item.product_id || ''}" class="w-full sm:w-24 h-24 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden border">
          <img src="${imgUrl}" alt="${name}" class="w-full h-full object-contain mix-blend-multiply" />
        </a>
        
        <div class="flex-1 w-full text-center sm:text-left">
          <a href="./product_detail.html?id=${item.product_id || ''}" class="font-bold text-lg hover:underline">${name}</a>
          <p class="text-sm text-gray-500 mt-1">Phân loại: ${item.color || 'N/A'}, ${item.size || 'N/A'}</p>
          <p class="font-semibold text-red-600 mt-2">${price > 0 ? price.toLocaleString('vi-VN') + 'đ' : 'Chưa nhập hàng'}</p>
          ${outOfStockStr}
        </div>

        <div class="flex items-center gap-4">
          <div class="flex border ${qty >= stock ? 'border-red-300 bg-red-50' : 'border-gray-300'} rounded-lg overflow-hidden h-10 w-28">
            <button type="button" class="w-10 hover:bg-gray-100 transition btn-decrease disabled:opacity-50" ${qty <= 1 ? 'disabled' : ''} data-id="${item.id}">-</button>
            <input type="text" class="w-full text-center text-sm focus:outline-none bg-transparent" value="${qty}" readonly>
            <button type="button" class="w-10 hover:bg-gray-100 transition btn-increase disabled:opacity-50" ${qty >= stock ? 'disabled text-red-500 font-bold' : ''} data-id="${item.id}" data-max="${stock}">+</button>
          </div>
        </div>

        <div class="text-right flex-shrink-0 w-full sm:w-24">
          <p class="font-bold text-red-600">${subtotal.toLocaleString('vi-VN')}đ</p>
          <button type="button" class="text-sm text-gray-500 hover:text-red-500 mt-2 underline transition btn-remove" data-id="${item.id}">Xóa</button>
        </div>
      </div>
    `;
  }).join('');

  subtotalEl.textContent = totalValue.toLocaleString('vi-VN') + 'đ';
  totalEl.textContent = totalValue.toLocaleString('vi-VN') + 'đ';
  totalItemsEl.textContent = totalItems.toString();
  checkoutBtn.disabled = false;
  
  updateCartBadge(totalItems);

  bindCartEvents();
}

function bindCartEvents() {
  document.querySelectorAll('.btn-decrease').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.getAttribute('data-id');
      const item = cartData.find(i => i.id == id);
      if (item && item.quantity > 1) {
        item.quantity--;
        await updateCartItemServer(id, item.quantity);
        renderCartItems();
      }
    });
  });

  document.querySelectorAll('.btn-increase').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.getAttribute('data-id');
      const maxQty = parseInt(e.target.getAttribute('data-max')) || 1;
      const item = cartData.find(i => i.id == id);
      
      if (item && item.quantity < maxQty) {
        item.quantity++;
        btn.disabled = true; // prevent double click spam
        await updateCartItemServer(id, item.quantity);
        renderCartItems();
      } else if (item && item.quantity >= maxQty) {
        alert("Đã đạt giới hạn tồn kho tối đa!");
      }
    });
  });

  document.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.getAttribute('data-id');
      if(confirm('Xóa sản phẩm này khỏi giỏ?')) {
        await removeCartItemServer(id);
        cartData = cartData.filter(i => i.id != id);
        renderCartItems();
      }
    });
  });

  document.getElementById('btnProceedCheckout').addEventListener('click', () => {
    window.location.href = './checkout.html';
  });
}

async function updateCartItemServer(cartId, newQuantity) {
  try {
    await fetchAPI('/cart/update.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cart_id: cartId, quantity: newQuantity })
    });
  } catch (e) {
    console.error("Lỗi cập nhật số lượng", e);
  }
}

async function removeCartItemServer(cartId) {
  try {
    await fetchAPI('/cart/delete.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cart_id: cartId })
    });
  } catch (e) {
    console.error("Lỗi xóa SP", e);
  }
}

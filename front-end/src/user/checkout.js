import '../utils/header.js';
import { getCartList } from '../api/cart.js';
import { createOrder } from '../api/order.js';
import { loadCategories, renderCategory } from '../api/category.js';

let cartData = [];
let userInfo = null;

document.addEventListener('DOMContentLoaded', async () => {
  const categories = await loadCategories();
  renderCategory(categories, "dropdownMenu");

  userInfo = JSON.parse(localStorage.getItem('user_info'));
  if (!userInfo) {
    alert("Vui lòng đăng nhập để thanh toán.");
    window.location.href = "./account/login.html";
    return;
  }

  // Tự động điền Address, Phone (Nếu có lưu trong LS)
  if(userInfo.username) document.getElementById("shipName").value = userInfo.username;
  if(userInfo.phone) document.getElementById("shipPhone").value = userInfo.phone;
  if(userInfo.address) document.getElementById("shipAddress").value = userInfo.address;

  await loadCheckoutCart(userInfo.id || userInfo.user_id);

  document.getElementById("checkoutForm").addEventListener("submit", handlePlaceOrder);

  // Ẩn/hiện thông tin chuyển khoản
  document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const bankInfo = document.getElementById('bankInfo');
      if (bankInfo) {
        bankInfo.classList.toggle('hidden', radio.value !== 'transfer' || !radio.checked);
      }
    });
  });
});

async function loadCheckoutCart(userId) {
  try {
    const res = await getCartList(userId);
    if (res.status && res.data) {
      cartData = Array.isArray(res.data) ? res.data : [];
      renderCheckoutItems();
    } else {
      document.getElementById("checkoutItemsContainer").innerHTML = `<p class="text-center text-red-500">Giỏ hàng trống.</p>`;
      document.getElementById("btnPlaceOrder").disabled = true;
    }
  } catch (err) {
    document.getElementById("checkoutItemsContainer").innerHTML = `<p class="text-center text-red-500">Lỗi kết nối.</p>`;
  }
}

function renderCheckoutItems() {
  const container = document.getElementById("checkoutItemsContainer");
  const subTotalEl = document.getElementById("checkoutSubtotal");
  const totalEl = document.getElementById("checkoutTotal");
  const btnSubmit = document.getElementById("btnPlaceOrder");

  if (cartData.length === 0) {
    container.innerHTML = `<p class="text-center text-red-500">Giỏ hàng trống. Vui lòng trở về <a href="cart.html" class="underline">Giỏ hàng</a>.</p>`;
    subTotalEl.textContent = "0đ";
    totalEl.textContent = "0đ";
    btnSubmit.disabled = true;
    return;
  }

  let totalValue = 0;

  container.innerHTML = cartData.map(item => {
    const price = item.unit_price ? Math.round(Number(item.unit_price)) : 0;
    const qty = parseInt(item.quantity) || 1;
    const name = item.product_name || "Sản phẩm";
    const outOfStockStr = !item.is_available ? `<span class="text-xs text-red-500 line-clamp-1 block mt-1">Đã hết hàng</span>` : '';
    
    let imgUrl = item.image || "https://via.placeholder.com/100";
    if (!imgUrl.startsWith('http') && !imgUrl.startsWith('data:')) {
      imgUrl = "../image/" + imgUrl;
    }

    const subtotal = price * qty;
    totalValue += subtotal;

    return `
      <div class="flex items-center gap-3">
        <div class="relative">
          <div class="w-16 h-16 bg-white border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center p-1">
            <img src="${imgUrl}" alt="${name}" class="w-full h-full object-contain mix-blend-multiply">
          </div>
          <span class="absolute -top-2 -right-2 bg-gray-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">${qty}</span>
        </div>
        <div class="flex-1 text-sm">
          <p class="font-medium text-black line-clamp-1">${name}</p>
          <p class="text-gray-500 text-xs">${item.color || 'N/A'}, ${item.size || 'N/A'}</p>
          ${outOfStockStr}
        </div>
        <div class="font-medium text-black whitespace-nowrap">${price > 0 ? subtotal.toLocaleString('vi-VN') + 'đ' : 'Hết hàng'}</div>
      </div>
    `;
  }).join('');

  subTotalEl.textContent = totalValue.toLocaleString('vi-VN') + 'đ';
  totalEl.textContent = totalValue.toLocaleString('vi-VN') + 'đ';
  btnSubmit.disabled = false;
}

async function handlePlaceOrder(e) {
  e.preventDefault();

  if (cartData.length === 0) {
    alert("Giỏ hàng của bạn đang trống!");
    return;
  }

  const hasUnavailableItems = cartData.some(item => !item.is_available);
  if (hasUnavailableItems) {
    alert("Giỏ hàng của bạn chứa sản phẩm đã hết hàng. Vui lòng quay lại giỏ hàng để cập nhật!");
    return;
  }

  const payload = {
    user_id: userInfo.id || userInfo.user_id,
    shipping: {
      name: document.getElementById("shipName").value.trim(),
      phone: document.getElementById("shipPhone").value.trim(),
      address: document.getElementById("shipAddress").value.trim()
    },
    payment_method: document.querySelector('input[name="paymentMethod"]:checked').value
  };

  const btn = document.getElementById("btnPlaceOrder");
  const originalHtml = btn.innerHTML;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang lên đơn...`;
  btn.disabled = true;

  try {
    const res = await createOrder(payload);

    if (res.status) {
      window.location.href = `./order_success.html?order_id=${res.order_id || ''}`;
    } else {
      alert("Lỗi tạo đơn: " + (res.message || "Kiểm tra số lượng tồn kho"));
    }
  } catch(err) {
    console.error("Lỗi đặt hàng", err);
    alert("Đã xảy ra lỗi, vui lòng thử lại sau.");
  } finally {
    btn.innerHTML = originalHtml;
    btn.disabled = false;
  }
}

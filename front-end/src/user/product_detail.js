import { updateCartBadge } from '../utils/header.js';
import { getPublicProductDetail } from '../api/product.js';
import { addToCart, getCartList } from '../api/cart.js';
import { loadCategories, renderCategory } from '../api/category.js';

let productData = null;
let selectedColor = null;
let selectedSizeObj = null; // contains the variant detail
let availableVariants = [];

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Render Categories dropdown
  const categories = await loadCategories();
  renderCategory(categories, "dropdownMenu");

  // 2. Fetch Product ID from URL
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    alert("Không tìm thấy sản phẩm");
    window.location.href = "index.html";
    return;
  }

  // 3. Fetch Detail
  try {
    const res = await getPublicProductDetail(id);
    if (res.status && res.data) {
      productData = res.data;
      availableVariants = productData.variants || [];
      renderProductInfo();
    } else {
      alert("Sản phẩm không tồn tại");
    }
  } catch (error) {
    console.error("Lỗi:", error);
    alert("Lỗi kết nối máy chủ");
  }

  bindEvents();
});

function renderProductInfo() {
  if (!productData) return;

  document.getElementById("productName").textContent = productData.name;
  document.getElementById("breadCurrent").textContent = productData.name;
  document.getElementById("breadCategory").textContent = productData.category_name || "Sản phẩm";
  
  if (productData.category_id) {
    document.getElementById("breadCategory").href = `./products.html?cate=${productData.category_id}`;
  }

  document.getElementById("productBrand").textContent = productData.brand_name || "N/A";
  document.getElementById("productDesc").textContent = productData.description || "Chưa có mô tả.";
  
  // Set Ảnh & Thumbnails
  const thumbsContainer = document.getElementById("productThumbnails");
  thumbsContainer.innerHTML = '';
  let imgUrl = "https://via.placeholder.com/500";
  
  const colorsData = productData.colors || [];
  
  if (colorsData.length > 0) {
    const mainColor = colorsData.find(c => c.is_main == 1) || colorsData[0];
    imgUrl = mainColor.image_url;
    
    colorsData.forEach((c, idx) => {
      let thumbUrl = c.image_url;
      if (!thumbUrl.startsWith('http') && !thumbUrl.startsWith('data:')) thumbUrl = "../../image/" + thumbUrl;
      const thumbActive = c.image_id === mainColor.image_id ? 'border-2 border-black' : 'border border-gray-200';
      thumbsContainer.innerHTML += `
        <img 
          src="${thumbUrl}" 
          alt="thumb ${idx}"
          class="color-thumb w-20 h-20 object-cover rounded-lg cursor-pointer hover:border-black transition ${thumbActive}"
          data-color="${c.color}"
          onclick="document.getElementById('productImage').src = '${thumbUrl}'; document.querySelectorAll('#productThumbnails img').forEach(i => i.className = 'color-thumb w-20 h-20 object-cover rounded-lg cursor-pointer hover:border-black transition border-gray-200 border-2'); this.className = 'color-thumb w-20 h-20 object-cover rounded-lg cursor-pointer hover:border-black transition border-2 border-black'; document.querySelector('input[name=\\'colorOption\\'][value=\\'${c.color}\\']')?.click();"
        />
      `;
    });
  } else if (productData.image) {
    imgUrl = productData.image; 
  }
  
  if (!imgUrl.startsWith('http') && !imgUrl.startsWith('data:')) imgUrl = "../../image/" + imgUrl;
  document.getElementById("productImage").src = imgUrl;

  // Stock
  const stock = productData.stock ? parseInt(productData.stock) : 0;
  document.getElementById("productStock").textContent = stock;

  const colorContainer = document.getElementById("colorOptions");
  if (colorsData.length === 0) {
    colorContainer.innerHTML = '<span class="text-sm text-red-500">Sản phẩm hiện không có biến thể màu.</span>';
    return;
  }

  colorContainer.innerHTML = colorsData.map((c, i) => `
    <label class="cursor-pointer">
      <input type="radio" name="colorOption" value="${c.color}" data-image="${c.image_url}" class="peer hidden" ${i === 0 ? 'checked' : ''} />
      <span class="px-4 py-2 border rounded-md inline-block peer-checked:border-black peer-checked:bg-black peer-checked:text-white hover:border-black transition">
        ${c.color}
      </span>
    </label>
  `).join('');

  const firstColorRadio = document.querySelector('input[name="colorOption"]:checked');
  if (firstColorRadio) handleColorSelect(firstColorRadio.value);

  document.querySelectorAll('input[name="colorOption"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
       handleColorSelect(e.target.value);
       // Also update thumbnail and main image if selected via radio
       const imgUrlData = e.target.getAttribute('data-image');
       let parsedImgUrl = imgUrlData;
       if (!parsedImgUrl.startsWith('http') && !parsedImgUrl.startsWith('data:')) parsedImgUrl = "../../image/" + parsedImgUrl;
       document.getElementById("productImage").src = parsedImgUrl;
       
       // Update thumb highlight
       document.querySelectorAll('#productThumbnails img').forEach(i => i.className = 'color-thumb w-20 h-20 object-cover rounded-lg cursor-pointer hover:border-black transition border-gray-200 border-2');
       const thumb = document.querySelector(`#productThumbnails img[data-color='${e.target.value}']`);
       if(thumb) thumb.className = 'color-thumb w-20 h-20 object-cover rounded-lg cursor-pointer hover:border-black transition border-2 border-black';
    });
  });
}

function handleColorSelect(color) {
  selectedColor = color;
  selectedSizeObj = null; 
  const sizeContainer = document.getElementById("sizeOptions");
  
  const colorsData = productData.colors || [];
  const colorGroup = colorsData.find(c => c.color === color);
  const sizesForColor = colorGroup ? (colorGroup.sizes || []) : [];

  if (sizesForColor.length === 0) {
    sizeContainer.innerHTML = '<span class="text-sm text-gray-500">Hết kích cỡ</span>';
    updatePriceAndCartState();
    return;
  }

  sizeContainer.innerHTML = sizesForColor.map((v) => `
      <label class="cursor-pointer">
        <input type="radio" name="sizeOption" value="${v.id}" class="peer hidden" />
        <span class="min-w-[40px] text-center px-3 py-2 border rounded-md inline-block peer-checked:border-black peer-checked:font-bold hover:border-black transition">
          ${v.size}
        </span>
      </label>
  `).join('');

  updatePriceAndCartState();

  document.querySelectorAll('input[name="sizeOption"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const variantId = e.target.value;
      selectedSizeObj = sizesForColor.find(v => v.id == variantId);
      updatePriceAndCartState();
    });
  });
}

function updatePriceAndCartState() {
  const btn = document.getElementById("btnAddToCart");
  const priceDisplay = document.getElementById("productPrice");
  const subPriceDisplay = document.getElementById("priceDisplay");
  const stockDisplay = document.getElementById("stockStatus");

  let basePriceStr = productData.min_price || productData.price || '0';
  // Backend returns string formatted with decimals eg 40480.00000000
  const defaultPrice = Math.round(Number(basePriceStr)); 

  if (selectedSizeObj) {
    const variantPriceStr = selectedSizeObj.price || basePriceStr;
    const variantPrice = Math.round(Number(variantPriceStr));
    const variantStock = Math.round(Number(selectedSizeObj.stock || 0));

    priceDisplay.textContent = variantPrice.toLocaleString('vi-VN') + 'đ';
    subPriceDisplay.textContent = variantPrice.toLocaleString('vi-VN') + 'đ';
    
    // Nếu hết hàng thì disable nút
    if (variantStock > 0) {
      btn.disabled = false;
      btn.innerHTML = 'Thêm vào giỏ';
      stockDisplay.textContent = `Tồn kho: ${variantStock}`;
    } else {
      btn.disabled = true;
      btn.innerHTML = 'Hết hàng';
      stockDisplay.textContent = `Tồn kho: 0`;
    }
  } else {
    priceDisplay.textContent = defaultPrice.toLocaleString('vi-VN') + 'đ';
    subPriceDisplay.textContent = "";
    btn.disabled = true;
    stockDisplay.textContent = "Vui lòng chọn Kích cỡ";
  }
}

function bindEvents() {
  const qtyInput = document.getElementById("qtyInput");
  const btnMinus = document.getElementById("btnMinus");
  const btnPlus = document.getElementById("btnPlus");
  const form = document.getElementById("addToCartForm");

  // Nút tăng giảm số lượng
  btnMinus.addEventListener("click", () => {
    let val = parseInt(qtyInput.value) || 1;
    if (val > 1) qtyInput.value = val - 1;
  });

  btnPlus.addEventListener("click", () => {
    let val = parseInt(qtyInput.value) || 1;
    qtyInput.value = val + 1;
  });

  qtyInput.addEventListener('change', () => {
    let val = parseInt(qtyInput.value);
    if (isNaN(val) || val < 1) qtyInput.value = 1;
  });

  // Submit giỏ hàng
  form.addEventListener("submit", async(e) => {
    e.preventDefault();
    
    const user = JSON.parse(localStorage.getItem('user_info'));
    if(!user) {
      alert("Vui lòng đăng nhập để thêm vào giỏ hàng!");
      window.location.href = "./account/login.html";
      return;
    }

    if (!selectedSizeObj) {
      alert("Vui lòng chọn Màu sắc và Kích cỡ.");
      return;
    }

    const qty = parseInt(qtyInput.value) || 1;
    const variantId = selectedSizeObj.id;

    const btn = document.getElementById("btnAddToCart");
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...`;
    btn.disabled = true;

    try {
      const payload = {
        user_id: user.id || user.user_id, // tùy vào cách jwt/login api trả về id (ví dụ localStorage)
        variant_id: variantId,
        quantity: qty
      };
      
      const res = await addToCart(payload);

      if (res.status === true || res.status === 'success') {
        alert("Đã thêm sản phẩm vào giỏ hàng thành công!");
        
        // Gọi API lấy lại giỏ hàng và đếm tổng số lượng để update header
        try {
          const cartRes = await getCartList(user.id || user.user_id);
          if (cartRes.status) {
             let totalCount = 0;
             const items = cartRes.data || [];
             items.forEach(i => totalCount += parseInt(i.quantity));
             updateCartBadge(totalCount);
          }
        } catch(e) {
          console.error("Lỗi cập nhật số lượng giỏ hàng:", e);
        }

      } else {
        alert(res.message || "Thêm thất bại");
      }
    } catch(err) {
      alert("Lỗi kết nối");
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  });
}

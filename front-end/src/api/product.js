import { fetchAPI } from './config.js';

export async function getProducts(filterParams = "") {
  try {
    let url = '/product/getProduct.php';
    if (filterParams) url += "?" + filterParams;
    const res = await fetchAPI(url);
    return res;
  } catch(e) {
    console.error("Lỗi lấy sản phẩm:", e);
    throw e;
  }
}

export async function getProductDetail(id) {
  try {
    const res = await fetchAPI(`/product/getDetail.php?id=${id}`);
    return res;
  } catch(e) {
    console.error("Lỗi lấy chi tiết sản phẩm:", e);
    throw e;
  }
}

export async function getPublicProductDetail(id) {
  try {
    const res = await fetchAPI(`/product/detailProduct.php?id=${id}`);
    return res;
  } catch(e) {
    console.error("Lỗi lấy chi tiết sản phẩm public:", e);
    throw e;
  }
}

export async function addProduct(formData) {
  try {
    const res = await fetchAPI('/product/addProduct.php', {
      method: 'POST',
      body: formData
    });
    return res;
  } catch(e) {
    console.error("Lỗi thêm sản phẩm:", e);
    throw e;
  }
}

export async function updateProduct(formData) {
  try {
    const res = await fetchAPI('/product/updateProduct.php', {
      method: 'POST',
      body: formData
    });
    return res;
  } catch(e) {
    console.error("Lỗi sửa sản phẩm:", e);
    throw e;
  }
}

export async function deleteProduct(id) {
  try {
    const formData = new FormData();
    formData.append('id', id);
    const res = await fetchAPI('/product/deleteProduct.php', {
      method: 'POST',
      body: formData
    });
    return res;
  } catch(e) {
    console.error("Lỗi xoá sản phẩm:", e);
    throw e;
  }
}

export function renderProduct(list, elementId) {
  const container = document.getElementById(elementId);
  if (!container) return;
  
  container.innerHTML = "";

  if (!list || list.length === 0) {
    container.innerHTML = "<p class='text-gray-500 col-span-full'>Chưa có sản phẩm nào.</p>";
    return;
  }

  list.forEach((product) => {
    // Giá tối thiểu, lượt bán ảo (nếu DB chưa có field này)
    const price = product.min_price ? Number(product.min_price) : 0;
    const sold = product.sold_count ? Number(product.sold_count) : Math.floor(Math.random() * 500) + 10;
    
    // Xử lý ảnh (Phòng trường hợp ảnh url hoặc đường dẫn relative)
    let imgUrl = product.image || "https://via.placeholder.com/300";
    if (!imgUrl.startsWith('http') && !imgUrl.startsWith('data:')) {
      imgUrl = "../image/" + imgUrl; // Dành cho data cũ dạng file_name
    }

    container.innerHTML += `
      <div class="border border-gray-100 rounded-2xl bg-white group shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full overflow-hidden">
        <a href="./product_detail.html?id=${product.id}" class="flex flex-col h-full relative">
          <!-- Image Section -->
          <div class="relative w-full h-64 sm:h-80 bg-gray-50 flex items-center justify-center overflow-hidden p-4">
            <img
              src="${imgUrl}"
              alt="${product.name}"
              class="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500 ease-in-out"
            />
            <!-- Quick actions on hover -->
            <div class="absolute inset-x-0 bottom-3 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
              <button class="bg-white text-black w-10 h-10 rounded-full shadow-md hover:bg-black hover:text-white flex items-center justify-center transition" onclick="event.preventDefault(); window.location.href='./product_detail.html?id=${product.id}'">
                <i class="fa-solid fa-cart-plus"></i>
              </button>
              <button class="bg-white text-black w-10 h-10 rounded-full shadow-md hover:bg-black hover:text-white flex items-center justify-center transition" onclick="event.preventDefault(); window.location.href='./product_detail.html?id=${product.id}'">
                <i class="fa-regular fa-eye"></i>
              </button>
            </div>
          </div>
          
          <!-- Info Section -->
          <div class="p-3.5 flex flex-col flex-1 bg-white">
            <h3 class="font-medium text-gray-800 text-[15px] leading-snug line-clamp-2 min-h-[40px] group-hover:text-red-500 transition-colors">${product.name}</h3>
            
            <div class="mt-auto pt-2 flex items-center justify-between">
              <span class="font-bold text-red-600 text-[17px] tracking-tight">
                ${price.toLocaleString('vi-VN')}đ
              </span>
              <p class="text-[11px] text-gray-400 font-medium">Đã bán ${sold >= 1000 ? (sold / 1000).toFixed(1) + "k" : sold}</p>
            </div>
          </div>
        </a>
      </div>
    `;
  });
}

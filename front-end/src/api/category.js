import { fetchAPI } from './config.js';

export async function getCategories() {
  try {
    const res = await fetchAPI('/category/getCate.php');
    return res;
  } catch(e) {
    console.error("Lỗi lấy danh mục:", e);
    throw e;
  }
}

export async function loadCategories() {
  try {
    const res = await fetchAPI('/category/getCate.php');
    if (res.status && res.data) {
      return Array.isArray(res.data) ? res.data : (res.data.data || []);
    }
  } catch(e) {
    console.error("Lỗi lấy danh mục:", e);
  }
  return [];
}

export function renderCategory(list, elementId) {
  const container = document.getElementById(elementId);
  if (!container) return;
  container.innerHTML = "";
  
  if (!list || list.length === 0) {
    container.innerHTML = `<p class="px-4 py-2 text-gray-500">Chưa có danh mục</p>`;
    return;
  }

  list.forEach((category) => {
    container.innerHTML += `
      <a
        href="./products.html?cate=${category.slug || category.id}"
        class="block px-4 py-2 hover:bg-black hover:text-white transition"
      >
        ${category.name}
      </a>
    `;
  });
}

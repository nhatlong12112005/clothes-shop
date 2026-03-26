import { fetchAPI } from './config.js';

export async function getBrands() {
  try {
    const res = await fetchAPI('/brand/getBrand.php');
    return res;
  } catch(e) {
    console.error("Lỗi lấy thương hiệu:", e);
    throw e;
  }
}

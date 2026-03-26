import { fetchAPI } from './config.js';

export async function getInventory(params = "") {
  try {
    let url = '/inventory/list.php';
    if (params) url += "?" + params;
    const res = await fetchAPI(url);
    return res;
  } catch(e) {
    console.error("Lỗi lấy danh sách tồn kho:", e);
    throw e;
  }
}

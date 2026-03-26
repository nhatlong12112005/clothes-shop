import { fetchAPI } from './config.js';

export async function getSuppliers(params = "") {
  try {
    let url = '/suppliers/getSuppliers.php';
    if (params) url += "?" + params;
    const res = await fetchAPI(url);
    return res;
  } catch(e) {
    console.error("Lỗi lấy nhà cung cấp:", e);
    throw e;
  }
}

export async function addSupplier(formData) {
  try {
    const res = await fetchAPI('/suppliers/addSuppliers.php', {
      method: 'POST',
      body: formData
    });
    return res;
  } catch(e) {
    console.error("Lỗi thêm nhà cung cấp:", e);
    throw e;
  }
}

export async function updateSupplier(formData) {
  try {
    const res = await fetchAPI('/suppliers/updateSuppliers.php', {
      method: 'POST',
      body: formData
    });
    return res;
  } catch(e) {
    console.error("Lỗi cập nhật nhà cung cấp:", e);
    throw e;
  }
}

export async function deleteSupplier(formData) {
  try {
    const res = await fetchAPI('/suppliers/deleteSuppliers.php', {
      method: 'POST',
      body: formData
    });
    return res;
  } catch(e) {
    console.error("Lỗi xóa nhà cung cấp:", e);
    throw e;
  }
}

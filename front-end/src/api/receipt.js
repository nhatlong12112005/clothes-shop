import { fetchAPI } from './config.js';

export async function getReceipts(query = '') {
  try {
    const res = await fetchAPI(`/receipt/getReceipt.php${query ? '?' + query : ''}`);
    return res;
  } catch(e) {
    console.error("Lỗi lấy danh sách phiếu nhập:", e);
    throw e;
  }
}

export async function getReceiptDetail(id) {
  try {
    const res = await fetchAPI(`/receipt/getDetail.php?id=${id}`);
    return res;
  } catch(e) {
    console.error("Lỗi lấy chi tiết phiếu nhập:", e);
    throw e;
  }
}

export async function addReceipt(data) {
  try {
    const res = await fetchAPI('/receipt/addReceipt.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res;
  } catch(e) {
    console.error("Lỗi thêm phiếu nhập:", e);
    throw e;
  }
}

export async function updateReceipt(data) {
  try {
    const res = await fetchAPI('/receipt/updateReceipt.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res;
  } catch(e) {
    console.error("Lỗi cập nhật phiếu nhập:", e);
    throw e;
  }
}

export async function completeReceipt(receiptId) {
  try {
    const res = await fetchAPI('/receipt/completeReceipt.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receipt_id: receiptId })
    });
    return res;
  } catch(e) {
    console.error("Lỗi hoàn thành phiếu nhập:", e);
    throw e;
  }
}

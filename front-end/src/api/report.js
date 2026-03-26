import { fetchAPI } from './config.js';

export async function getDashboardReport(from, to) {
  try {
    const res = await fetchAPI(`/report/dashboard.php?from=${from}&to=${to}`);
    return res;
  } catch(e) {
    console.error("Lỗi lấy báo cáo bảng điều khiển:", e);
    throw e;
  }
}

export async function getPricingReport() {
  try {
    return await fetchAPI('/report/pricingReport.php');
  } catch(e) {
    console.error("Lỗi lấy báo cáo giá bán:", e);
    throw e;
  }
}

export async function getStockReport(from = '', to = '') {
  try {
    return await fetchAPI(`/report/stockReport.php?from=${from}&to=${to}`);
  } catch(e) {
    console.error("Lỗi lấy báo cáo nhập xuất:", e);
    throw e;
  }
}

import { fetchAPI } from './config.js';

export async function getUsers(params = "") {
  try {
    let url = '/user/users.php';
    if (params) url += "?" + params;
    const res = await fetchAPI(url);
    return res;
  } catch(e) {
    console.error("Lỗi lấy danh sách người dùng:", e);
    throw e;
  }
}

export async function updateUserProfile(data) {
  try {
    const res = await fetchAPI('/user/updateProfile.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res;
  } catch(e) {
    console.error("Lỗi cập nhật hồ sơ người dùng:", e);
    throw e;
  }
}

export async function toggleUserStatus(data) {
  try {
    const res = await fetchAPI('/user/toggleStatus.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res;
  } catch(e) {
    console.error("Lỗi thay đổi trạng thái user:", e);
    throw e;
  }
}

export async function addUser(data) {
  try {
    const res = await fetchAPI('/user/addUser.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res;
  } catch(e) {
    console.error("Lỗi thêm user:", e);
    throw e;
  }
}

export async function updateUser(data) {
  try {
    const res = await fetchAPI('/user/updateUser.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res;
  } catch(e) {
    console.error("Lỗi cập nhật user:", e);
    throw e;
  }
}

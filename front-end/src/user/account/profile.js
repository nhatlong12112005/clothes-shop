import '../../utils/header.js';
import { updateUserProfile } from '../../api/user.js';
import { loadCategories, renderCategory } from '../../api/category.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Tải danh mục cho Header
    const categories = await loadCategories();
    renderCategory(categories, "dropdownMenu");
    // 1. Kiểm tra đăng nhập
    const token = localStorage.getItem('token');
    let user = JSON.parse(localStorage.getItem('user_info'));

    if (!token || !user) {
        alert("Bạn cần đăng nhập để xem trang này.");
        window.location.href = './login.html';
        return;
    }

    // 2. Điền thông tin cũ vào Form
    document.getElementById('sidebarName').textContent = user.username || 'Khách';
    
    document.getElementById('usernameInput').value = user.username || '';
    document.getElementById('emailInput').value = user.email || '';
    document.getElementById('phoneInput').value = user.phone || '';
    document.getElementById('addressInput').value = user.address || '';

    // 3. Xử lý khi nhấn Lưu
    const form = document.getElementById('profileForm');
    const errorMsg = document.getElementById('errorMsg');
    const successMsg = document.getElementById('successMsg');
    const btnSave = document.getElementById('btnSave');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Reset Message
        errorMsg.classList.add('hidden');
        successMsg.classList.add('hidden');
        btnSave.disabled = true;
        btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';

        const payload = {
            username: document.getElementById('usernameInput').value.trim(),
            phone: document.getElementById('phoneInput').value.trim(),
            address: document.getElementById('addressInput').value.trim()
        };

        try {
            const res = await updateUserProfile(payload);

            if (res.status && res.user) {
                // Hiển thị thông báo thành công
                successMsg.textContent = res.message || "Cập nhật hồ sơ thành công!";
                successMsg.classList.remove('hidden');

                // Update Local Storage
                localStorage.setItem('user_info', JSON.stringify(res.user));
                
                // Cập nhật giao diện liền mạch
                document.getElementById('sidebarName').textContent = res.user.username;
                document.getElementById('username').textContent = res.user.username; // Cái này mấp từ header.js
                
            } else {
                throw new Error(res.message || "Lỗi cập nhật chưa xác định.");
            }
        } catch (error) {
            console.error("Lỗi Profile:", error);
            errorMsg.textContent = error.message || "Đã xảy ra lỗi, vui lòng thử lại.";
            errorMsg.classList.remove('hidden');
        } finally {
            // Restore button
            btnSave.disabled = false;
            btnSave.textContent = "Lưu Thay Đổi";
        }
    });
});

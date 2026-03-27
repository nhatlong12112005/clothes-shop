import { renderProduct, getProducts } from '../api/product.js';
import { loadCategories, renderCategory } from '../api/category.js';
import '../utils/header.js';
import { startCategorySync } from '../utils/sync.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Phân tích URL để lấy từ khóa tìm kiếm và trang
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('keyword') || '';
    const page = parseInt(urlParams.get('page')) || 1;
    const minPrice = urlParams.get('min_price') || '';
    const maxPrice = urlParams.get('max_price') || '';
    const limit = 4; // Giảm xuống 4 sản phẩm/trang để dễ thấy phân trang hơn
    
    const keywordEl = document.getElementById('searchKeyword');
    const countEl = document.getElementById('searchCount');
    const resultsContainer = document.getElementById('searchResults');
    const paginationContainer = document.getElementById('paginationContainer');

    // Nạp Categories cho Header
    try {
        const categories = await loadCategories();
        renderCategory(categories, "dropdownMenu");
        // Auto-sync categories every 30s
        startCategorySync(cats => renderCategory(cats, "dropdownMenu"), 30_000);
    } catch(e) {}

    if (!query || query.trim() === '') {
        keywordEl.textContent = "Không có từ khóa";
        countEl.textContent = "0";
        resultsContainer.innerHTML = `
            <div class="col-span-full text-center py-20">
                <i class="fa-solid fa-magnifying-glass text-gray-300 text-6xl mb-4 block"></i>
                <p class="text-gray-500 text-lg">Vui lòng nhập từ khóa để bắt đầu tìm kiếm.</p>
                <a href="./index.html" class="inline-block mt-4 text-blue-600 hover:underline">Quay về trang chủ</a>
            </div>
        `;
        return;
    }

    keywordEl.textContent = `"${query}"`;

    // 2. Gọi API Custom để bắt Pagination metadata
    try {
        let params = `keyword=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
        if (minPrice) params += `&min_price=${encodeURIComponent(minPrice)}`;
        if (maxPrice) params += `&max_price=${encodeURIComponent(maxPrice)}`;
        
        const res = await getProducts(params);
        
        const products = res?.data || [];
        const pagination = res?.pagination || { total_records: 0, total_pages: 1, current_page: 1 };
        
        countEl.textContent = pagination.total_records;

        if (!products || products.length === 0) {
            resultsContainer.innerHTML = `
                <div class="col-span-full text-center py-20">
                    <i class="fa-regular fa-face-frown text-gray-300 text-6xl mb-4 block"></i>
                    <p class="text-gray-500 text-lg">Rất tiếc, không tìm thấy sản phẩm nào phù hợp với từ khóa "${query}".</p>
                    <a href="./index.html" class="inline-block mt-4 text-blue-600 hover:underline">Tiếp tục mua sắm</a>
                </div>
            `;
        } else {
            // Hiển thị sản phẩm
            resultsContainer.innerHTML = '';
            renderProduct(products, "searchResults");
            
            // Render Pagination Buttons
            renderPagination(pagination.total_pages, pagination.current_page, query, minPrice, maxPrice);
        }
    } catch (error) {
        console.error("Lỗi khi tìm kiếm:", error);
        resultsContainer.innerHTML = `
            <div class="col-span-full text-center py-20 text-red-500">
                <p>Đã xảy ra lỗi khi tìm kiếm dữ liệu. Vui lòng thử lại sau.</p>
            </div>
        `;
    }

    // Xử lý Lọc giá
    if (minPrice) document.getElementById('minPrice').value = minPrice;
    if (maxPrice) document.getElementById('maxPrice').value = maxPrice;

    document.getElementById('priceFilterForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const minP = document.getElementById('minPrice').value;
        const maxP = document.getElementById('maxPrice').value;
        let url = `./search.html?keyword=${encodeURIComponent(query)}`;
        if (minP) url += `&min_price=${minP}`;
        if (maxP) url += `&max_price=${maxP}`;
        window.location.href = url;
    });
});

function renderPagination(totalPages, currentPage, keyword, minPrice, maxPrice) {
    const container = document.getElementById('paginationContainer');
    container.innerHTML = '';
    
    // Xóa dòng if (totalPages <= 1) return; để nút [1] luôn hiện cho mượt mắt
    
    for (let i = 1; i <= totalPages; i++) {
        let url = `./search.html?keyword=${encodeURIComponent(keyword)}&page=${i}`;
        if (minPrice) url += `&min_price=${encodeURIComponent(minPrice)}`;
        if (maxPrice) url += `&max_price=${encodeURIComponent(maxPrice)}`;

        const btn = document.createElement('a');
        btn.href = url;
        btn.textContent = i;
        btn.className = `w-10 h-10 flex items-center justify-center rounded transition-colors ${
            i === currentPage 
            ? 'bg-black text-white font-bold pointer-events-none' 
            : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
        }`;
        container.appendChild(btn);
    }
}

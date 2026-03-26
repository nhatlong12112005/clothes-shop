import { renderCategoryManager } from './components/category.js';
import { renderProductManager } from './components/product.js';
import { renderOrderManager } from './components/order.js';
import { renderCustomerManager } from './components/customer.js';
import { renderDashboard } from './components/dashboard.js';
import { renderBrandManager } from './components/brand.js';
import { renderSupplierManager } from './components/supplier.js';
import { renderInventoryManager } from './components/inventory.js';
import { renderReceiptManager } from './components/receipt.js';
import { renderPricingManager } from './components/pricing.js';

/** Parse hash like "#listsp&page=3" → { target: 'listsp', page: 3 } */
function parseHash() {
  const raw = window.location.hash.slice(1); // remove #
  const [target, queryStr] = raw.split('&');
  const page = queryStr ? parseInt(new URLSearchParams(queryStr).get('page')) || 1 : 1;
  return { target: target || 'trangchu', page };
}

/** Update hash URL silently (no hashchange event) so page number shows in URL */
window.adminSetPageHash = function(target, page) {
  const hash = page > 1 ? `${target}&page=${page}` : target;
  history.replaceState(null, '', `#${hash}`);
};

document.addEventListener('DOMContentLoaded', () => {
  const mainContent = document.getElementById('main-content');
  const navLinks = document.querySelectorAll('nav a[data-target]');

  async function navigateTo(target, page = 1) {
    // Cập nhật active class sidebar
    navLinks.forEach(link => link.closest('li').classList.remove('text-primary', 'font-bold'));
    const activeLink = document.querySelector(`nav a[data-target="${target}"]`);
    if (activeLink) activeLink.closest('li').classList.add('text-primary', 'font-bold');

    // Cập nhật hash URL (silent)
    window.adminSetPageHash(target, page);

    // Render component
    switch (target) {
      case 'trangchu':   await renderDashboard(mainContent);               break;
      case 'listdm':     await renderCategoryManager(mainContent, page);   break;
      case 'listsp':     await renderProductManager(mainContent, page);    break;
      case 'listbrand':  await renderBrandManager(mainContent, page);      break;
      case 'listsupplier': await renderSupplierManager(mainContent, page); break;
      case 'inventory':  await renderInventoryManager(mainContent);        break;
      case 'receipt':    await renderReceiptManager(mainContent, page);    break;
      case 'qldh':       await renderOrderManager(mainContent, page);      break;
      case 'qlkh':       await renderCustomerManager(mainContent, page);   break;
      case 'pricing':    await renderPricingManager(mainContent);          break;
      default:
        mainContent.innerHTML = `<h1 class="text-xl text-red-500">Trang không tồn tại</h1>`;
    }
  }

  // Hashchange: parse target + page từ hash
  window.addEventListener('hashchange', () => {
    const { target, page } = parseHash();
    navigateTo(target, page);
  });

  // Click trên sidebar: reset về trang 1
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('data-target');
      window.location.hash = target; // triggers hashchange
    });
  });

  // Load lần đầu
  const { target, page } = parseHash();
  navigateTo(target, page);
});

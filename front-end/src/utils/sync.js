/**
 * sync.js — Polling-based real-time sync utility
 * 
 * Usage:
 *   import { startCategorySync, startProductSync, stopSync } from '../utils/sync.js';
 *
 *   startCategorySync(renderCallback, 30000);
 *   startProductSync(fetchParams, renderCallback, 20000);
 */

import { loadCategories } from '../api/category.js';
import { getProducts }     from '../api/product.js';

const _timers = [];

/**
 * Start polling for category changes.
 * @param {(categories: Array) => void} onUpdate - called when categories change
 * @param {number} interval - ms between polls (default 30s)
 * @returns {number} intervalId
 */
export function startCategorySync(onUpdate, interval = 30_000) {
  let lastHash = '';

  const poll = async () => {
    try {
      const cats = await loadCategories();
      const hash = cats.map(c => `${c.id}:${c.name}:${c.slug}`).join('|');
      if (hash !== lastHash) {
        lastHash = hash;
        onUpdate(cats);
        console.log('[sync] Danh mục cập nhật:', cats.length, 'mục');
      }
    } catch(_) { /* silent */ }
  };

  // Run once immediately to set lastHash without triggering onUpdate
  loadCategories().then(cats => {
    lastHash = cats.map(c => `${c.id}:${c.name}:${c.slug}`).join('|');
  }).catch(() => {});

  const id = setInterval(poll, interval);
  _timers.push(id);
  return id;
}

/**
 * Start polling for product list changes.
 * @param {string} fetchParams - query string for getProducts (e.g. "limit=8")
 * @param {(products: Array) => void} onUpdate - called when products change
 * @param {number} interval - ms between polls (default 20s)
 * @returns {number} intervalId
 */
export function startProductSync(fetchParams, onUpdate, interval = 20_000) {
  let lastHash = '';

  const poll = async () => {
    try {
      const res = await getProducts(fetchParams);
      const products = res?.data || [];
      const hash = products.map(p => `${p.id}:${p.name}:${p.min_price}`).join('|');
      if (hash !== lastHash) {
        lastHash = hash;
        onUpdate(products);
        console.log('[sync] Sản phẩm cập nhật:', products.length, 'sp');
      }
    } catch(_) { /* silent */ }
  };

  // Set baseline hash silently
  getProducts(fetchParams).then(res => {
    const products = res?.data || [];
    lastHash = products.map(p => `${p.id}:${p.name}:${p.min_price}`).join('|');
  }).catch(() => {});

  const id = setInterval(poll, interval);
  _timers.push(id);
  return id;
}

/** Clear all sync intervals on this page */
export function stopSync() {
  _timers.forEach(id => clearInterval(id));
  _timers.length = 0;
}

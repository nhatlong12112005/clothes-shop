// front-end/src/admin/utils/urlSync.js
export function updateAdminUrl(params) {
  const query = params.filter(p => p).join('&');
  const newUrl = `${window.location.pathname}?${query}`;
  history.replaceState(null, '', newUrl);
}

export function getAdminUrlParams() {
  return new URLSearchParams(window.location.search);
}

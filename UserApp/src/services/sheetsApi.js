// UserApp/src/services/sheetsApi.js
/**
 * API Service — đọc APPS_SCRIPT_URL từ shared/env.js
 * Metro alias: @shared → G:\Football Penalty\shared\
 */
import ENV from '@shared/env';

const APPS_SCRIPT_URL = ENV.APPS_SCRIPT_URL;
const TIMEOUT_MS      = ENV.API_TIMEOUT;

// ─── Helper ────────────────────────────────────────────────────────────────
async function fetchWithTimeout(url, options = {}) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return res.json();
  } catch (e) {
    clearTimeout(timer);
    if (e.name === 'AbortError') throw new Error('Request timeout — kiểm tra kết nối mạng');
    throw e;
  }
}

// ─── API Functions ──────────────────────────────────────────────────────────

/**
 * 1. Lấy danh sách cửa hàng
 */
export async function fetchStores() {
  const data = await fetchWithTimeout(`${APPS_SCRIPT_URL}?action=getStores`);
  if (!data.success) throw new Error(data.error || 'Không thể lấy danh sách cửa hàng');
  return data.stores;
}

/**
 * 2. Lấy tồn kho theo storeId
 */
export async function fetchGiftStock(storeId) {
  if (!storeId) throw new Error('storeId is required to fetch stock');
  const data = await fetchWithTimeout(
    `${APPS_SCRIPT_URL}?action=getStock&storeId=${encodeURIComponent(storeId)}`
  );
  if (!data.success) throw new Error(data.error || 'fetchGiftStock failed');
  return data.stock;
}

/**
 * 3. Kiểm tra SĐT đã NHẬN QUÀ chưa tại cùng phân vùng/khu vực
 *
 * @param {string} phone
 * @param {string} storeId
 */
export async function checkPhonePlayed(phone, storeId) {
  if (!phone || !storeId) return false;
  const data = await fetchWithTimeout(
    `${APPS_SCRIPT_URL}?action=checkPhone&phone=${encodeURIComponent(phone)}&storeId=${encodeURIComponent(storeId)}`
  );
  if (!data.success) throw new Error(data.error || 'checkPhonePlayed failed');
  return data.hasPlayed === true;
}

/**
 * 4. Ghi nhận kết quả quay thưởng
 * Tự động updateCell cộng thêm 1 vào bảng Số Lượng Đã Phát và appendRow thông tin khách hàng vào Kết Quả Vòng Quay.
 */
export async function submitResult({ storeId, user, gift }) {
  const data = await fetchWithTimeout(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({
      action:       'submitResult',
      storeId,
      hoTen:        user.name,
      soDienThoai:  user.phone,
      diaChi:       user.address || '',
      maQua:        gift.id,
      tenQua:       gift.name,
      thoiGian:     new Date().toISOString(),
    }),
  });
  if (!data.success) throw new Error(data.error || 'submitResult failed');
  return data;
}

/**
 * 5. Admin nhập hàng mới (Form Nhập Liệu)
 * @param {string} storeId
 * @param {Array} items - [{ giftId, quantity }]
 * @param {string} ghiChu
 */
export async function adminAddStock({ storeId, items, ghiChu }) {
  const data = await fetchWithTimeout(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({
      action: 'adminAddStock',
      storeId,
      items,
      ghiChu,
    }),
  });
  if (!data.success) throw new Error(data.error || 'adminAddStock failed');
  return data;
}

/**
 * 6. Admin điều chỉnh kho (Form Cập Nhật)
 * @param {string} storeId
 * @param {string} giftId
 * @param {number} quantity - số nguyên (âm/dương)
 * @param {string} ghiChu
 */
export async function adminUpdateStock({ storeId, giftId, quantity, ghiChu }) {
  const data = await fetchWithTimeout(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({
      action: 'adminUpdateStock',
      storeId,
      giftId,
      quantity,
      ghiChu,
    }),
  });
  if (!data.success) throw new Error(data.error || 'adminUpdateStock failed');
  return data;
}

/**
 * 7. Khởi tạo Database nếu cần
 */
export async function setupDatabase() {
  const data = await fetchWithTimeout(`${APPS_SCRIPT_URL}?action=setupDatabase`);
  if (!data.success) throw new Error(data.error || 'setupDatabase failed');
  return data;
}

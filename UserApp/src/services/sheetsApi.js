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
 * 1. Lấy tồn kho theo location
 */
export async function fetchGiftStock(location) {
  const data = await fetchWithTimeout(
    `${APPS_SCRIPT_URL}?action=getStock&location=${location}`
  );
  if (!data.success) throw new Error(data.error || 'fetchGiftStock failed');
  return data.stock;
}

/**
 * 2. Kiểm tra SĐT đã NHẬN QUÀ chưa (không phải đã chơi)
 *
 * Quan trọng: checkPhone chỉ true khi user đã HOÀN TẤT quay thưởng
 * (tức là submitResult đã được gọi thành công).
 * Người chơi từ GameApp → UserApp chưa submit → checkPhone = false → OK.
 *
 * @param {string} phone
 * @param {string} location - 'HN' | 'HCM'
 */
export async function checkPhonePlayed(phone, location) {
  if (!phone) return false;
  const data = await fetchWithTimeout(
    `${APPS_SCRIPT_URL}?action=checkPhone&phone=${encodeURIComponent(phone)}&location=${location}`
  );
  return data.hasPlayed === true;
}

/**
 * 3. Ghi nhận kết quả + lưu vào Sheets
 * Được gọi DUY NHẤT 1 LẦN trong WheelScreen sau khi quay xong.
 *
 * Apps Script dùng LockService → thread-safe khi nhiều người cùng gửi.
 */
export async function submitResult({ location, user, gift }) {
  const data = await fetchWithTimeout(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({
      action:       'submitResult',
      diaDiem:      location,
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
 * 4. Trừ kho sau khi quay
 * Apps Script dùng LockService → thread-safe.
 */
export async function decrementStock(location, giftId) {
  const data = await fetchWithTimeout(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action: 'decrementStock', location, giftId }),
  });
  if (!data.success) throw new Error(data.error || 'decrementStock failed');
  return data;
}

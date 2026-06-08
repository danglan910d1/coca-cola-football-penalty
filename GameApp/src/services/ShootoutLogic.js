// GameApp/src/services/ShootoutLogic.js
/**
 * ShootoutLogic - Tính toán xác suất cản phá và vị trí bay của thủ môn.
 * 
 * Tọa độ chuẩn hóa:
 *   x: 0.0 (Bên trái) -> 1.0 (Bên phải) của khung thành.
 *   y: 0.0 (Mép trên) -> 1.0 (Mặt đất) của khung thành.
 */

export const DIFFICULTY_PRESETS = {
  EASY: {
    1: 0.45, // Center Middle (Dễ bắt nhất)
    2: 0.25, // Left Middle
    3: 0.25, // Right Middle
    4: 0.15, // Bottom Left
    5: 0.15, // Bottom Right
    6: 0.30, // Center Up
    7: 0.30, // Center Down
    8: 0.08, // Top Left (Góc chết hiểm hóc)
    9: 0.08, // Top Right (Góc chết hiểm hóc)
  },
  MEDIUM: {
    1: 0.60,
    2: 0.40,
    3: 0.40,
    4: 0.25,
    5: 0.25,
    6: 0.45,
    7: 0.45,
    8: 0.12,
    9: 0.12,
  },
  HARD: {
    1: 0.75,
    2: 0.55,
    3: 0.55,
    4: 0.40,
    5: 0.40,
    6: 0.60,
    7: 0.60,
    8: 0.20,
    9: 0.20,
  }
};

// Cấu hình Catching Zone: Trung tâm (centerX, centerY) và bán kính bắt bóng (radius) của từng vùng sút
export const CATCHING_ZONES = {
  1: { centerX: 0.5, centerY: 0.5, radius: 0.18 },   // Center Mid
  2: { centerX: 0.18, centerY: 0.5, radius: 0.15 },  // Jump Left (Center Left)
  3: { centerX: 0.82, centerY: 0.5, radius: 0.15 },  // Jump Right (Center Right)
  4: { centerX: 0.2, centerY: 0.8, radius: 0.12 },   // Bottom Left
  5: { centerX: 0.8, centerY: 0.8, radius: 0.12 },   // Bottom Right
  6: { centerX: 0.5, centerY: 0.2, radius: 0.15 },   // Center Up (Top Mid)
  7: { centerX: 0.5, centerY: 0.8, radius: 0.15 },   // Crouch Center Down (Bottom Mid)
  8: { centerX: 0.12, centerY: 0.18, radius: 0.09 }, // Top Left (Góc chết sút phạt hiểm hóc)
  9: { centerX: 0.88, centerY: 0.18, radius: 0.09 }, // Top Right (Góc chết sút phạt hiểm hóc)
};

/**
 * Tính toán kết quả cú sút dựa trên vị trí chạm và cơ chế Catching Zone.
 * 
 * @param {number} targetX - Tọa độ X người chơi sút (0.0 -> 1.0)
 * @param {number} targetY - Tọa độ Y người chơi sút (0.0 -> 1.0)
 * @param {string} difficultyLevel - Mức độ khó ('EASY' | 'MEDIUM' | 'HARD')
 * @param {number} successRateModifier - Tham số nhân tỉ lệ thành công (mặc định 1.0)
 * @returns {object} { isGoal, gkEndX, gkEndY, poseIndex, msg, inZone }
 */
export function calculateShootoutResult(targetX, targetY, difficultyLevel = 'MEDIUM', successRateModifier = 1.0) {
  const preset = DIFFICULTY_PRESETS[difficultyLevel] || DIFFICULTY_PRESETS.MEDIUM;

  const gkStartX = 0.5;
  const gkStartY = 0.7;

  // 1. Phân chia tọa độ thành 9 vùng hành động của thủ môn (poseIndex từ 1 đến 9)
  let poseIndex = 1; // Mặc định ở giữa

  const diffX = targetX - gkStartX;
  const diffY = targetY - gkStartY;

  if (Math.abs(diffX) < 0.15 && Math.abs(diffY) < 0.2) {
    // Cú sút chính diện
    if (diffY < -0.15) {
      poseIndex = 6; // Nhảy cao giữa
    } else if (diffY > 0.15) {
      poseIndex = 7; // Cúi thấp giữa
    } else {
      poseIndex = 1; // Sẵn sàng ở giữa
    }
  } else if (diffX < 0) {
    // Sút sang bên trái thủ môn
    if (targetY < 0.35) {
      poseIndex = 8; // Bay cao bên trái (Top-Left)
    } else if (targetY > 0.65) {
      poseIndex = 4; // Bay sệt bên trái (Bottom-Left)
    } else {
      poseIndex = 2; // Bay ngang bên trái (Jump Left)
    }
  } else {
    // Sút sang bên phải thủ môn
    if (targetY < 0.35) {
      poseIndex = 9; // Bay cao bên phải (Top-Right)
    } else if (targetY > 0.65) {
      poseIndex = 5; // Bay sệt bên phải (Bottom-Right)
    } else {
      poseIndex = 3; // Bay ngang bên phải (Jump Right)
    }
  }

  // 2. Tính toán xem bóng có nằm trong "Catching Zone" của thủ môn hay không
  const zone = CATCHING_ZONES[poseIndex];
  const distance = Math.sqrt(
    Math.pow(targetX - zone.centerX, 2) + Math.pow(targetY - zone.centerY, 2)
  );
  
  const inZone = distance <= zone.radius;
  let isSaved = false;

  if (inZone) {
    // Nếu sút trúng vùng bắt bóng của thủ môn -> thủ môn mới có cơ hội cản phá
    const saveProbability = (preset[poseIndex] ?? 0.30) * successRateModifier;
    const rand = Math.random();
    isSaved = rand < saveProbability;
  } else {
    // Sút trúng "vùng trống" hoặc "góc chết" ngoài tầm với -> thủ môn luôn bay người hụt (isSaved = false)
    isSaved = false;
  }

  // Tọa độ kết thúc của thủ môn bay người đến vùng bắt bóng của mình
  const gkEndX = zone.centerX;
  const gkEndY = zone.centerY;

  // Trả về kết quả
  return {
    isGoal: !isSaved,
    gkEndX,
    gkEndY,
    poseIndex, // 1 -> 9
    inZone,
    msg: isSaved ? 'THỦ MÔN CẢN PHÁ! 🧤' : 'VÀO!!! ⚽'
  };
}

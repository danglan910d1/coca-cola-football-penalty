// UserApp/src/hooks/useResponsive.js
/**
 * Hook responsive — dùng trong toàn bộ UserApp
 *
 * Breakpoints:
 *   phone:  width < 600
 *   tablet: width >= 600
 *
 * Trả về các giá trị scale để dùng trong StyleSheet.
 */
import { Dimensions, useWindowDimensions } from 'react-native';

const BASE_PHONE_WIDTH = 375;

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isTablet  = width >= 600;
  const isLandscape = width > height;

  // Scale factor tương đối so với thiết kế gốc (375px)
  const scale     = width / BASE_PHONE_WIDTH;
  const fontScale = isTablet ? Math.min(scale, 1.6) : 1;

  // Padding chuẩn
  const hPad = isTablet ? 48 : 24;
  const vPad = isTablet ? 48 : 32;

  // Card max width (để khớp với thiết kế rộng của tablet/desktop)
  const contentWidth = isTablet ? Math.min(width * 0.85, 1000) : width;

  /** Scale một giá trị kích thước */
  const rs = (size) => isTablet ? size * fontScale : size;

  return {
    width, height,
    isTablet, isLandscape,
    scale, fontScale,
    hPad, vPad,
    contentWidth,
    rs,
  };
}

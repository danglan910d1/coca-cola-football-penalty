// UserApp/src/components/CocaButton.js
import React, { useEffect, useRef } from 'react';
import { Pressable, Text, StyleSheet, View, Platform } from 'react-native';
import { Theme } from './Theme';
import { useResponsive } from '../hooks/useResponsive';
import { audioHelper } from '../services/AudioHelper';

export default function CocaButton({ 
  title, 
  onPress, 
  disabled = false, 
  loading = false,
  style,
  textColor
}) {
  const { rs, isTablet } = useResponsive();
  const bubbleContainerRef = useRef(null);

  // Sử dụng tiêu đề thô directly kết hợp css letterSpacing
  const formattedTitle = title;

  useEffect(() => {
    if (Platform.OS !== 'web' || disabled || loading) return;
    const container = bubbleContainerRef.current;
    if (!container) return;
    
    const interval = setInterval(() => {
      const bubble = document.createElement('div');
      bubble.className = 'bubble';
      
      const size = Math.random() * 6 + 3 + 'px'; // Bọt khí ga nhỏ li ti (3px - 9px)
      const left = Math.random() * 80 + 10 + '%'; // Keep within button width
      const duration = Math.random() * 1.2 + 1.0; // Bay nhanh hơn (1s - 2.2s)
      const delay = Math.random() * 0.8; // Trễ ngắn hơn
      
      bubble.style.width = size;
      bubble.style.height = size;
      bubble.style.left = left;
      bubble.style.bottom = '20px';
      bubble.style.animationDuration = `${duration}s`;
      bubble.style.animationDelay = `${delay}s`;
      
      container.appendChild(bubble);
      
      setTimeout(() => {
        bubble.remove();
      }, 3000);
    }, 120); // Tạo bọt khí liên tục (120ms) để giống ga sủi bọt Coca-Cola
    
    return () => clearInterval(interval);
  }, [disabled, loading]);

  const handlePress = () => {
    audioHelper.playButtonClick();
    if (onPress) {
      onPress();
    }
  };

  return (
    <View style={[styles.wrapper, { marginVertical: isTablet ? 10 : 6 }]}>
      {/* Absolute bubble container for rising particles */}
      <View 
        ref={bubbleContainerRef} 
        style={styles.bubbleContainer} 
        pointerEvents="none"
      />
      
      <Pressable
        className="btn-3d"
        style={({ pressed }) => [
          styles.button,
          { paddingVertical: isTablet ? 18 : 13 },
          pressed && styles.pressed,
          disabled && styles.disabled,
          style
        ]}
        onPress={handlePress}
        disabled={disabled || loading}
      >
        {/* Gradient Overlay for high-end look */}
        <View style={styles.gradientOverlay} pointerEvents="none" />
        
        <Text style={[styles.text, { fontSize: rs(isTablet ? 22 : 15) }, textColor && { color: textColor }]}>
          {loading ? 'Đ A N G   X Ử   L Ý . . .' : formattedTitle}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    width: '100%',
    alignItems: 'center',
    marginVertical: 10,
  },
  bubbleContainer: {
    position: 'absolute',
    top: -40,
    bottom: -40,
    left: 0,
    right: 0,
    pointerEvents: 'none',
    overflow: 'visible',
    zIndex: 10,
  },
  button: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radius.button,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    width: '100%',
    // Fallback for native/non-web or failed class loads
    borderWidth: 0,
    borderBottomWidth: 10,
    borderBottomColor: Theme.colors.primaryDark,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 10,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundImage: 'linear-gradient(to top, transparent, rgba(255, 255, 255, 0.2))',
    opacity: 0.6,
  },
  pressed: {
    transform: [{ translateY: 6 }, { scale: 0.98 }],
    borderBottomWidth: 4,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontFamily: 'Anton', // Đổi sang font Anton để giống hệt hình mẫu
    letterSpacing: 1.2, // Giảm khoảng cách dãn chữ lại theo phản hồi
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    zIndex: 11,
  }
});

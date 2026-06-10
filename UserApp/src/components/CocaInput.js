// UserApp/src/components/CocaInput.js
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Platform } from 'react-native';
import { Theme } from './Theme';
import { useResponsive } from '../hooks/useResponsive';

export default function CocaInput({ 
  label,
  error, 
  style,
  ...props 
}) {
  const { rs } = useResponsive();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {/* Nhãn nhãn chữ (Labels) trên đầu Input nổi bật hơn */}
      {label && (
        <Text style={[styles.label, { fontSize: rs(18), marginBottom: rs(10) }]}>
          {label}
        </Text>
      )}
      
      <TextInput
        style={[
          styles.input,
          { 
            fontSize: rs(20), // Tăng cỡ chữ để dễ đọc hơn nữa
            paddingHorizontal: rs(20), 
            paddingVertical: rs(16),
            borderRadius: Theme.radius.input,
          },
          isFocused && styles.inputFocused,
          error && styles.inputError,
          style
        ]}
        placeholderTextColor="rgba(71, 85, 105, 0.5)" // Làm nổi bật placeholder trên nền sáng
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
      {error && <Text style={[styles.errorText, { fontSize: rs(13), marginTop: rs(4) }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
    width: '100%',
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontFamily: 'JetBrains Mono',
    letterSpacing: 2,
    textTransform: 'uppercase',
    paddingLeft: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    color: '#1E293B',
    fontWeight: '700',
    outlineStyle: 'none',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.18)', // Đổ bóng nổi rõ nét trên nền cỏ
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 15,
    elevation: 5,
    transition: 'all 0.2s ease',
    fontFamily: Platform.OS === 'web'
      ? 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      : 'Outfit',
  },
  inputFocused: {
    borderColor: '#3b82f6', // Xanh dương khi chọn
    backgroundColor: '#FFFFFF',
    boxShadow: '0 0 10px rgba(59, 130, 246, 0.25), 0 2px 8px rgba(71, 85, 105, 0.1)',
  },
  inputError: {
    borderColor: Theme.colors.error,
  },
  errorText: {
    color: '#FF2D2D',
    marginLeft: 4,
    marginTop: 5,
    fontWeight: '800',
    // Nổi bật trên nền sân cỏ bằng nền trắng nhỏ
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    overflow: 'hidden',
  }
});

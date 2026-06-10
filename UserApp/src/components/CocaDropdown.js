// UserApp/src/components/CocaDropdown.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { Theme } from './Theme';
import { useResponsive } from '../hooks/useResponsive';
import { audioHelper } from '../services/AudioHelper';

export default function CocaDropdown({
  label,
  placeholder = '-- Chọn --',
  value,
  options = [],
  onSelect,
  error,
  disabled = false,
  style,
  containerStyle,
  isOpen: controlledIsOpen,
  onToggle
}) {
  const { rs } = useResponsive();
  const [localIsOpen, setLocalIsOpen] = useState(false);
  const containerRef = useRef(null);

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : localIsOpen;
  const setIsOpen = (val) => {
    if (onToggle) {
      onToggle(val);
    } else {
      setLocalIsOpen(val);
    }
  };

  // Close dropdown on click outside (Web compatibility)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [onToggle, controlledIsOpen]);

  const handleToggle = () => {
    if (disabled) return;
    audioHelper.playButtonClick();
    setIsOpen(!isOpen);
  };

  const handleSelect = (option) => {
    audioHelper.playButtonClick();
    if (onSelect) {
      onSelect(option);
    }
    setIsOpen(false);
  };

  const hasValue = value !== undefined && value !== null && value !== '';
  const displayValue = hasValue ? value : placeholder;
  const textColor = hasValue ? '#1E293B' : 'rgba(71, 85, 105, 0.5)';

  return (
    <View
      ref={containerRef}
      style={[styles.container, containerStyle, { zIndex: isOpen ? 10000 : 1 }]}
    >
      {label && (
        <Text style={[styles.label, { fontSize: rs(18), marginBottom: rs(10) }]}>
          {label}
        </Text>
      )}

      <TouchableOpacity
        activeOpacity={0.85}
        disabled={disabled}
        onPress={handleToggle}
        style={[
          styles.trigger,
          {
            borderRadius: Theme.radius.input,
            paddingHorizontal: rs(20),
            paddingVertical: rs(16),
          },
          isOpen && styles.triggerFocused,
          disabled && styles.triggerDisabled,
          error && styles.triggerError,
          style
        ]}
      >
        <Text style={[styles.valueText, { fontSize: rs(20), color: textColor }]}>
          {displayValue}
        </Text>
        <View style={[styles.arrow, isOpen && styles.arrowOpen]} />
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.dropdownList}>
          <ScrollView
            style={{ maxHeight: 300 }}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            {options.length === 0 ? (
              <View style={[styles.noResultsItem, { paddingVertical: rs(16), paddingHorizontal: rs(20) }]}>
                <Text style={[styles.noResultsText, { fontSize: rs(20) }]}>
                  Không tìm thấy kết quả
                </Text>
              </View>
            ) : (
              options.map((opt, idx) => {
                const optId = typeof opt === 'object' ? opt.id : opt;
                const optName = typeof opt === 'object' ? opt.name : opt;
                const isSelected = value === optName;

                return (
                  <TouchableOpacity
                    key={optId || idx}
                    style={[
                      styles.dropdownItem,
                      { paddingVertical: rs(16), paddingHorizontal: rs(20) },
                      isSelected && styles.dropdownItemActive
                    ]}
                    onPress={() => handleSelect(opt)}
                  >
                    <Text style={[
                      styles.dropdownItemText,
                      { fontSize: rs(20) },
                      isSelected && styles.dropdownItemTextActive
                    ]}>
                      {optName}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      )}

      {error && (
        <Text style={[styles.errorText, { fontSize: rs(13), marginTop: rs(4) }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
    width: '100%',
    position: 'relative',
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
  trigger: {
    // Style đồng bộ với CocaInput
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // Đổ bóng nổi rõ nét như CocaInput
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 15,
    elevation: 5,
    cursor: 'pointer',
    width: '100%',
    minHeight: 56, // Đảm bảo chiều cao đồng bộ
  },
  triggerFocused: {
    borderColor: '#3b82f6', // Xanh dương
    backgroundColor: '#FFFFFF',
    shadowColor: 'rgba(59, 130, 246, 0.25)',
    boxShadow: '0 0 10px rgba(59, 130, 246, 0.25), 0 2px 8px rgba(71, 85, 105, 0.1)',
  },
  triggerDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    cursor: 'not-allowed',
  },
  triggerError: {
    borderColor: Theme.colors.error,
  },
  valueText: {
    fontWeight: '700',
    fontFamily: Platform.OS === 'web'
      ? 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      : 'Outfit',
    flex: 1,
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#475569',
    marginLeft: 10,
    transition: 'transform 0.2s ease',
  },
  arrowOpen: {
    transform: [{ rotate: '180deg' }],
  },
  dropdownList: {
    position: 'absolute',
    top: '105%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 9999, // Đảm bảo nó nổi lên trên các thành phần khác
  },
  dropdownItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
  },
  dropdownItemActive: {
    backgroundColor: '#f1f5f9', // Xám nhạt
  },
  dropdownItemText: {
    color: '#1E293B',
    fontWeight: '600',
    fontFamily: Platform.OS === 'web'
      ? 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      : 'Outfit',
  },
  dropdownItemTextActive: {
    color: '#1E293B', // Đen tối
    fontWeight: '800',
  },
  noResultsItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsText: {
    color: '#94A3B8',
    fontStyle: 'italic',
    fontWeight: '600',
    fontFamily: Platform.OS === 'web'
      ? 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      : 'Outfit',
  },
  errorText: {
    color: '#FF2D2D',
    marginLeft: 4,
    marginTop: 5,
    fontWeight: '800',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    overflow: 'hidden',
  }
});

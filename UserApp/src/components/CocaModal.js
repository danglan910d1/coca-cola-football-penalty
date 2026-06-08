import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { Theme } from './Theme';
import CocaButton from './CocaButton';
import { useResponsive } from '../hooks/useResponsive';

export default function CocaModal({ visible, title, message, onClose, onConfirm, confirmText = 'ĐÓNG' }) {
  const { rs, contentWidth } = useResponsive();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.card, { width: Math.min(contentWidth - 32, 400), padding: rs(24) }]}>
          <Text style={[styles.title, { fontSize: rs(20), marginBottom: rs(12) }]}>{title}</Text>
          <Text style={[styles.message, { fontSize: rs(15), marginBottom: rs(24) }]}>{message}</Text>
          <CocaButton title={confirmText} onPress={onConfirm || onClose} style={{ paddingVertical: rs(16) }} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(71, 85, 105, 0.4)', // Overlay sáng hơn mờ nhẹ
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: Theme.colors.card, // Kính mờ sáng từ Theme
    borderRadius: Theme.radius.card,
    borderWidth: 2,
    borderColor: Theme.colors.cardBorder,
    alignItems: 'center',
    shadowColor: 'rgba(71, 85, 105, 0.3)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
    backdropFilter: 'blur(20px)', // Blur cho Web
  },
  title: {
    color: Theme.colors.textTitle, // Chữ tiêu đề tối
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    color: Theme.colors.textSub, // Chữ phụ tối
    textAlign: 'center',
    lineHeight: 22,
  }
});

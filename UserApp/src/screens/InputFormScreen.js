// UserApp/src/screens/InputFormScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Animated,
  KeyboardAvoidingView, Platform, Linking, ImageBackground, Image, TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useResponsive } from '../hooks/useResponsive';
import { checkPhonePlayed } from '../services/sheetsApi';
import { Theme } from '../components/Theme';
import CocaInput from '../components/CocaInput';
import CocaButton from '../components/CocaButton';
import CocaModal from '../components/CocaModal';
import SharedStyles from '../components/SharedStyles';
import AmbientBubbles from '../components/AmbientBubbles';

const BG_IMAGE = require('../../assets/bg_main.jpeg');
const LOGO_IMAGE = require('../../assets/logo_coca.png');

export default function InputFormScreen() {
  const navigation = useNavigation();
  const { user, updateUser } = useApp();
  const R = useResponsive();
  const { rs, isTablet, contentWidth, hPad } = R;

  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [location, setLocation] = useState(user.location || ''); // Mặc định trống để buộc chọn
  const [address, setAddress] = useState(user.address || '');
  const [errors, setErrors] = useState({});
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // ── Animations ─────────────────────────────────────────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 550, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 550, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Parallax effect ────────────────────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handleMouseMove = (e) => {
      const moveX = (e.clientX - window.innerWidth / 2) / 80;
      const moveY = (e.clientY - window.innerHeight / 2) / 80;
      const form = document.querySelector('.form-glass');
      if (form) {
        form.style.transform = `translate(${moveX}px, ${moveY}px)`;
      }
    };
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Logic kiểm tra trùng SĐT sẽ chỉ thực hiện khi nhấn nút Xác nhận (handleSubmit)

  // ── Validation & Submit ──────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Vui lòng nhập họ tên';
    if (!phone.trim()) e.phone = 'Vui lòng nhập số điện thoại';
    else if (!/^[0-9]{9,11}$/.test(phone.trim())) e.phone = 'Số điện thoại không hợp lệ';
    if (!location) e.location = 'Vui lòng chọn địa điểm';
    if (!address.trim()) e.address = 'Vui lòng nhập địa chỉ';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const hasPlayed = await checkPhonePlayed(phone.trim(), location);

      if (hasPlayed) {
        setModalMessage('Số điện thoại này đã tham gia nhận quà. Mỗi người chỉ được tham gia 1 lần!');
        setModalVisible(true);
        return;
      }

      updateUser({ name: name.trim(), phone: phone.trim(), location, address: address.trim() });
      navigation.navigate('Wheel');
    } catch (err) {
      setModalMessage('Lỗi hệ thống khi kiểm tra SĐT. Vui lòng kiểm tra kết nối và thử lại.');
      setModalVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const s = buildStyles(R);

  const ContainerView = Platform.OS === 'web' ? View : KeyboardAvoidingView;

  return (
    <ContainerView style={s.root} {...(Platform.OS !== 'web' ? { behavior: Platform.OS === 'ios' ? 'padding' : 'height' } : {})}>
      <SharedStyles />
      <ImageBackground source={BG_IMAGE} style={s.container} imageStyle={s.bgImage}>
        <View style={s.bgOverlay} />
        <AmbientBubbles />

        <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={s.centerWrap}>

            {/* Logo ở ngoài, trên đầu card */}
            <View style={s.logoWrap} className="logo-glow animate-logo-float">
              <Image source={LOGO_IMAGE} style={s.logo} />
            </View>

            {/* Hộp kính mờ (form-glass) bao bọc toàn bộ nội dung */}
            <Animated.View
              style={[s.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
              className="form-glass"
            >

              {/* Tiêu đề trong card đồng bộ với WheelScreen */}
              <View style={s.header}>
                <View style={s.headlineWrap} className="animate-title-pop">
                  <View style={s.titleRow}>
                    <Text style={[s.mainHeading, { fontSize: rs(isTablet ? 40 : 36) }]}>
                      MỜI BẠN NHẬP THÔNG TIN
                    </Text>
                  </View>

                  <View style={s.titleRow}>
                    <Text style={[s.mainHeading, { fontSize: rs(isTablet ? 40 : 36) }]}>
                      TRƯỚC KHI{' '}
                    </Text>
                    <View style={s.highlightContainer}>
                      <Text style={[s.highlightText, { fontSize: rs(isTablet ? 40 : 36) }]}>
                        CHƠI
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Form Input fields */}
              <View style={s.formArea}>
                <CocaInput
                  label="Họ và tên"
                  placeholder="Nguyễn Văn A"
                  value={name}
                  onChangeText={(val) => {
                    setName(val);
                    if (errors.name) {
                      setErrors(prev => ({ ...prev, name: null }));
                    }
                  }}
                  error={errors.name}
                  returnKeyType="next"
                  autoCapitalize="words"
                />

                <CocaInput
                  label="Số điện thoại *"
                  placeholder="0901 234 567"
                  value={phone}
                  onChangeText={(val) => {
                    setPhone(val);
                    if (errors.phone) {
                      setErrors(prev => ({ ...prev, phone: null }));
                    }
                  }}
                  error={errors.phone}
                  keyboardType="phone-pad"
                  returnKeyType="next"
                  maxLength={11}
                />

                {/* Lựa Chọn Địa Điểm (2 Nút HCM / HN) */}
                <View style={s.inputContainer}>
                  <Text style={[s.inputLabel, { fontSize: rs(isTablet ? 18 : 13), marginBottom: rs(isTablet ? 10 : 6) }]}>
                    Tham gia tại *
                  </Text>
                  <View style={s.locationRow}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[
                        s.locationBtn,
                        location === 'HCM' && s.locationBtnActive,
                        errors.location && { borderColor: Theme.colors.error }
                      ]}
                      onPress={() => {
                        setLocation('HCM');
                        if (errors.location) {
                          setErrors(prev => ({ ...prev, location: null }));
                        }
                      }}
                    >
                      <Text style={[
                        s.locationBtnText,
                        location === 'HCM' && s.locationBtnTextActive
                      ]}>
                        {isTablet ? 'TP. HỒ CHÍ MINH (HCM)' : 'TP. HCM'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[
                        s.locationBtn,
                        location === 'HN' && s.locationBtnActive,
                        errors.location && { borderColor: Theme.colors.error }
                      ]}
                      onPress={() => {
                        setLocation('HN');
                        if (errors.location) {
                          setErrors(prev => ({ ...prev, location: null }));
                        }
                      }}
                    >
                      <Text style={[
                        s.locationBtnText,
                        location === 'HN' && s.locationBtnTextActive
                      ]}>
                        {isTablet ? 'HÀ NỘI (HN)' : 'HÀ NỘI'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {errors.location && <Text style={s.errorText}>{errors.location}</Text>}
                </View>

                <CocaInput
                  label="Địa chỉ *"
                  placeholder="Số nhà, đường, phường/xã..."
                  value={address}
                  onChangeText={(val) => {
                    setAddress(val);
                    if (errors.address) {
                      setErrors(prev => ({ ...prev, address: null }));
                    }
                  }}
                  error={errors.address}
                  returnKeyType="done"
                  autoCapitalize="sentences"
                />
              </View>

              {/* Submit Button */}
              <View style={s.btnWrap}>
                <CocaButton
                  title="XÁC NHẬN"
                  onPress={handleSubmit}
                  loading={isSubmitting}
                />
              </View>

              {/* Ghi chú dưới nút */}
              <Text style={s.privacyNote}>
                Vui lòng điền chính xác để nhận quà Coca-Cola
              </Text>

            </Animated.View>
          </View>
        </ScrollView>
      </ImageBackground>

      <CocaModal
        visible={modalVisible}
        title="Thông Báo"
        message={modalMessage}
        onClose={() => setModalVisible(false)}
      />
    </ContainerView>
  );
}

// ─── Responsive StyleSheet factory ───────────────────────────────────────────
function buildStyles(R) {
  const { isTablet, contentWidth, hPad, rs } = R;
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: Theme.colors.background,
      ...(Platform.OS === 'web' ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, height: '100%', width: '100%', overflow: 'hidden' } : {})
    },
    container: { flex: 1, width: '100%', height: '100%' },
    bgImage: { resizeMode: 'cover' },
    bgOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundImage: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.0) 0%, rgba(241, 245, 249, 0.45) 100%)', // Giảm tối, đổi sang tông trắng/xám mờ sáng
    },
    scroll: {
      flexGrow: 1, paddingHorizontal: hPad,
      paddingTop: isTablet ? 20 : 15, paddingBottom: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    centerWrap: { width: '100%', maxWidth: isTablet ? 920 : 480, alignItems: 'center' },
    logoWrap: {
      alignItems: 'center',
      marginBottom: rs(isTablet ? 12 : 16),
    },
    logo: {
      width: rs(isTablet ? 240 : 180),
      height: rs(isTablet ? 75 : 55),
      resizeMode: 'contain',
    },
    card: {
      paddingHorizontal: rs(isTablet ? 32 : 16),
      paddingVertical: rs(isTablet ? 24 : 14),
      width: '100%',
      backgroundColor: 'transparent',
      borderWidth: 0,
    },
    header: { alignItems: 'center', marginBottom: rs(isTablet ? 12 : 8) },
    formArea: {
      width: '100%',
      marginBottom: rs(isTablet ? 24 : 12),
    },
    inputContainer: {
      marginBottom: isTablet ? 20 : 14,
      width: '100%',
    },
    inputLabel: {
      color: '#FFFFFF',
      fontWeight: '800',
      fontFamily: 'JetBrains Mono',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      paddingLeft: 4,
      textShadowColor: 'rgba(0, 0, 0, 0.85)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 8,
    },
    locationRow: {
      flexDirection: 'row',
      gap: rs(16),
      width: '100%',
      alignSelf: 'stretch',
    },
    locationBtn: {
      flex: 1,
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.35)',
      borderRadius: Theme.radius.input,
      paddingVertical: isTablet ? 14 : 9,
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    locationBtnActive: {
      backgroundColor: Theme.colors.primary, // Đỏ classic khi chọn
      borderColor: 'rgba(255, 255, 255, 0.35)',
      boxShadow: '0 0 15px rgba(244, 0, 9, 0.35)',
    },
    locationBtnText: {
      color: '#FFFFFF',
      fontWeight: '800',
      fontFamily: 'Hanken Grotesk',
      fontSize: isTablet ? 22 : 13,
      textShadowColor: 'rgba(0, 0, 0, 0.5)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    locationBtnTextActive: {
      color: '#FFFFFF',
      fontWeight: '900',
      fontSize: isTablet ? 22 : 13,
      textShadowColor: 'rgba(0, 0, 0, 0.2)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    errorText: {
      color: '#FF2D2D',
      marginLeft: 4,
      marginTop: 5,
      fontSize: rs(13),
      fontWeight: '800',
      backgroundColor: 'rgba(255, 255, 255, 0.92)',
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 6,
      alignSelf: 'flex-start',
      overflow: 'hidden',
    },
    btnWrap: {
      width: '100%',
      marginTop: rs(10),
    },
    privacyNote: {
      color: '#FFFFFF',
      fontSize: rs(isTablet ? 16 : 12),
      textAlign: 'center',
      marginTop: rs(isTablet ? 12 : 8),
      fontStyle: 'italic',
      fontWeight: '700',
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      paddingVertical: isTablet ? 8 : 6,
      paddingHorizontal: isTablet ? 24 : 16,
      borderRadius: 9999,
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.25)',
      alignSelf: 'stretch',
      textAlign: 'center',
    },
    headlineWrap: {
      alignItems: 'center',
      marginBottom: rs(isTablet ? 8 : 6),
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 4,
    },
    mainHeading: {
      color: '#FFFFFF',
      fontWeight: '900',
      textAlign: 'center',
      textTransform: 'uppercase',
      fontFamily: 'Anton',
      textShadowColor: 'rgba(0, 0, 0, 0.85)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 8,
    },
    highlightContainer: {
      backgroundColor: '#FFFFFF',
      borderWidth: 3.5,
      borderColor: '#F40009', // Đỏ classic
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 2,
      transform: [{ rotate: '-3deg' }],
      boxShadow: '0 4px 12px rgba(244,0,9,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    highlightText: {
      color: '#F40009', // Đỏ classic
      fontWeight: '900',
      textAlign: 'center',
      textTransform: 'uppercase',
      fontFamily: 'Anton',
    },
  });
}

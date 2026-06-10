// UserApp/src/screens/InputFormScreen.js
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Animated,
  KeyboardAvoidingView, Platform, ImageBackground, Image, TouchableOpacity, ActivityIndicator
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useResponsive } from '../hooks/useResponsive';
import { fetchStores, checkPhonePlayed } from '../services/sheetsApi';
import { Theme } from '../components/Theme';
import CocaInput from '../components/CocaInput';
import CocaDropdown from '../components/CocaDropdown';
import CocaButton from '../components/CocaButton';
import CocaModal from '../components/CocaModal';
import SharedStyles from '../components/SharedStyles';
import AmbientBubbles from '../components/AmbientBubbles';
import { audioHelper } from '../services/AudioHelper';

const BG_IMAGE = require('../../assets/bg_main.jpeg');
const LOGO_IMAGE = require('../../assets/logo_coca.png');

export default function InputFormScreen() {
  const navigation = useNavigation();
  const { user, updateUser } = useApp();
  const R = useResponsive();
  const { rs, isTablet, contentWidth, hPad } = R;

  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [address, setAddress] = useState(user.address || '');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stores data and selectors state
  const [stores, setStores] = useState([]);
  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [storesError, setStoresError] = useState(null);

  const [selectedRegion, setSelectedRegion] = useState('HCM'); // Mặc định chọn sẵn HCM
  const [selectedType, setSelectedType] = useState('');
  const [selectedCum, setSelectedCum] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState('');

  // Custom select states
  const [isCumDropdownOpen, setIsCumDropdownOpen] = useState(false);
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);

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

    // Load stores list
    const loadStoresCatalog = async () => {
      try {
        setIsLoadingStores(true);
        setStoresError(null);
        const data = await fetchStores();
        setStores(data);
      } catch (err) {
        setStoresError(err.message || 'Lỗi kết nối tải dữ liệu cửa hàng');
      } finally {
        setIsLoadingStores(false);
      }
    };
    loadStoresCatalog();
  }, []);

  // ── Parallax effect ────────────────────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handleMouseMove = (e) => {
      const moveX = (e.clientX - window.innerWidth / 2) / 80;
      const moveY = (e.clientY - window.innerHeight / 2) / 80;
      const form = document.querySelector('.form-container-card');
      if (form) {
        form.style.transform = `translate(${moveX}px, ${moveY}px)`;
      }
    };
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFocusEffect(
    useCallback(() => {
      audioHelper.startWelcomeMusic();
      return () => {
        audioHelper.stopWelcomeMusic();
      };
    }, [])
  );

  // ─── Dropdowns options filtering ───
  const types = useMemo(() => {
    if (!selectedRegion) return [];
    return Array.from(new Set(stores.filter(s => s.region === selectedRegion).map(s => s.type))).filter(Boolean);
  }, [stores, selectedRegion]);

  const cums = useMemo(() => {
    if (!selectedRegion || selectedType !== 'Mall') return [];
    return Array.from(new Set(stores.filter(s => s.region === selectedRegion && s.type === 'Mall').map(s => s.cum))).filter(Boolean);
  }, [stores, selectedRegion, selectedType]);

  const filteredStores = useMemo(() => {
    if (!selectedRegion || !selectedType) return [];
    if (selectedType === 'Mall' && !selectedCum) return [];
    return stores.filter(s =>
      s.region === selectedRegion &&
      s.type === selectedType &&
      (selectedType === 'Outside' || s.cum === selectedCum)
    );
  }, [stores, selectedRegion, selectedType, selectedCum]);

  // ── Validation & Submit ──────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Vui lòng nhập họ tên';
    if (!phone.trim()) e.phone = 'Vui lòng nhập số điện thoại';
    else if (!/^[0-9]{9,11}$/.test(phone.trim())) e.phone = 'Số điện thoại không hợp lệ';

    // Check validation at each specific level
    if (!selectedRegion) e.region = 'Vui lòng chọn Khu vực';
    if (!selectedType) e.type = 'Vui lòng chọn Phân loại';
    if (selectedType === 'Mall' && !selectedCum) e.cum = 'Vui lòng chọn Tên cụm';
    if (!selectedStoreId) e.storeId = 'Vui lòng chọn Tên cửa hàng';

    if (!address.trim()) e.address = 'Vui lòng nhập địa chỉ';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const hasPlayed = await checkPhonePlayed(phone.trim(), selectedStoreId);

      if (hasPlayed) {
        setModalMessage('Số điện thoại này đã tham gia nhận quà tại khu vực này. Mỗi người chỉ được tham gia 1 lần!');
        setModalVisible(true);
        return;
      }

      const store = stores.find(st => st.id === selectedStoreId);
      updateUser({
        name: name.trim(),
        phone: phone.trim(),
        location: selectedStoreId,
        storeId: selectedStoreId,
        storeName: store ? store.name : '',
        address: address.trim()
      });
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

  // HỘP XOAY TRONG SUỐT BẢO VỆ LOAD FORM
  if (isLoadingStores) {
    return (
      <ContainerView style={s.root} {...(Platform.OS !== 'web' ? { behavior: Platform.OS === 'ios' ? 'padding' : 'height' } : {})}>
        <SharedStyles />
        <ImageBackground source={BG_IMAGE} style={s.container} imageStyle={s.bgImage}>
          <View style={s.bgOverlay} />
          <AmbientBubbles />
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', marginTop: 12, fontSize: 16, fontWeight: '700', fontFamily: 'Outfit', textShadowColor: 'rgba(0,0,0,0.85)', textShadowRadius: 8, textShadowOffset: { width: 1, height: 1 } }}>
              Đang tải dữ liệu...
            </Text>
          </View>
        </ImageBackground>
      </ContainerView>
    );
  }

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

            {/* Hộp kính mờ (form-container-card) bao bọc toàn bộ nội dung - TRONG SUỐT */}
            <Animated.View
              style={[s.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
              className="form-container-card"
            >

              {/* Tiêu đề trong card */}
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
              <View style={s.formArea} className="form-area-container">
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

                {/* 4-Tier Store Selector */}
                <View style={s.inputContainer}>
                  {storesError ? (
                    <Text style={s.errorText}>⚠️ {storesError}</Text>
                  ) : (
                    <View style={s.selectorGroup}>

                      {/* 1. Chọn Khu Vực (2 horizontal buttons) */}
                      <Text style={s.inputLabel}>Tham gia tại</Text>
                      <View style={s.locationRow}>
                        <TouchableOpacity
                          activeOpacity={0.8}
                          style={[
                            s.locationBtn,
                            selectedRegion === 'HCM' && s.locationBtnActive
                          ]}
                          onPress={() => {
                            audioHelper.playButtonClick();
                            setSelectedRegion('HCM');
                            setSelectedType('');
                            setSelectedCum('');
                            setSelectedStoreId('');
                            setIsCumDropdownOpen(false);
                            setIsStoreDropdownOpen(false);
                            setErrors(prev => ({ ...prev, region: null, type: null, cum: null, storeId: null }));
                          }}
                        >
                          <Text style={[
                            s.locationBtnText,
                            selectedRegion === 'HCM' && s.locationBtnTextActive
                          ]}>
                            {isTablet ? 'TP. HỒ CHÍ MINH (HCM)' : 'TP. HCM'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.8}
                          style={[
                            s.locationBtn,
                            selectedRegion === 'HN' && s.locationBtnActive
                          ]}
                          onPress={() => {
                            audioHelper.playButtonClick();
                            setSelectedRegion('HN');
                            setSelectedType('');
                            setSelectedCum('');
                            setSelectedStoreId('');
                            setIsCumDropdownOpen(false);
                            setIsStoreDropdownOpen(false);
                            setErrors(prev => ({ ...prev, region: null, type: null, cum: null, storeId: null }));
                          }}
                        >
                          <Text style={[
                            s.locationBtnText,
                            selectedRegion === 'HN' && s.locationBtnTextActive
                          ]}>
                            {isTablet ? 'HÀ NỘI (HN)' : 'HÀ NỘI'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      {errors.region && <Text style={s.errorText}>{errors.region}</Text>}

                      {/* 2. Chọn Phân Loại (Radio buttons) */}
                      <Text style={s.dropdownLabel}>Phân Loại *</Text>
                      <View style={s.radioRow}>
                        <TouchableOpacity
                          style={s.radioItem}
                          onPress={() => {
                            audioHelper.playButtonClick();
                            setSelectedType('Mall');
                            setSelectedCum('');
                            setSelectedStoreId('');
                            setIsCumDropdownOpen(false);
                            setIsStoreDropdownOpen(false);
                            setErrors(prev => ({ ...prev, type: null, cum: null, storeId: null }));
                          }}
                        >
                          <View style={[s.radioCircle, selectedType === 'Mall' && s.radioCircleActive]}>
                            {selectedType === 'Mall' && <View style={s.radioInnerCircle} />}
                          </View>
                          <Text style={s.radioLabel}>Siêu thị / Mall</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={s.radioItem}
                          onPress={() => {
                            audioHelper.playButtonClick();
                            setSelectedType('Outside');
                            setSelectedCum('Outside');
                            setSelectedStoreId('');
                            setIsCumDropdownOpen(false);
                            setIsStoreDropdownOpen(false);
                            setErrors(prev => ({ ...prev, type: null, cum: null, storeId: null }));
                          }}
                        >
                          <View style={[s.radioCircle, selectedType === 'Outside' && s.radioCircleActive]}>
                            {selectedType === 'Outside' && <View style={s.radioInnerCircle} />}
                          </View>
                          <Text style={s.radioLabel}>Cửa hàng tự do (Outside)</Text>
                        </TouchableOpacity>
                      </View>
                      {errors.type && <Text style={s.errorText}>{errors.type}</Text>}

                      {/* 3. Tên Cụm (Chỉ hiển thị khi Phân Loại là Mall) */}
                      {selectedType === 'Mall' && (
                        <CocaDropdown
                          label="Tên Cụm *"
                          placeholder="-- Chọn Cụm --"
                          value={selectedCum}
                          options={cums}
                          isOpen={isCumDropdownOpen}
                          onToggle={(open) => {
                            setIsCumDropdownOpen(open);
                            if (open) setIsStoreDropdownOpen(false);
                          }}
                          onSelect={(val) => {
                            setSelectedCum(val);
                            setSelectedStoreId('');
                            if (errors.cum) setErrors(prev => ({ ...prev, cum: null }));
                          }}
                          error={errors.cum}
                        />
                      )}

                      {/* 4. Tên Cửa Hàng (Hiển thị ngay từ đầu) */}
                      <CocaDropdown
                        label="Tên Cửa Hàng *"
                        placeholder="-- Chọn Cửa Hàng --"
                        value={stores.find(st => st.id === selectedStoreId)?.name}
                        options={filteredStores}
                        isOpen={isStoreDropdownOpen}
                        onToggle={(open) => {
                          setIsStoreDropdownOpen(open);
                          if (open) setIsCumDropdownOpen(false);
                        }}
                        onSelect={(val) => {
                          const storeId = typeof val === 'object' ? val.id : val;
                          setSelectedStoreId(storeId);
                          if (errors.storeId) setErrors(prev => ({ ...prev, storeId: null }));
                        }}
                        disabled={!selectedRegion || !selectedType || (selectedType === 'Mall' && !selectedCum)}
                        error={errors.storeId}
                      />

                    </View>
                  )}
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
              <View style={s.btnWrap} className="btn-wrap-container">
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
      backgroundImage: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.0) 0%, rgba(241, 245, 249, 0.45) 100%)',
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
      position: 'relative',
      zIndex: 10,
    },
    inputContainer: {
      marginBottom: isTablet ? 20 : 14,
      width: '100%',
      position: 'relative',
      zIndex: 1000,
    },
    inputLabel: {
      color: '#FFFFFF',
      fontWeight: '800',
      fontFamily: 'JetBrains Mono',
      letterSpacing: 2,
      textTransform: 'uppercase',
      paddingLeft: 4,
      textShadowColor: 'rgba(0, 0, 0, 0.85)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 8,
      fontSize: rs(18),
      marginBottom: rs(10),
    },
    dropdownLabel: {
      color: '#FFFFFF',
      fontWeight: '800',
      fontFamily: 'JetBrains Mono',
      letterSpacing: 2,
      textTransform: 'uppercase',
      paddingLeft: 4,
      textShadowColor: 'rgba(0, 0, 0, 0.85)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 8,
      fontSize: rs(18),
      marginBottom: rs(10),
      marginTop: rs(isTablet ? 14 : 10),
    },
    selectTrigger: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.5)',
      borderRadius: Theme.radius.input,
      paddingHorizontal: rs(20),
      paddingVertical: rs(14),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.18)',
      cursor: 'pointer',
      width: '100%',
      marginBottom: 14,
    },
    selectTriggerFocused: {
      borderColor: '#3b82f6',
      backgroundColor: '#FFFFFF',
      boxShadow: '0 0 10px rgba(59, 130, 246, 0.25), 0 2px 8px rgba(71, 85, 105, 0.1)',
    },
    selectTriggerDisabled: {
      backgroundColor: 'rgba(255, 255, 255, 0.6)',
      borderColor: 'rgba(255, 255, 255, 0.3)',
      cursor: 'not-allowed',
    },
    selectTriggerText: {
      color: Theme.colors.textTitle,
      fontWeight: '700',
      fontFamily: 'Outfit',
      fontSize: rs(18),
    },
    selectTriggerTextDisabled: {
      color: '#94A3B8',
    },
    selectTriggerArrow: {
      width: 0,
      height: 0,
      borderLeftWidth: 6,
      borderRightWidth: 6,
      borderTopWidth: 8,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderTopColor: '#475569',
      marginLeft: 10,
    },
    dropdownList: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: 'rgba(0, 0, 0, 0.1)',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
      marginTop: 4,
      overflow: 'hidden',
      zIndex: 10000,
    },
    dropdownItem: {
      paddingHorizontal: rs(20),
      paddingVertical: rs(12),
      borderBottomWidth: 1,
      borderBottomColor: '#F1F5F9',
      backgroundColor: '#FFFFFF',
      cursor: 'pointer',
    },
    dropdownItemActive: {
      backgroundColor: '#f1f5f9',
    },
    dropdownItemText: {
      color: '#1E293B',
      fontWeight: '600',
      fontFamily: 'Outfit',
      fontSize: rs(16),
    },
    dropdownItemTextActive: {
      color: '#1E293B',
      fontWeight: '800',
    },
    selectorGroup: {
      marginTop: 4,
      width: '100%',
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
      backgroundColor: Theme.colors.primary,
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
    radioRow: {
      flexDirection: 'row',
      gap: 20,
      marginTop: 4,
      marginBottom: 28,
      paddingLeft: 2,
    },
    radioItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      cursor: 'pointer',
      backgroundColor: 'rgba(0, 0, 0, 0.25)',
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderRadius: Theme.radius.input,
    },
    radioCircle: {
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 2.5,
      borderColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioCircleActive: {
      borderColor: '#F40009',
      backgroundColor: '#FFFFFF',
    },
    radioInnerCircle: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: '#F40009',
    },
    radioLabel: {
      color: '#FFFFFF',
      fontWeight: '800',
      fontFamily: 'JetBrains Mono',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      paddingLeft: 6,
      textShadowColor: 'rgba(0, 0, 0, 0.85)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 8,
      fontSize: rs(15),
    },
    btnWrap: {
      width: '100%',
      marginTop: rs(10),
      position: 'relative',
      zIndex: 1,
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
      borderColor: '#F40009',
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 2,
      transform: [{ rotate: '-3deg' }],
      boxShadow: '0 4px 12px rgba(244,0,9,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    highlightText: {
      color: '#F40009',
      fontWeight: '900',
      textAlign: 'center',
      textTransform: 'uppercase',
      fontFamily: 'Anton',
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
  });
}

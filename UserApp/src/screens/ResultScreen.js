// UserApp/src/screens/ResultScreen.js — CLASSIC PREMIUM RESULT SCREEN
import React, { useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Animated, Image, Easing, ScrollView, Platform, Linking, ImageBackground
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useResponsive } from '../hooks/useResponsive';
import { getGameAppURL } from '@shared/env';
import SharedStyles from '../components/SharedStyles';
import AmbientBubbles from '../components/AmbientBubbles';
import FireworksCanvas from '../components/FireworksCanvas';
import CocaButton from '../components/CocaButton';
import { Theme } from '../components/Theme';
import { audioHelper } from '../services/AudioHelper';

const BG_IMAGE = require('../../assets/bg_main.jpeg'); // Sửa đuôi ảnh sang .jpeg
const LOGO_IMAGE = require('../../assets/logo_coca.png');

// ── Confetti particle ────────────────────────────────────────────────────────
const COLORS = ['#F40009','#FFD700','#FFF','#FF6B6B','#FFA500','#2ECC71'];
function Particle({ delay, x, color, screenWidth }) {
  const y   = useRef(new Animated.Value(-20)).current;
  const op  = useRef(new Animated.Value(0)).current;
  const rot = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(y,   { toValue: 700, duration: 2500, useNativeDriver: true }),
        Animated.timing(op,  { toValue: 1,   duration: 200,  useNativeDriver: true }),
        Animated.timing(rot, { toValue: 1,   duration: 2500, useNativeDriver: true }),
      ]),
      Animated.timing(op, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);
  const rotate = rot.interpolate({ inputRange: [0,1], outputRange: ['0deg','720deg'] });
  return (
    <Animated.View style={{
      position: 'absolute', top: 0, left: x % screenWidth,
      width: 8, height: 8, borderRadius: 4,
      backgroundColor: color, opacity: op,
      transform: [{ translateY: y }, { rotate }],
    }} />
  );
}

export default function ResultScreen() {
  const navigation = useNavigation();
  const { user, wheel, resetAll } = useApp();
  const R = useResponsive();
  const { width, isTablet, contentWidth, rs } = R;

  const gift = wheel.selectedGift || { id: 'placeholder', name: 'Món quà may mắn', color: '#E8003D' };

  // Generate confetti
  const confetti = useRef(
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      delay: Math.random() * 1500,
      x: Math.random() * width,
      color: COLORS[i % COLORS.length],
    }))
  ).current;

  // Animations
  const trophyScale  = useRef(new Animated.Value(0)).current;
  const giftScale    = useRef(new Animated.Value(0)).current;
  const infoOpacity  = useRef(new Animated.Value(0)).current;
  const infoY        = useRef(new Animated.Value(30)).current;
  const btnOpacity   = useRef(new Animated.Value(0)).current;
  const floatAnim    = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      audioHelper.startWelcomeMusic();
      return () => {
        audioHelper.stopWelcomeMusic();
      };
    }, [])
  );

  useEffect(() => {
    Animated.sequence([
      Animated.spring(trophyScale, { toValue: 1, friction: 5, tension: 50, useNativeDriver: true }),
      Animated.spring(giftScale,   { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(infoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(infoY,       { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.timing(btnOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    // Floating animation loop for gift element
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -15, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleGoHome = () => {
    resetAll();
    navigation.reset({ index: 0, routes: [{ name: 'InputForm' }] });
  };

const GIFT_IMAGES = {
  tui_vai_thoi_trang: require('../../assets/img_gift/tui_vai_thoi_trang.png'),
  binh_giu_nhiet: require('../../assets/img_gift/binh_giu_nhiet.png'),
  tui_the_thao: require('../../assets/img_gift/tui_the_thao.png'),
  ly_giu_nhiet: require('../../assets/img_gift/ly_giu_nhiet.png'),
  tui_vai_phien_ban_gioi_han: require('../../assets/img_gift/tui_vai_phien_ban_gioi_han.png'),
  tshirt_red: require('../../assets/img_gift/t_shirt_do.png'),
  tshirt_grey: require('../../assets/img_gift/t_shirt_xam.png'),
};

  return (
    <View style={styles.root}>
      <SharedStyles />
      <ImageBackground source={BG_IMAGE} style={styles.container} imageStyle={styles.bgImage}>
        <View style={styles.bgOverlay} />
        <AmbientBubbles />
        <FireworksCanvas active={true} />

        <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={[styles.scrollContainer, { paddingTop: rs(isTablet ? 40 : 20), paddingBottom: rs(isTablet ? 30 : 20) }]} showsVerticalScrollIndicator={false}>

          {/* Confetti */}
          {confetti.map(p => (
            <Particle key={p.id} {...p} screenWidth={width} />
          ))}

          {/* Logo branding ở đỉnh */}
          <View style={styles.logoWrap} className="logo-glow animate-logo-float">
            <Image source={LOGO_IMAGE} resizeMode="contain" style={[styles.logo, { width: rs(isTablet ? 160 : 120), height: rs(isTablet ? 50 : 37) }]} />
          </View>

          {/* Card Kính mờ sáng nhạt chứa toàn bộ nội dung hân hoan */}
          <Animated.View 
            style={[
              styles.card, 
              { 
                opacity: trophyScale, 
                width: '100%', 
                maxWidth: isTablet ? 580 : 400, 
                alignSelf: 'center',
                transform: [{ translateY: floatAnim }],
                marginTop: rs(isTablet ? 20 : 12)
              }
            ]}
            className="form-glass"
          >
            
            {/* ── Spotlight & Pedestal Area (Pedestal 3D lơ lửng) ── */}
            <View style={styles.showcaseWrap}>
              {/* Floating Gift Box / Gift Emoji */}
              <Animated.View style={[
                styles.floatingGift, 
                { transform: [{ scale: giftScale }] }
              ]}>
                {gift.id && GIFT_IMAGES[gift.id] ? (
                  <Image
                    source={GIFT_IMAGES[gift.id]}
                    resizeMode="contain"
                    style={{
                      width: rs(isTablet ? 220 : 150),
                      height: rs(isTablet ? 220 : 150),
                      zIndex: 10,
                    }}
                  />
                ) : (
                  <Text style={[styles.giftEmoji, { fontSize: rs(isTablet ? 160 : 120) }]}>
                    🎁
                  </Text>
                )}
                {/* Hào quang lấp lánh sau món quà */}
                <View style={styles.giftGlow} />
              </Animated.View>
            </View>

            {/* ── Title Text Chữ Anton Nổi Bật và Hân Hoan ── */}
            <View style={styles.titleWrap}>
              <Text style={styles.celebrationBadge}>🎉 XIN CHÚC MỪNG 🎉</Text>
              
              <Text style={[styles.headingText, { fontSize: rs(isTablet ? 38 : 42) }]}>
                SÚT CỰC CHÁY,
              </Text>
              <Text style={[styles.headingText, { fontSize: rs(isTablet ? 38 : 42) }, { color: '#FFD700' }]}>
                QUÀ TRAO TAY!
              </Text>
              
              {/* Khung tên quà tối giản sạch sẽ nổi bật của Coca-Cola */}
              <View style={styles.giftNameBadge}>
                <Text style={[styles.giftNameText, { fontSize: rs(isTablet ? 32 : 24) }]}>
                  {gift.name.toUpperCase()}
                </Text>
              </View>

              <Text style={[styles.subText, { fontSize: rs(isTablet ? 15 : 12) }]}>
                BẠN ĐÃ ĐẠT BÀN THẮNG VÀNG & NHẬN PHẦN QUÀ MAY MẮN!
              </Text>
            </View>

            {/* ── Button Area (Đồng bộ CocaButton) ── */}
            <View style={styles.btnArea}>
              <CocaButton
                title="XÁC NHẬN NHẬN QUÀ"
                onPress={handleGoHome}
              />

              <CocaButton
                title="QUAY LẠI MÀN HÌNH CHÍNH"
                onPress={handleGoHome}
                style={styles.backBtn3D}
                textColor="#FFFFFF"
              />
            </View>

          </Animated.View>
        </ScrollView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    ...(Platform.OS === 'web' ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, height: '100%', width: '100%', overflow: 'hidden' } : {})
  },
  container: { flex: 1, width: '100%', height: '100%' },
  bgImage: { resizeMode: 'cover' },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundImage: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.0) 0%, rgba(241, 245, 249, 0.4) 100%)',
  },
  logoWrap: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 2,
    zIndex: 10,
  },
  logo: {
  },
  card: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 16,
    zIndex: 5,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  showcaseWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 200,
    width: '100%',
    marginBottom: 4,
  },
  floatingGift: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    marginBottom: 10,
  },
  giftEmoji: {
    textShadowColor: 'rgba(255,215,0,0.65)',
    textShadowOffset: { width: 0, height: 8 },
    textShadowRadius: 24,
  },
  giftGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    filter: 'blur(20px)',
    zIndex: -1,
  },
  titleWrap: {
    alignItems: 'center',
    marginVertical: 4,
    width: '100%',
  },
  celebrationBadge: {
    backgroundColor: '#FFD700',
    color: '#1e293b',
    fontWeight: '900',
    fontFamily: 'JetBrains Mono',
    fontSize: 13,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 20,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 1.5,
    boxShadow: '0 4px 10px rgba(255, 215, 0, 0.25)',
  },
  headingText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontFamily: 'Anton',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  giftNameBadge: {
    backgroundColor: '#F40009', // Đỏ classic Coca-Cola
    borderWidth: 2,
    borderColor: '#FFD700', // Viền vàng neon
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 20px rgba(71, 85, 105, 0.12)',
    width: '90%',
    alignSelf: 'center',
    className: 'winner-card-glow',
  },
  giftNameText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontFamily: 'Anton',
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontFamily: 'Hanken Grotesk',
    letterSpacing: 1.2,
    marginTop: 4,
    textAlign: 'center',
    opacity: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  btnArea: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  backBtn3D: {
    backgroundColor: '#334155',
    borderBottomColor: '#1e293b',
    marginTop: 8,
  },
  // 3D Spotlight Effect
  spotlightCone: {
    position: 'absolute',
    top: -20,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 280,
    height: 200,
    backgroundImage: 'radial-gradient(ellipse at top, rgba(255, 215, 0, 0.3) 0%, rgba(255, 215, 0, 0.0) 70%)',
    clipPath: 'polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)',
    pointerEvents: 'none',
    zIndex: 1,
  },
  // 3D Pedestal (Bục quà)
  pedestalRing: {
    width: 140,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 70,
    boxShadow: '0 8px 20px rgba(71, 85, 105, 0.15), 0 0 10px rgba(255, 215, 0, 0.2)',
    position: 'relative',
    zIndex: 2,
  },
});

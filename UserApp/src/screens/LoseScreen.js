// UserApp/src/screens/LoseScreen.js — RESPONSIVE
import React, { useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView, Platform, Linking, Image, ImageBackground
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useResponsive } from '../hooks/useResponsive';
import { getGameAppURL } from '@shared/env';
import SharedStyles from '../components/SharedStyles';
import AmbientBubbles from '../components/AmbientBubbles';
import CocaButton from '../components/CocaButton';
import { audioHelper } from '../services/AudioHelper';

const BG_IMAGE = require('../../assets/bg_main.jpeg');

export default function LoseScreen() {
  const navigation = useNavigation();
  const { user, game, resetAll } = useApp();
  const { isTablet, contentWidth, rs } = useResponsive();

  const shakeX  = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useFocusEffect(
    useCallback(() => {
      audioHelper.startWelcomeMusic();
      return () => {
        audioHelper.stopWelcomeMusic();
      };
    }, [])
  );

  useEffect(() => {
    Animated.parallel([
      Animated.sequence([
        Animated.timing(shakeX, { toValue: 12,  duration: 70, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -12, duration: 70, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 8,   duration: 70, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -8,  duration: 70, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 0,   duration: 70, useNativeDriver: true }),
      ]),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleGoHome = () => {
    resetAll();
    navigation.reset({ index: 0, routes: [{ name: 'InputForm' }] });
  };

  const shotDots = game.shotsDetail
    ? game.shotsDetail.split('').map(c => c === 'G')
    : Array.from({ length: 5 }, (_, i) => i < (game.totalGoals || 0));

  return (
    <View style={styles.root}>
      <SharedStyles />
      <ImageBackground source={BG_IMAGE} style={styles.container} imageStyle={styles.bgImage}>
        <View style={styles.bgOverlay} />
        <AmbientBubbles />

        <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

      <View style={[styles.content, { width: '100%', maxWidth: isTablet ? 600 : 420, alignSelf: 'center' }]}>

        {/* Icon */}
        <Animated.View style={{ transform: [{ translateX: shakeX }], alignItems: 'center' }}>
          <View style={styles.iconRing}>
            <Text style={[styles.icon, { fontSize: rs(isTablet ? 72 : 58) }]}>😔</Text>
          </View>
        </Animated.View>

        {/* Text */}
        <Animated.View style={[styles.textBlock, {
          opacity: fadeAnim, transform: [{ translateY: slideAnim }],
        }]}>
          <Text style={[styles.title, { fontSize: rs(isTablet ? 48 : 38) }]}>CHƯA ĐỦ!</Text>
          <Text style={[styles.subtitle, { fontSize: rs(isTablet ? 17 : 15) }]}>
            Bạn cần sút vào ít nhất{' '}
            <Text style={styles.accent}>3/5</Text> quả để nhận quà.
          </Text>
        </Animated.View>

        {/* Score recap */}
        <Animated.View style={[styles.scoreBox, {
          opacity: fadeAnim, transform: [{ translateY: slideAnim }],
        }]}>
          <View style={styles.dotsRow}>
            {shotDots.map((isGoal, i) => (
              <View key={i} style={[styles.dot, isGoal ? styles.dotGoal : styles.dotMiss]}>
                <Text style={styles.dotIcon}>{isGoal ? '⚽' : '✕'}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.scoreText, { fontSize: rs(isTablet ? 20 : 17) }]}>
            {game.totalGoals || 0}/5 bàn thắng
          </Text>
          <Text style={[styles.needMore, { fontSize: rs(13) }]}>
            Cần thêm {Math.max(0, 3 - (game.totalGoals || 0))} bàn nữa để thắng
          </Text>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={[styles.encourage, { fontSize: rs(14) }]}>
            Đừng nản lòng! Hãy thử lại lần sau 💪
          </Text>
        </Animated.View>

        {/* Button */}
        <Animated.View style={{ opacity: fadeAnim, width: '100%', alignItems: 'center' }}>
          <CocaButton
            title="QUAY LẠI MÀN HÌNH CHÍNH"
            onPress={handleGoHome}
            style={styles.backBtn3D}
            textColor="#FFFFFF"
          />
        </Animated.View>

      </View>
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
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  bgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 255, 255, 0.25)' },
  content: { gap: 20, alignItems: 'center' },
  iconRing: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 2, borderColor: 'rgba(244, 0, 9, 0.25)',
    alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 8px 20px rgba(71, 85, 105, 0.08)',
  },
  icon: {},
  textBlock: { alignItems: 'center', gap: 10 },
  title: {
    color: '#1e293b', // Chữ Slate 800
    fontWeight: '900',
    letterSpacing: 3,
    fontFamily: 'Anton',
    textShadowColor: 'rgba(255, 255, 255, 0.85)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subtitle: { color: 'rgba(71, 85, 105, 0.85)', textAlign: 'center', lineHeight: 24, fontWeight: '600' },
  accent: { color: '#F40009', fontWeight: '900' },
  scoreBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 28, 
    paddingVertical: 24, 
    paddingHorizontal: 32, 
    width: '95%',
    maxWidth: 440, // Expanded width
    alignItems: 'center', 
    gap: 16,
    borderWidth: 2, 
    borderColor: 'rgba(244, 0, 9, 0.25)',
    boxShadow: '0 15px 35px rgba(71, 85, 105, 0.15)',
  },
  dotsRow: { flexDirection: 'row', gap: 16 }, // Expanded gap
  dot: {
    width: 64, height: 64, borderRadius: 32, // Enlarge ball indicators
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(71, 85, 105, 0.08)',
  },
  dotGoal: { backgroundColor: 'rgba(46,204,113,0.3)', borderColor: '#2eac71', borderWidth: 1.5 },
  dotMiss: { backgroundColor: 'rgba(231,76,60,0.3)', borderColor: '#e74c3c', borderWidth: 1.5 },
  dotIcon: { fontSize: 24, color: '#1e293b', fontWeight: '900' }, // Larger icon
  scoreText: { color: '#1e293b', fontWeight: '900', fontSize: 20 }, // Larger score text
  needMore: { color: 'rgba(71, 85, 105, 0.65)', fontWeight: '600', fontSize: 15 },
  encourage: { color: 'rgba(71, 85, 105, 0.7)', textAlign: 'center', fontWeight: '600', fontSize: 15 },
  backBtn3D: {
    backgroundColor: '#334155',
    borderBottomColor: '#1e293b',
    marginTop: 8,
  },
});

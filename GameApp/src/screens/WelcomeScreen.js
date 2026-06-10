// GameApp/src/screens/WelcomeScreen.js
import React, { useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Animated, Image, ScrollView, Platform, ImageBackground
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useResponsive } from '../hooks/useResponsive';
import SharedStyles from '../components/SharedStyles';
import AmbientBubbles from '../components/AmbientBubbles';
import CocaButton from '../components/CocaButton';
import { audioEngine } from '../services/AudioEngine';

const BG_IMAGE = require('../../assets/bg_main.jpeg');
const LOGO_IMAGE = require('../../assets/logo_coca.png');

export default function WelcomeScreen() {
  const navigation = useNavigation();
  const R = useResponsive();
  const { isTablet, rs } = R;

  // Animations
  const logoScale    = useRef(new Animated.Value(0.6)).current;
  const logoOpacity  = useRef(new Animated.Value(0)).current;
  const titleY       = useRef(new Animated.Value(50)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const btnOpacity   = useRef(new Animated.Value(0)).current;
  const btnScale     = useRef(new Animated.Value(0.85)).current;
  const pulse        = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    useCallback(() => {
      audioEngine.startWelcomeMusic();
      return () => {
        audioEngine.stopWelcomeMusic();
      };
    }, [])
  );

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale,    { toValue: 1, friction: 5, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(logoOpacity,  { toValue: 1, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
      ]),
      Animated.parallel([
        Animated.timing(titleY,       { toValue: 0, duration: 500, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: Platform.OS !== 'web' }),
      ]),
      Animated.parallel([
        Animated.spring(btnScale,  { toValue: 1, friction: 4, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(btnOpacity,{ toValue: 1, duration: 400, useNativeDriver: Platform.OS !== 'web' }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.04, duration: 1000, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(pulse, { toValue: 1.00, duration: 1000, useNativeDriver: Platform.OS !== 'web' }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.root}>
      <SharedStyles />
      <ImageBackground source={BG_IMAGE} style={styles.container} resizeMode="cover">
        <View style={styles.bgOverlay} />
        <AmbientBubbles />

        <ScrollView
          style={{ flex: 1, width: '100%' }}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
        {/* Brand Logo at the top */}
        <Animated.View 
          style={[
            styles.logoWrap, 
            { opacity: logoOpacity, transform: [{ scale: logoScale }] }
          ]}
          className="logo-glow animate-logo-float"
        >
          <Image 
            source={LOGO_IMAGE} 
            resizeMode="contain"
            style={[
              styles.logo, 
              { 
                width: rs(isTablet ? 240 : 170), 
                height: rs(isTablet ? 75 : 52) 
              }
            ]} 
          />
        </Animated.View>

        {/* Content Area */}
        <View style={[styles.content, { maxWidth: isTablet ? 700 : 450, alignSelf: 'center', marginTop: rs(isTablet ? 40 : 20) }]}>
          
          {/* Headline titles matching image 1 */}
          <Animated.View 
            style={[
              styles.titleWrap, 
              { opacity: titleOpacity, transform: [{ translateY: titleY }] }
            ]}
          >
            <Text 
              style={[styles.headingWhite, { fontSize: rs(isTablet ? 38 : 24) }]} 
              numberOfLines={1} 
              adjustsFontSizeToFit
            >
              PENALTY SHOOTOUT
            </Text>
            <Text 
              style={[styles.headingPrimary, { fontSize: rs(isTablet ? 64 : 42), marginTop: rs(-5) }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              FOOTBALL 2026
            </Text>

            {/* Subtitle Glass Pill matching Form Screen card */}
            <View style={styles.subtitleBadge}>
              <Text style={[styles.subtitleText, { fontSize: rs(isTablet ? 15 : 12.5) }]}>
                Sút bóng cực cháy - Rinh quà cực chất cùng Coca-Cola
              </Text>
            </View>
          </Animated.View>

          {/* CTA Button */}
          <Animated.View 
            style={[
              styles.btnArea, 
              { 
                opacity: btnOpacity, 
                transform: [{ scale: Animated.multiply(btnScale, pulse) }],
                marginTop: rs(isTablet ? 140 : 90)
              }
            ]}
          >
            <CocaButton
              title="BẮT ĐẦU NGAY"
              onPress={() => navigation.navigate('Gameplay')}
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
    ...(Platform.OS === 'web' ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, height: '100%', width: '100%', overflow: 'hidden', touchAction: 'none' } : {})
  },
  container: { flex: 1, width: '100%', height: '100%' },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    gap: 25,
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.25)', // Phủ mờ sáng nhẹ sân vận động
  },
  logoWrap: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 5,
    zIndex: 10,
  },
  logo: {
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 15,
    zIndex: 5,
  },
  titleWrap: {
    alignItems: 'center',
    width: '100%',
  },
  headingWhite: {
    color: '#FFFFFF', // Chuyển sang màu trắng nổi bật
    fontWeight: '900',
    fontFamily: 'Anton',
    fontStyle: 'normal', // Thẳng đứng, không nghiêng
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.6)', // Bóng tối đậm để làm nổi bật trên nền stadium
    textShadowOffset: { width: 2, height: 3 },
    textShadowRadius: 6,
  },
  headingPrimary: {
    color: '#F40009', // Đỏ classic Coca-Cola
    fontWeight: '900',
    fontFamily: 'Anton',
    fontStyle: 'italic', // Nghiêng đồng bộ
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.45)', // Bóng tối đậm tương phản
    textShadowOffset: { width: 2, height: 3 },
    textShadowRadius: 6,
  },
  subtitleBadge: {
    backgroundColor: 'rgba(20, 35, 25, 0.72)', // Nền tối trong suốt như form screen
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 15,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.25)',
  },
  subtitleText: {
    color: '#FFFFFF', // Chữ trắng
    fontWeight: '800',
    fontStyle: 'italic', // Chữ nghiêng đặc trưng
    fontFamily: 'Hanken Grotesk',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  btnArea: {
    width: '90%',
    alignItems: 'center',
    marginTop: 10,
  },
});

// GameApp/src/screens/GameplayScreen.js
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, Linking, Modal, Share, Platform, Image, ScrollView, ImageBackground
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getUserAppURL } from '@shared/env';
import SharedStyles from '../components/SharedStyles';
import AmbientBubbles from '../components/AmbientBubbles';
import CocaButton from '../components/CocaButton';
import { useResponsive } from '../hooks/useResponsive';
import { audioEngine } from '../services/AudioEngine';
import Svg, { Line } from 'react-native-svg';

// Reanimated
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withSequence,
  withDelay,
  withSpring,
  withRepeat
} from 'react-native-reanimated';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const MAX_SHOTS = 3;
const WIN_THRESHOLD = 2;

const BG_MAIN = require('../../assets/bg_main.jpeg');
const LOGO_IMAGE = require('../../assets/logo_coca.png');
const GOAL_IMAGE = require('../../assets/goal_3d.png');
const BALL_IMAGE = require('../../assets/ball_3d.png');

function buildUserAppURL(goals, shots) {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  const baseUrl = getUserAppURL(platform);
  const detailStr = shots.map(s => s ? 'G' : 'M').join('_');
  return `${baseUrl}?goals=${goals}&detail=${detailStr}`;
}

const getTouchCoords = (e) => {
  const native = e.nativeEvent;
  if (native.changedTouches && native.changedTouches.length > 0) {
    return { pageX: native.changedTouches[0].pageX, pageY: native.changedTouches[0].pageY };
  }
  if (native.touches && native.touches.length > 0) {
    return { pageX: native.touches[0].pageX, pageY: native.touches[0].pageY };
  }
  return { pageX: native.pageX ?? 0, pageY: native.pageY ?? 0 };
};

const getPowerColor = (percent) => {
  if (percent < 35) return '#22c55e'; // Green
  if (percent < 75) return '#eab308'; // Yellow
  return '#ef4444'; // Red
};

const renderMiniBallIndicator = (state, size = 32) => {
  // state: 'goal' | 'miss' | 'unshot'
  let opacity = 1.0;
  if (state === 'miss') opacity = 0.25;
  if (state === 'unshot') opacity = 0.15;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
      <Image
        source={BALL_IMAGE}
        style={{ width: size, height: size, opacity }}
        resizeMode="contain"
      />
      {state === 'goal' && (
        <View style={{
          position: 'absolute',
          bottom: -2,
          right: -2,
          backgroundColor: '#22c55e',
          borderRadius: 8,
          width: size * 0.45,
          height: size * 0.45,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: '#FFFFFF',
        }}>
          <Text style={{ color: '#FFFFFF', fontSize: size * 0.25, fontWeight: '900', lineHeight: size * 0.35 }}>✓</Text>
        </View>
      )}
      {state === 'miss' && (
        <View style={{
          position: 'absolute',
          bottom: -2,
          right: -2,
          backgroundColor: '#ef4444',
          borderRadius: 8,
          width: size * 0.45,
          height: size * 0.45,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: '#FFFFFF',
        }}>
          <Text style={{ color: '#FFFFFF', fontSize: size * 0.25, fontWeight: '900', lineHeight: size * 0.35 }}>✕</Text>
        </View>
      )}
    </View>
  );
};

function FireworkParticle({ index }) {
  const angle = (index * 15 * Math.PI) / 180;
  const distance = Math.random() * 160 + 100;
  const tx = Math.cos(angle) * distance;
  const ty = Math.sin(angle) * distance - Math.random() * 60;

  const animX = useSharedValue(0);
  const animY = useSharedValue(0);
  const animOpacity = useSharedValue(1);
  const animScale = useSharedValue(1);

  useEffect(() => {
    animX.value = withTiming(tx, { duration: 950, easing: Easing.out(Easing.quad) });
    animY.value = withTiming(ty, { duration: 950, easing: Easing.out(Easing.quad) });
    animOpacity.value = withTiming(0, { duration: 950 });
    animScale.value = withTiming(0.15, { duration: 950 });
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: animX.value },
      { translateY: animY.value },
      { scale: animScale.value }
    ],
    opacity: animOpacity.value,
  }));

  const colors = ['#FFD700', '#FF4500', '#FF1493', '#00FF00', '#00FFFF', '#FF00FF', '#FFFFFF'];
  const color = colors[index % colors.length];

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: '50%',
          top: '40%',
          width: 12,
          height: 12,
          borderRadius: 6,
          marginLeft: -6,
          marginTop: -6,
          zIndex: 100,
        },
        style,
        { backgroundColor: color }
      ]}
    />
  );
}

function GoalFireworks({ active }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (active) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 1100);
      return () => clearTimeout(timer);
    }
  }, [active]);

  if (!show) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: 24 }).map((_, i) => (
        <FireworkParticle key={i} index={i} />
      ))}
    </View>
  );
}

export default function GameplayScreen() {
  const navigation = useNavigation();
  const R = useResponsive();
  const { isTablet, rs } = R;

  // Game state
  const [shots, setShots] = useState([]);
  const [lastShotResult, setLastShotResult] = useState({ isGoal: false, msg: '' });
  const [isComplete, setIsComplete] = useState(false);
  const [isWinner, setIsWinner] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [fallbackModal, setFallbackModal] = useState(false);
  const [fallbackURL, setFallbackURL] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  // Interaction State
  const [isDragging, setIsDragging] = useState(false);
  const [isFlying, setIsFlying] = useState(false);
  const [goalLayout, setGoalLayout] = useState({ x: 0, y: 0, width: 300, height: 120 });
  const [containerSize, setContainerSize] = useState({ width: screenWidth, height: screenHeight });

  // Touch Coordinates
  const touchStart = useRef({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ dx: 0, dy: 0 });

  // Goal & Miss Flash Effects
  const [showGoalFlash, setShowGoalFlash] = useState(false);
  const [showMissFlash, setShowMissFlash] = useState(false);
  const goalFlashOpacity = useSharedValue(0);
  const missFlashOpacity = useSharedValue(0);
  const missFlashScale = useSharedValue(0.5);

  const goalFlashAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: goalFlashOpacity.value,
    };
  });

  const missFlashAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: missFlashOpacity.value,
      transform: [{ scale: missFlashScale.value }],
    };
  });

  // Result screen rotation
  const endScreenBallRotation = useSharedValue(0);

  // Layout calculations
  const goalWidth = isTablet ? 1750 : Math.min(screenWidth * 0.96, 480);
  const goalHeight = goalWidth * 0.5;

  const onContainerLayout = useCallback((e) => {
    const { width, height } = e.nativeEvent.layout;
    setContainerSize({ width, height });
  }, []);

  const ballSize = rs(isTablet ? 130 : 88);
  const startX = containerSize.width / 2 - ballSize / 2;
  const startY = containerSize.height - rs(isTablet ? 195 : 160);

  // Reanimated ball values
  const ballX = useSharedValue(0);
  const ballY = useSharedValue(0);
  const ballScale = useSharedValue(1.0);
  const ballRotation = useSharedValue(0);
  const ballOpacity = useSharedValue(1.0);

  const ballAnimatedStyle = useAnimatedStyle(() => {
    return {
      left: ballX.value,
      top: ballY.value,
      opacity: ballOpacity.value,
      transform: [
        { scale: ballScale.value },
        { rotate: `${ballRotation.value}deg` }
      ]
    };
  });

  // Reset ball position
  const resetBall = useCallback(() => {
    ballX.value = startX;
    ballY.value = startY;
    ballScale.value = 1.0;
    ballRotation.value = 0;
    ballOpacity.value = 1.0;
  }, [startX, startY]);

  useEffect(() => {
    resetBall();
  }, [startX, startY]);

  // Start background music and loop animations
  useEffect(() => {
    audioEngine.init();
    if (!isMuted) {
      audioEngine.startMusic();
    }

    endScreenBallRotation.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );

    return () => {
      audioEngine.stopMusic();
    };
  }, [isMuted]);

  const onGoalLayout = useCallback((e) => {
    const { x, y, width, height } = e.nativeEvent.layout;
    setGoalLayout({ x, y, width, height });
  }, []);

  // Toggle Mute
  const handleToggleMute = () => {
    setIsMuted(prev => {
      const next = !prev;
      if (next) {
        audioEngine.stopMusic();
      } else {
        audioEngine.startMusic();
      }
      return next;
    });
  };

  // Drag & Shoot Math mapping
  const MAX_DRAG = 120;
  const dx = isNaN(dragOffset.dx) ? 0 : dragOffset.dx;
  const dy = isNaN(dragOffset.dy) ? 0 : dragOffset.dy;
  const distance = Math.sqrt(dx * dx + dy * dy) || 0;

  // Constrain drag values for aiming logic to keep target within bounds
  const constrainedDx = Math.max(-MAX_DRAG * 1.15, Math.min(MAX_DRAG * 1.15, dx));
  const constrainedDy = Math.max(0, Math.min(MAX_DRAG * 1.15, dy));

  // Aiming math: pulling down-left shoots right, pulling down-right shoots left
  const targetX = distance > 10 ? 0.5 - (constrainedDx / MAX_DRAG) * 0.55 : 0.5;
  const targetY = distance > 10 ? 0.95 - (constrainedDy / MAX_DRAG) * 0.92 : 0.52;

  const handleTouchStart = (e) => {
    if (shots.length >= MAX_SHOTS || isComplete || isFlying) return;
    audioEngine.init();
    const coords = getTouchCoords(e);
    touchStart.current = { x: coords.pageX, y: coords.pageY };
    setIsDragging(true);
    setDragOffset({ dx: 0, dy: 0 });
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const coords = getTouchCoords(e);
    const currentDx = coords.pageX - touchStart.current.x;
    const currentDy = coords.pageY - touchStart.current.y;

    // Constraint: only allow dragging backwards (downwards) mostly
    setDragOffset({
      dx: currentDx,
      dy: Math.max(-20, currentDy) // Don't let them push ball forward too much
    });

    // Also update ball position dynamically during dragging to stretch the ball
    ballX.value = startX + currentDx * 0.4;
    ballY.value = startY + currentDy * 0.4;
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // If drag was very small, reset ball position and cancel shot
    if (distance < 20) {
      resetBall();
      setDragOffset({ dx: 0, dy: 0 });
      return;
    }

    executeShot();
  };

  const advanceToNextShot = useCallback((isGoal) => {
    // Fade ball out
    ballOpacity.value = withTiming(0, { duration: 150 });

    setTimeout(() => {
      const newShots = [...shots, isGoal];

      setShots(newShots);

      resetBall();
      setDragOffset({ dx: 0, dy: 0 });
      setIsFlying(false);

      if (newShots.length >= MAX_SHOTS) {
        const finalGoals = newShots.filter(Boolean).length;
        setIsComplete(true);
        setIsWinner(finalGoals >= WIN_THRESHOLD);
      }
    }, 200);
  }, [shots, resetBall]);

  const executeShot = () => {
    setIsFlying(true);

    // Check post and goal bounds (aligned with physical goal frame in image)
    // Ball radius as percentage of goal dimensions
    const ballRadiusPctX = 0.06; // Horizontal radius relative to goal width
    const ballRadiusPctY = 0.10; // Vertical radius relative to goal height
    
    // Post positions (outer edges of the goal frame)
    const leftPostInner = 0.24;  // Inner edge of left post
    const rightPostInner = 0.76; // Inner edge of right post  
    const crossbarBottom = 0.22; // Bottom edge of crossbar

    // Ball is considered hitting post if its CENTER is near the post line
    const hitsLeftPost = (targetX <= leftPostInner + ballRadiusPctX) && (targetY >= crossbarBottom - ballRadiusPctY);
    const hitsRightPost = (targetX >= rightPostInner - ballRadiusPctX) && (targetY >= crossbarBottom - ballRadiusPctY);
    const hitsCrossbar = (targetY <= crossbarBottom + ballRadiusPctY) && (targetX >= leftPostInner - ballRadiusPctX) && (targetX <= rightPostInner + ballRadiusPctX);

    const isPost = hitsLeftPost || hitsRightPost || hitsCrossbar;

    // Clean goal: ball center must be strictly inside the goal opening
    const isGoal = !isPost 
      && (targetX > leftPostInner + ballRadiusPctX) 
      && (targetX < rightPostInner - ballRadiusPctX) 
      && (targetY > crossbarBottom + ballRadiusPctY) 
      && (targetY < 0.95);

    // Play kick sound
    audioEngine.playKick();

    // Destination coordinates on the screen relative to goal layout
    const destX = goalLayout.x + targetX * goalLayout.width - ballSize / 2;
    const destY = goalLayout.y + targetY * goalLayout.height - ballSize / 2;

    // Ball flight animation - shrink smoothly from 1.0 → 0.55 during flight for perspective depth
    ballX.value = withTiming(destX, { duration: 600, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
    ballY.value = withTiming(destY, { duration: 600, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
    ballScale.value = withTiming(0.55, { duration: 600, easing: Easing.bezier(0.4, 0.0, 0.2, 1) });
    ballRotation.value = withTiming(1080, { duration: 600 });

    setTimeout(() => {
      if (isGoal) {
        audioEngine.playGoal();

        // Ball drops to the ground after hitting the net
        const groundY = goalLayout.y + goalLayout.height + rs(10);
        ballY.value = withSequence(
          withSpring(destY + rs(12), { damping: 9, stiffness: 70 }), // hit net bounce
          withDelay(200, withSpring(groundY, { damping: 14, stiffness: 60 })) // gravity drop to grass
        );
        ballScale.value = withTiming(0.65, { duration: 250 });

        // Show "VÀO!!!" flash overlay
        setShowGoalFlash(true);
        goalFlashOpacity.value = withSequence(
          withTiming(1, { duration: 120 }),
          withDelay(1000, withTiming(0, { duration: 300 }))
        );
        setTimeout(() => {
          setShowGoalFlash(false);
          advanceToNextShot(true);
        }, 1500);

      } else if (isPost) {
        audioEngine.playPost();

        // Bounce off post then drop to ground
        const bounceX = destX + (targetX > 0.5 ? -rs(60) : rs(60));
        const groundY = containerSize.height - rs(160);
        ballX.value = withSpring(bounceX, { damping: 8, stiffness: 50 });
        ballY.value = withSequence(
          withSpring(destY - rs(20), { damping: 8, stiffness: 50 }),
          withDelay(150, withSpring(groundY, { damping: 14, stiffness: 55 }))
        );
        ballScale.value = withSpring(0.6, { damping: 8 });

        // Show "TRƯỢT" flash
        setShowMissFlash(true);
        missFlashOpacity.value = withSequence(
          withTiming(1, { duration: 120 }),
          withDelay(800, withTiming(0, { duration: 300 }))
        );
        missFlashScale.value = withSequence(
          withSpring(1, { damping: 10, stiffness: 80 }),
          withDelay(800, withTiming(0.5, { duration: 300 }))
        );
        setTimeout(() => {
          setShowMissFlash(false);
          advanceToNextShot(false);
        }, 1400);

      } else {
        audioEngine.playWhistle();

        // Fly wide then drop to ground
        const flyX = destX + (targetX > 0.5 ? rs(120) : -rs(120));
        const flyY = destY - rs(60);
        const groundY = containerSize.height - rs(160);
        ballX.value = withTiming(flyX, { duration: 350 });
        ballY.value = withSequence(
          withTiming(flyY, { duration: 350 }),
          withDelay(50, withSpring(groundY, { damping: 14, stiffness: 55 }))
        );
        ballScale.value = withSequence(
          withTiming(0.55, { duration: 350 }),
          withDelay(50, withSpring(0.6, { damping: 10 }))
        );
        ballOpacity.value = withSequence(
          withTiming(1, { duration: 350 }),
          withDelay(600, withTiming(0, { duration: 250 }))
        );

        // Show "TRƯỢT" flash
        setShowMissFlash(true);
        missFlashOpacity.value = withSequence(
          withTiming(1, { duration: 120 }),
          withDelay(800, withTiming(0, { duration: 300 }))
        );
        missFlashScale.value = withSequence(
          withSpring(1, { damping: 10, stiffness: 80 }),
          withDelay(800, withTiming(0.5, { duration: 300 }))
        );
        setTimeout(() => {
          setShowMissFlash(false);
          advanceToNextShot(false);
        }, 1400);
      }

      setLastShotResult({ isGoal, msg: isGoal ? 'VÀO!!!' : 'TRƯỢT' });

    }, 600);
  };

  const handleRetry = useCallback(() => {
    setShots([]);
    setIsComplete(false);
    setIsWinner(false);
    resetBall();
    setDragOffset({ dx: 0, dy: 0 });
  }, [resetBall]);

  const handleGoHome = useCallback(() => {
    setShots([]);
    setIsComplete(false);
    setIsWinner(false);
    resetBall();
    setDragOffset({ dx: 0, dy: 0 });
    navigation.navigate('Welcome');
  }, [navigation, resetBall]);

  const launchUserApp = useCallback(async (totalGoals, allShots) => {
    setIsLaunching(true);
    const url = buildUserAppURL(totalGoals, allShots);

    if (Platform.OS === 'web') {
      window.location.href = url;
      setIsLaunching(false);
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        setFallbackURL(url);
        setFallbackModal(true);
      }
    } catch {
      setFallbackURL(url);
      setFallbackModal(true);
    } finally {
      setIsLaunching(false);
    }
  }, []);

  const goalsCount = shots.filter(Boolean).length;
  const missesCount = shots.length - goalsCount;

  // End game result screen
  const renderEndScreen = (titleText, subtitleText, button1Title, button1Action, button2Title, button2Action) => {
    return (
      <View style={styles.missedRoot}>
        <SharedStyles />
        <ImageBackground source={BG_MAIN} style={styles.bgContainer} resizeMode="cover">
          <View style={styles.bgOverlay} />
          <AmbientBubbles />

          <ScrollView
            style={{ flex: 1, width: '100%' }}
            contentContainerStyle={styles.missedScrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Logo */}
            <View style={styles.logoWrap}>
              <Image source={LOGO_IMAGE} style={[styles.logo, { width: rs(isTablet ? 240 : 170), height: rs(isTablet ? 75 : 52) }]} resizeMode="contain" />
            </View>

            {/* Showcase */}
            <View style={[styles.missedContent, { width: '100%', maxWidth: isTablet ? 600 : 420, alignSelf: 'center' }]}>
              <View style={styles.showcaseWrap}>
                <View style={styles.floatingBall} className="animate-logo-float">
                  <Image source={BALL_IMAGE} style={{ width: rs(isTablet ? 220 : 160), height: rs(isTablet ? 220 : 160) }} resizeMode="contain" />
                </View>
              </View>

              <View style={styles.missedTitleWrap}>
                <Text style={[styles.missedTitle, { fontSize: rs(isTablet ? 46 : 32) }]}>{titleText}</Text>
              </View>

              <View style={styles.missedSubtitleBadge}>
                <Text style={[styles.missedSubtitleText, { fontSize: rs(isTablet ? 24 : 18) }]}>{subtitleText}</Text>
              </View>

              {/* Score Recap */}
              <View style={styles.scoreBox}>
                <View style={styles.dotsRowEnd}>
                  {Array.from({ length: MAX_SHOTS }).map((_, i) => {
                    let state = 'unshot';
                    if (shots[i] === true) state = 'goal';
                    if (shots[i] === false) state = 'miss';
                    return (
                      <View key={i}>
                        {renderMiniBallIndicator(state, 72)}
                      </View>
                    );
                  })}
                </View>
                <Text style={styles.scoreTextEnd}>
                  {goalsCount}/{MAX_SHOTS} BÀN THẮNG THÀNH CÔNG
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={[styles.missedBtnArea, { width: '100%', maxWidth: isTablet ? 450 : 320 }]}>
              <CocaButton title={button1Title} onPress={button1Action} />
              <CocaButton title={button2Title} onPress={button2Action} style={styles.backBtnGhost} textColor="#FFFFFF" />
            </View>
          </ScrollView>
        </ImageBackground>
      </View>
    );
  };

  if (isComplete) {
    if (isWinner) {
      return renderEndScreen(
        "SÚT CỰC CHÁY,",
        "QUÀ TRAO TAY!",
        "TIẾP TỤC NHẬN QUÀ",
        () => launchUserApp(goalsCount, shots),
        "QUAY VỀ MÀN HÌNH CHÀO",
        handleGoHome
      );
    } else {
      return renderEndScreen(
        "CHƯA ĐỦ BÀN THẮNG!",
        "HÃY SÚT LẠI ĐỂ ĐẠT ĐỦ 3 BÀN THẮNG NHÉ!",
        "SÚT LẠI NGAY",
        handleRetry,
        "QUAY LẠI MÀN HÌNH CHÍNH",
        handleGoHome
      );
    }
  }

  return (
    <View style={styles.container} onLayout={onContainerLayout}>
      <ImageBackground source={BG_MAIN} style={styles.bgContainer} resizeMode="cover">
        <View style={styles.bgOverlay} />

        {/* Ambient Bubbles */}
        <View
          style={[StyleSheet.absoluteFill, Platform.OS === 'web' && { pointerEvents: 'none' }]}
          pointerEvents={Platform.OS === 'web' ? undefined : 'none'}
        >
          <AmbientBubbles />
        </View>

        {/* LOGO COCA-COLA */}
        <View style={styles.topLogoWrap}>
          <Image source={LOGO_IMAGE} style={[styles.logo, { width: rs(isTablet ? 260 : 150), height: rs(isTablet ? 80 : 46) }]} resizeMode="contain" />
        </View>

        {/* SCOREBOARD */}
        <View style={[styles.scoreboardRow, { marginTop: rs(isTablet ? -35 : 6) }]}>
          <View style={styles.scoreboardLeft}>
            <View style={styles.progressSection}>
              <Text style={[styles.progressLabel, { fontSize: isTablet ? 20 : 13 }]}>LƯỢT SÚT</Text>
              <View style={styles.dotsRow}>
                {Array.from({ length: MAX_SHOTS }).map((_, i) => {
                  let state = 'unshot';
                  if (shots[i] === true) state = 'goal';
                  if (shots[i] === false) state = 'miss';
                  return (
                    <View key={i}>
                      {renderMiniBallIndicator(state, isTablet ? 60 : 36)}
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={styles.scoreboardCenter}>
            <View style={[styles.centerScoreBanner, { paddingVertical: isTablet ? 14 : 8, paddingHorizontal: isTablet ? 48 : 18 }]}>
              <View style={styles.scoreCol}>
                <Text style={[styles.scoreColLabel, { fontSize: isTablet ? 18 : 11 }]}>KẾT QUẢ SÚT</Text>
                <Text style={[styles.scoreColNum, { fontSize: isTablet ? 58 : 32 }]}>{goalsCount}/{MAX_SHOTS}</Text>
              </View>
            </View>
          </View>

          <View style={styles.scoreboardRight}>
            <TouchableOpacity activeOpacity={0.8} onPress={handleToggleMute} style={[styles.audioBtn, { width: isTablet ? 48 : 34, height: isTablet ? 48 : 34, borderRadius: isTablet ? 24 : 17 }]}>
              <Text style={[styles.audioBtnIcon, { fontSize: isTablet ? 20 : 15 }]}>{isMuted ? '🔇' : '🔊'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Real-time Shooting Power Bar */}
        {isDragging && (
          <View style={[styles.powerBarContainer, { top: rs(isTablet ? 95 : 62), maxWidth: isTablet ? 320 : 220 }]}>
            <Text style={[styles.powerBarLabel, { fontSize: isTablet ? 16 : 12 }]}>
              LỰC SÚT: {Math.round(Math.min(100, (distance / MAX_DRAG) * 100))}%
            </Text>
            <View style={[styles.powerBarOuter, { height: isTablet ? 18 : 12 }]}>
              <View
                style={[
                  styles.powerBarInner,
                  {
                    width: `${Math.min(100, (distance / MAX_DRAG) * 100)}%`,
                    backgroundColor: getPowerColor((distance / MAX_DRAG) * 100)
                  }
                ]}
              />
            </View>
          </View>
        )}

        {/* GOAL 3D AREA */}
        <View
          style={[styles.goalFrame, { width: goalWidth, height: goalHeight, marginTop: -rs(isTablet ? 90 : 45) }]}
          onLayout={onGoalLayout}
        >
          {/* Goal 3D image with mesh net */}
          <Image
            source={GOAL_IMAGE}
            style={[styles.goalImage, { width: goalWidth, height: goalHeight }]}
            resizeMode="contain"
          />

          {/* Target Indicator when aiming */}
          {isDragging && (
            <View style={[
              styles.aimTargetIndicator,
              {
                left: targetX * goalLayout.width - 35,
                top: targetY * goalLayout.height - 35
              }
            ]}>
              <View style={styles.aimTargetInnerCircle} />
              <View style={styles.aimTargetOuterRing} />
            </View>
          )}
        </View>

        {/* Trajectory Guide line on the pitch */}
        <View
          style={[StyleSheet.absoluteFill, Platform.OS === 'web' && { pointerEvents: 'none' }]}
          pointerEvents={Platform.OS === 'web' ? undefined : 'none'}
        >
          <Svg
            style={[StyleSheet.absoluteFill, Platform.OS === 'web' && { pointerEvents: 'none' }]}
            pointerEvents={Platform.OS === 'web' ? undefined : 'none'}
          >
            {isDragging && (
              <Line
                x1={startX + ballSize / 2 + dx * 0.4}
                y1={startY + ballSize / 2 + dy * 0.4}
                x2={goalLayout.x + targetX * goalLayout.width}
                y2={goalLayout.y + targetY * goalLayout.height}
                stroke="#FFD700"
                strokeWidth={4}
                strokeDasharray="8,6"
                opacity={0.85}
              />
            )}
          </Svg>
        </View>

        {/* BALL Touch Area / Penalty Spot */}
        <View
          style={[
            styles.touchZone,
            {
              left: startX - 20,
              top: startY - 20,
              width: ballSize + 40,
              height: ballSize + 40
            }
          ]}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {!isFlying && (
            <Animated.Image
              source={BALL_IMAGE}
              style={[
                styles.ballSprite,
                {
                  width: ballSize,
                  height: ballSize,
                  left: 20,
                  top: 20,
                  // Subtle blur + glow to give 3D depth feel at rest
                  ...Platform.select({
                    web: {
                      filter: isDragging
                        ? 'drop-shadow(0 8px 16px rgba(0,0,0,0.55)) brightness(1.08)'
                        : 'drop-shadow(0 12px 22px rgba(0,0,0,0.6)) drop-shadow(0 0 8px rgba(255,255,255,0.15))',
                    },
                    default: {},
                  }),
                },
                isDragging && { transform: [{ scale: 1.06 }] }
              ]}
              resizeMode="contain"
            />
          )}
        </View>

        {/* BALL OVERLAY WHEN FLYING */}
        {isFlying && (
          <Animated.Image
            source={BALL_IMAGE}
            style={[
              styles.flyingBallOverlay,
              { width: ballSize, height: ballSize },
              ballAnimatedStyle,
              Platform.OS === 'web' && { pointerEvents: 'none' }
            ]}
            pointerEvents={Platform.OS === 'web' ? undefined : 'none'}
            resizeMode="contain"
          />
        )}

        {/* Miss Flash Overlay - just shows "TRƯỢT" text */}
        {showMissFlash && (
          <Animated.View style={[styles.missOverlay, missFlashAnimatedStyle]}>
            <Text style={styles.missText}>TRƯỢT</Text>
          </Animated.View>
        )}

        {/* Instruction Footer hint */}
        {!isComplete && (
          <View style={styles.footerHintWrap}>
            <Text style={styles.footerHintText}>
              {isDragging ? "KÉO BÓNG CÀNG SÂU LỰC SÚT CÀNG MẠNH!" : "CHẠM KÉO BÓNG LÙI VỀ SAU ĐỂ CĂN LỰC SÚT"}
            </Text>
          </View>
        )}

        {/* Goal Flash Highlight Overlay */}
        {showGoalFlash && (
          <Animated.View style={[styles.victoryOverlay, goalFlashAnimatedStyle]}>
            <AmbientBubbles />
            <GoalFireworks active={showGoalFlash} />
            <Text style={styles.victoryText}>VÀO!!!</Text>
          </Animated.View>
        )}

        {/* Fallback Link Modal */}
        <Modal visible={fallbackModal} transparent animationType="fade"
          onRequestClose={() => setFallbackModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>⚠️ Không thể mở tự động</Text>
              <Text style={styles.modalDesc}>
                Nhờ nhân viên mở link sau hoặc gửi cho khách:
              </Text>
              <View style={styles.urlBox}>
                <Text style={styles.urlText} selectable>{fallbackURL}</Text>
              </View>
              <TouchableOpacity style={styles.shareBtn}
                onPress={() => Share.share({ message: fallbackURL, url: fallbackURL })}>
                <Text style={styles.shareBtnText}>📤 Chia sẻ link</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeBtn}
                onPress={() => setFallbackModal(false)}>
                <Text style={styles.closeBtnText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a361c',
    overflow: 'hidden',
  },
  bgContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 24,
    paddingBottom: 24,
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.25)', // Phủ mờ sáng nhẹ sân vận động đồng bộ Welcome
  },
  topLogoWrap: {
    alignItems: 'center',
    marginTop: 10,
    zIndex: 10,
  },
  logo: {
  },

  // Horizontal Scoreboard Styling
  scoreboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '98%',
    marginTop: 5,
    maxWidth: 1100,
    backgroundColor: 'rgba(10, 50, 20, 0.55)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 28,
    paddingVertical: 12,
    paddingHorizontal: 16,
    zIndex: 10,
    backdropFilter: 'blur(15px)',
    boxShadow: '0 12px 35px rgba(0,0,0,0.3)',
  },
  scoreboardLeft: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  scoreboardCenter: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreboardRight: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  progressSection: {
    alignItems: 'flex-start',
    gap: 6,
  },
  progressLabel: {
    color: '#FFD700',
    fontSize: 20, // Increased size
    fontFamily: 'Hanken Grotesk',
    fontWeight: '600',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginBottom: 4,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  dotGoal: {
    backgroundColor: '#F40009', // Red circle for Goal
    borderColor: '#FFD700',
    boxShadow: '0 0 6px #F40009',
  },
  dotMiss: {
    backgroundColor: '#475569', // Slate grey for Miss
    borderColor: '#94a3b8',
  },
  dotIcon: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '900',
    textAlign: 'center',
  },

  centerScoreBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 48, // Increased padding
    boxShadow: '0 8px 25px rgba(0,0,0,0.25)',
  },
  scoreCol: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  scoreColLabel: {
    color: '#475569',
    fontSize: 18, // Increased size
    fontWeight: '600',
    fontFamily: 'Hanken Grotesk',
  },
  scoreColNum: {
    color: '#1e293b',
    fontSize: 58, // Increased size
    fontFamily: 'Anton',
    fontWeight: '500',
  },
  scoreColDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 12,
  },

  // Power Bar Styles - Positioned ABOVE the scoreboard card
  powerBarContainer: {
    position: 'absolute',
    width: '80%',
    top: 120,
    maxWidth: 320, // Scaled down width
    alignItems: 'center',
    zIndex: 100,
  },
  powerBarLabel: {
    color: '#FFFFFF',
    fontFamily: 'Hanken Grotesk',
    fontSize: 16, // Scaled down text size
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: 5, // Reduced margin
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  powerBarOuter: {
    width: '100%',
    height: 18, // Thicker bar
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
  },
  powerBarInner: {
    height: '100%',
    borderRadius: 9,
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(to right, #22c55e, #eab308, #ef4444)',
      },
      default: {},
    }),
  },

  audioBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  audioBtnIcon: {
    fontSize: 20,
  },

  // 3D Goal Container & Rendering
  goalFrame: {
    backgroundColor: 'transparent',
    overflow: 'visible',
    position: 'relative',
    alignSelf: 'center',
    zIndex: 2,
    marginTop: -20,
  },
  goalImage: {
    // Drop shadow under goal
    filter: 'drop-shadow(0px 22px 14px rgba(0,0,0,0.5))',
  },

  // Aiming Target HUD on release
  aimTargetIndicator: {
    position: 'absolute',
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 12,
  },
  aimTargetInnerCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    boxShadow: '0 0 12px rgba(255,255,255,0.8)',
  },
  aimTargetOuterRing: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    boxShadow: '0 0 15px rgba(255,255,255,0.6)',
  },

  // Ball Touch and physics
  touchZone: {
    position: 'absolute',
    zIndex: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ballSprite: {
  },
  flyingBallOverlay: {
    position: 'absolute',
    zIndex: 5,
  },

  // Miss flash overlay
  missOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 99,
    justifyContent: 'center',
    alignItems: 'center',
  },
  missText: {
    color: '#CBD5E1', // Silver-grey neon
    fontFamily: 'Anton',
    fontSize: 80,
    fontWeight: '900',
    letterSpacing: 6,
    textShadowColor: 'rgba(148, 163, 184, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    ...Platform.select({
      web: {
        textShadow: '0 0 18px rgba(203,213,225,0.9), 0 0 40px rgba(148,163,184,0.5), 0 4px 8px rgba(0,0,0,0.7)',
      },
      default: {},
    }),
  },

  nextShotBtn: {
    backgroundColor: '#F40009',
    borderRadius: 28,
    paddingVertical: 18,
    paddingHorizontal: 40,
    marginTop: 24,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 20px rgba(244,0,9,0.35)',
  },
  nextShotBtnText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontFamily: 'Anton',
    fontSize: 20,
    letterSpacing: 0.8,
  },

  footerHintWrap: {
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 20,
    marginBottom: 6,
  },
  footerHintText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Hanken Grotesk',
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  // Modal styling
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 28,
    width: '100%', maxWidth: 480,
    borderWidth: 2, borderColor: 'rgba(244,0,9,0.25)',
    gap: 12,
  },
  modalTitle: { color: '#F40009', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  modalDesc: { color: '#475569', fontSize: 14, textAlign: 'center', fontWeight: '600' },
  urlBox: {
    backgroundColor: '#f8fafc', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#e2e8f0', padding: 14,
  },
  urlText: { color: '#1d4ed8', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  shareBtn: {
    backgroundColor: '#F40009', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  shareBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  closeBtn: { paddingVertical: 10, alignItems: 'center' },
  closeBtnText: { color: '#64748b', fontSize: 14, fontWeight: '600' },

  // Result view
  missedRoot: {
    flex: 1,
    backgroundColor: '#0a361c',
  },
  missedScrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 36,
    paddingHorizontal: 20,
  },
  logoWrap: { alignItems: 'center', zIndex: 10 },
  missedContent: {
    alignItems: 'center',
    gap: 16,
    zIndex: 5,
  },
  missedTitleWrap: { alignItems: 'center', width: '100%' },
  missedTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontFamily: 'Anton',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
    ...Platform.select({
      web: {
        textShadow: '0px 3px 10px rgba(0,0,0,0.8), 0px 0px 30px rgba(255,255,255,0.15)',
      },
      default: {},
    }),
  },
  missedSubtitleBadge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#FFD700',
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 -6px 0 rgba(0,0,0,0.12), 0 10px 28px rgba(0,0,0,0.35)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 12,
      },
    }),
  },
  missedSubtitleText: {
    color: '#0f172a',
    fontWeight: '900',
    fontFamily: 'Anton',
    textAlign: 'center',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  missedBtnArea: {
    alignItems: 'center',
    gap: 10,
  },
  backBtnGhost: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderBottomColor: 'rgba(0, 0, 0, 0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
      },
      default: {},
    }),
  },

  showcaseWrap: {
    width: '100%',
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 10,
  },
  spotlightCone: {
    position: 'absolute',
    top: -40,
    width: 260,
    height: 220,
    backgroundImage: 'linear-gradient(to bottom, rgba(255, 215, 0, 0.25) 0%, rgba(255, 215, 0, 0.0) 80%)',
    clipPath: 'polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%)',
    zIndex: 1,
  },
  floatingBall: {
    zIndex: 3,
    filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.45))',
  },
  pedestalRing: {
    position: 'absolute',
    bottom: 0,
    width: 140,
    height: 35,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: 'rgba(255, 215, 0, 0.45)',
    backgroundColor: 'rgba(10, 50, 20, 0.8)',
    transform: [{ scaleY: 0.28 }],
    zIndex: 2,
  },

  scoreBox: {
    backgroundColor: 'rgba(5, 30, 12, 0.7)',
    borderRadius: 32,
    paddingVertical: 28,
    paddingHorizontal: 36,
    width: '98%',
    maxWidth: 460,
    alignItems: 'center',
    gap: 18,
    borderWidth: 2.5,
    borderColor: 'rgba(255, 215, 0, 0.35)',
    marginTop: 14,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px)',
        boxShadow: '0 -4px 0 rgba(255,215,0,0.15), 0 20px 45px rgba(0,0,0,0.45)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
        elevation: 14,
      },
    }),
  },
  dotsRowEnd: { flexDirection: 'row', gap: 18 },
  scoreTextEnd: {
    color: '#FFD700',
    fontWeight: '900',
    fontSize: 20,
    fontFamily: 'Anton',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },

  victoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 99,
    justifyContent: 'center',
    alignItems: 'center',
  },
  victoryText: {
    color: '#FFD700',
    fontFamily: 'Anton',
    fontSize: 72,
    fontWeight: '900',
    letterSpacing: 4,
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  }
});

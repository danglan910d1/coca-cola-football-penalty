// UserApp/src/screens/WheelScreen.js — CLASSIC PREMIUM 3D WHEEL
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, ActivityIndicator, Image, Easing, Platform, ScrollView, ImageBackground
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useResponsive } from '../hooks/useResponsive';
import { getAvailableGifts, spinWheel } from '../config/giftConfig';
import { submitResult, fetchGiftStock } from '../services/sheetsApi';
import { audioHelper } from '../services/AudioHelper';
import SharedStyles from '../components/SharedStyles';
import AmbientBubbles from '../components/AmbientBubbles';
import FireworksCanvas from '../components/FireworksCanvas';
import CocaButton from '../components/CocaButton';
import CocaModal from '../components/CocaModal';

const BG_IMAGE = require('../../assets/bg_main.jpeg');
const LOGO_IMAGE = require('../../assets/logo_coca.png');

import resolveAssetSource from 'react-native/Libraries/Image/resolveAssetSource';

const GIFT_IMAGES = {
  tui_vai_thoi_trang: require('../../assets/img_gift/tui_vai_thoi_trang.png'),
  binh_giu_nhiet: require('../../assets/img_gift/binh_giu_nhiet.png'),
  tui_the_thao: require('../../assets/img_gift/tui_the_thao.png'),
  ly_giu_nhiet: require('../../assets/img_gift/ly_giu_nhiet.png'),
  tui_vai_phien_ban_gioi_han: require('../../assets/img_gift/tui_vai_phien_ban_gioi_han.png'),
  tshirt_red: require('../../assets/img_gift/t_shirt_do.png'),
  tshirt_grey: require('../../assets/img_gift/t_shirt_xam.png'),
};

const getGiftImageUri = (id) => {
  const asset = GIFT_IMAGES[id];
  if (!asset) return '';
  const resolved = resolveAssetSource(asset);
  return resolved ? resolved.uri : '';
};

export default function WheelScreen() {
  const navigation = useNavigation();
  const { user, wheel, setSelectedGift, resetAll } = useApp();
  const R = useResponsive();

  const isSpinningRef = useRef(false); // Ref để theo dõi trạng thái quay thực tế của âm thanh

  const storeId = user.storeId || user.location || 'STORE_HCM_MALL_01';
  
  const [gifts, setGifts]             = useState([]);
  const [isLoadingStock, setIsLoadingStock] = useState(true);
  const [stockError, setStockError]   = useState(null);

  const [isSpinning,  setIsSpinning]  = useState(false);
  const [hasSpun,     setHasSpun]     = useState(false);
  const [winner,      setWinner]      = useState(null);
  const [isSubmitting,setIsSubmitting] = useState(false);
  const [isMuted,     setIsMuted]     = useState(false);

  // Hiệu ứng kim quay rung lắc (jiggle)
  const [needleJiggle, setNeedleJiggle] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);

  // Cheat Mode / Control Mode cho Admin test
  const [showCheatPanel, setShowCheatPanel] = useState(false);
  const [forcedPrizeId, setForcedPrizeId]   = useState(null);
  const [logoClicks, setLogoClicks]         = useState(0);

  const handleLogoPress = () => {
    setLogoClicks(prev => {
      const next = prev + 1;
      if (next >= 5) {
        setShowCheatPanel(true);
        return 0;
      }
      return next;
    });
  };

  // Lưu góc quay hiện tại
  const [currentRotation, setCurrentRotation] = useState(0); // Bắt đầu ở góc 0 độ để tránh kẹt lệch góc quay trên Web

  // Anim xoay bánh xe
  const spinAngle = useRef(new Animated.Value(0)).current;
  const fadeIn     = useRef(new Animated.Value(0)).current;
  const headerY    = useRef(new Animated.Value(-30)).current;
  const capPulse   = useRef(new Animated.Value(1)).current;
  const capGlow    = useRef(new Animated.Value(0)).current;

  const [outOfStockModalVisible, setOutOfStockModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      audioHelper.stopWelcomeMusic();
      return () => {};
    }, [])
  );

  const handleGoBack = () => {
    audioHelper.playButtonClick();
    resetAll();
    navigation.reset({
      index: 0,
      routes: [{ name: 'InputForm' }],
    });
  };

  // Lấy dữ liệu tồn kho thực tế
  const loadStock = async () => {
    try {
      setIsLoadingStock(true);
      setStockError(null);
      const stockData = await fetchGiftStock(storeId);
      const available = getAvailableGifts(storeId, stockData);
      setGifts(available);
      setIsLoadingStock(false);
      if (!available.some(g => g.currentStock > 0)) {
        setOutOfStockModalVisible(true);
      }
    } catch (err) {
      setStockError(err.message || 'Lỗi tải danh sách quà');
      setIsLoadingStock(false);
    }
  };

  useEffect(() => {
    loadStock();
  }, [storeId]);

  // Sắp xếp xen kẽ các phần quà tỉ lệ trúng cao và thấp
  const interleaveGifts = (arr) => {
    if (arr.length <= 2) return arr;
    const sorted = [...arr].sort((a, b) => b.currentStock - a.currentStock);
    const mid = Math.ceil(sorted.length / 2);
    const high = sorted.slice(0, mid);
    const low = sorted.slice(mid);
    const result = [];
    for (let i = 0; i < mid; i++) {
      if (high[i]) result.push(high[i]);
      if (low[i]) result.push(low[i]);
    }
    return result;
  };

  // Thiết lập danh sách các ô quà trên vòng quay động
  const wheelItems = useMemo(() => {
    return interleaveGifts(gifts);
  }, [gifts]);

  // Entrance animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(headerY, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();

    // Cap pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(capPulse, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(capPulse, { toValue: 1.0,  duration: 900, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(capGlow, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(capGlow, { toValue: 0, duration: 1100, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // ── Spin logic ─────────────────────────────────────────────────────────────
  const handleSpin = () => {
    audioHelper.playButtonClick();
    if (isSpinning || hasSpun || !gifts.some(g => g.currentStock > 0) || isLoadingStock) return;
    
    setIsSpinning(true);
    isSpinningRef.current = true; // Bắt đầu quay
    setShowFireworks(false);

    // 1. Chọn quà chiến thắng
    let wonGift = null;
    if (forcedPrizeId !== null) {
      wonGift = gifts.find(g => g.id === forcedPrizeId);
    }
    if (!wonGift) {
      wonGift = spinWheel(gifts);
    }

    // 2. Tìm sector index của phần quà trúng trên vòng quay động
    let sectorIndex = wheelItems.findIndex(item => item.id === wonGift.id);
    if (sectorIndex === -1) sectorIndex = 0;

    const N = wheelItems.length;
    const itemAngle = N > 0 ? 360 / N : 360;
    const centerOfSegment = (sectorIndex * itemAngle) + (itemAngle / 2);
    
    // Tính góc quay cần dừng để sector nằm ở vị trí 12h (Công thức đúng là 360 - centerOfSegment do SVG path đã dịch góc sẵn)
    let neededStopAngle = (360 - centerOfSegment) % 360;
    if (neededStopAngle < 0) neededStopAngle += 360;

    // Thêm các vòng quay dồn dập (6 đến 9 vòng) và một ít lệch nhẹ
    const extraSpins = 6 + Math.floor(Math.random() * 3);
    const targetRotation = currentRotation + (extraSpins * 360) + (neededStopAngle - (currentRotation % 360)) + (Math.random() * (itemAngle * 0.4) - (itemAngle * 0.2));

    // Cập nhật góc quay hiện tại
    setCurrentRotation(targetRotation);

    // 3. Giả lập tiếng tick cơ học dồn dập rồi giãn ra khi bánh xe giảm tốc
    let tickCount = 0;
    const playTickSequence = () => {
      // Chỉ phát tick khi vẫn đang trong trạng thái quay
      if (isSpinningRef.current && tickCount < 50) {
        if (!isMuted) audioHelper.playTick();
        setNeedleJiggle(true);
        setTimeout(() => setNeedleJiggle(false), 70);
        
        tickCount++;
        setTimeout(playTickSequence, 65 + (tickCount * tickCount * 0.15));
      }
    };
    setTimeout(playTickSequence, 100);

    // 4. Animate vòng quay
    Animated.timing(spinAngle, {
      toValue: targetRotation,
      duration: 5000,
      easing: Easing.bezier(0.15, 0, 0.1, 1),
      useNativeDriver: true,
    }).start(async () => {
      isSpinningRef.current = false; // Bánh xe đã dừng quay - dừng âm thanh tick ngay lập tức
      setWinner(wonGift);
      setSelectedGift(wonGift);
      setHasSpun(true);
      setIsSpinning(false);
      setShowFireworks(true);

      // Phát âm thanh chiến thắng
      if (wonGift.name.toLowerCase().includes("chúc bạn may mắn") || wonGift.name.toLowerCase().includes("mất lượt") || wonGift.id.includes("placeholder")) {
        if (!isMuted) audioHelper.playFailure();
      } else {
        if (!isMuted) audioHelper.playVictory();
      }

      // Lưu kết quả ngầm (không chặn UI)
      try {
        setIsSubmitting(true);
        await submitResult({
          storeId,
          user,
          gift: wonGift,
        });
      } catch (err) {
        console.warn("Backend error: ", err);
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  const handleGoResult = () => {
    audioHelper.playButtonClick();
    navigation.navigate('Result');
  };

  const handleGoHome = () => {
    audioHelper.playButtonClick();
    resetAll();
    navigation.reset({ index: 0, routes: [{ name: 'InputForm' }] });
  };

  // Tạo đường viền răng cưa nắp chai Coca-Cola
  const capPath = useMemo(() => {
    const cx = 200;
    const cy = 200;
    const teeth = 21;
    const rOut = 35;
    const rIn = 32;
    const pts = [];
    for (let i = 0; i < teeth * 2; i++) {
      const angle = (i * Math.PI) / teeth - Math.PI / 2;
      const r = i % 2 === 0 ? rOut : rIn;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return `M ${pts.join(' L ')} Z`;
  }, []);

  // ── Responsive styles ──────────────────────────────────────────────────────
  const { isTablet, contentWidth, rs, width } = R;
  const wheelSize = isTablet
    ? Math.min(width - 48, rs(480))
    : Math.min(width - 16, 360);

  const spinRotation = spinAngle.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
    extrapolate: 'extend'
  });

  const N = wheelItems.length;
  const itemAngle = N > 0 ? 360 / N : 360;

  return (
    <View style={styles.root}>
      <SharedStyles />
      <ImageBackground source={BG_IMAGE} style={styles.container} imageStyle={styles.bgImage}>
        <View style={styles.bgOverlay} />
        <AmbientBubbles />
        <FireworksCanvas active={showFireworks} />

        <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

      {/* Logo branding ở ngoài, trên đầu giống màn nhập thông tin */}
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={handleLogoPress}
        style={styles.logoWrap} 
        className="logo-glow animate-logo-float"
      >
        <Image source={LOGO_IMAGE} resizeMode="contain" style={[styles.logo, { width: rs(isTablet ? 240 : 180), height: rs(isTablet ? 75 : 55) }]} />
      </TouchableOpacity>

      {/* Header Bar */}
      <Animated.View style={[styles.header, {
        opacity: fadeIn,
        transform: [{ translateY: headerY }],
        width: contentWidth,
      }]}>
        {/* Tiêu đề "QUAY LÀ TRÚNG!" bọc khung trắng hoàn hảo */}
        <View style={styles.headlineWrap} className="animate-title-pop">
          <View style={styles.titleRow}>
            <Text style={[styles.mainHeading, { fontSize: rs(isTablet ? 48 : 42) }]}>
              QUAY LÀ{' '}
            </Text>
            <View style={styles.highlightContainer}>
              <Text style={[styles.highlightText, { fontSize: rs(isTablet ? 48 : 42) }]}>
                TRÚNG!
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* ── WHEEL CONTAINER DYNAMIC VECTOR SVG ── */}
      <Animated.View style={[styles.wheelArena, { opacity: fadeIn, width: wheelSize, height: wheelSize }]}>
        
        {/* The 3D Pointer (wheel-indicator-3d) */}
        <View style={[
          styles.flapperNeedle,
          { transform: [{ translateX: -12 }, { rotate: needleJiggle ? '12deg' : '0deg' }] }
        ]}>
          <View style={styles.indicatorDot} />
        </View>

        {isLoadingStock ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#FF1E1E" />
            <Text style={styles.loadingText}>Đang nạp dữ liệu kho...</Text>
          </View>
        ) : stockError ? (
          <View style={styles.loadingWrap}>
            <Text style={styles.errorText}>⚠️ {stockError}</Text>
          </View>
        ) : gifts.length === 0 ? (
          <View style={styles.loadingWrap}>
            <Text style={styles.errorText}>Rất tiếc, đã hết sạch quà tặng!</Text>
          </View>
        ) : (
          <Animated.View style={[
            styles.wheelSpinnable,
            { transform: [{ rotate: spinRotation }] }
          ]}>
            {/* Draw dynamic SVG sectors representing available catalog gifts in real time */}
            <svg viewBox="0 0 400 400" width="100%" height="100%" style={{ overflow: 'visible' }}>
              <defs>
                <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="4" stdDeviation="5" flood-opacity="0.5"/>
                </filter>
              </defs>

              {/* Outer Gold Ring */}
              <circle cx="200" cy="200" r="195" fill="#B8860B" />
              <circle cx="200" cy="200" r="192" fill="#FFD700" />
              
              {/* LED Lights (Blinking Ring) */}
              <circle
                cx="200"
                cy="200"
                r="186"
                fill="none"
                stroke="#FFFFFF"
                stroke-width="5"
                stroke-dasharray="8 12"
                style={{
                  animation: 'led-blink-even 0.6s infinite steps(2)',
                }}
              />

              {/* Draw Slices */}
              {N === 1 ? (
                <g>
                  {/* Full Circle */}
                  <circle cx="200" cy="200" r="180" fill="#F40009" stroke="#B30006" stroke-width="1.2" />
                  
                  {/* Text at the bottom (rotated 180 degrees so it faces up when rotated 180 degrees) */}
                  <g transform="translate(200, 316) rotate(180)">
                    {wheelItems[0].name.split('\n').map((line, idx) => (
                      <text
                        key={idx}
                        y={idx * 21}
                        textAnchor="middle"
                        fill="#FFD700"
                        stroke="#000000"
                        stroke-width="4.5"
                        paint-order="stroke fill"
                        stroke-linejoin="round"
                        fontFamily="Anton"
                        fontSize="18"
                        letterSpacing="0.6"
                        fontWeight="900"
                        filter="url(#shadow)"
                      >
                        {line.toUpperCase()}
                      </text>
                    ))}
                    {/* White backing circle to highlight the gift image */}
                    <circle
                      cx="0"
                      cy="38"
                      r="24"
                      fill="#FFFFFF"
                      stroke="#FFD700"
                      stroke-width="1.8"
                      style={{
                        filter: 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.25))'
                      }}
                    />
                    <image
                      href={getGiftImageUri(wheelItems[0].id)}
                      x="-22"
                      y="16"
                      width="44"
                      height="44"
                      preserveAspectRatio="xMidYMid meet"
                      style={{
                        filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.35))'
                      }}
                    />
                  </g>
                </g>
              ) : (
                wheelItems.map((item, i) => {
                  const startAngle = i * itemAngle;
                  const endAngle = (i + 1) * itemAngle;
                  const startRad = (startAngle - 90) * Math.PI / 180;
                  const endRad = (endAngle - 90) * Math.PI / 180;
                  const x1 = 200 + 180 * Math.cos(startRad);
                  const y1 = 200 + 180 * Math.sin(startRad);
                  const x2 = 200 + 180 * Math.cos(endRad);
                  const y2 = 200 + 180 * Math.sin(endRad);
                  const d = `M 200 200 L ${x1} ${y1} A 180 180 0 0 1 ${x2} ${y2} Z`;
                  
                  // Xen kẽ Đỏ Coca-Cola và Trắng Bạc sáng
                  const fillColor = i % 2 === 0 ? '#F40009' : '#F8F9FA';
                  
                  // Màu chữ tương phản: Vàng trên Đỏ, Slate 800 trên Trắng Bạc
                  const textFill = i % 2 === 0 ? '#FFD700' : '#1e293b';
                  
                  const midAngle = startAngle + itemAngle / 2;
                  const textRad = (midAngle - 90) * Math.PI / 180;
                  const tx = 200 + 116 * Math.cos(textRad);
                  const ty = 200 + 116 * Math.sin(textRad);
                  
                  const lines = item.name.split('\n');

                  return (
                    <g key={item.id}>
                      <path d={d} fill={fillColor} stroke="#B30006" stroke-width="1.2" />
                      <g transform={`translate(${tx}, ${ty}) rotate(${midAngle})`}>
                        {lines.map((line, idx) => (
                          <text
                            key={idx}
                            y={idx * 21 - (lines.length - 1) * 10.5 + (lines.length === 1 ? 3 : 0)}
                            textAnchor="middle"
                            fill={textFill}
                            stroke={i % 2 === 0 ? '#000000' : '#FFFFFF'}
                            stroke-width={i % 2 === 0 ? '4.5' : '3.5'}
                            paint-order="stroke fill"
                            stroke-linejoin="round"
                            fontFamily="Anton"
                            fontSize="18"
                            letterSpacing="0.6"
                            fontWeight="900"
                            filter="url(#shadow)"
                          >
                            {line.toUpperCase()}
                          </text>
                        ))}
                        {/* White backing circle to highlight the gift image */}
                        <circle
                          cx="0"
                          cy="38"
                          r="24"
                          fill="#FFFFFF"
                          stroke="#FFD700"
                          stroke-width="1.8"
                          style={{
                            filter: 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.25))'
                          }}
                        />
                        <image
                          href={getGiftImageUri(item.id)}
                          x="-22"
                          y="16"
                          width="44"
                          height="44"
                          preserveAspectRatio="xMidYMid meet"
                          style={{
                            filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.35))'
                          }}
                        />
                      </g>
                    </g>
                  );
                })
              )}

              {/* Gold boundary pins */}
              {Array.from({ length: N }).map((_, i) => {
                const angle = i * itemAngle;
                const rad = (angle - 90) * Math.PI / 180;
                const px = 200 + 180 * Math.cos(rad);
                const py = 200 + 180 * Math.sin(rad);
                return (
                  <circle
                    key={i}
                    cx={px}
                    cy={py}
                    r="4.5"
                    fill="#FFD700"
                    stroke="#8B6508"
                    stroke-width="1"
                  />
                );
              })}

              {/* Center Coca-Cola Bottle Cap (Nắp chai 3D) */}
              <path
                d={capPath}
                fill="#E8E8E8"
                stroke="#666666"
                stroke-width="1.8"
                filter="url(#shadow)"
              />
              <circle cx="200" cy="200" r="27" fill="#F40009" stroke="#9E0005" stroke-width="1.2" />
              <circle cx="200" cy="200" r="24" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="1" />
              <text
                x="200"
                y="204"
                textAnchor="middle"
                fill="#FFFFFF"
                fontFamily="Anton"
                fontSize="9.5"
                fontWeight="bold"
                letterSpacing="0.3"
              >
                COCA-COLA
              </text>
            </svg>
          </Animated.View>
        )}
        {/* Bottle Cap Touch Button — only shown when gifts are loaded */}
        {!isLoadingStock && !stockError && gifts.some(g => g.currentStock > 0) && (
          <>
            {/* Cap pulse glow ring */}
            {!hasSpun && (
              <Animated.View
                style={[
                  styles.capGlowRing,
                  {
                    opacity: capGlow,
                    transform: [{ scale: capPulse }],
                  }
                ]}
                pointerEvents="none"
              />
            )}

            <TouchableOpacity
              activeOpacity={hasSpun ? 1 : 0.75}
              onPress={!hasSpun && !isSpinning ? handleSpin : undefined}
              style={styles.capTouchArea}
              disabled={hasSpun || isSpinning}
            >
              <Animated.View style={[
                styles.capOuter,
                !hasSpun && { transform: [{ scale: capPulse }] }
              ]}>
                <View style={styles.capMetalRing} />
                <View style={styles.capRedCircle}>
                  <View style={styles.capShimmer} />
                  {isSpinning ? (
                    <ActivityIndicator size="small" color="#FFD700" />
                  ) : hasSpun ? (
                    <Text style={styles.capText}>✓</Text>
                  ) : (
                    <View style={styles.capLogoWrap}>
                      <Image
                        source={LOGO_IMAGE}
                        style={styles.capLogoImage}
                        resizeMode="contain"
                      />
                      <Text style={styles.capRegistered}>®</Text>
                    </View>
                  )}
                </View>
              </Animated.View>
            </TouchableOpacity>
          </>
        )}

      </Animated.View>

      {/* ── Winner Card ── */}
      {winner && (
        <Animated.View 
          style={[styles.winnerCardContainer, { opacity: fadeIn }]}
        >
          <View 
            className="winner-card-glow"
            style={styles.winnerCard}
          >
            <Text style={[styles.winnerName, { fontSize: rs(isTablet ? 32 : 24) }]}>
              {winner.name.toUpperCase()}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* ── Bottom Controls — only show after spin ── */}
      <View style={[styles.bottomControls, { width: '100%', maxWidth: 420 }]}>
        {hasSpun ? (
          <CocaButton
            title="XEM PHIẾU QUÀ →"
            onPress={handleGoResult}
          />
        ) : (
          <View style={styles.tapHintWrap}>
            <Text style={styles.tapHintText}>
              {isLoadingStock ? 'Đang nạp dữ liệu...' : !gifts.some(g => g.currentStock > 0) ? 'Đã hết quà tặng!' : '↑  Nhấn nắp chai để quay'}
            </Text>
          </View>
        )}
      </View>

      {/* Admin Cheat Modal */}
      {showCheatPanel && (
        <View style={styles.cheatOverlay}>
          <View style={styles.cheatBox}>
            <Text style={styles.cheatTitle}>⚙️ CƠ CHẾ CHEAT MODE (TESTING)</Text>
            
            {/* 2 nút bổ sung: Làm mới kho và Reset Trạng thái */}
            <View style={styles.cheatActionRow}>
              <TouchableOpacity
                style={[styles.cheatActionButton, { backgroundColor: '#4b3330' }]}
                onPress={() => {
                  loadStock();
                  setShowCheatPanel(false);
                }}
              >
                <Text style={styles.cheatActionButtonText}>🔄 LÀM MỚI KHO</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cheatActionButton, { backgroundColor: '#930003' }]}
                onPress={() => {
                  resetAll();
                  setShowCheatPanel(false);
                  navigation.reset({ index: 0, routes: [{ name: 'InputForm' }] });
                }}
              >
                <Text style={styles.cheatActionButtonText}>⚠️ RESET TRẠNG THÁI</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.cheatSubtitle}>Chỉ định phần quà thắng cuộc để kiểm tra luồng:</Text>
            
            <View style={styles.cheatList}>
              <TouchableOpacity
                style={[styles.cheatItem, forcedPrizeId === null && styles.cheatItemActive]}
                onPress={() => { setForcedPrizeId(null); setShowCheatPanel(false); }}
              >
                <Text style={styles.cheatItemText}>-- Ngẫu nhiên theo Sheets --</Text>
              </TouchableOpacity>
              
              {gifts.map(g => (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.cheatItem, forcedPrizeId === g.id && styles.cheatItemActive]}
                  onPress={() => { setForcedPrizeId(g.id); setShowCheatPanel(false); }}
                >
                  <Text style={styles.cheatItemText}>🎯 Ép trúng: {g.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity style={styles.cheatClose} onPress={() => setShowCheatPanel(false)}>
              <Text style={styles.cheatCloseText}>ĐÓNG</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <CocaModal
        visible={outOfStockModalVisible}
        title="Thông Báo"
        message="Số phần quà tại cửa hàng này đã hết!"
        confirmText="ĐÓNG"
        onConfirm={handleGoBack}
        onClose={handleGoBack}
      />
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
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundImage: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.0) 0%, rgba(241, 245, 249, 0.45) 100%)',
  },
  logoWrap: {
    alignItems: 'center',
    marginTop: 4, // Thu nhỏ margin
    marginBottom: 4,
  },
  logo: {
    width: 180,
    height: 55,
  },
  header: {
    alignItems: 'center',
    alignSelf: 'center',
  },
  topUtility: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  locationBadge: {
    backgroundColor: 'rgba(244, 0, 9, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(244, 0, 9, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  locationText: {
    color: '#F40009',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  adminCog: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(71, 85, 105, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.15)',
  },
  headlineWrap: {
    alignItems: 'center',
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
    boxShadow: '0 4px 12px rgba(244, 0, 9, 0.15)',
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
  subHeading: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
    letterSpacing: 1.5,
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.9,
  },
  wheelArena: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    perspective: 1200,
    shadowColor: 'rgba(71, 85, 105, 0.2)',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 60,
    marginVertical: 14,
  },
  flapperNeedle: {
    position: 'absolute',
    top: -15,
    left: '50%',
    width: 24,
    height: 36,
    backgroundColor: '#F40009',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 2,
    borderColor: '#ffffff',
    zIndex: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  wheelSpinnable: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
    overflow: 'visible',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingWrap: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 3,
    borderColor: 'rgba(71, 85, 105, 0.1)',
  },
  loadingText: {
    color: '#1e293b',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: '#F40009',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  winnerCardContainer: {
    alignItems: 'center',
    marginVertical: 10,
    width: '100%',
  },
  winnerCard: {
    backgroundColor: '#F40009', // Đỏ classic Coca-Cola
    borderWidth: 2,
    borderColor: '#FFD700', // Viền vàng neon
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 20px rgba(71, 85, 105, 0.12)',
    width: '90%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  winnerLabel: {
    color: '#FFB4A9',
    fontWeight: '800',
    fontFamily: 'Hanken Grotesk',
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  winnerName: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontFamily: 'Anton',
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 6,
  },
  savingText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 8,
  },
  gridWrap: {
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 10,
  },
  gridTitle: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  gridItem: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.45)', // dark transparent capsule
    paddingHorizontal: 8,
    paddingVertical: 5,
    alignItems: 'center',
    minWidth: 72,
  },
  gridEmoji: {
    fontSize: 12,
  },
  gridName: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },
  gridProb: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 1,
  },
  bottomControls: {
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%',
  },
  utilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 14,
    paddingHorizontal: 8,
  },
  muteBtn: {
    paddingVertical: 4,
  },
  homeBtn: {
    paddingVertical: 4,
  },
  homeBtnText: {
    color: 'rgba(71, 85, 105, 0.6)',
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  cheatOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(71, 85, 105, 0.4)',
    zIndex: 999999,
    elevation: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  cheatBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#F40009',
    borderRadius: 24,
    padding: 24,
    width: 340,
    alignItems: 'center',
    boxShadow: '0 15px 35px rgba(71, 85, 105, 0.2)',
  },
  cheatTitle: {
    color: '#1e293b',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1,
    marginBottom: 4,
  },
  cheatActionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 16,
    marginTop: 8,
  },
  cheatActionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cheatActionButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cheatSubtitle: {
    color: '#475569',
    fontSize: 11,
    marginBottom: 12,
    textAlign: 'center',
  },
  cheatList: {
    width: '100%',
    maxHeight: 180,
    overflow: 'y-auto',
    marginBottom: 16,
  },
  cheatItem: {
    width: '100%',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(71, 85, 105, 0.1)',
    alignItems: 'center',
  },
  cheatItemActive: {
    backgroundColor: 'rgba(244,0,9,0.1)',
  },
  cheatItemText: {
    color: '#1e293b',
    fontSize: 12,
    fontWeight: '600',
  },
  cheatClose: {
    backgroundColor: 'rgba(71, 85, 105, 0.1)',
    borderRadius: 12,
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  cheatCloseText: {
    color: '#1e293b',
    fontSize: 11,
    fontWeight: 'bold',
  },

  // ── Bottle Cap Spin Button ─────────────────────────────────────────────────
  capTouchArea: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    cursor: 'pointer',
  },
  capGlowRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#FFD700',
    zIndex: 49,
    boxShadow: '0 0 20px rgba(255,215,0,0.9), 0 0 40px rgba(255,215,0,0.5)',
  },
  capOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    // Metallic outer ring effect via shadow
    boxShadow: '0 4px 18px rgba(0,0,0,0.55), 0 0 0 4px #B8860B, 0 0 0 6px #FFD700',
  },
  capMetalRing: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: '#FFD700',
    backgroundColor: '#D4A800',
  },
  capRedCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#F40009',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#9E0005',
    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.35), inset 0 4px 8px rgba(255,255,255,0.2)',
  },
  capShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    borderTopLeftRadius: 31,
    borderTopRightRadius: 31,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  capText: {
    color: '#FFD700',
    fontFamily: 'Anton',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    lineHeight: 14,
  },
  capTextSub: {
    color: '#FFFFFF',
    fontFamily: 'Anton',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    lineHeight: 11,
  },
  capLogoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 52,
    height: 32,
  },
  capLogoImage: {
    width: 48,
    height: 22,
    tintColor: '#FFFFFF',
  },
  capRegistered: {
    position: 'absolute',
    top: 0,
    right: 0,
    color: '#FFD700',
    fontSize: 8,
    fontWeight: '900',
    lineHeight: 9,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tapHintWrap: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
  },
  tapHintText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Hanken Grotesk',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});

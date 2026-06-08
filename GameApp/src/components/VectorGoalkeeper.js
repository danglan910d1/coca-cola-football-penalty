// GameApp/src/components/VectorGoalkeeper.js
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Rect, Path, G, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withSpring,
  withTiming,
  useAnimatedStyle,
  withRepeat,
  Easing
} from 'react-native-reanimated';

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function VectorGoalkeeper({ poseIndex = 1, style }) {
  // Các giá trị Reanimated Shared Values để điều khiển toàn bộ tư thế của thủ môn
  const torsoX = useSharedValue(100);
  const torsoY = useSharedValue(70);
  const headX = useSharedValue(100);
  const headY = useSharedValue(42);

  const leftHandX = useSharedValue(55);
  const leftHandY = useSharedValue(100);
  const rightHandX = useSharedValue(145);
  const rightHandY = useSharedValue(100);

  const leftFootX = useSharedValue(80);
  const leftFootY = useSharedValue(175);
  const rightFootX = useSharedValue(120);
  const rightFootY = useSharedValue(175);

  const tiltAngle = useSharedValue(0); // Độ nghiêng cơ thể (độ)
  const scaleY = useSharedValue(1);    // Độ nén khi crouch/jump

  useEffect(() => {
    const springConfig = { damping: 13, stiffness: 100 };
    const timingConfig = { duration: 320, easing: Easing.out(Easing.quad) }; // Phản xạ cực nhanh 0.3s

    // Hủy các animation lặp trước đó bằng cách ghi đè giá trị tĩnh trước khi bắt đầu tư thế mới
    if (poseIndex !== 1) {
      torsoY.value = torsoY.value;
      headY.value = headY.value;
      leftHandY.value = leftHandY.value;
      rightHandY.value = rightHandY.value;
    }

    switch (poseIndex) {
      case 1: // IDLE (Trạng thái đứng chờ - Đung đưa thở nhẹ)
        torsoX.value = withSpring(100, springConfig);
        leftFootX.value = withSpring(80, springConfig);
        leftFootY.value = withSpring(175, springConfig);
        rightFootX.value = withSpring(120, springConfig);
        rightFootY.value = withSpring(175, springConfig);
        leftHandX.value = withSpring(55, springConfig);
        rightHandX.value = withSpring(145, springConfig);
        tiltAngle.value = withSpring(0, springConfig);
        scaleY.value = withSpring(1, springConfig);

        // Vòng lặp nhịp thở nhẹ nhàng của thủ môn khi chờ bóng
        torsoY.value = withRepeat(
          withTiming(73, { duration: 900, easing: Easing.inOut(Easing.ease) }),
          -1,
          true
        );
        headY.value = withRepeat(
          withTiming(45, { duration: 900, easing: Easing.inOut(Easing.ease) }),
          -1,
          true
        );
        leftHandY.value = withRepeat(
          withTiming(103, { duration: 900, easing: Easing.inOut(Easing.ease) }),
          -1,
          true
        );
        rightHandY.value = withRepeat(
          withTiming(103, { duration: 900, easing: Easing.inOut(Easing.ease) }),
          -1,
          true
        );
        headX.value = withSpring(100, springConfig);
        break;

      case 2: // JUMP LEFT (Bay người sang trái)
        torsoX.value = withTiming(65, timingConfig);
        torsoY.value = withTiming(65, timingConfig);
        headX.value = withTiming(60, timingConfig);
        headY.value = withTiming(38, timingConfig);
        leftHandX.value = withTiming(10, timingConfig);
        leftHandY.value = withTiming(50, timingConfig); // Tay trái giơ cao sang trái cản phá
        rightHandX.value = withTiming(90, timingConfig);
        rightHandY.value = withTiming(75, timingConfig);
        leftFootX.value = withTiming(55, timingConfig);
        leftFootY.value = withTiming(145, timingConfig);
        rightFootX.value = withTiming(105, timingConfig);
        rightFootY.value = withTiming(135, timingConfig);
        tiltAngle.value = withSpring(-28, springConfig);
        scaleY.value = withSpring(1.05, springConfig);
        break;

      case 3: // JUMP RIGHT (Bay người sang phải)
        torsoX.value = withTiming(135, timingConfig);
        torsoY.value = withTiming(65, timingConfig);
        headX.value = withTiming(140, timingConfig);
        headY.value = withTiming(38, timingConfig);
        leftHandX.value = withTiming(110, timingConfig);
        leftHandY.value = withTiming(75, timingConfig);
        rightHandX.value = withTiming(190, timingConfig);
        rightHandY.value = withTiming(50, timingConfig); // Tay phải giơ cao sang phải cản phá
        leftFootX.value = withTiming(95, timingConfig);
        leftFootY.value = withTiming(135, timingConfig);
        rightFootX.value = withTiming(145, timingConfig);
        rightFootY.value = withTiming(145, timingConfig);
        tiltAngle.value = withSpring(28, springConfig);
        scaleY.value = withSpring(1.05, springConfig);
        break;

      case 4: // DIVE BOTTOM-LEFT (Bay sệt góc trái)
        torsoX.value = withTiming(55, timingConfig);
        torsoY.value = withTiming(105, timingConfig); 
        headX.value = withTiming(45, timingConfig);
        headY.value = withTiming(82, timingConfig);
        leftHandX.value = withTiming(0, timingConfig);
        leftHandY.value = withTiming(135, timingConfig); // Tay trái sạt sát đất cản bóng sệt
        rightHandX.value = withTiming(85, timingConfig);
        rightHandY.value = withTiming(100, timingConfig);
        leftFootX.value = withTiming(60, timingConfig);
        leftFootY.value = withTiming(165, timingConfig);
        rightFootX.value = withTiming(110, timingConfig);
        rightFootY.value = withTiming(150, timingConfig);
        tiltAngle.value = withSpring(-42, springConfig);
        scaleY.value = withSpring(0.9, springConfig);
        break;

      case 5: // DIVE BOTTOM-RIGHT (Bay sệt góc phải)
        torsoX.value = withTiming(145, timingConfig);
        torsoY.value = withTiming(105, timingConfig);
        headX.value = withTiming(155, timingConfig);
        headY.value = withTiming(82, timingConfig);
        leftHandX.value = withTiming(115, timingConfig);
        leftHandY.value = withTiming(100, timingConfig);
        rightHandX.value = withTiming(200, timingConfig);
        rightHandY.value = withTiming(135, timingConfig); // Tay phải sạt sát đất cản bóng sệt
        leftFootX.value = withTiming(90, timingConfig);
        leftFootY.value = withTiming(150, timingConfig);
        rightFootX.value = withTiming(140, timingConfig);
        rightFootY.value = withTiming(165, timingConfig);
        tiltAngle.value = withSpring(42, springConfig);
        scaleY.value = withSpring(0.9, springConfig);
        break;

      case 6: // JUMP CENTER-UP (Nhảy cao lên giữa)
        torsoX.value = withSpring(100, springConfig);
        torsoY.value = withTiming(42, timingConfig); 
        headX.value = withSpring(100, springConfig);
        headY.value = withTiming(16, timingConfig);
        leftHandX.value = withTiming(55, timingConfig);
        leftHandY.value = withTiming(-15, timingConfig); // Cả 2 tay giơ cao đón bóng bổng
        rightHandX.value = withTiming(145, timingConfig);
        rightHandY.value = withTiming(-15, timingConfig);
        leftFootX.value = withTiming(85, timingConfig);
        leftFootY.value = withTiming(125, timingConfig);
        rightFootX.value = withTiming(115, timingConfig);
        rightFootY.value = withTiming(125, timingConfig);
        tiltAngle.value = withSpring(0, springConfig);
        scaleY.value = withSpring(1.22, springConfig);
        break;

      case 7: // CROUCH CENTER-DOWN (Ngồi nhún thấp người)
        torsoX.value = withSpring(100, springConfig);
        torsoY.value = withSpring(95, springConfig); 
        headX.value = withSpring(100, springConfig);
        headY.value = withSpring(74, springConfig);
        leftHandX.value = withSpring(40, springConfig);
        leftHandY.value = withSpring(122, springConfig);
        rightHandX.value = withSpring(160, springConfig);
        rightHandY.value = withSpring(122, springConfig);
        leftFootX.value = withSpring(75, springConfig);
        leftFootY.value = withSpring(180, springConfig);
        rightFootX.value = withSpring(125, springConfig);
        rightFootY.value = withSpring(180, springConfig);
        tiltAngle.value = withSpring(0, springConfig);
        scaleY.value = withSpring(0.76, springConfig);
        break;

      case 8: // DIVE TOP-LEFT (Bay người lên góc chữ A trái)
        torsoX.value = withTiming(70, timingConfig);
        torsoY.value = withTiming(48, timingConfig);
        headX.value = withTiming(65, timingConfig);
        headY.value = withTiming(16, timingConfig);
        leftHandX.value = withTiming(0, timingConfig);
        leftHandY.value = withTiming(-20, timingConfig); // Tay trái vươn thẳng lên góc cao bên trái
        rightHandX.value = withTiming(95, timingConfig);
        rightHandY.value = withTiming(40, timingConfig);
        leftFootX.value = withTiming(60, timingConfig);
        leftFootY.value = withTiming(135, timingConfig);
        rightFootX.value = withTiming(105, timingConfig);
        rightFootY.value = withTiming(115, timingConfig);
        tiltAngle.value = withSpring(-35, springConfig);
        scaleY.value = withSpring(1.18, springConfig);
        break;

      case 9: // DIVE TOP-RIGHT (Bay người lên góc chữ A phải)
        torsoX.value = withTiming(130, timingConfig);
        torsoY.value = withTiming(48, timingConfig);
        headX.value = withTiming(135, timingConfig);
        headY.value = withTiming(16, timingConfig);
        leftHandX.value = withTiming(105, timingConfig);
        leftHandY.value = withTiming(40, timingConfig);
        rightHandX.value = withTiming(200, timingConfig);
        rightHandY.value = withTiming(-20, timingConfig); // Tay phải vươn thẳng lên góc cao bên phải
        leftFootX.value = withTiming(95, timingConfig);
        leftFootY.value = withTiming(115, timingConfig);
        rightFootX.value = withTiming(140, timingConfig);
        rightFootY.value = withTiming(135, timingConfig);
        tiltAngle.value = withSpring(35, springConfig);
        scaleY.value = withSpring(1.18, springConfig);
        break;
    }
  }, [poseIndex]);

  // Vẽ các đường nét dứt khoát và nét vẽ dày (strokeWidth lớn) để nhìn rõ dưới nắng sự kiện
  const bodyProps = useAnimatedProps(() => {
    const tx = torsoX.value;
    const ty = torsoY.value;
    const sy = scaleY.value;

    const shoulderL_X = tx - 25;
    const shoulderL_Y = ty - 12 * sy;
    const shoulderR_X = tx + 25;
    const shoulderR_Y = ty - 12 * sy;
    const hipL_X = tx - 14;
    const hipL_Y = ty + 32 * sy;
    const hipR_X = tx + 14;
    const hipR_Y = ty + 32 * sy;

    return {
      d: `M ${shoulderL_X} ${shoulderL_Y} L ${shoulderR_X} ${shoulderR_Y} L ${hipR_X} ${hipR_Y} L ${hipL_X} ${hipL_Y} Z`
    };
  });

  const headProps = useAnimatedProps(() => {
    return {
      cx: headX.value,
      cy: headY.value
    };
  });

  const visorProps = useAnimatedProps(() => {
    const hx = headX.value;
    const hy = headY.value;
    return {
      d: `M ${hx - 15} ${hy - 2} Q ${hx} ${hy + 5} ${hx + 15} ${hy - 2}`
    };
  });

  const leftArmProps = useAnimatedProps(() => {
    const tx = torsoX.value;
    const ty = torsoY.value;
    const sy = scaleY.value;
    return {
      x1: tx - 25,
      y1: ty - 8 * sy,
      x2: leftHandX.value,
      y2: leftHandY.value
    };
  });

  const rightArmProps = useAnimatedProps(() => {
    const tx = torsoX.value;
    const ty = torsoY.value;
    const sy = scaleY.value;
    return {
      x1: tx + 25,
      y1: ty - 8 * sy,
      x2: rightHandX.value,
      y2: rightHandY.value
    };
  });

  const leftGloveProps = useAnimatedProps(() => {
    return {
      cx: leftHandX.value,
      cy: leftHandY.value
    };
  });

  const rightGloveProps = useAnimatedProps(() => {
    return {
      cx: rightHandX.value,
      cy: rightHandY.value
    };
  });

  const leftLegProps = useAnimatedProps(() => {
    const tx = torsoX.value;
    const ty = torsoY.value;
    const sy = scaleY.value;
    return {
      x1: tx - 13,
      y1: ty + 30 * sy,
      x2: leftFootX.value,
      y2: leftFootY.value
    };
  });

  const rightLegProps = useAnimatedProps(() => {
    const tx = torsoX.value;
    const ty = torsoY.value;
    const sy = scaleY.value;
    return {
      x1: tx + 13,
      y1: ty + 30 * sy,
      x2: rightFootX.value,
      y2: rightFootY.value
    };
  });

  const goalieStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${tiltAngle.value}deg` }
      ]
    };
  });

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={[styles.svgWrapper, goalieStyle]}>
        <Svg width="100%" height="100%" viewBox="0 0 200 200">
          <Defs>
            {/* Đỏ cam Coca-Cola đậm nét */}
            <LinearGradient id="cokeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#F40009" />
              <Stop offset="100%" stopColor="#9C0005" />
            </LinearGradient>
            <LinearGradient id="silverGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#FFFFFF" />
              <Stop offset="100%" stopColor="#9E9E9E" />
            </LinearGradient>
            <LinearGradient id="neonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#FF4136" />
              <Stop offset="50%" stopColor="#FF851B" />
              <Stop offset="100%" stopColor="#FF4136" />
            </LinearGradient>
          </Defs>

          {/* CHÂN TRÁI (Thick stroke-width) */}
          <AnimatedLine
            animatedProps={leftLegProps}
            stroke="#1C1311"
            strokeWidth="15"
            strokeLinecap="round"
          />

          {/* CHÂN PHẢI (Thick stroke-width) */}
          <AnimatedLine
            animatedProps={rightLegProps}
            stroke="#1C1311"
            strokeWidth="15"
            strokeLinecap="round"
          />

          {/* GIÀY TRÁI */}
          <AnimatedCircle
            cx={leftFootX}
            cy={leftFootY}
            r="11"
            fill="url(#silverGrad)"
            stroke="#1C1311"
            strokeWidth="3.5"
          />

          {/* GIÀY PHẢI */}
          <AnimatedCircle
            cx={rightFootX}
            cy={rightFootY}
            r="11"
            fill="url(#silverGrad)"
            stroke="#1C1311"
            strokeWidth="3.5"
          />

          {/* CÁNH TAY TRÁI (Thick stroke-width) */}
          <AnimatedLine
            animatedProps={leftArmProps}
            stroke="#F40009"
            strokeWidth="13"
            strokeLinecap="round"
          />

          {/* CÁNH TAY PHẢI (Thick stroke-width) */}
          <AnimatedLine
            animatedProps={rightArmProps}
            stroke="#F40009"
            strokeWidth="13"
            strokeLinecap="round"
          />

          {/* THÂN MÌNH (Jersey) */}
          <AnimatedPath
            animatedProps={bodyProps}
            fill="url(#cokeGrad)"
            stroke="#1C1311"
            strokeWidth="4.5"
            strokeLinejoin="round"
          />

          {/* ĐẦU */}
          <AnimatedCircle
            animatedProps={headProps}
            r="18.5"
            fill="#1C1311"
            stroke="#FFFFFF"
            strokeWidth="3.5"
          />

          {/* KÍNH NEON GIÚP CẦU THỦ NỔI BẬT DƯỚI ÁNH SÁNG MẠNH */}
          <AnimatedPath
            animatedProps={visorProps}
            fill="none"
            stroke="url(#neonGrad)"
            strokeWidth="6"
            strokeLinecap="round"
          />

          {/* GĂNG TAY TRÁI PHÓNG TO */}
          <AnimatedCircle
            animatedProps={leftGloveProps}
            r="13.5"
            fill="url(#silverGrad)"
            stroke="#F40009"
            strokeWidth="4"
          />
          <AnimatedCircle
            animatedProps={leftGloveProps}
            r="5.5"
            fill="#F40009"
          />

          {/* GĂNG TAY PHẢI PHÓNG TO */}
          <AnimatedCircle
            animatedProps={rightGloveProps}
            r="13.5"
            fill="url(#silverGrad)"
            stroke="#F40009"
            strokeWidth="4"
          />
          <AnimatedCircle
            animatedProps={rightGloveProps}
            r="5.5"
            fill="#F40009"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  svgWrapper: {
    width: '100%',
    height: '100%',
  },
});

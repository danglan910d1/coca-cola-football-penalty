// GameApp/src/components/CanvasBall.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Path, G, Defs, RadialGradient, Stop, LinearGradient } from 'react-native-svg';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

const AnimatedG = Animated.createAnimatedComponent(G);

export default function CanvasBall({ rotation, style }) {
  const rotatedPatternStyle = useAnimatedStyle(() => {
    const rot = rotation ? rotation.value : 0;
    return {
      transform: [
        { rotate: typeof rot === 'number' ? `${rot}deg` : rot }
      ]
    };
  });

  const r_inner = 18; 
  const r_outer = 50; 

  const vertices = Array.from({ length: 5 }).map((_, i) => {
    const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    return {
      x: Math.cos(angle) * r_inner,
      y: Math.sin(angle) * r_inner,
      xOut: Math.cos(angle) * r_outer,
      yOut: Math.sin(angle) * r_outer
    };
  });

  const centerPentagonPath = `M ${vertices[0].x} ${vertices[0].y} ` +
    vertices.slice(1).map(v => `L ${v.x} ${v.y}`).join(' ') + ' Z';

  const edgePanels = vertices.map((v, i) => {
    const nextV = vertices[(i + 1) % 5];
    const angleMid = ((i + 0.5) * 2 * Math.PI) / 5 - Math.PI / 2;
    const xMid = Math.cos(angleMid) * r_outer;
    const yMid = Math.sin(angleMid) * r_outer;

    return `M ${v.x} ${v.y} L ${v.xOut} ${v.yOut} Q ${xMid} ${yMid} ${nextV.xOut} ${nextV.yOut} L ${nextV.x} ${nextV.y} Z`;
  });

  return (
    <View style={[styles.container, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 110 110">
        <Defs>
          <RadialGradient id="ballShading" cx="30%" cy="30%" rx="55%" ry="55%" fx="30%" fy="30%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <Stop offset="55%" stopColor="#D8D8D8" stopOpacity="0.45" />
            <Stop offset="80%" stopColor="#707070" stopOpacity="0.75" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0.95" />
          </RadialGradient>

          <LinearGradient id="cokePattern" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#F40009" />
            <Stop offset="100%" stopColor="#9E0005" />
          </LinearGradient>
        </Defs>

        {/* Nền quả bóng trắng tinh khiết viền dày hơn (strokeWidth="3.5") */}
        <Circle cx="55" cy="55" r="50" fill="#FFFFFF" stroke="#1C1311" strokeWidth="3.5" />

        {/* CỤM HỌA TIẾT XOAY ĐỘNG */}
        <AnimatedG style={rotatedPatternStyle} origin="55, 55">
          <G transform="translate(55, 55)">
            {/* Ngũ giác trung tâm màu đỏ Coca-Cola viền dày hơn */}
            <Path d={centerPentagonPath} fill="url(#cokePattern)" stroke="#1C1311" strokeWidth="3" />

            {/* Các tấm họa tiết biên ngoài màu đen */}
            {edgePanels.map((path, idx) => (
              <Path key={idx} d={path} fill="#1C1311" stroke="#1C1311" strokeWidth="2.5" />
            ))}

            {/* Các đường chỉ khâu nối viền dày hơn */}
            {vertices.map((v, idx) => (
              <Path
                key={`line-${idx}`}
                d={`M ${v.x} ${v.y} L ${v.xOut} ${v.yOut}`}
                stroke="#1C1311"
                strokeWidth="3.5"
              />
            ))}
          </G>
        </AnimatedG>

        {/* LỚP PHỦ 3D GIỮ CỐ ĐỊNH */}
        <Circle cx="55" cy="55" r="50" fill="url(#ballShading)" style={styles.shadingOverlay} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shadingOverlay: {
    // Trên Web, mixBlendMode giúp lớp bóng đè hòa trộn rất đẹp, trên native tự động bỏ qua
    mixBlendMode: 'multiply', 
  }
});

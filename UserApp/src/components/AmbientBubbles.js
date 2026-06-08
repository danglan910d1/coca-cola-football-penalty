import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';

export default function AmbientBubbles() {
  const [bubbles, setBubbles] = useState([]);

  useEffect(() => {
    const arr = [];
    for (let i = 0; i < 48; i++) {
      arr.push({
        id: i,
        left: Math.random() * 100,
        size: Math.random() * 8 + 3,
        duration: Math.random() * 4 + 3,
        delay: Math.random() * 4
      });
    }
    setBubbles(arr);
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* CSS Keyframes Injection */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes rise {
          0% {
            transform: translateY(100vh) scale(0.3) rotate(0deg);
            opacity: 0;
          }
          15% {
            opacity: 0.8;
          }
          85% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-20vh) scale(1.6) rotate(360deg);
            opacity: 0;
          }
        }
      `}} />

      {bubbles.map(b => (
        <span
          key={b.id}
          style={{
            position: 'absolute',
            left: `${b.left}%`,
            width: `${b.size}px`,
            height: `${b.size}px`,
            bottom: `-20px`,
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            borderRadius: '50%',
            filter: 'blur(0.5px)',
            animation: `rise ${b.duration}s infinite linear`,
            animationDelay: `${b.delay}s`,
            pointerEvents: 'none',
            zIndex: 0
          }}
        />
      ))}
    </View>
  );
}

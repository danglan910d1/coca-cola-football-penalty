import React from 'react';

export default function SharedStyles() {
  return (
    <style dangerouslySetInnerHTML={{__html: `
      @import url('https://fonts.googleapis.com/css2?family=Anton&family=Hanken+Grotesk:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');
      
      html, body {
        overflow: hidden !important;
        background-color: #f1f5f9 !important; /* Màu nền sáng tránh lộ khoảng trắng */
      }

      .font-headline {
        font-family: 'Anton', sans-serif;
      }
      .font-sans {
        font-family: 'Hanken Grotesk', sans-serif;
      }
      .font-mono {
        font-family: 'JetBrains Mono', monospace;
      }

      @keyframes pulse-glow {
        0%, 100% {
          box-shadow: 0 0 15px rgba(244, 0, 9, 0.3);
          transform: scale(1);
        }
        50% {
          box-shadow: 0 0 35px rgba(244, 0, 9, 0.6), 0 0 50px rgba(244, 0, 9, 0.3);
          transform: scale(1.03);
        }
      }

      @keyframes logo-float {
        0%, 100% {
          transform: translateY(0px) rotate(0deg);
        }
        50% {
          transform: translateY(-5px) rotate(0.5deg);
        }
      }

      .animate-pulse-glow {
        animation: pulse-glow 2s infinite ease-in-out;
      }

      .animate-logo-float {
        animation: logo-float 4s infinite ease-in-out;
      }

      /* Stitch 3D Button Style - Improved with active compress and shadow blur */
      .btn-3d {
        position: relative;
        transition: transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.15s ease !important;
        background-color: #F40009 !important;
        border: none !important;
        cursor: pointer;
        animation: btn-breathing-glow 2.5s infinite ease-in-out;
      }

      @keyframes btn-breathing-glow {
        0%, 100% {
          transform: scale(1);
          box-shadow: 0 10px 0 #B30006, 0 15px 25px rgba(244, 0, 9, 0.35) !important;
        }
        50% {
          transform: scale(1.02);
          box-shadow: 0 10px 0 #B30006, 0 25px 40px rgba(244, 0, 9, 0.65), 0 0 15px rgba(244, 0, 9, 0.2) !important;
        }
      }

      .btn-3d:hover {
        transform: translateY(-2px) scale(1.025);
        box-shadow: 0 12px 0 #B30006, 0 25px 35px rgba(244, 0, 9, 0.4) !important;
        animation: none;
      }
      
      .btn-3d:active {
        transform: translateY(6px) scale(0.97) !important;
        box-shadow: 0 4px 0 #B30006, 0 10px 15px rgba(0, 0, 0, 0.3) !important;
        animation: none;
      }

      /* Stitch Bubbles rising from Button - Carbonated Soda Gas Style */
      .bubble {
        position: absolute;
        background: rgba(255, 255, 255, 0.85);
        border-radius: 50%;
        pointer-events: none;
        z-index: 10;
        animation: rise-btn 2.2s infinite linear;
        filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.75));
      }

      @keyframes rise-btn {
        0% { transform: translateY(0) scale(0.3); opacity: 0; }
        15% { opacity: 0.95; }
        85% { opacity: 0.95; }
        100% { transform: translateY(-150px) scale(1.2); opacity: 0; }
      }

      /* Pop animations for Title */
      @keyframes title-pop {
        0%, 100% {
          transform: scale(1);
          filter: drop-shadow(0 0 8px rgba(244, 0, 9, 0.2));
        }
        50% {
          transform: scale(1.03) rotate(-0.5deg);
          filter: drop-shadow(0 0 22px rgba(244, 0, 9, 0.5));
        }
      }
      
      .animate-title-pop {
        animation: title-pop 2.5s infinite ease-in-out;
      }

      .logo-glow {
        filter: drop-shadow(0 0 15px rgba(244, 0, 9, 0.5)) !important;
      }

      .form-glass {
        background: rgba(255, 255, 255, 0.82) !important; /* Kính mờ sáng */
        backdrop-filter: blur(25px) !important;
        border: 2.5px solid rgba(244, 0, 9, 0.3) !important; /* Viền đỏ classic Coca-Cola */
        box-shadow: 0 30px 60px -12px rgba(71, 85, 105, 0.25), 0 0 40px rgba(244, 0, 9, 0.1) !important; /* Đổ bóng sáng dịu */
      }

      /* 3D Spotlight Effect */
      .spotlight-cone {
        position: absolute;
        top: -20px;
        left: 50%;
        transform: translateX(-50%);
        width: 320px;
        height: 240px;
        background: radial-gradient(ellipse at top, rgba(255, 215, 0, 0.45) 0%, rgba(255, 215, 0, 0.04) 65%, transparent 80%);
        clip-path: polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%);
        pointer-events: none;
        z-index: 1;
      }

      /* 3D Pedestal (Bục quà) */
      .pedestal-ring {
        width: 170px;
        height: 22px;
        background: rgba(255, 255, 255, 0.9);
        border: 2.5px solid #FFD700;
        border-radius: 50%;
        box-shadow: 0 10px 25px rgba(71, 85, 105, 0.3), 0 0 15px rgba(255, 215, 0, 0.25);
        position: relative;
        z-index: 2;
      }
    `}} />
  );
}

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

      @keyframes led-blink-even {
        0%, 100% { fill: #ffbf00; filter: drop-shadow(0 0 5px #ffbf00); }
        50% { fill: #b91c1c; filter: none; }
      }
      
      @keyframes led-blink-odd {
        0%, 100% { fill: #b91c1c; filter: none; }
        50% { fill: #ffbf00; filter: drop-shadow(0 0 5px #ffbf00); }
      }

      .animate-pulse-glow {
        animation: pulse-glow 2s infinite ease-in-out;
      }

      .animate-logo-float {
        animation: logo-float 4s infinite ease-in-out;
      }

      .led-even {
        animation: led-blink-even 0.4s infinite ease-in-out;
      }

      .led-odd {
        animation: led-blink-odd 0.4s infinite ease-in-out;
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

      /* Glow animations for Winner Card */
      @keyframes winner-neon {
        0%, 100% {
          border-color: rgba(255, 215, 0, 0.6);
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.4), inset 0 0 10px rgba(255, 215, 0, 0.2);
          transform: scale(1);
        }
        50% {
          border-color: rgba(255, 255, 255, 1);
          box-shadow: 0 0 45px rgba(255, 215, 0, 0.95), inset 0 0 15px rgba(255, 255, 255, 0.4);
          transform: scale(1.02);
        }
      }

      .winner-card-glow {
        animation: winner-neon 1.2s infinite ease-in-out;
      }

      .logo-glow {
        filter: drop-shadow(0 0 15px rgba(244, 0, 9, 0.5)) !important;
      }

      /* Force dropdown list to float above animated 3D button on web */
      .form-area-container {
        z-index: 100 !important;
        position: relative !important;
      }
      .btn-wrap-container {
        z-index: 1 !important;
        position: relative !important;
      }

      .form-glass {
        background: rgba(255, 255, 255, 0.82) !important; /* Kính mờ sáng */
        backdrop-filter: blur(25px) !important;
        border: 2.5px solid rgba(244, 0, 9, 0.3) !important; /* Viền đỏ classic Coca-Cola */
        box-shadow: 0 30px 60px -12px rgba(71, 85, 105, 0.25), 0 0 40px rgba(244, 0, 9, 0.1) !important; /* Đổ bóng sáng dịu */
        transition: transform 0.1s ease-out;
      }

      .coca-select {
        appearance: none !important;
        -webkit-appearance: none !important;
        -moz-appearance: none !important;
        background-color: rgba(255, 255, 255, 0.95) !important;
        border: 1.5px solid rgba(255, 255, 255, 0.5) !important;
        color: #1E293B !important;
        font-weight: 700 !important;
        border-radius: 12px !important;
        padding: 11px 14px !important;
        padding-right: 40px !important;
        font-size: 15px !important;
        width: 100% !important;
        margin-bottom: 14px !important;
        outline: none !important;
        font-family: 'Outfit', sans-serif !important;
        background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e") !important;
        background-repeat: no-repeat !important;
        background-position: right 14px center !important;
        background-size: 16px !important;
        transition: all 0.2s ease !important;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.18) !important;
        cursor: pointer !important;
      }
      .coca-select:focus {
        border-color: #F40009 !important;
        background-color: #ffffff !important;
        box-shadow: 0 0 10px rgba(244, 0, 9, 0.25), 0 2px 8px rgba(71, 85, 105, 0.1) !important;
      }
      .coca-select:disabled {
        background-color: rgba(255, 255, 255, 0.6) !important;
        color: #94A3B8 !important;
        border-color: rgba(255, 255, 255, 0.3) !important;
        cursor: not-allowed !important;
        background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e") !important;
      }
      @media (min-width: 768px) {
        .coca-select {
          padding: 16px 20px !important;
          font-size: 20px !important;
          border-radius: 12px !important;
        }
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

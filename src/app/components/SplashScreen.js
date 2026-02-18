import React, { useEffect, useState, useRef } from 'react';

export default function SplashScreen({ visible = true, onFadeOutEnd }) {
  const [isVisible, setIsVisible] = useState(visible);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!visible) {
      setIsVisible(false);
      const timeout = setTimeout(() => {
        if (onFadeOutEnd) onFadeOutEnd();
      }, 600);
      return () => clearTimeout(timeout);
    } else {
      setIsVisible(true);
      // Auto-hide after 5 seconds
      const timeout = setTimeout(() => {
        setIsVisible(false);
        if (onFadeOutEnd) onFadeOutEnd();
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [visible, onFadeOutEnd]);

  if (!isVisible) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-[#181818] flex items-center justify-center"
    >
      <div
        className="relative flex flex-col items-center justify-center animate-splash-zoom w-full max-w-md px-4"
        style={{
          animation: 'splashZoom 5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        }}
      >
        {/* Animated SVG Music Visualizer */}
        <svg
          width="100%"
          height="60"
          viewBox="0 0 320 60"
          className="absolute inset-0 z-0"
          style={{
            filter: 'blur(2px) brightness(1.2)',
            opacity: 0.5,
            pointerEvents: 'none',
          }}
        >
          <g>
            <rect x="10" y="20" width="10" height="30" rx="5" fill="#4176D6">
              <animate attributeName="height" values="30;50;30" dur="0.8s" repeatCount="indefinite" />
              <animate attributeName="y" values="20;0;20" dur="0.8s" repeatCount="indefinite" />
            </rect>
            <rect x="30" y="10" width="10" height="40" rx="5" fill="#7B9685">
              <animate attributeName="height" values="40;20;40" dur="0.7s" repeatCount="indefinite" />
              <animate attributeName="y" values="10;30;10" dur="0.7s" repeatCount="indefinite" />
            </rect>
            <rect x="50" y="25" width="10" height="25" rx="5" fill="#C3D34B">
              <animate attributeName="height" values="25;45;25" dur="0.9s" repeatCount="indefinite" />
              <animate attributeName="y" values="25;5;25" dur="0.9s" repeatCount="indefinite" />
            </rect>
            <rect x="70" y="15" width="10" height="35" rx="5" fill="#E0B15B">
              <animate attributeName="height" values="35;15;35" dur="0.6s" repeatCount="indefinite" />
              <animate attributeName="y" values="15;35;15" dur="0.6s" repeatCount="indefinite" />
            </rect>
            <rect x="90" y="20" width="10" height="30" rx="5" fill="#D86C97">
              <animate attributeName="height" values="30;50;30" dur="1.0s" repeatCount="indefinite" />
              <animate attributeName="y" values="20;0;20" dur="1.0s" repeatCount="indefinite" />
            </rect>
            <rect x="110" y="10" width="10" height="40" rx="5" fill="#B23AC7">
              <animate attributeName="height" values="40;20;40" dur="0.8s" repeatCount="indefinite" />
              <animate attributeName="y" values="10;30;10" dur="0.8s" repeatCount="indefinite" />
            </rect>
            <rect x="130" y="25" width="10" height="25" rx="5" fill="#A05ACF">
              <animate attributeName="height" values="25;45;25" dur="0.7s" repeatCount="indefinite" />
              <animate attributeName="y" values="25;5;25" dur="0.7s" repeatCount="indefinite" />
            </rect>
            <rect x="150" y="15" width="10" height="35" rx="5" fill="#E25B3C">
              <animate attributeName="height" values="35;15;35" dur="0.9s" repeatCount="indefinite" />
              <animate attributeName="y" values="15;35;15" dur="0.9s" repeatCount="indefinite" />
            </rect>
          </g>
        </svg>
        
        {/* MoodyBeats Text */}
        <svg 
          width="100%" 
          height="40" 
          viewBox="0 0 320 40" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          className="relative z-10"
        >
          <text x="160" y="25" fontFamily="Montserrat, Arial, sans-serif" fontSize="24" fontWeight="500" letterSpacing="2" textAnchor="middle">
            <tspan fill="#4176D6">M</tspan>
            <tspan fill="#7B9685">o</tspan>
            <tspan fill="#C3D34B">o</tspan>
            <tspan fill="#E0B15B">d</tspan>
            <tspan fill="#D86C97">y</tspan>
            <tspan fill="#B23AC7">B</tspan>
            <tspan fill="#B23AC7">e</tspan>
            <tspan fill="#A05ACF">a</tspan>
            <tspan fill="#A05ACF">t</tspan>
            <tspan fill="#E25B3C">s</tspan>
          </text>
        </svg>
      </div>
    </div>
  );
} 
import React, { useState, useRef } from 'react';
import { motion, useSpring, useTransform } from 'motion/react';

export default function GlassCrystal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Motion physics for parallax rotation
  const rotateX = useSpring(0, { stiffness: 60, damping: 20 });
  const rotateY = useSpring(0, { stiffness: 60, damping: 20 });
  const lightX = useSpring(50, { stiffness: 80, damping: 25 });
  const lightY = useSpring(50, { stiffness: 80, damping: 25 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Relative position from -0.5 to 0.5
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    
    setCoords({
      x: Math.round((e.clientX - rect.left)),
      y: Math.round((e.clientY - rect.top)),
    });

    rotateX.set(-y * 22); // Tilt up/down
    rotateY.set(x * 22);  // Tilt left/right

    // Map light position from 0% to 100%
    lightX.set((x + 0.5) * 100);
    lightY.set((y + 0.5) * 100);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    rotateX.set(0);
    rotateY.set(0);
    lightX.set(50);
    lightY.set(50);
  };

  return (
    <div 
      id="crystal-interactive-container"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="relative flex items-center justify-center w-full max-w-[580px] aspect-square select-none cursor-default group"
    >
      {/* Dynamic Floor Soft Shadow - Pink/Terracotta Tinted */}
      <motion.div 
        id="crystal-floor-shadow"
        style={{
          scale: useTransform(rotateX, [-22, 22], [0.95, 1.05]),
          opacity: useTransform(rotateX, [-22, 22], [0.45, 0.65]),
        }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 w-4/5 h-12 bg-radial from-brand-terracotta/20 to-transparent blur-2xl pointer-events-none"
      />

      {/* Behind Ambient Neon Glow (only visible when hovered) */}
      <motion.div 
        id="crystal-behind-glow"
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="absolute w-72 h-72 rounded-full bg-radial from-brand-pink-dust/20 to-transparent blur-3xl pointer-events-none -z-10 animate-pulse-slow" 
      />

      {/* Main Glass 3D Crystal Body Container */}
      <motion.div
        id="crystal-3d-wrapper"
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative w-[90%] h-[90%] rounded-3xl overflow-hidden shadow-[0_30px_100px_rgba(189,91,130,0.12),inset_0_2px_4px_rgba(255,255,255,0.7)] border border-white/60 backdrop-blur-[24px] bg-white/20"
      >
        {/* PREMIUM MINIMALIST GLASSMORPHIC BRAND LOGO SVG */}
        <svg 
          viewBox="0 0 400 480" 
          className="w-full h-full p-8 drop-shadow-[0_20px_50px_rgba(188,70,56,0.12)] transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        >
          <defs>
            {/* Highly polished, multi-stop 3D glass gradients matching authentic brand colors */}
            <linearGradient id="logo-left-grad" x1="15%" y1="0%" x2="85%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="25%" stopColor="#f38b76" stopOpacity="0.75" />
              <stop offset="65%" stopColor="#bc4638" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#80261b" stopOpacity="0.9" />
            </linearGradient>

            <linearGradient id="logo-right-grad" x1="15%" y1="0%" x2="85%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="25%" stopColor="#e28fb1" stopOpacity="0.75" />
              <stop offset="65%" stopColor="#bd5b82" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#803251" stopOpacity="0.9" />
            </linearGradient>

            {/* Seamless gradient flowing horizontally across the entire H shape */}
            <linearGradient id="logo-h-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#bc4638" stopOpacity="0.85" />
              <stop offset="20%" stopColor="#f38b76" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#d57e8c" stopOpacity="0.8" />
              <stop offset="80%" stopColor="#e28fb1" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#bd5b82" stopOpacity="0.85" />
            </linearGradient>

            {/* Glowing refraction background */}
            <radialGradient id="prism-glow-refined" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f38b76" stopOpacity="0.3" />
              <stop offset="60%" stopColor="#bd5b82" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Core Ambient Back-Glow (only visible when hovered) */}
          <motion.circle 
            cx="200" 
            cy="240" 
            r="160" 
            fill="url(#prism-glow-refined)" 
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />

          {/* Left Figure Head (Width matched perfectly to the 85px left pillar, r=42.5) */}
          <circle 
            cx="102.5" 
            cy="75" 
            r="42.5" 
            fill="url(#logo-left-grad)" 
            stroke="rgba(255,255,255,0.45)" 
            strokeWidth="0.75"
            className="transition-all duration-300 hover:opacity-95"
          />

          {/* Right Figure Head (Width matched perfectly to the 85px right pillar, r=42.5) */}
          <circle 
            cx="297.5" 
            cy="75" 
            r="42.5" 
            fill="url(#logo-right-grad)" 
            stroke="rgba(255,255,255,0.45)" 
            strokeWidth="0.75"
            className="transition-all duration-300 hover:opacity-95"
          />

          {/* SINGLE SEAMLESS INTEGRATED H LETTER BODY (Left/Right Pillars + Wide Connector + Filleted Corners) */}
          <path 
            d="M 60,180 
               A 42.5,42.5 0 0,1 145,180 
               L 145,220 
               C 145,236.5 158.5,250 175,250 
               L 225,250 
               C 241.5,250 255,236.5 255,220 
               L 255,180 
               A 42.5,42.5 0 0,1 340,180 
               L 340,400 
               A 42.5,42.5 0 0,1 255,400 
               L 255,360 
               C 255,343.5 241.5,330 225,330 
               L 175,330 
               C 158.5,330 145,343.5 145,360 
               L 145,400 
               A 42.5,42.5 0 0,1 60,400 
               Z" 
            fill="url(#logo-h-grad)" 
            stroke="rgba(255,255,255,0.5)" 
            strokeWidth="1"
            className="transition-all duration-300 hover:opacity-95"
          />

          {/* Dynamic 3D Overlay Highlights & Flares */}
          <path 
            d="M 70,185 L 70,395" 
            stroke="rgba(255,255,255,0.45)" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            opacity="0.85" 
          />
          <path 
            d="M 330,185 L 330,395" 
            stroke="rgba(255,255,255,0.4)" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            opacity="0.85" 
          />
          
          {/* Pinpoint Connection Sparkle */}
          <circle cx="200" cy="290" r="2.5" fill="#ffffff" opacity="0.95" className="animate-pulse" />
        </svg>

        {/* Dynamic Light Refraction Layer 1 (Screen Overlay, only visible when hovered) */}
        <motion.div
          id="crystal-light-refraction-1"
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          style={{
            x: useTransform(lightX, (x) => `${x - 50}%`),
            y: useTransform(lightY, (y) => `${y - 50}%`),
          }}
          className="absolute w-[180%] h-[180%] top-[-40%] left-[-40%] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.45)_0%,rgba(255,150,150,0.15)_35%,transparent_70%)] mix-blend-screen pointer-events-none"
        />

        {/* Dynamic Coral Shimmer Layer (Color Dodge, only visible when hovered) */}
        <motion.div
          id="crystal-light-refraction-2"
          animate={{ opacity: isHovered ? 0.8 : 0 }}
          transition={{ duration: 0.4 }}
          style={{
            x: useTransform(lightX, (x) => `${(x - 50) * 0.3}%`),
            y: useTransform(lightY, (y) => `${(y - 50) * 0.3}%`),
            rotate: useTransform(lightX, (x) => (x - 50) * 0.4),
          }}
          className="absolute w-[200%] h-[200%] top-[-50%] left-[-50%] bg-[linear-gradient(45deg,rgba(201,111,115,0)_20%,rgba(201,111,115,0.2)_50%,rgba(189,91,130,0.25)_70%,rgba(255,255,255,0)_90%)] mix-blend-color-dodge pointer-events-none"
        />

        {/* Ultra-sharp Edge Highlight Lines */}
        <div className="absolute inset-0 border border-white/30 rounded-3xl pointer-events-none mix-blend-overlay" />
        <div className="absolute inset-[1px] border border-brand-pink-dust/10 rounded-3xl pointer-events-none mix-blend-normal" />

        {/* Interactive Floating Glare (only visible when hovered) */}
        <motion.div
          id="crystal-interactive-glare"
          animate={{ opacity: isHovered ? 0.3 : 0 }}
          transition={{ duration: 0.4 }}
          style={{
            x: useTransform(lightX, (x) => `${x}%`),
            y: useTransform(lightY, (y) => `${y}%`),
          }}
          className="absolute w-48 h-48 bg-white rounded-full blur-2xl mix-blend-overlay pointer-events-none -mt-24 -ml-24 top-0 left-0"
        />
      </motion.div>

    </div>
  );
}


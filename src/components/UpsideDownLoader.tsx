"use client";

import React, { useState, useEffect } from "react";

interface LoaderProps {
  onComplete?: () => void;
  duration?: number; // duration of simulated load in ms
}

function FogParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      <div className="ash-particle ash-1"></div>
      <div className="ash-particle ash-2"></div>
      <div className="ash-particle ash-3"></div>
      <div className="ash-particle ash-4"></div>
      <div className="ash-particle ash-5"></div>
      <div className="ash-particle ash-6"></div>
      <div className="ash-particle ash-7"></div>
      <div className="ash-particle ash-8"></div>
      <div className="ash-particle ash-9"></div>
      <div className="ash-particle ash-10"></div>
    </div>
  );
}

export default function UpsideDownLoader({ onComplete, duration = 1500 }: LoaderProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const stepTime = duration / 100;
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          // Let the user see 100% for a tiny split second, then trigger onComplete
          setTimeout(() => {
            onComplete?.();
          }, 100);
          return 100;
        }
        return prev + 1;
      });
    }, stepTime);

    return () => clearInterval(timer);
  }, [duration, onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black overflow-hidden select-none select-none">
      {/* Fog/Ash Spores background */}
      <FogParticles />

      {/* Red sheet lightning flash overlay */}
      <div className="absolute inset-0 bg-transparent pointer-events-none animate-lightning-flash z-10" />

      {/* Portal & Sparks Container */}
      <div className="relative w-56 h-56 flex items-center justify-center mb-8 z-20">
        
        {/* Lightning Spark 1 (Top-Left) */}
        <svg 
          className="absolute w-20 h-20 text-red-500 animate-spark-1 -top-4 -left-8 pointer-events-none filter drop-shadow-[0_0_8px_rgba(229,9,20,0.8)]" 
          viewBox="0 0 100 100" 
          fill="currentColor"
        >
          <path d="M50 0 L40 40 L60 40 L30 100 L45 60 L30 60 Z" />
        </svg>
        
        {/* Lightning Spark 2 (Bottom-Right) */}
        <svg 
          className="absolute w-20 h-20 text-red-500 animate-spark-2 -bottom-6 -right-6 pointer-events-none filter drop-shadow-[0_0_8px_rgba(229,9,20,0.8)]" 
          viewBox="0 0 100 100" 
          fill="currentColor"
        >
          <path d="M60 0 L45 45 L65 45 L35 100 L50 55 L35 55 Z" />
        </svg>

        {/* Outer Pulsing Portal Aura Ring */}
        <div className="absolute inset-0 rounded-full border border-red-500/20 animate-portal-pulse"></div>

        {/* Rotating Portal Vortex */}
        <div className="absolute w-44 h-44 rounded-full bg-gradient-to-tr from-black via-red-950/20 to-blue-955/20 border-4 border-double border-red-500/30 animate-portal-rotate flex items-center justify-center glow-red" style={{ animationDuration: "12s" }}>
          {/* Internal swirls */}
          <div className="absolute w-full h-1 bg-red-500/10 rotate-45"></div>
          <div className="absolute w-full h-1 bg-blue-500/10 -rotate-45"></div>
          <div className="absolute w-full h-1 bg-red-500/5 rotate-90"></div>
        </div>

        {/* Inner Glowing Core Portal - Eerie Dark Void */}
        <div className="absolute w-32 h-32 rounded-full bg-black shadow-[inset_0_0_20px_rgba(229,9,20,0.85),_0_0_15px_rgba(10,80,255,0.4)] flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-red-950/10 border border-red-500/20 animate-ping opacity-30" style={{ animationDuration: "2.5s" }}></div>
        </div>
      </div>

      {/* Main Text Header */}
      <div className="text-center space-y-4 z-20">
        <h2 className="text-xl sm:text-2xl font-stranger tracking-widest text-red-500 glow-text-red uppercase animate-pulse" style={{ animationDuration: "2s" }}>
          Entering The Upside Down...
        </h2>
        
        {/* Progress bar container */}
        <div className="flex flex-col items-center">
          <div className="w-60 h-1 bg-zinc-950 rounded-full overflow-hidden border border-red-955/20 glow-red relative">
            <div 
              className="h-full bg-gradient-to-r from-blue-700 via-red-900 to-red-655 transition-all duration-75 ease-out" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-red-500/80 mt-2 tracking-wider glow-text-red">{progress}%</span>
        </div>
      </div>
    </div>
  );
}

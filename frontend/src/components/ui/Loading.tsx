"use client";

import React from 'react';

export default function Loading() {
  return (
    <div className="relative flex items-center justify-center pointer-events-none select-none">
      {/* Container - Responsive sizing */}
      <div className="relative text-[40px] sm:text-[50px] md:text-[80px] font-['Google_Sans_Flex'] leading-none tracking-tighter">
        
        {/* Layer 1: The Outline (Structure) */}
        <div 
          className="relative z-20 font-light text-transparent"
          style={{ 
            WebkitTextStroke: '1.5px var(--logo-stroke)', 
          }}
        >
          ins<span className="font-extrabold" style={{ WebkitTextStroke: '2px var(--logo-stroke)' }}>y</span>dr
        </div>

        {/* Layer 2: The Liquid Wave (Animation) */}
        <div 
          className="absolute top-0 left-0 w-full h-full z-10 animate-rise-flow text-[#D60000]"
        >
          {/* We use background-clip: text to emulate the liquid being inside the text, 
              utilizing the exact gradient pattern from the reference */}
          <span 
            className="block font-light text-transparent bg-clip-text animate-wave-bg-scroll"
            style={{
              backgroundImage: `
                radial-gradient(circle at 50% 100%, #D60000 25%, transparent 26%),
                radial-gradient(circle at 50% 0%, #D60000 25%, transparent 26%)
              `,
              backgroundSize: '60px 100px', 
              backgroundPosition: '0 100%',
              backgroundRepeat: 'repeat-x',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
            }}
          >
            ins<span className="font-extrabold">y</span>dr
          </span>
        </div>
      </div>
    </div>
  );
}

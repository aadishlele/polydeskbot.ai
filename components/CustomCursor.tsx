import React, { useEffect, useRef } from 'react';

const CustomCursor: React.FC = () => {
  const shadowRef = useRef<HTMLDivElement>(null);
  const yellowDotRef = useRef<HTMLDivElement>(null);
  const maroonDotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      
      // 1. Update Position (Direct DOM manipulation for performance)
      const updatePos = (ref: React.RefObject<HTMLDivElement | null>) => {
        if (ref.current) {
          ref.current.style.left = `${clientX}px`;
          ref.current.style.top = `${clientY}px`;
        }
      };

      updatePos(shadowRef);
      updatePos(yellowDotRef);
      updatePos(maroonDotRef);

      // 2. Determine Cursor Type based on hovered element
      const target = e.target as HTMLElement;
      // Look for the closest parent with a data-cursor attribute. 
      // Values: 'default' (Bg), 'yellow' (Maroon Elements), 'maroon' (White Elements/Yellow Btns)
      const cursorType = target.closest('[data-cursor]')?.getAttribute('data-cursor') || 'default';

      if (shadowRef.current && yellowDotRef.current && maroonDotRef.current) {
        if (cursorType === 'maroon') {
          // Case: White Background or Yellow Button -> Show Maroon Dot, Hide Shadow
          maroonDotRef.current.style.opacity = '1';
          yellowDotRef.current.style.opacity = '0';
          shadowRef.current.style.opacity = '0';
        } else if (cursorType === 'yellow') {
          // Case: Maroon Element (Header/User Bubble) -> Show Yellow Dot, Hide Shadow
          maroonDotRef.current.style.opacity = '0';
          yellowDotRef.current.style.opacity = '1';
          shadowRef.current.style.opacity = '0';
        } else {
          // Case: Default (Main Background) -> Show Yellow Dot, Show Shadow
          maroonDotRef.current.style.opacity = '0';
          yellowDotRef.current.style.opacity = '1';
          shadowRef.current.style.opacity = '1';
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const commonStyle: React.CSSProperties = {
    position: 'fixed',
    left: '0px',
    top: '0px',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
  };

  return (
    <>
      {/* Shadow: Only visible on Main Background */}
      <div
        ref={shadowRef}
        className="z-[9999] rounded-full transition-opacity duration-300 ease-out"
        style={{
          ...commonStyle,
          width: '150px',
          height: '150px',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 60%)',
          opacity: 1, 
        }}
      />

      {/* Yellow Dot: Visible on Maroon Backgrounds */}
      <div
        ref={yellowDotRef}
        className="z-[10000] rounded-full shadow-[0_0_0.7px_rgba(255,199,44,0.5)] transition-opacity duration-150"
        style={{
          ...commonStyle,
          width: '12px',
          height: '12px',
          backgroundColor: '#FFC72C', // Yellow
          opacity: 1,
        }}
      />

      {/* Maroon Dot: Visible on White Backgrounds */}
      <div
        ref={maroonDotRef}
        className="z-[10001] rounded-full transition-opacity duration-150"
        style={{
          ...commonStyle,
          width: '12px',
          height: '12px',
          backgroundColor: '#2B0000', // Maroon
          opacity: 0,
        }}
      />
    </>
  );
};

export default CustomCursor;
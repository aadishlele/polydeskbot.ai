import React, { useEffect, useRef } from 'react';
import { Dot } from '../types';

const DOT_SPACING = 30;
const PROXIMITY_DISTANCE = 100;
const MOVE_STRENGTH = 15;
const DOT_SIZE = 4;

interface DotGridProps {
  isHoveringCard: boolean;
}

const DotGrid: React.FC<DotGridProps> = ({ isHoveringCard }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const requestRef = useRef<number>(0);
  
  // Track mouse position locally to avoid re-renders
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Initialize dots
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const generateDots = () => {
      container.innerHTML = '';
      dotsRef.current = [];
      
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      const cols = Math.ceil(width / DOT_SPACING);
      const rows = Math.ceil(height / DOT_SPACING);

      const startX = (width - (cols * DOT_SPACING)) / 2;
      const startY = (height - (rows * DOT_SPACING)) / 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const dotEl = document.createElement('div');
          
          // Apply basic styles directly for performance
          dotEl.style.position = 'absolute';
          dotEl.style.width = `${DOT_SIZE}px`;
          dotEl.style.height = `${DOT_SIZE}px`;
          dotEl.style.borderRadius = '50%';
          dotEl.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
          dotEl.style.left = `${c * DOT_SPACING + startX}px`;
          dotEl.style.top = `${r * DOT_SPACING + startY}px`;
          dotEl.style.willChange = 'transform';
          // CSS transition for smooth return to center when mouse leaves
          dotEl.style.transition = 'transform 0.1s ease-out'; 

          container.appendChild(dotEl);

          dotsRef.current.push({
            element: dotEl,
            initialX: c * DOT_SPACING + startX + (DOT_SIZE / 2),
            initialY: r * DOT_SPACING + startY + (DOT_SIZE / 2)
          });
        }
      }
    };

    generateDots();
    
    const handleResize = () => generateDots();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Animation Loop
  useEffect(() => {
    const animate = () => {
      // If hovering card, we "reset" dots by passing coordinates far away
      const targetX = isHoveringCard ? -1000 : mouseRef.current.x;
      const targetY = isHoveringCard ? -1000 : mouseRef.current.y;

      dotsRef.current.forEach(dot => {
        const dx = dot.initialX - targetX;
        const dy = dot.initialY - targetY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < PROXIMITY_DISTANCE) {
          const influence = 1 - (distance / PROXIMITY_DISTANCE);
          const angle = Math.atan2(dy, dx);
          
          const moveX = Math.cos(angle) * MOVE_STRENGTH * influence;
          const moveY = Math.sin(angle) * MOVE_STRENGTH * influence;

          dot.element.style.transform = `translate(${moveX}px, ${moveY}px)`;
        } else {
           // Only reset if it's not already 0,0 (optimization check usually done by browser but good to be explicit)
           if (dot.element.style.transform !== 'translate(0px, 0px)') {
             dot.element.style.transform = 'translate(0px, 0px)';
           }
        }
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isHoveringCard]); // Only re-bind animation loop if hovering state changes (minimal impact)

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden" 
    />
  );
};

export default DotGrid;
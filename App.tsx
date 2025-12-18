import React, { useState } from 'react';
import DotGrid from './components/DotGrid';
import CustomCursor from './components/CustomCursor';
import Portal from './components/Portal';
import ChatInterface from './components/ChatInterface';
import { ViewState } from './types';

const App: React.FC = () => {
  const [isHoveringCard, setIsHoveringCard] = useState(false);
  const [view, setView] = useState<ViewState>('portal');

  const handleLaunch = () => {
    setView('chat');
    setIsHoveringCard(false); // Reset hover state when entering chat
  };
  
  const handleBack = () => {
      setView('portal');
  }

  return (
    <div 
      className="relative min-h-screen w-full overflow-hidden bg-[#2B0000]"
      data-cursor="default" // Default state: Yellow cursor + Shadow
    >
      {/* Background Visuals */}
      <DotGrid isHoveringCard={isHoveringCard} />
      
      <CustomCursor />

      {/* Main Content Container - Centers both Portal and Chat */}
      <div className="relative z-[1000] min-h-screen w-full flex justify-center items-center p-4 md:p-6">
        {view === 'portal' ? (
          <Portal
            onMouseEnter={() => setIsHoveringCard(true)}
            onMouseLeave={() => setIsHoveringCard(false)}
            onLaunch={handleLaunch}
          />
        ) : (
          <ChatInterface
            onMouseEnter={() => setIsHoveringCard(true)}
            onMouseLeave={() => setIsHoveringCard(false)}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  );
};

export default App;
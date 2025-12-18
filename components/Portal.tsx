import React from 'react';
import { COLORS } from '../constants';

interface PortalProps {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onLaunch: () => void;
}

const Portal: React.FC<PortalProps> = ({ onMouseEnter, onMouseLeave, onLaunch }) => {
  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      data-cursor="maroon" // White background -> Maroon cursor
      className="relative z-[1000] w-[90%] max-w-[1200px] bg-white rounded-[15px] shadow-2xl overflow-hidden border-2 border-white transform transition-transform duration-300"
    >
      <img
        src="https://www.asu.edu/sites/default/files/2022-03/210618-CollegeSchool-HeroPoly.jpeg"
        alt="University building exterior"
        className="w-full h-[300px] object-cover block"
      />

      <div className="p-[40px_30px] text-center">
        <h1 className="text-[2.5em] m-0 mb-[10px] font-bold" style={{ color: COLORS.MAROON }}>
          University Housing Desk Chatbot Portal
        </h1>
        <h2 className="text-[1.4em] mt-[5px] font-normal" style={{ color: COLORS.YELLOW }}>
          Arizona State University
        </h2>

        <p className="text-[1.2em] leading-relaxed mb-[40px] font-normal text-black mt-8">
          Your friendly chatbot to answer ASU university housing questions and get genuine answers.
        </p>

        <button
          onClick={onLaunch}
          data-cursor="maroon" // Yellow button -> Maroon cursor for contrast
          className="inline-block text-[1.3em] font-bold py-[18px] px-[40px] rounded-[10px] border-none cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-md hover:shadow-lg active:translate-y-1 active:shadow-sm"
          style={{ backgroundColor: COLORS.YELLOW, color: COLORS.BLACK }}
        >
          Launch polydeskbot.ai
        </button>

        <div className="mt-[30px] text-[1em] font-bold">
          <p style={{ color: COLORS.GREY_FOOTER }}>&copy; 2025 University Housing Polytechnic</p>
        </div>
      </div>
    </div>
  );
};

export default Portal;
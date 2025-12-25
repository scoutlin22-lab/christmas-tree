
import React, { useState } from 'react';

interface OverlayProps {
  onSendWish?: () => void;
}

const Overlay: React.FC<OverlayProps> = ({ onSendWish }) => {
  const [wish, setWish] = useState('');

  const handleSend = () => {
    if (wish.trim()) {
      onSendWish?.();
      setWish('');
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 md:p-16 z-10 select-none">
      {/* Header - Top Left removed, Top Right remains */}
      <div className="flex justify-end items-start opacity-0 animate-[fadeIn_1s_ease-out_forwards]">
        <div className="text-right">
            <span className="text-white/20 text-[10px] md:text-xs uppercase tracking-[0.4em]">Dec 2024</span>
        </div>
      </div>

      {/* Center Message & Wish Input */}
      <div className="flex-1 flex flex-col items-center justify-center opacity-0 animate-[fadeIn_2s_ease-out_1s_forwards]">
        <div className="text-center group pointer-events-auto cursor-default mb-12">
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent mx-auto mb-6 group-hover:w-32 transition-all duration-700"></div>
            <p className="text-white/80 text-lg md:text-2xl font-extralight italic tracking-[0.15em] px-4 leading-relaxed">
              Experience the <span className="text-yellow-400/80">warmth</span>, <br className="md:hidden" /> and <span className="text-yellow-400/80">make a wish</span>.
            </p>
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent mx-auto mt-6 group-hover:w-32 transition-all duration-700"></div>
        </div>

        {/* Wish Interaction UI */}
        <div className="w-full max-w-md bg-white/5 backdrop-blur-md border border-white/10 p-2 rounded-full flex items-center shadow-2xl transition-all focus-within:border-yellow-500/50 focus-within:bg-white/10 pointer-events-auto">
          <input 
            type="text" 
            value={wish}
            onChange={(e) => setWish(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="TYPE YOUR WISH..." 
            className="flex-1 bg-transparent border-none outline-none text-white px-6 py-2 text-xs md:text-sm tracking-widest placeholder:text-white/20"
          />
          <button 
            onClick={handleSend}
            className="text-yellow-500 font-bold px-6 py-2 hover:text-white transition-colors text-xs md:text-sm tracking-[0.2em] uppercase"
          >
            SEND
          </button>
        </div>
      </div>

      {/* Footer - Bottom Left removed, Bottom Right remains */}
      <div className="flex flex-col md:flex-row justify-end items-end md:items-center space-y-6 md:space-y-0 opacity-0 animate-[fadeIn_1.5s_ease-out_2s_forwards]">
        <div className="group pointer-events-auto cursor-pointer">
          <div className="bg-white/5 border border-white/10 backdrop-blur-xl px-8 py-4 rounded-full hover:bg-yellow-500/10 hover:border-yellow-500/30 transition-all duration-500 flex items-center space-x-3">
              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
              <p className="text-yellow-500/80 text-xs font-bold tracking-[0.2em] uppercase">Love & Light</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        input::placeholder {
          font-family: 'Space Mono', monospace;
        }
      `}</style>
    </div>
  );
};

export default Overlay;

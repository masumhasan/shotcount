import React from 'react';
import { X } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface ChatHeaderProps {
  onClose?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ onClose }) => (
  <div className="bg-surface-raised p-6 text-text-main flex justify-between items-center border-b border-border">
    <div className="flex items-center gap-3">
      <div className="relative w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
        <DotLottieReact
          src="/bot.lottie"
          autoplay
          loop
          className="w-16 h-16 absolute -top-3 -left-3"
        />
      </div>
      <div>
        <h3 className="font-bold leading-tight text-text-main">Shotcount Assistant</h3>
        <p className="text-[10px] text-text-warm uppercase tracking-widest font-bold">
          Private Concierge
        </p>
      </div>
    </div>
    {onClose && (
      <button
        onClick={onClose}
        className="p-2 hover:bg-border rounded-full transition-colors"
      >
        <X className="w-5 h-5 text-text-muted" />
      </button>
    )}
  </div>
);

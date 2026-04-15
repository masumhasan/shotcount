import React from 'react';

export const TypingIndicator: React.FC = () => (
  <div className="flex items-center gap-1 p-4 bg-surface-bubble-bot border border-border rounded-2xl rounded-tl-none w-16">
    <div className="w-1.5 h-1.5 bg-accent/40 rounded-full animate-bounce" />
    <div className="w-1.5 h-1.5 bg-accent/40 rounded-full animate-bounce [animation-delay:0.2s]" />
    <div className="w-1.5 h-1.5 bg-accent/40 rounded-full animate-bounce [animation-delay:0.4s]" />
  </div>
);

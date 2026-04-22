import React from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ChatHeaderProps {
  onClose?: () => void;
}

const HOME_URL = 'https://shotcount.com/';

export const ChatHeader: React.FC<ChatHeaderProps> = ({ onClose }) => (
  <div
    className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-border bg-surface-raised px-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] py-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-text-main sm:gap-3 sm:p-6 sm:pt-6"
    style={{ WebkitBackdropFilter: 'blur(6px)', backdropFilter: 'blur(6px)' }}
  >
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
        <img src="/Shotcount-Logo.png" alt="Shotcount logo" className="h-full w-full object-contain" />
      </div>
      <div className="min-w-0">
        <h3 className="truncate font-bold leading-tight text-text-main">Shotcount Assistant</h3>
        <p className="hidden text-[10px] font-bold uppercase tracking-widest text-text-warm min-[360px]:block">
          Private Concierge
        </p>
      </div>
    </div>
    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
      <a
        href={HOME_URL}
        className={cn(
          'inline-flex shrink-0 items-center gap-1 rounded-xl border-2 border-accent bg-primary px-2 py-2 text-[11px] font-semibold whitespace-nowrap text-white shadow-sm',
          'transition-all hover:border-accent-hover hover:bg-primary-hover hover:shadow-[0_4px_20px_-4px_rgba(198,168,107,0.2)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised',
          'sm:gap-2 sm:px-3 sm:text-xs',
        )}
      >
        <ArrowLeft className="h-3.5 w-3.5 shrink-0 text-white/90 sm:h-4 sm:w-4" aria-hidden />
        <span className="hidden sm:inline">Back to Home</span>
        <span className="sm:hidden">Home</span>
      </a>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 transition-colors hover:bg-border"
          aria-label="Close chat"
        >
          <X className="h-5 w-5 text-text-muted" />
        </button>
      )}
    </div>
  </div>
);

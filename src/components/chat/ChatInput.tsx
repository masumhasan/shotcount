import React from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ value, onChange, onSubmit }) => (
  <div className="border-t border-border bg-surface-raised px-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-6">
    <form onSubmit={onSubmit} className="flex min-w-0 gap-2 sm:gap-3">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your message..."
        className="min-w-0 flex-1 bg-primary border border-border rounded-2xl px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
      />
      <button
        type="submit"
        disabled={!value.trim()}
        className="h-12 w-12 shrink-0 bg-accent text-primary rounded-2xl flex items-center justify-center hover:bg-accent-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent/10"
      >
        <Send className="w-5 h-5" />
      </button>
    </form>
  </div>
);

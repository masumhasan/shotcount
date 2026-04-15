import React, { useState } from 'react';
import { Upload, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../../lib/utils';
import { TypingIndicator } from './TypingIndicator';
import { getImageByKey } from '../../lib/image-catalog';
import type { Message } from '../../types';

const ACUITY_OWNER_ID = '39033219';

interface ChatMessagesProps {
  messages: Message[];
  isTyping: boolean;
  contactCollected: boolean;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  onOptionSelect: (option: string) => void;
  onMultiSelect: (options: string[]) => void;
  onFlowStep: (input: string) => void;
  onContactSubmit: (name: string, phone: string, email: string) => void;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isTyping,
  contactCollected,
  chatEndRef,
  onOptionSelect,
  onMultiSelect,
  onFlowStep,
  onContactSubmit,
}) => (
  <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-primary">
    {messages.map((msg) => (
      <div
        key={msg.id}
        className={cn(
          'flex flex-col max-w-[85%]',
          msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start',
        )}
      >
        <MessageBubble msg={msg} />
        {msg.options && msg.multiSelect && (
          <MultiSelectButtons options={msg.options} onConfirm={onMultiSelect} />
        )}
        {msg.options && !msg.multiSelect && (
          <OptionButtons options={msg.options} onSelect={onOptionSelect} />
        )}
        {msg.type === 'contact-form' && !contactCollected && (
          <ContactForm onSubmit={onContactSubmit} />
        )}
        {msg.type === 'upload' && (
          <PhotoUpload
            onUpload={() => onFlowStep('photo_uploaded')}
            onSkip={() => onFlowStep('skip_photo')}
          />
        )}
        {msg.type === 'scheduling' && <SchedulingEmbed />}
        {msg.type === 'button' && msg.buttonUrl && (
          <BookingButton text={msg.buttonText} url={msg.buttonUrl} />
        )}
      </div>
    ))}
    {isTyping && <TypingIndicator />}
    <div ref={chatEndRef} />
  </div>
);

/* ── Sub-components ─────────────────────────────────────────────── */

const MessageBubble: React.FC<{ msg: Message }> = ({ msg }) => (
  <div
    className={cn(
      'p-4 rounded-2xl text-sm leading-relaxed prose prose-sm max-w-none prose-invert',
      msg.sender === 'user'
        ? 'bg-surface-bubble-user text-text-main rounded-tr-none'
        : msg.sender === 'admin'
          ? 'bg-accent/10 text-text-main rounded-tl-none border border-accent/20'
          : 'bg-surface-bubble-bot text-text-main rounded-tl-none border border-border',
    )}
  >
    {msg.sender === 'admin' && (
      <p className="text-[10px] font-bold text-text-warm uppercase tracking-widest mb-1 not-prose">
        Concierge Reply
      </p>
    )}
    <MessageContent text={msg.text} />
  </div>
);

const IMAGE_REF_REGEX = /\{\{([a-zA-Z0-9_-]+)\}\}/g;

const MessageContent: React.FC<{ text: string }> = ({ text }) => {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const regex = new RegExp(IMAGE_REF_REGEX);

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <ReactMarkdown key={`t-${lastIndex}`} remarkPlugins={[remarkGfm]}>
          {text.slice(lastIndex, match.index)}
        </ReactMarkdown>,
      );
    }
    const img = getImageByKey(match[1]);
    if (img) {
      parts.push(
        <img
          key={`img-${match[1]}`}
          src={img.src}
          alt={img.alt}
          className="rounded-xl w-full my-2 not-prose"
        />,
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(
      <ReactMarkdown key={`t-${lastIndex}`} remarkPlugins={[remarkGfm]}>
        {text.slice(lastIndex)}
      </ReactMarkdown>,
    );
  }

  return <>{parts}</>;
};

const ContactForm: React.FC<{ onSubmit: (name: string, phone: string, email: string) => void }> = ({
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && phone.trim()) {
      onSubmit(name.trim(), phone.trim(), email.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 w-full space-y-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="First Name *"
        className="w-full bg-surface-raised border border-border rounded-xl px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
        required
      />
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Phone *"
        className="w-full bg-surface-raised border border-border rounded-xl px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
        required
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email (optional)"
        className="w-full bg-surface-raised border border-border rounded-xl px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
      />
      <button
        type="submit"
        disabled={!name.trim() || !phone.trim()}
        className="w-full py-3 bg-accent text-primary rounded-xl text-sm font-bold hover:bg-accent-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </form>
  );
};

const OptionButtons: React.FC<{ options: string[]; onSelect: (opt: string) => void }> = ({
  options,
  onSelect,
}) => (
  <div className="mt-3 flex flex-wrap gap-2">
    {options.map((opt) => (
      <button
        key={opt}
        onClick={() => onSelect(opt)}
        className="px-4 py-2 bg-surface-raised border border-border rounded-full text-xs font-bold text-text-muted hover:border-accent hover:text-accent transition-all"
      >
        {opt}
      </button>
    ))}
  </div>
);

const MultiSelectButtons: React.FC<{
  options: string[];
  onConfirm: (selected: string[]) => void;
}> = ({ options, onConfirm }) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (opt: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(opt)) next.delete(opt);
      else next.add(opt);
      return next;
    });
  };

  return (
    <div className="mt-3 w-full">
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            className={cn(
              'px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5',
              selected.has(opt)
                ? 'bg-accent text-primary border border-accent'
                : 'bg-surface-raised border border-border text-text-muted hover:border-accent hover:text-accent',
            )}
          >
            {selected.has(opt) && <Check className="w-3 h-3" />}
            {opt}
          </button>
        ))}
      </div>
      {selected.size > 0 && (
        <button
          onClick={() => onConfirm(Array.from(selected))}
          className="mt-3 px-6 py-2 bg-accent text-primary rounded-full text-xs font-bold hover:bg-accent-hover transition-all"
        >
          Continue with {selected.size} selected
        </button>
      )}
    </div>
  );
};

const PhotoUpload: React.FC<{ onUpload: () => void; onSkip: () => void }> = ({
  onUpload,
  onSkip,
}) => (
  <div className="mt-3 w-full">
    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:bg-surface-raised transition-all bg-surface-raised/50">
      <div className="flex flex-col items-center justify-center pt-5 pb-6">
        <Upload className="w-6 h-6 text-accent/60 mb-2" />
        <p className="text-xs text-text-muted font-bold">Upload Space Photo</p>
      </div>
      <input type="file" className="hidden" onChange={onUpload} />
    </label>
    <button
      onClick={onSkip}
      className="w-full mt-2 text-[10px] font-bold text-text-muted/60 uppercase tracking-widest hover:text-accent"
    >
      Skip for now
    </button>
  </div>
);

const SchedulingEmbed: React.FC = () => (
  <div className="mt-4 w-full rounded-2xl overflow-hidden border border-border">
    <iframe
      src={`https://app.acuityscheduling.com/schedule.php?owner=${ACUITY_OWNER_ID}&ref=embedded_csp`}
      title="Schedule Appointment"
      width="100%"
      height="600"
      frameBorder="0"
      allow="payment"
      className="block"
    />
  </div>
);

const BookingButton: React.FC<{ text?: string; url?: string }> = ({ text, url }) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className="mt-4 w-full py-4 bg-accent text-primary rounded-2xl flex items-center justify-center gap-2 font-bold hover:bg-accent-hover transition-all shadow-lg shadow-accent/10"
  >
    {text}
  </a>
);

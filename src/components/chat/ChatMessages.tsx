import React, { useState } from 'react';
import { Upload } from 'lucide-react';
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
  onFlowStep: (input: string) => void;
  onContactSubmit: (name: string, phone: string, email: string) => void;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isTyping,
  contactCollected,
  chatEndRef,
  onOptionSelect,
  onFlowStep,
  onContactSubmit,
}) => (
  <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-stone-50/30">
    {messages.map((msg) => (
      <div
        key={msg.id}
        className={cn(
          'flex flex-col max-w-[85%]',
          msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start',
        )}
      >
        <MessageBubble msg={msg} />
        {msg.options && <OptionButtons options={msg.options} onSelect={onOptionSelect} />}
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
      'p-4 rounded-2xl text-sm leading-relaxed prose prose-sm max-w-none',
      msg.sender === 'user'
        ? 'bg-primary text-white rounded-tr-none prose-invert'
        : msg.sender === 'admin'
          ? 'bg-secondary/10 text-text-main rounded-tl-none border border-secondary/30'
          : 'bg-white text-text-main rounded-tl-none border border-border shadow-sm',
    )}
  >
    {msg.sender === 'admin' && (
      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1 not-prose">
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
        placeholder="Your First Name *"
        className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        required
      />
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Phone number *"
        className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        required
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email (optional)"
        className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
      />
      <button
        type="submit"
        disabled={!name.trim() || !phone.trim()}
        className="w-full py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
        className="px-4 py-2 bg-white border border-border rounded-full text-xs font-bold text-text-muted hover:border-primary hover:text-primary transition-all shadow-sm"
      >
        {opt}
      </button>
    ))}
  </div>
);

const PhotoUpload: React.FC<{ onUpload: () => void; onSkip: () => void }> = ({
  onUpload,
  onSkip,
}) => (
  <div className="mt-3 w-full">
    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:bg-surface transition-all bg-white">
      <div className="flex flex-col items-center justify-center pt-5 pb-6">
        <Upload className="w-6 h-6 text-primary/60 mb-2" />
        <p className="text-xs text-text-muted font-bold">Upload Space Photo</p>
      </div>
      <input type="file" className="hidden" onChange={onUpload} />
    </label>
    <button
      onClick={onSkip}
      className="w-full mt-2 text-[10px] font-bold text-text-muted/60 uppercase tracking-widest hover:text-primary"
    >
      Skip for now
    </button>
  </div>
);

const SchedulingEmbed: React.FC = () => (
  <div className="mt-4 w-full rounded-2xl overflow-hidden border border-border shadow-sm">
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
    className="mt-4 w-full py-4 bg-primary text-white rounded-2xl flex items-center justify-center gap-2 font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
  >
    {text}
  </a>
);

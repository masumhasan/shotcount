import React from 'react';
import { MessageSquare, Send, Trash2, User, X } from 'lucide-react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../../../lib/utils';
import type { Lead } from '../../../types';

function LeadMetaField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-slate-400 sm:text-[10px]">
        {label}
      </p>
      <p className="break-words text-xs font-bold leading-snug text-slate-800 sm:text-sm">{value}</p>
    </div>
  );
}

export interface LeadThreadModalProps {
  lead: Lead;
  adminReplyValue: string;
  onAdminReplyChange: (v: string) => void;
  onAdminReplySubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  onDelete: (id: string) => void;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
}

export function LeadThreadModal({
  lead,
  adminReplyValue,
  onAdminReplyChange,
  onAdminReplySubmit,
  onClose,
  onDelete,
  chatEndRef,
}: LeadThreadModalProps) {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-stretch justify-center p-0 sm:items-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-label="Close conversation"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative z-[1] flex h-[100dvh] max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl sm:h-[min(80vh,720px)] sm:max-h-[80vh] sm:rounded-3xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 p-3 sm:gap-3 sm:p-6">
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white sm:h-12 sm:w-12">
              <User className="h-5 w-5 text-slate-400 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold text-slate-800 sm:text-lg">
                {lead.name || `${lead.type} Lead`}
              </h3>
              <p className="truncate text-xs text-slate-500 sm:text-sm">
                {lead.timestamp} &middot; {lead.status}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <button
              type="button"
              onClick={() => onDelete(lead.id)}
              className="rounded-full p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
              title="Delete lead"
            >
              <Trash2 className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 transition-colors hover:bg-slate-100"
              aria-label="Close"
            >
              <X className="h-6 w-6 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Two columns on all widths: left = contact/role, right = project — saves vertical space on mobile */}
        <div className="flex shrink-0 gap-3 border-b border-slate-200 bg-slate-50 px-3 py-2.5 sm:gap-6 sm:px-5 sm:py-3 md:px-6">
          <div className="grid min-w-0 flex-1 auto-rows-min gap-y-2 sm:gap-y-2.5">
            <LeadMetaField label="Phone" value={lead.phone || '-'} />
            <LeadMetaField label="Email" value={lead.email || '-'} />
            <LeadMetaField label="Type" value={lead.type} />
          </div>
          <div className="grid min-w-0 flex-1 auto-rows-min gap-y-2 sm:gap-y-2.5">
            <LeadMetaField label="Project" value={lead.projectType || 'N/A'} />
            <LeadMetaField label="Service" value={lead.serviceType || 'N/A'} />
            <LeadMetaField label="Budget" value={lead.budget || 'N/A'} />
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto bg-white p-4 sm:p-8">
          {lead.messages && lead.messages.length > 0 ? (
            lead.messages.map(msg => (
              <div
                key={msg.id}
                className={cn(
                  'flex max-w-[92%] flex-col sm:max-w-[85%]',
                  msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start',
                )}
              >
                <div
                  className={cn(
                    'prose prose-sm max-w-none rounded-2xl p-4 text-sm leading-relaxed shadow-sm prose-slate',
                    msg.sender === 'user'
                      ? 'rounded-tr-none bg-[#0F1A2B] text-white prose-invert'
                      : msg.sender === 'admin'
                        ? 'rounded-tl-none border border-amber-200 bg-amber-50 text-slate-800'
                        : 'rounded-tl-none border border-slate-200 bg-slate-50 text-slate-800',
                  )}
                >
                  {msg.sender === 'admin' && (
                    <p className="not-prose mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Admin Reply
                    </p>
                  )}
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                </div>
              </div>
            ))
          ) : (
            <div className="flex h-full min-h-[12rem] flex-col items-center justify-center text-slate-300">
              <MessageSquare className="mb-4 h-12 w-12 opacity-40" />
              <p className="text-slate-400">No messages yet</p>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-slate-50 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-6">
          <form onSubmit={onAdminReplySubmit} className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <input
              type="text"
              value={adminReplyValue}
              onChange={e => onAdminReplyChange(e.target.value)}
              placeholder="Type your reply..."
              className="min-h-[44px] flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
            <button
              type="submit"
              disabled={!adminReplyValue.trim()}
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0F1A2B] px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#162236] disabled:cursor-not-allowed disabled:opacity-50 sm:px-6"
            >
              <Send className="h-4 w-4" />
              Reply
            </button>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

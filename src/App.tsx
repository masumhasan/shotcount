import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Inbox,
  Layers,
  Search,
  Send,
  Settings,
  User,
  MoreHorizontal,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { cn } from './lib/utils';
import { Lead, Message } from './types';
import { ChatInterface } from './components/ChatInterface';

const INITIAL_LEADS: Lead[] = [
  {
    id: '1',
    type: 'Designer',
    projectType: 'Entire residence',
    serviceType: 'Installation',
    timeline: '1-3 months',
    budget: '$3000+',
    timestamp: '2 hours ago',
    tags: ['High Intent', 'Designer Lead', 'Premium Client'],
    status: 'New',
  },
  {
    id: '2',
    type: 'Homeowner',
    projectType: 'Single room',
    serviceType: 'Removal & Prep',
    timeline: 'Within 1 month',
    budget: '$1000-$3000',
    timestamp: '5 hours ago',
    tags: ['Premium Client'],
    status: 'Contacted',
  },
];

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: React.ElementType; label: string; active?: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
      active ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:bg-surface hover:text-text-main',
    )}
  >
    <Icon className={cn('w-5 h-5', active ? 'text-white' : 'text-text-muted/60 group-hover:text-text-main')} />
    <span className="font-medium">{label}</span>
  </button>
);

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/chat" element={<PublicChatPage />} />
        <Route path="/*" element={<AdminLayout />} />
      </Routes>
    </Router>
  );
}

function PublicChatPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-0 md:p-4">
      <ChatInterface isFullScreen requireContact />
    </div>
  );
}

function AdminLayout() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem('shotcount_leads');
    return saved ? JSON.parse(saved) : INITIAL_LEADS;
  });
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [adminReplyValue, setAdminReplyValue] = useState('');
  const modalChatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncLeads = () => {
      const saved = localStorage.getItem('shotcount_leads');
      if (saved) setLeads(JSON.parse(saved));
    };
    window.addEventListener('focus', syncLeads);
    return () => window.removeEventListener('focus', syncLeads);
  }, []);

  useEffect(() => {
    if (selectedLead) {
      modalChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedLead?.messages]);

  const handleAdminReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminReplyValue.trim() || !selectedLead) return;

    const adminMsg: Message = { id: Date.now().toString(), text: adminReplyValue, sender: 'admin' };
    const updatedMessages = [...(selectedLead.messages || []), adminMsg];
    const updatedLead = { ...selectedLead, messages: updatedMessages, status: 'Contacted' as const };
    setSelectedLead(updatedLead);

    const updatedLeads = leads.map(lead => (lead.id === selectedLead.id ? updatedLead : lead));
    setLeads(updatedLeads);
    localStorage.setItem('shotcount_leads', JSON.stringify(updatedLeads));
    setAdminReplyValue('');
  };

  return (
    <div className="min-h-screen bg-surface flex font-sans selection:bg-primary selection:text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-border flex flex-col p-6 fixed h-full">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Layers className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-text-main">Shotcount</span>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem icon={Inbox} label="Inbox" active onClick={() => {}} />
          <SidebarItem icon={MessageSquare} label="Public Chat" onClick={() => navigate('/chat')} />
        </nav>

        <div className="pt-6 border-t border-border">
          <SidebarItem icon={Settings} label="Settings" onClick={() => {}} />
        </div>
      </aside>

      {/* Main Content — Inbox */}
      <main className="flex-1 ml-64 p-10">
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-text-main">Lead Inbox</h1>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search leads..."
                className="pl-10 pr-4 py-2 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface border-b border-border">
                  <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Lead Details</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Project Info</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Investment</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Tags</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="hover:bg-surface/50 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center">
                          <User className="w-4 h-4 text-text-muted" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text-main">{lead.name || lead.type}</p>
                          <p className="text-xs text-text-muted">{lead.timestamp}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-text-main font-medium">{lead.phone || '—'}</p>
                      <p className="text-xs text-text-muted">{lead.email || '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-text-main font-medium">{lead.projectType || 'N/A'}</p>
                      <p className="text-xs text-text-muted">{lead.serviceType || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-text-main">{lead.budget || 'N/A'}</p>
                      <p className="text-xs text-text-muted">{lead.timeline || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {lead.tags.map(tag => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-surface text-text-main/80 font-bold">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        'text-[10px] px-2 py-1 rounded-lg font-bold uppercase tracking-wider',
                        lead.status === 'New' ? 'bg-primary/10 text-primary'
                          : lead.status === 'Booked' ? 'bg-secondary/20 text-secondary'
                          : lead.status === 'In Progress' ? 'bg-amber-50 text-amber-600'
                          : 'bg-surface text-text-muted',
                      )}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-text-muted/60 hover:text-text-main opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Conversation Modal */}
      <AnimatePresence>
        {selectedLead && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLead(null)}
              className="absolute inset-0 bg-text-main/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-2xl h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-border flex justify-between items-center bg-surface">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white border border-border flex items-center justify-center">
                    <User className="w-6 h-6 text-text-muted" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-main">{selectedLead.name || `${selectedLead.type} Lead`}</h3>
                    <p className="text-sm text-text-muted">{selectedLead.timestamp} &middot; {selectedLead.status}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-border rounded-full transition-colors">
                  <X className="w-6 h-6 text-text-muted" />
                </button>
              </div>

              <div className="p-6 bg-surface border-b border-border grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-text-muted/80 uppercase tracking-widest mb-1">Phone</p>
                  <p className="text-sm font-bold text-text-main">{selectedLead.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-text-muted/80 uppercase tracking-widest mb-1">Email</p>
                  <p className="text-sm font-bold text-text-main">{selectedLead.email || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-text-muted/80 uppercase tracking-widest mb-1">Type</p>
                  <p className="text-sm font-bold text-text-main">{selectedLead.type}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-text-muted/80 uppercase tracking-widest mb-1">Project</p>
                  <p className="text-sm font-bold text-text-main">{selectedLead.projectType || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-text-muted/80 uppercase tracking-widest mb-1">Service</p>
                  <p className="text-sm font-bold text-text-main">{selectedLead.serviceType || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-text-muted/80 uppercase tracking-widest mb-1">Budget</p>
                  <p className="text-sm font-bold text-text-main">{selectedLead.budget || 'N/A'}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {selectedLead.messages && selectedLead.messages.length > 0 ? (
                  selectedLead.messages.map((msg) => (
                    <div key={msg.id} className={cn('flex flex-col max-w-[80%]', msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start')}>
                      <div className={cn(
                        'p-4 rounded-2xl text-sm leading-relaxed shadow-sm prose prose-sm max-w-none',
                        msg.sender === 'user'
                          ? 'bg-primary text-white rounded-tr-none prose-invert'
                          : msg.sender === 'admin'
                            ? 'bg-secondary/10 border border-secondary/30 text-text-main rounded-tl-none'
                            : 'bg-white border border-border text-text-main rounded-tl-none',
                      )}>
                        {msg.sender === 'admin' && (
                          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1 not-prose">Admin Reply</p>
                        )}
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-text-muted/40">
                    <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                    <p>No messages yet</p>
                  </div>
                )}
                <div ref={modalChatEndRef} />
              </div>

              <div className="p-6 border-t border-border bg-surface">
                <form onSubmit={handleAdminReply} className="flex gap-3">
                  <input
                    type="text"
                    value={adminReplyValue}
                    onChange={(e) => setAdminReplyValue(e.target.value)}
                    placeholder="Type your reply..."
                    className="flex-1 bg-white border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="submit"
                    disabled={!adminReplyValue.trim()}
                    className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Reply
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

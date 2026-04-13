import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare,
  Inbox,
  Search,
  Send,
  User,
  Trash2,
  LogOut,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { cn } from './lib/utils';
import type { Lead, Message } from './types';
import { ChatInterface } from './components/ChatInterface';
import { ProtectedRoute } from './components/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import { useAuth } from './hooks/useAuth';
import { supabase } from './lib/supabase';
import {
  fetchLeads as fetchLeadsFromDb,
  deleteLead as deleteLeadFromDb,
  fetchLeadWithMessages,
} from './services/leads';
import { addMessage as addMessageToDb } from './services/messages';

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
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/inbox"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<PublicChatPage />} />
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
  const { signOut } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [adminReplyValue, setAdminReplyValue] = useState('');
  const [loadingLeads, setLoadingLeads] = useState(true);
  const modalChatEndRef = useRef<HTMLDivElement>(null);

  const loadLeads = useCallback(async () => {
    try {
      const data = await fetchLeadsFromDb();
      setLeads(data);
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoadingLeads(false);
    }
  }, []);

  useEffect(() => {
    loadLeads();

    const channel = supabase
      .channel('leads-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        loadLeads();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        loadLeads();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadLeads]);

  const handleSelectLead = useCallback(async (lead: Lead) => {
    const full = await fetchLeadWithMessages(lead.id);
    if (full) setSelectedLead(full);
  }, []);

  useEffect(() => {
    if (selectedLead) {
      modalChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedLead?.messages]);

  useEffect(() => {
    if (!selectedLead) return;

    const channel = supabase
      .channel(`lead-msgs-${selectedLead.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `lead_id=eq.${selectedLead.id}`,
      }, async () => {
        const fresh = await fetchLeadWithMessages(selectedLead.id);
        if (fresh) setSelectedLead(fresh);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedLead?.id]);

  const handleAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminReplyValue.trim() || !selectedLead) return;

    const adminMsg: Message = { id: Date.now().toString(), text: adminReplyValue, sender: 'admin' };

    setSelectedLead(prev => prev ? {
      ...prev,
      messages: [...(prev.messages || []), adminMsg],
      status: 'Contacted',
    } : null);
    setAdminReplyValue('');

    try {
      await addMessageToDb(selectedLead.id, adminMsg);
      await loadLeads();
    } catch (err) {
      console.error('Failed to send admin reply:', err);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      await deleteLeadFromDb(leadId);
      setLeads(prev => prev.filter(l => l.id !== leadId));
      setSelectedLead(null);
    } catch (err) {
      console.error('Failed to delete lead:', err);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-surface flex font-sans selection:bg-primary selection:text-white">
      <aside className="w-64 bg-white border-r border-border flex flex-col p-6 fixed h-full">
        <div className="flex items-center gap-3 mb-10 px-2">
          <img src="/Shotcount-Logo.png" alt="Shotcount" className="w-10 h-10 rounded-xl object-contain" />
          <span className="text-xl font-bold tracking-tight text-text-main">Shotcount</span>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem icon={Inbox} label="Inbox" active onClick={() => {}} />
          <SidebarItem icon={MessageSquare} label="Public Chat" onClick={() => navigate('/')} />
        </nav>

        <div className="pt-6 border-t border-border space-y-2">
          <SidebarItem icon={LogOut} label="Sign Out" onClick={handleSignOut} />
        </div>
      </aside>

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
                {loadingLeads ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-sm text-text-muted">Loading leads...</p>
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <Inbox className="w-10 h-10 text-text-muted/30 mx-auto mb-3" />
                      <p className="text-sm text-text-muted">No leads yet. New conversations from the public chat will appear here.</p>
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => handleSelectLead(lead)}
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
                        <p className="text-sm text-text-main font-medium">{lead.phone || '-'}</p>
                        <p className="text-xs text-text-muted">{lead.email || '-'}</p>
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
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteLead(lead.id); }}
                          className="p-2 text-text-muted/60 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                          title="Delete lead"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

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
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDeleteLead(selectedLead.id)}
                    className="p-2 hover:bg-red-50 text-text-muted hover:text-red-500 rounded-full transition-colors"
                    title="Delete lead"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-border rounded-full transition-colors">
                    <X className="w-6 h-6 text-text-muted" />
                  </button>
                </div>
              </div>

              <div className="p-6 bg-surface border-b border-border grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-text-muted/80 uppercase tracking-widest mb-1">Phone</p>
                  <p className="text-sm font-bold text-text-main">{selectedLead.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-text-muted/80 uppercase tracking-widest mb-1">Email</p>
                  <p className="text-sm font-bold text-text-main">{selectedLead.email || '-'}</p>
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

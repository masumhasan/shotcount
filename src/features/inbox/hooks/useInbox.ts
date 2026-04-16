import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Lead, Message } from '../../../types';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../lib/supabase';
import {
  fetchLeads as fetchLeadsFromDb,
  deleteLead as deleteLeadFromDb,
  fetchLeadWithMessages,
} from '../../../services/leads';
import { addMessage as addMessageToDb } from '../../../services/messages';

function leadMatchesQuery(lead: Lead, q: string): boolean {
  if (!q.trim()) return true;
  const s = q.toLowerCase();
  return [
    lead.name,
    lead.phone,
    lead.email,
    lead.type,
    lead.projectType,
    lead.budget,
    lead.status,
    ...(lead.tags || []),
  ]
    .filter(Boolean)
    .some(field => String(field).toLowerCase().includes(s));
}

export function useInbox() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [adminReplyValue, setAdminReplyValue] = useState('');
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const modalChatEndRef = useRef<HTMLDivElement>(null);

  const filteredLeads = useMemo(
    () => leads.filter(l => leadMatchesQuery(l, searchQuery)),
    [leads, searchQuery],
  );

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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadLeads]);

  const handleSelectLead = useCallback(async (lead: Lead) => {
    const full = await fetchLeadWithMessages(lead.id);
    if (full) setSelectedLead(full);
    setSidebarOpen(false);
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
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `lead_id=eq.${selectedLead.id}`,
        },
        async () => {
          const fresh = await fetchLeadWithMessages(selectedLead.id);
          if (fresh) setSelectedLead(fresh);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedLead?.id]);

  const handleAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminReplyValue.trim() || !selectedLead) return;

    const adminMsg: Message = { id: Date.now().toString(), text: adminReplyValue, sender: 'admin' };

    setSelectedLead(prev =>
      prev
        ? {
            ...prev,
            messages: [...(prev.messages || []), adminMsg],
            status: 'Contacted',
          }
        : null,
    );
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

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const openSidebar = useCallback(() => setSidebarOpen(true), []);

  return {
    leads: filteredLeads,
    loadingLeads,
    selectedLead,
    setSelectedLead,
    adminReplyValue,
    setAdminReplyValue,
    modalChatEndRef,
    searchQuery,
    setSearchQuery,
    sidebarOpen,
    openSidebar,
    closeSidebar,
    loadLeads,
    handleSelectLead,
    handleAdminReply,
    handleDeleteLead,
    handleSignOut,
    navigateToPublicChat: () => navigate('/'),
  };
}

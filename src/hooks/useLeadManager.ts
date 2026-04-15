import { useState, useEffect, useRef, useCallback } from 'react';
import type { Lead, Message } from '../types';
import { getLeadTags } from '../lib/lead-classifier';
import { createLead, updateLead } from '../services/leads';
import { addMessage } from '../services/messages';

interface UseLeadManagerProps {
  messages: Message[];
  currentStep: number;
  onLeadUpdate?: (lead: Lead) => void;
}

export function useLeadManager({ messages, currentStep, onLeadUpdate }: UseLeadManagerProps) {
  const [userLeadData, setUserLeadData] = useState<Partial<Lead>>({});
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const leadCreating = useRef(false);
  const lastSyncedMsgCount = useRef(0);

  const updateLeadData = useCallback((update: Partial<Lead>) => {
    setUserLeadData(prev => ({ ...prev, ...update }));
  }, []);

  useEffect(() => {
    if (leadCreating.current || activeLeadId) return;
    leadCreating.current = true;

    createLead({ status: 'New' })
      .then(lead => setActiveLeadId(lead.id))
      .catch(err => console.error('Failed to create lead:', err))
      .finally(() => { leadCreating.current = false; });
  }, [activeLeadId]);

  useEffect(() => {
    if (!activeLeadId) return;

    const tags = getLeadTags(userLeadData);
    const status: Lead['status'] = currentStep >= 7 ? 'Booked' : currentStep >= 1 ? 'In Progress' : 'New';

    updateLead(activeLeadId, {
      ...userLeadData,
      tags,
      status,
    }).catch(err => console.error('Failed to update lead:', err));

    onLeadUpdate?.({
      id: activeLeadId,
      type: userLeadData.type || 'Homeowner',
      timestamp: '',
      tags,
      status,
      ...userLeadData,
    } satisfies Lead as Lead);
  }, [userLeadData, currentStep, activeLeadId]);

  useEffect(() => {
    if (!activeLeadId || messages.length <= lastSyncedMsgCount.current) return;

    const newMessages = messages.slice(lastSyncedMsgCount.current);
    lastSyncedMsgCount.current = messages.length;

    for (const msg of newMessages) {
      addMessage(activeLeadId, msg).catch(err =>
        console.error('Failed to save message:', err),
      );
    }
  }, [messages, activeLeadId]);

  return { userLeadData, activeLeadId, updateLeadData };
}

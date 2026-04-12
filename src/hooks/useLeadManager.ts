import { useState, useEffect } from 'react';
import type { Lead, Message } from '../types';
import { getLeadTags } from '../lib/lead-classifier';

interface UseLeadManagerProps {
  messages: Message[];
  currentStep: number;
  onLeadUpdate?: (lead: Lead) => void;
}

export function useLeadManager({ messages, currentStep, onLeadUpdate }: UseLeadManagerProps) {
  const [userLeadData, setUserLeadData] = useState<Partial<Lead>>({});
  const [activeLeadId] = useState(() => Math.random().toString(36).substr(2, 9));

  const updateLeadData = (update: Partial<Lead>) => {
    setUserLeadData(prev => ({ ...prev, ...update }));
  };

  useEffect(() => {
    if (!onLeadUpdate) return;

    const lead: Lead = {
      id: activeLeadId,
      name: userLeadData.name,
      phone: userLeadData.phone,
      email: userLeadData.email,
      type: userLeadData.type || 'Homeowner',
      serviceType: userLeadData.serviceType,
      projectType: userLeadData.projectType,
      timeline: userLeadData.timeline,
      budget: userLeadData.budget,
      timestamp: 'Just now',
      tags: getLeadTags(userLeadData),
      status: currentStep >= 7 ? 'Booked' : 'In Progress',
      messages,
    };

    onLeadUpdate(lead);

    const savedLeads = JSON.parse(localStorage.getItem('shotcount_leads') || '[]');
    const idx = savedLeads.findIndex((l: Lead) => l.id === activeLeadId);
    if (idx > -1) {
      savedLeads[idx] = lead;
    } else {
      savedLeads.unshift(lead);
    }
    localStorage.setItem('shotcount_leads', JSON.stringify(savedLeads));
  }, [messages, userLeadData, currentStep, activeLeadId, onLeadUpdate]);

  return { userLeadData, activeLeadId, updateLeadData };
}

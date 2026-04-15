import { supabase } from '../lib/supabase';
import type { Lead } from '../types';

interface LeadRow {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  user_type: string;
  service_type: string | null;
  project_type: string | null;
  timeline: string | null;
  budget: string | null;
  photo_url: string | null;
  tags: string[];
  status: string;
  created_at: string;
  updated_at: string;
}

export function rowToLead(row: LeadRow): Lead {
  return {
    id: row.id,
    name: row.name ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    type: (row.user_type as Lead['type']) || 'Homeowner',
    serviceType: (row.service_type as Lead['serviceType']) ?? undefined,
    projectType: row.project_type ?? undefined,
    timeline: (row.timeline as Lead['timeline']) ?? undefined,
    budget: (row.budget as Lead['budget']) ?? undefined,
    photoUrl: row.photo_url ?? undefined,
    tags: row.tags || [],
    status: (row.status as Lead['status']) || 'New',
    timestamp: new Date(row.created_at).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
    }),
    createdAt: row.created_at,
  };
}

export async function createLead(data: Partial<Lead>): Promise<Lead> {
  const { data: row, error } = await supabase
    .from('leads')
    .insert({
      name: data.name ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      user_type: data.type || 'Homeowner',
      service_type: data.serviceType ?? null,
      project_type: data.projectType ?? (data.roomTypes ? data.roomTypes.join(', ') : null),
      timeline: data.timeline ?? null,
      budget: data.budget ?? null,
      tags: data.tags || [],
      status: data.status || 'New',
    })
    .select()
    .single();

  if (error) throw error;
  return rowToLead(row);
}

export async function updateLead(id: string, data: Partial<Lead>): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.phone !== undefined) payload.phone = data.phone;
  if (data.email !== undefined) payload.email = data.email;
  if (data.type !== undefined) payload.user_type = data.type;
  if (data.serviceType !== undefined) payload.service_type = data.serviceType;
  if (data.projectType !== undefined) payload.project_type = data.projectType;
  if (data.roomTypes !== undefined) payload.project_type = data.roomTypes.join(', ');
  if (data.timeline !== undefined) payload.timeline = data.timeline;
  if (data.budget !== undefined) payload.budget = data.budget;
  if (data.tags !== undefined) payload.tags = data.tags;
  if (data.status !== undefined) payload.status = data.status;

  if (Object.keys(payload).length === 0) return;

  const { error } = await supabase.from('leads').update(payload).eq('id', id);
  if (error) throw error;
}

export async function deleteLead(id: string): Promise<void> {
  const { error } = await supabase.from('leads').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(rowToLead);
}

export async function fetchLeadWithMessages(id: string): Promise<Lead | null> {
  const { data: row, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !row) return null;

  const { data: msgs } = await supabase
    .from('messages')
    .select('*')
    .eq('lead_id', id)
    .order('created_at', { ascending: true });

  const lead = rowToLead(row);
  lead.messages = (msgs || []).map(m => ({
    id: m.id,
    text: m.text,
    sender: m.sender as 'bot' | 'user' | 'admin',
    options: m.options ?? undefined,
    type: m.msg_type as any ?? undefined,
  }));

  return lead;
}

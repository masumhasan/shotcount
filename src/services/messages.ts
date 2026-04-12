import { supabase } from '../lib/supabase';
import type { Message } from '../types';

export async function addMessage(
  leadId: string,
  msg: Message,
): Promise<void> {
  const { error } = await supabase.from('messages').insert({
    lead_id: leadId,
    text: msg.text,
    sender: msg.sender,
    options: msg.options ?? null,
    msg_type: msg.type ?? 'text',
  });

  if (error) throw error;
}

export async function fetchMessages(leadId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data || []).map(m => ({
    id: m.id,
    text: m.text,
    sender: m.sender as Message['sender'],
    options: m.options ?? undefined,
    type: m.msg_type as Message['type'] ?? undefined,
  }));
}

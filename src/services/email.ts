import { supabase } from '../lib/supabase';
import type { Lead, Message } from '../types';

export async function sendChatSummaryEmail(
  leadData: Partial<Lead>,
  messages: Message[],
): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        action: 'chat-summary',
        leadName: leadData.name,
        leadPhone: leadData.phone,
        leadEmail: leadData.email,
        leadType: leadData.type,
        projectType: leadData.projectType,
        serviceType: leadData.serviceType,
        timeline: leadData.timeline,
        budget: leadData.budget,
        tags: leadData.tags,
        messages: messages
          .filter(m => m.type !== 'contact-form')
          .map(m => ({ sender: m.sender, text: m.text })),
      },
    });

    if (error) console.error('Chat summary email failed:', error);
  } catch (err) {
    console.error('Failed to send chat summary email:', err);
  }
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: { action: 'send', to, subject, html },
    });

    if (error) console.error('Email send failed:', error);
  } catch (err) {
    console.error('Failed to send email:', err);
  }
}

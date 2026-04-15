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
        leadName: leadData.name || null,
        leadPhone: leadData.phone || null,
        leadEmail: leadData.email || null,
        leadType: leadData.type || null,
        roomTypes: leadData.roomTypes || [],
        projectType: leadData.projectType || null,
        timeline: leadData.timeline || null,
        budget: leadData.budget || null,
        hasWallpaper: leadData.hasWallpaper || null,
        tags: leadData.tags || [],
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

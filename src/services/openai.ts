import OpenAI from 'openai';
import { AGENT_INSTRUCTION } from '../prompts/agent-instruction';
import { buildSessionInstruction } from '../prompts/session-instruction';
import type { Lead } from '../types';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

const FALLBACK = "I appreciate your patience. Could you share a bit more about what you're envisioning?";

export async function generateConciergeResponse(
  userMessage: string,
  currentStep: number,
  leadData: Partial<Lead>,
): Promise<string> {
  const sessionContext = buildSessionInstruction(currentStep, leadData);

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: `${AGENT_INSTRUCTION}\n\n${sessionContext}` },
      { role: 'user', content: userMessage },
    ],
  });

  return response.choices[0]?.message?.content || FALLBACK;
}

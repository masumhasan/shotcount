import type { Lead, ClientTier } from '../types';

export function classifyClientTier(leadData: Partial<Lead>): ClientTier {
  if (leadData.budget === '$2000+') return 'premium';
  if (leadData.budget === '$1000-$2000') return 'premium';
  if (leadData.budget === '$500-$1000') return 'mid';
  if (leadData.budget === '$0-$300') return 'budget';

  if (leadData.type === 'Interior Designer' || leadData.type === 'Architect') return 'premium';
  if (leadData.type === 'Real Estate Developer') return 'premium';

  return 'mid';
}

export function getLeadTags(leadData: Partial<Lead>): string[] {
  const tier = classifyClientTier(leadData);
  const tags: string[] = [];

  if (tier === 'premium') tags.push('High Intent', 'Premium Client');
  if (leadData.type === 'Interior Designer') tags.push('Designer Lead');
  if (leadData.type === 'Architect') tags.push('Architect Lead');
  if (leadData.type === 'Real Estate Developer') tags.push('Developer Lead');
  if (leadData.timeline === 'ASAP' || leadData.timeline === 'Within two weeks') tags.push('Urgent');

  return tags;
}

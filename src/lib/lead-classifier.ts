import type { Lead, ClientTier } from '../types';

export function classifyClientTier(leadData: Partial<Lead>): ClientTier {
  if (leadData.budget === '$3000+' || leadData.budget === '$1000-$3000') return 'premium';
  if (leadData.budget === '$500-$1000') return 'mid';
  if (leadData.budget === '$0-$500') return 'budget';

  if (leadData.type === 'Designer') return 'premium';
  if (
    leadData.projectType === 'Entire residence' ||
    leadData.projectType === 'Commercial space'
  ) {
    return 'premium';
  }

  return 'mid';
}

export function getLeadTags(leadData: Partial<Lead>): string[] {
  const tier = classifyClientTier(leadData);
  const tags: string[] = [];

  if (tier === 'premium') tags.push('High Intent', 'Premium Client');
  if (leadData.type === 'Designer') tags.push('Designer Lead');
  if (leadData.type === 'Contractor') tags.push('Contractor Lead');
  if (leadData.projectType === 'Entire residence') tags.push('Full Project');
  if (leadData.projectType === 'Commercial space') tags.push('Commercial');
  if (leadData.timeline === 'ASAP') tags.push('Urgent');

  return tags;
}

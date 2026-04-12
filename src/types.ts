export type LeadType = 'Homeowner' | 'Designer' | 'Contractor';
export type ProjectType = 'Accent wall' | 'Single room' | 'Multiple rooms' | 'Entire residence' | 'Commercial space';
export type ServiceType = 'Installation' | 'Removal & Prep' | 'Site Visit' | 'Measurement' | 'Other';
export type Timeline = 'ASAP' | 'Within 1 month' | '1-3 months' | 'Planning phase';
export type Budget = '$0-$500' | '$500-$1000' | '$1000-$3000' | '$3000+';
export type ClientTier = 'premium' | 'mid' | 'budget';

export interface Lead {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  type: LeadType;
  serviceType?: ServiceType;
  projectType?: ProjectType;
  timeline?: Timeline;
  budget?: Budget;
  photoUrl?: string;
  timestamp: string;
  createdAt?: string;
  tags: string[];
  status: 'New' | 'Contacted' | 'Booked' | 'In Progress';
  messages?: Message[];
}

export interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user' | 'admin';
  options?: string[];
  type?: 'text' | 'upload' | 'button' | 'scheduling' | 'contact-form';
  buttonText?: string;
  buttonUrl?: string;
}

export interface FlowAction {
  messages: Message[];
  step?: number;
  leadUpdate?: Partial<Lead>;
  delayMs?: number;
}

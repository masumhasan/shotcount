export type LeadType = 'Homeowner' | 'Interior Designer' | 'Architect' | 'Real Estate Developer';
export type RoomType = 'Accent Wall' | 'Living Room' | 'Bedroom' | 'Bathroom' | 'Powder Room' | 'Dining Room' | 'Kitchen' | 'Office' | 'Site Visit' | 'Other';
export type ServiceType = 'Installation' | 'Removal & Prep' | 'Site Visit' | 'Measurement' | 'Other';
export type Timeline = 'ASAP' | 'Within two weeks' | 'Within 1 to 3 months' | 'Planning Phase';
export type Budget = '$0-$300' | '$500-$1000' | '$1000-$2000' | '$2000+' | 'Other';
export type ClientTier = 'premium' | 'mid' | 'budget';

export interface Lead {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  type: LeadType;
  roomTypes?: RoomType[];
  serviceType?: ServiceType;
  projectType?: string;
  timeline?: Timeline;
  budget?: Budget;
  hasWallpaper?: string;
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
  multiSelect?: boolean;
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

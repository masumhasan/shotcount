import type {
  Message, Lead, FlowAction,
  LeadType, ServiceType, ProjectType, Timeline, Budget,
} from '../types';
import { classifyClientTier } from './lead-classifier';
import { generateMessageId } from './utils';

/* ── Initial messages ───────────────────────────────────────────── */

export const GREETING_MESSAGE: Message = {
  id: '1',
  text: "Welcome. You’re in the right place if you’re looking to elevate your space with precision-installed wallpaper.\n\nBefore we begin, may I have your name and the best way to reach you?",
  sender: 'bot',
  type: 'contact-form',
};

export const INITIAL_MESSAGE: Message = {
  id: '1',
  text: "Welcome. You've reached the private concierge for Shotcount Wallpaper Hangers - Washington DC's premier wallpaper installation atelier.\n\nHow may we elevate your space today?",
  sender: 'bot',
  options: ['Get a Quote', 'Design Guidance', 'Visualize Room', 'Speak to Specialist'],
};

export function createWelcomeMessage(name: string): Message {
  return msg(
    `It's a pleasure to meet you, **${name}**. How may we elevate your space today?`,
    { options: ['Get a Quote', 'Design Guidance', 'Visualize Room', 'Speak to Specialist'] },
  );
}

/* ── Step descriptions ──────────────────────────────────────────── */

export function getNextStepDescription(step: number): string {
  switch (step) {
    case 0: return "Collecting the client's name and contact information before proceeding.";
    case 1: return 'Identifying the category (Quote, Guidance, Visualization, or Specialist).';
    case 2: return 'Identifying if they are a Homeowner, Designer, or Contractor.';
    case 3: return 'Asking about the Service Type (Installation, Removal, etc).';
    case 4: return 'Asking about the Project Type (Accent wall, Single room, etc).';
    case 5: return 'Asking about the Timeline.';
    case 6: return 'Asking about the Budget / Investment level.';
    case 7: return 'Offering photo upload for preliminary assessment.';
    default: return 'Booking a private consultation.';
  }
}

/* ── Helpers ─────────────────────────────────────────────────────── */

function msg(text: string, extra?: Partial<Message>): Message {
  return { id: generateMessageId(), text, sender: 'bot', ...extra };
}

function nameAddr(leadData: Partial<Lead>): string {
  return leadData.name ? `, ${leadData.name}` : '';
}

/* ── Step router ─────────────────────────────────────────────────── */

export function processStep(
  step: number,
  input: string,
  leadData: Partial<Lead>,
): FlowAction[] {
  switch (step) {
    case 1: return processCategory(input, leadData);
    case 2: return processLeadType(input, leadData);
    case 3: return processServiceType(input, leadData);
    case 4: return processProjectType(input, leadData);
    case 5: return processTimeline(input, leadData);
    case 6: return processBudget(input, leadData);
    case 7: return processPhotoStep(leadData);
    default: return [];
  }
}

/* ── Step handlers ──────────────────────────────────────────────── */

function processCategory(input: string, ld: Partial<Lead>): FlowAction[] {
  if (input === 'Speak to Specialist') {
    return [{
      messages: [msg(
        `I've personally notified Ben, our master craftsman and lead installer. He will reach out to you shortly${nameAddr(ld)}.\n\nIn the meantime, may I learn a bit more about you: are you a homeowner, a professional designer, or a contractor?`,
        { options: ['Homeowner', 'Designer', 'Contractor'] },
      )],
      step: 2,
    }];
  }

  const labels: Record<string, string> = {
    'Get a Quote': 'a refined estimate',
    'Design Guidance': 'expert design guidance',
    'Visualize Room': 'a visualization of your space',
  };

  return [{
    messages: [msg(
      `Wonderful choice${nameAddr(ld)}. To provide ${labels[input] || 'the best experience'}, may I ask: are you a discerning homeowner, a professional designer, or a contractor?`,
      { options: ['Homeowner', 'Designer', 'Contractor'] },
    )],
    step: 2,
  }];
}

function processLeadType(input: string, ld: Partial<Lead>): FlowAction[] {
  const type = input as LeadType;

  const greetings: Record<LeadType, string> = {
    Homeowner:
      `A pleasure${nameAddr(ld)}. We collaborate with discerning homeowners to transform interiors into timeless works of art, with every seam invisible and every pattern perfectly aligned.`,
    Designer:
      `Delighted to connect${nameAddr(ld)}. We partner with leading designers to execute intricate installations with the seamless precision your vision demands.`,
    Contractor:
      `Excellent${nameAddr(ld)}. We provide white-glove wallpaper services for your most demanding projects: reliable, detailed, and always on schedule.`,
  };

  return [
    { messages: [msg(greetings[type])], leadUpdate: { type } },
    {
      messages: [msg(
        'Which service are you envisioning for this project?',
        { options: ['Installation', 'Removal & Prep', 'Site Visit', 'Measurement', 'Other'] },
      )],
      step: 3,
      delayMs: 1000,
    },
  ];
}

function processServiceType(input: string, _ld: Partial<Lead>): FlowAction[] {
  return [{
    messages: [msg(
      'Beautiful. And what type of transformation are you planning?',
      { options: ['Accent wall', 'Single room', 'Multiple rooms', 'Entire residence', 'Commercial space'] },
    )],
    step: 4,
    leadUpdate: { serviceType: input as ServiceType },
  }];
}

function processProjectType(input: string, ld: Partial<Lead>): FlowAction[] {
  return [{
    messages: [msg(
      `Excellent taste${nameAddr(ld)}. When would you like to see your space transformed?`,
      { options: ['ASAP', 'Within 1 month', '1-3 months', 'Planning phase'] },
    )],
    step: 5,
    leadUpdate: { projectType: input as ProjectType },
  }];
}

function processTimeline(input: string, _ld: Partial<Lead>): FlowAction[] {
  const urgentNote = input === 'ASAP'
    ? '\n\nWe do have select priority openings for clients who need swift, meticulous execution.'
    : '';

  return [{
    messages: [msg(
      `Noted.${urgentNote}\n\nOur work is highly detailed and tailored to each unique space. Projects like these vary depending on scale and intricacy. What level of investment are you considering?`,
      { options: ['$0-$500', '$500-$1000', '$1000-$3000', '$3000+'] },
    )],
    step: 6,
    leadUpdate: { timeline: input as Timeline },
  }];
}

function processBudget(input: string, leadData: Partial<Lead>): FlowAction[] {
  const budget = input as Budget;
  const tier = classifyClientTier({ ...leadData, budget });
  const name = nameAddr(leadData);

  const responses: Record<string, string> = {
    premium:
      `Perfect${name}, that's exactly the level of craftsmanship we specialize in. We'd be honored to bring your vision to life with the precision and care your space deserves.\n\nWe specialize in seamless finishes, perfect pattern alignment, and working with delicate, high-end materials. Our clients come to us when they want the result to feel *exceptional*, not just installed.`,
    mid:
      'Every surface tells a story. The difference truly comes down to precision and finish, especially with premium materials.\n\nWe\'d love to explore what\'s possible for your space and help you achieve a result that exceeds your expectations.',
    budget:
      "We appreciate your interest in our work. Our focus is on high-end installations where detail and craftsmanship are the priority.\n\nIf you're looking for that level of finish, we'd be delighted to explore your project and discuss options.",
  };

  return [
    { messages: [msg(responses[tier])], leadUpdate: { budget } },
    {
      messages: [msg(
        "If you'd like, you may share a photo of your space or wall. Our team can provide a preliminary assessment and help you visualize the transformation.",
        { type: 'upload' },
      )],
      step: 7,
      delayMs: 1200,
    },
  ];
}

function processPhotoStep(leadData: Partial<Lead>): FlowAction[] {
  const tier = classifyClientTier(leadData);
  const name = nameAddr(leadData);

  const copy: Record<string, string> = {
    premium:
      `To ensure a flawless result${name}, we recommend a private consultation with Ben, our master craftsman. We're currently booking a limited number of projects to maintain our standard of excellence.\n\nWe have a few priority openings available this week.`,
    mid:
      `We'd love to discuss your project in detail${name}. Ben, our lead specialist, is available for a consultation to explore the best approach for your space.`,
    budget:
      'For projects at every scale, a brief consultation helps us understand your vision and recommend the right approach. Ben would be happy to connect.',
  };

  return [{
    messages: [msg(copy[tier], { type: 'scheduling' })],
    step: 8,
  }];
}

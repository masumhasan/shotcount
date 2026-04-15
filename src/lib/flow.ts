import type {
  Message, Lead, FlowAction,
  LeadType, Timeline, Budget, RoomType,
} from '../types';
import { classifyClientTier } from './lead-classifier';
import { generateMessageId } from './utils';

/* ── Initial messages ───────────────────────────────────────────── */

export const GREETING_MESSAGE: Message = {
  id: '1',
  text: "It's a pleasure to meet you!\n\nWelcome to Shotcount, where walls become statements.\n\nAre you looking to elevate your space with bespoke wallpaper installation?",
  sender: 'bot',
  options: ['Yes, for a home', 'Yes, for a project/client', 'Just exploring ideas'],
};

export const INITIAL_MESSAGE: Message = {
  id: '1',
  text: "It's a pleasure to meet you!\n\nWelcome to Shotcount, where walls become statements.\n\nAre you looking to elevate your space with bespoke wallpaper installation?",
  sender: 'bot',
  options: ['Yes, for a home', 'Yes, for a project/client', 'Just exploring ideas'],
};

export function createWelcomeMessage(_name: string): Message {
  return msg(
    "It's a pleasure to meet you!\n\nWelcome to Shotcount, where walls become statements.\n\nAre you looking to elevate your space with bespoke wallpaper installation?",
    { options: ['Yes, for a home', 'Yes, for a project/client', 'Just exploring ideas'] },
  );
}

/* ── Step descriptions ──────────────────────────────────────────── */

/**
 * Steps:
 * 0  - Contact form (legacy, now unused in main flow)
 * 1  - Welcome: home / project / exploring
 * 2  - "Exploring" sub-path: estimate or specialist
 * 3  - Lead type selection (Homeowner, Interior Designer, Architect, Real Estate Developer)
 * 4  - Room type multi-select
 * 5  - Timeline
 * 6  - Premium positioning + social proof (shown before budget if timeline is longer)
 * 7  - Budget
 * 8  - Wallpaper qualification (do you have wallpaper selected?)
 * 9  - Lead capture (contact form)
 * 10 - Close / booking
 * 11 - Confirmation
 */
export function getNextStepDescription(step: number): string {
  switch (step) {
    case 0: return "Collecting the client's name and contact information.";
    case 1: return 'Welcome: identifying if for home, project/client, or exploring.';
    case 2: return 'Exploring path: rough estimate or speak with specialist.';
    case 3: return 'Identifying lead type (Homeowner, Interior Designer, Architect, Real Estate Developer).';
    case 4: return 'Selecting room types (multi-select).';
    case 5: return 'Asking about timeline.';
    case 6: return 'Premium positioning and social proof.';
    case 7: return 'Asking about budget / investment level.';
    case 8: return 'Wallpaper qualification: do they have wallpaper selected?';
    case 9: return 'Lead capture: collecting name, phone, email.';
    case 10: return 'Close: booking consultation.';
    case 11: return 'Confirmation message sent.';
    default: return 'Conversation complete.';
  }
}

/* ── Helpers ─────────────────────────────────────────────────────── */

function msg(text: string, extra?: Partial<Message>): Message {
  return { id: generateMessageId(), text, sender: 'bot', ...extra };
}

/* ── Step router ─────────────────────────────────────────────────── */

export function processStep(
  step: number,
  input: string,
  leadData: Partial<Lead>,
): FlowAction[] {
  switch (step) {
    case 1: return processWelcome(input, leadData);
    case 2: return processExploring(input, leadData);
    case 3: return processLeadType(input, leadData);
    case 4: return processRoomType(input, leadData);
    case 5: return processTimeline(input, leadData);
    case 6: return processPremiumPositioning(leadData);
    case 7: return processBudget(input, leadData);
    case 8: return processWallpaperQualification(input, leadData);
    case 9: return processLeadCapture(leadData);
    default: return [];
  }
}

/* ── Step handlers ──────────────────────────────────────────────── */

function processWelcome(input: string, _ld: Partial<Lead>): FlowAction[] {
  if (input === 'Just exploring ideas') {
    return [{
      messages: [msg(
        "Inspiration is where great design begins.\n\nWould you like to:",
        { options: ['Get a rough estimate', 'Speak with a specialist'] },
      )],
      step: 2,
    }];
  }

  return [{
    messages: [msg(
      "Perfect. We collaborate closely with project owners to make your vision a reality.\n\nWonderful. To provide a refined estimate, may I ask. Are you?",
      { options: ['A Homeowner', 'An Interior Designer', 'Architect', 'A Real Estate Developer'] },
    )],
    step: 3,
  }];
}

function processExploring(_input: string, _ld: Partial<Lead>): FlowAction[] {
  return [{
    messages: [msg(
      "I've personally notified Ben, our master craftsman and lead installer. He will reach out to you shortly.",
    )],
    step: 9,
    delayMs: 0,
  }, {
    messages: [msg(
      "To prepare your personalized consultation, may I have a few details?",
      { type: 'contact-form' },
    )],
    step: 9,
    delayMs: 1200,
  }];
}

function processLeadType(input: string, _ld: Partial<Lead>): FlowAction[] {
  const selections = input.split(', ');
  const primary = selections[0];

  let leadType: LeadType = 'Homeowner';
  let greeting = '';

  if (primary.includes('Homeowner')) {
    leadType = 'Homeowner';
    greeting = "A pleasure. We collaborate with discerning homeowners to transform interiors into timeless works of art, with every seam invisible and every pattern perfectly aligned.\n\nWhat type of space are you transforming?";
  } else if (primary.includes('Interior Designer')) {
    leadType = 'Interior Designer';
    greeting = "Delighted to connect. We partner with leading designers to provide white-glove intricate installations with the seamless precision your vision demands.\n\nWhat type of space are you transforming?";
  } else if (primary.includes('Architect')) {
    leadType = 'Architect';
    greeting = "Beautiful. Let's make your architectural skills stand out.\n\nWhat type of space are you transforming?";
  } else if (primary.includes('Real Estate Developer')) {
    leadType = 'Real Estate Developer';
    greeting = "Wonderful, let's add value to your project.\n\nWhat type of space are you transforming?";
  }

  const roomOptions: RoomType[] = [
    'Accent Wall', 'Living Room', 'Bedroom', 'Bathroom',
    'Powder Room', 'Dining Room', 'Kitchen', 'Office', 'Site Visit', 'Other',
  ];

  return [{
    messages: [msg(greeting, { options: roomOptions, multiSelect: true })],
    step: 4,
    leadUpdate: { type: leadType },
  }];
}

function processRoomType(input: string, _ld: Partial<Lead>): FlowAction[] {
  const rooms = input.split(', ') as RoomType[];

  return [{
    messages: [msg(
      "Excellent, when would you like to see your space transformed?",
      { options: ['ASAP', 'Within two weeks', 'Within 1 to 3 months', 'Planning Phase'] },
    )],
    step: 5,
    leadUpdate: { roomTypes: rooms, projectType: rooms.join(', ') },
  }];
}

function processTimeline(input: string, ld: Partial<Lead>): FlowAction[] {
  const timeline = input as Timeline;

  if (timeline === 'ASAP' || timeline === 'Within two weeks') {
    return [{
      messages: [msg(
        "We do have select priority openings for clients who need swift, meticulous execution.\n\nOur work is highly detailed and tailored to each unique space. Projects like these vary depending on scale and intricacy. What level of investment are you considering?",
        { options: ['$0-$300', '$500-$1000', '$1000-$2000', '$2000+', 'Other'] },
      )],
      step: 7,
      leadUpdate: { timeline },
    }];
  }

  return [
    {
      messages: [msg(
        "We specialize in high-end wallpaper installations using precision techniques and curated materials.\n\nOur clients value flawless finishes, discretion, and attention to detail.",
      )],
      step: 6,
      leadUpdate: { timeline },
    },
    {
      messages: [msg(
        "Our work is highly detailed and tailored to each unique space. Projects like these vary depending on scale and intricacy. What level of investment are you considering?",
        { options: ['$0-$300', '$500-$1000', '$1000-$2000', '$2000+', 'Other'] },
      )],
      step: 7,
      delayMs: 1500,
    },
  ];
}

function processPremiumPositioning(ld: Partial<Lead>): FlowAction[] {
  return [{
    messages: [msg(
      "Our work is highly detailed and tailored to each unique space. Projects like these vary depending on scale and intricacy. What level of investment are you considering?",
      { options: ['$0-$300', '$500-$1000', '$1000-$2000', '$2000+', 'Other'] },
    )],
    step: 7,
  }];
}

function processBudget(input: string, leadData: Partial<Lead>): FlowAction[] {
  const budget = input as Budget;
  const tier = classifyClientTier({ ...leadData, budget });

  const budgetResponses: Record<string, string> = {
    budget:
      "We appreciate your interest in our work. Our focus is on high-end installations where detail and craftsmanship are the priority. We'd be delighted to work with you to explore your project and discuss options.",
    mid:
      "That's a great starting point to elevate your space and transform it into works of art.",
    premium:
      "Perfect. We'd be honored to bring your vision to life with the precision and care your space deserves.\n\nWe specialize in seamless finishes, perfect pattern alignment, and working with delicate, high-end materials. Our clients come to us when they want the result to feel exceptional, not just installed.",
  };

  const midHighResponse = "Every surface tells a story. The difference truly comes down to precision and finish, especially with premium materials.\n\nWe'd love to explore what's possible for your space and help you achieve a result that exceeds your expectations.";

  const responseText = budget === '$1000-$2000' ? midHighResponse : budgetResponses[tier];

  return [
    { messages: [msg(responseText)], leadUpdate: { budget } },
    {
      messages: [msg(
        "We're currently booking a limited number of projects this month to maintain our quality standards.\n\nLet's secure your spot early.",
      )],
      delayMs: 1200,
    },
    {
      messages: [msg(
        "Do you already have wallpaper selected?",
        { options: ['Yes', 'Need guidance'] },
      )],
      step: 8,
      delayMs: 2400,
    },
  ];
}

function processWallpaperQualification(input: string, ld: Partial<Lead>): FlowAction[] {
  if (input === 'Need guidance') {
    return [
      {
        messages: [msg(
          "Perfect, during our consultation we can recommend exclusive designs tailored to your space and vision.",
        )],
        leadUpdate: { hasWallpaper: 'No' },
      },
      {
        messages: [msg(
          "To prepare your personalized consultation, may I have a few details?",
          { type: 'contact-form' },
        )],
        step: 9,
        delayMs: 1200,
      },
    ];
  }

  return [{
    messages: [msg(
      "To prepare your personalized consultation, may I have a few details?",
      { type: 'contact-form' },
    )],
    step: 9,
    leadUpdate: { hasWallpaper: 'Yes' },
  }];
}

function processLeadCapture(ld: Partial<Lead>): FlowAction[] {
  return [
    {
      messages: [msg(
        "Based on your project, the next step is a private phone consultation with our specialist to get you started.",
      )],
      step: 10,
    },
    {
      messages: [msg(
        "You're all set. A specialist will reach out shortly to finalize your consultation.\n\nWe look forward to transforming your space into something extraordinary.",
      )],
      step: 11,
      delayMs: 1500,
    },
  ];
}

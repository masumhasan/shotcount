import { useState, useEffect, useRef, useCallback } from 'react';
import type { Message, Lead, FlowAction } from '../types';
import {
  GREETING_MESSAGE, INITIAL_MESSAGE,
  createWelcomeMessage, processStep,
} from '../lib/flow';
import { generateConciergeResponse } from '../services/openai';
import { useLeadManager } from './useLeadManager';
import { sendChatSummaryEmail } from '../services/email';

interface UseChatProps {
  onLeadUpdate?: (lead: Lead) => void;
  requireContact?: boolean;
}

export function useChat({ onLeadUpdate, requireContact }: UseChatProps = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [contactCollected, setContactCollected] = useState(!requireContact);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { userLeadData, updateLeadData } = useLeadManager({
    messages,
    currentStep,
    onLeadUpdate,
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (messages.length === 0) {
      if (requireContact) {
        setMessages([GREETING_MESSAGE]);
      } else {
        setMessages([INITIAL_MESSAGE]);
        setCurrentStep(1);
      }
    }
  }, []);

  const executeFlowActions = (actions: FlowAction[]) => {
    let cumulativeDelay = 0;

    for (const action of actions) {
      cumulativeDelay += action.delayMs ?? 0;

      if (cumulativeDelay === 0) {
        if (action.messages.length) setMessages(prev => [...prev, ...action.messages]);
        if (action.step !== undefined) setCurrentStep(action.step);
        if (action.leadUpdate) updateLeadData(action.leadUpdate);
      } else {
        const delay = cumulativeDelay;
        const a = action;
        setTimeout(() => {
          if (a.messages.length) setMessages(prev => [...prev, ...a.messages]);
          if (a.step !== undefined) setCurrentStep(a.step);
          if (a.leadUpdate) updateLeadData(a.leadUpdate);
        }, delay);
      }
    }
  };

  const handleContactSubmit = (name: string, phone: string, email: string) => {
    const summary = email ? `${name} - ${phone} - ${email}` : `${name} - ${phone}`;
    const userMsg: Message = {
      id: Date.now().toString(),
      text: summary,
      sender: 'user',
    };
    setMessages(prev => [...prev, userMsg]);
    updateLeadData({ name, phone, ...(email ? { email } : {}) });
    setContactCollected(true);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, createWelcomeMessage(name)]);
      setCurrentStep(1);
    }, 800);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), text: inputValue, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    const text = inputValue;
    setInputValue('');
    setIsTyping(true);

    if (currentStep === 0) {
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: "I'd love to assist you. Please share your name and preferred contact method using the form above - it helps me provide a truly personalized experience.",
          sender: 'bot',
        }]);
      }, 600);
      return;
    }

    const currentOptions = messages[messages.length - 1]?.options;
    if (currentOptions) {
      const match = currentOptions.find(opt =>
        text.toLowerCase().includes(opt.toLowerCase()) ||
        opt.toLowerCase().includes(text.toLowerCase()),
      );
      if (match) {
        setTimeout(() => {
          setIsTyping(false);
          executeFlowActions(processStep(currentStep, match, userLeadData));
        }, 800);
        return;
      }
    }

    try {
      const response = await generateConciergeResponse(text, currentStep, userLeadData);
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: response,
        sender: 'bot',
      }]);
    } catch (error) {
      console.error('OpenAI Error:', error);
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: "I appreciate your patience. Could you share that with me once more?",
        sender: 'bot',
      }]);
    }
  };

  const handleOptionSelect = (option: string) => {
    const userMsg: Message = { id: Date.now().toString(), text: option, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      executeFlowActions(processStep(currentStep, option, userLeadData));
    }, 800);
  };

  const triggerFlowStep = (input: string) => {
    executeFlowActions(processStep(currentStep, input, userLeadData));
  };

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const summarySentRef = useRef(false);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (summarySentRef.current) return;

    idleTimerRef.current = setTimeout(() => {
      if (summarySentRef.current || messages.length <= 1) return;
      summarySentRef.current = true;
      sendChatSummaryEmail(userLeadData, messages);
    }, 5 * 60 * 1000);
  }, [userLeadData, messages]);

  useEffect(() => {
    if (messages.length > 1 && contactCollected) {
      resetIdleTimer();
    }
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [messages, contactCollected, resetIdleTimer]);

  return {
    messages,
    inputValue,
    isTyping,
    contactCollected,
    chatEndRef,
    setInputValue,
    handleSendMessage,
    handleOptionSelect,
    handleContactSubmit,
    triggerFlowStep,
  };
}

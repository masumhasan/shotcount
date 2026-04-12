import React from 'react';
import { cn } from '../lib/utils';
import { useChat } from '../hooks/useChat';
import { ChatHeader } from './chat/ChatHeader';
import { ChatMessages } from './chat/ChatMessages';
import { ChatInput } from './chat/ChatInput';
import type { Lead } from '../types';

interface ChatInterfaceProps {
  isFullScreen?: boolean;
  requireContact?: boolean;
  onClose?: () => void;
  onLeadUpdate?: (lead: Lead) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  isFullScreen,
  requireContact,
  onClose,
  onLeadUpdate,
}) => {
  const {
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
  } = useChat({ onLeadUpdate, requireContact });

  return (
    <div
      className={cn(
        'bg-white flex flex-col overflow-hidden',
        isFullScreen
          ? 'w-full h-screen max-w-4xl mx-auto shadow-2xl rounded-none md:rounded-3xl md:h-[90vh] md:my-[5vh]'
          : 'w-[400px] h-[600px] rounded-3xl shadow-2xl border border-border',
      )}
    >
      <ChatHeader onClose={onClose} />
      <ChatMessages
        messages={messages}
        isTyping={isTyping}
        contactCollected={contactCollected}
        chatEndRef={chatEndRef}
        onOptionSelect={handleOptionSelect}
        onFlowStep={triggerFlowStep}
        onContactSubmit={handleContactSubmit}
      />
      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSubmit={handleSendMessage}
      />
    </div>
  );
};

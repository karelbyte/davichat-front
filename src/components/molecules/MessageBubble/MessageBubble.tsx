import React from 'react';

interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: string;
  messageType: 'text' | 'file' | 'audio';
}

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  senderName?: string;
  isGroupConversation?: boolean;
  className?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  senderName,
  isGroupConversation = false,
  className = ''
}) => {
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 ${className}`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isOwnMessage ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
      }`}>
        {isGroupConversation && !isOwnMessage && (
          <div className={`text-xs font-medium ${
            isOwnMessage ? 'text-blue-100' : 'text-gray-600'
          } mb-1`}>
            {senderName} • {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        )}
        <div className="text-sm">{message.content}</div>
        {(!isGroupConversation || isOwnMessage) && (
          <div className={`text-xs ${
            isOwnMessage ? 'text-blue-100' : 'text-gray-500'
          } mt-1`}>
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}; 
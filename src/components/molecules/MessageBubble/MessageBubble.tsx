import React from 'react';
import { Message } from '../../../services/types';

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
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 px-2 ${className}`}>
      <div className="flex flex-col">
        <div className={`flex items-center gap-2 mb-1 ${
          isOwnMessage ? 'justify-end' : 'justify-start'
        }`}>
          {isGroupConversation && !isOwnMessage && (
            <div className="text-xs font-medium text-gray-600">
              {senderName}
            </div>
          )}
          <div className="text-xs text-gray-500">
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isOwnMessage ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
        }`}>
          <div className="text-sm">{message.content}</div>
        </div>
      </div>
    </div>
  );
}; 
import React, { useState } from 'react';
import { IconButton } from '../IconButton/IconButton';
import { GoBell } from "react-icons/go";

interface UnreadMessage {
  senderId: string;
  senderName: string;
  conversationId: string;
  messageContent: string;
  timestamp: string;
}

interface NotificationBellProps {
  unreadMessages: UnreadMessage[];
  onMessageClick: (conversationId: string, senderId: string) => void;
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  unreadMessages,
  onMessageClick,
  className = ''
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleBellClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMessageClick = (conversationId: string, senderId: string) => {
    onMessageClick(conversationId, senderId);
    setIsMenuOpen(false);
  };

  const handleOutsideClick = () => {
    setIsMenuOpen(false);
  };

  const unreadCount = unreadMessages.length;

  return (
    <div className={`relative ${className}`}>
      <IconButton
        onClick={handleBellClick}
        className="text-gray-600 hover:text-gray-800 relative"
      >
        <GoBell/>
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
        )}
      </IconButton>

      {isMenuOpen && (
        <div className="fixed inset-0 z-50" onClick={handleOutsideClick}>
          <div className="absolute top-16 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-64 max-w-sm">
            <div className="mb-2">
              <h3 className="text-sm font-medium text-gray-900">
                Mensajes no leídos ({unreadCount})
              </h3>
            </div>
            
            {unreadMessages.length === 0 ? (
              <div className="text-sm text-gray-500 py-2">
                No hay mensajes no leídos
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {unreadMessages.map((message, index) => (
                  <button
                    key={index}
                    onClick={() => handleMessageClick(message.conversationId, message.senderId)}
                    className="w-full text-left p-2 hover:bg-gray-50 rounded transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {message.senderName}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {message.messageContent}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 ml-2">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 
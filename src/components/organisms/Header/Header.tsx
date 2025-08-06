import React, { useState, useRef, useEffect } from 'react';
import { User } from '../../../services/api';
import { Avatar } from '../../atoms/Avatar/Avatar';
import { NotificationBell } from '../../atoms/NotificationBell/NotificationBell';

interface UnreadMessage {
  senderId: string;
  senderName: string;
  conversationId: string;
  messageContent: string;
  timestamp: string;
}

interface HeaderProps {
  currentUser: User;
  onLogout: () => void;
  unreadMessages: UnreadMessage[];
  onNotificationClick: (conversationId: string, senderId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  currentUser, 
  onLogout, 
  unreadMessages, 
  onNotificationClick 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <img src="/logo.png" alt="logo" className="w-12 h-8" />
          <h1 className="text-lg text-gray-600">
            Davivienda Chat Interno
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <NotificationBell
            unreadMessages={unreadMessages}
            onMessageClick={onNotificationClick}
          />
          
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Avatar name={currentUser.name} size="md" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                <div className="py-1">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                    <div className="font-medium">{currentUser.name}</div>
                    <div className="text-gray-500">{currentUser.email}</div>
                  </div>
                  <button
                    onClick={() => {
                      onLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}; 
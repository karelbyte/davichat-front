import React, { useState, useRef, useEffect } from 'react';
import { User } from '../../../services/api';
import { Avatar } from '../../atoms/Avatar/Avatar';
import { NotificationBell } from '../../atoms/NotificationBell/NotificationBell';
import { ProfileConfigModal } from '../../atoms/ProfileConfigModal/ProfileConfigModal';
import { TbAlertCircle } from "react-icons/tb";
import { TbBellOff } from "react-icons/tb";
import { TbSettings } from "react-icons/tb";
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
  onRequestNotificationPermission?: () => Promise<boolean>;
  browserNotificationsEnabled?: boolean;
  onUpdateProfile?: (data: { name: string; email: string; avatar?: string }) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  currentUser, 
  onLogout, 
  unreadMessages, 
  onNotificationClick,
  onRequestNotificationPermission,
  browserNotificationsEnabled = false,
  onUpdateProfile
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
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
        <a
        href={process.env.NEXT_PUBLIC_HUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex title-font font-medium items-center text-gray-900"
      >
          <img src="/link.png" alt="logo" className="w-22" />
          </a>
          <h1 className="text-lg text-gray-600">
            Davivienda Chat Interno
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          {/* Botón de notificaciones del navegador */}
          {onRequestNotificationPermission && (
            <button
              onClick={onRequestNotificationPermission}
              className={`p-2 rounded-full transition-colors ${
                browserNotificationsEnabled 
                  ? 'text-green-600 hover:text-green-700' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title={browserNotificationsEnabled ? 'Notificaciones habilitadas' : 'Habilitar notificaciones'}
            >
              {browserNotificationsEnabled ? <TbAlertCircle/> : <TbBellOff />}
            </button>
          )}
          
          <NotificationBell
            unreadMessages={unreadMessages}
            onMessageClick={onNotificationClick}
          />
          
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Avatar name={currentUser.name} size="md" src={currentUser.avatar} />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                <div className="py-1">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                    <div className="font-medium">{currentUser.name}</div>
                  </div>
                  
                  {onUpdateProfile && (
                    <button
                      onClick={() => {
                        setIsProfileModalOpen(true);
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
                    >
                      <TbSettings className="mr-2" />
                      Configuración
                    </button>
                  )}
                  
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
      
      {onUpdateProfile && (
        <ProfileConfigModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          currentUser={currentUser}
          onUpdateProfile={onUpdateProfile}
        />
      )}
    </header>
  );
}; 
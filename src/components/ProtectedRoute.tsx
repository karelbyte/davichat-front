"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/auth.context';
import { ChatPage } from './pages/ChatPage/ChatPage';
import { User } from '../services/api';
import DotPulse from './atoms/Dotpulse';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, connectToChat } = useAuth();
  const [chatUser, setChatUser] = useState<User | null>(null);
  const [isConnectingToChat, setIsConnectingToChat] = useState(false);

  // Función para actualizar el usuario del chat
  const updateChatUser = (updatedUser: User) => {
    setChatUser(updatedUser);
  };

  useEffect(() => {
    
    if (isAuthenticated && !chatUser && !isConnectingToChat) {
      setIsConnectingToChat(true);
      connectToChat()
        .then(async (user) => {
          if (user) {
            // Obtener información actualizada del usuario incluyendo avatar
            try {
              const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user.id}`);
              if (response.ok) {
                const userData = await response.json();
                // Actualizar el usuario con la información del servidor
                const updatedUser = {
                  ...user,
                  name: userData.name,
                  email: userData.email,
                  avatar: userData.avatar ? `${process.env.NEXT_PUBLIC_API_URL}${userData.avatar.replace('/api', '')}` : undefined
                };
                setChatUser(updatedUser);
              } else {
                // Si falla la llamada, usar el usuario del chat
                setChatUser(user);
              }
            } catch (error) {
              console.error('Error al obtener información del usuario:', error);
              // Si falla la llamada, usar el usuario del chat
              setChatUser(user);
            }
          }
        })
        .catch((error) => {
          // Error connecting to chat
        })
        .finally(() => {
          setIsConnectingToChat(false);
        });
    }
  }, [isAuthenticated, chatUser, isConnectingToChat, connectToChat]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const hubUrl = process.env.NEXT_PUBLIC_HUB_URL || 'https://davihub.achdavivienda.org';
      window.location.href = hubUrl;
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading || isConnectingToChat) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <DotPulse />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <DotPulse />
          <p className="mt-4 text-gray-600">Redirigiendo a davihub...</p>
        </div>
      </div>
    );
  }

  if (!chatUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <DotPulse />
      </div>
    );
  }

  return <ChatPage currentUser={chatUser} onUpdateUser={updateChatUser} />;
}; 
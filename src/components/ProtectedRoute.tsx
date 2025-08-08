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

  useEffect(() => {
    if (isAuthenticated && !chatUser && !isConnectingToChat) {
      setIsConnectingToChat(true);
      connectToChat()
        .then((user) => {
          setChatUser(user);
        })
        .catch((error) => {
          console.error('Error connecting to chat:', error);
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

  return <ChatPage currentUser={chatUser} />;
}; 
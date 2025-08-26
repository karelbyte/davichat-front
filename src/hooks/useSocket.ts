import { useEffect, useRef } from 'react';
import { SocketService } from '../services/socket';
import { User } from '../services/api';

export const useSocket = (currentUser: User | null) => {
  const socketServiceRef = useRef<SocketService | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    socketServiceRef.current = new SocketService();
    socketServiceRef.current.connect(currentUser);

    return () => {
      socketServiceRef.current?.disconnect();
    };
  }, [currentUser]);

  const getSocketService = () => socketServiceRef.current;

  return { getSocketService };
}; 
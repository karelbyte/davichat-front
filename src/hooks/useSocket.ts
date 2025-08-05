import { useEffect, useRef } from 'react';
import { SocketService } from '../services/socket';

export const useSocket = (userId: string | null) => {
  const socketServiceRef = useRef<SocketService | null>(null);

  useEffect(() => {
    if (!userId) return;

    socketServiceRef.current = new SocketService();
    socketServiceRef.current.connect(userId);

    return () => {
      socketServiceRef.current?.disconnect();
    };
  }, [userId]);

  const getSocketService = () => socketServiceRef.current;

  return { getSocketService };
}; 
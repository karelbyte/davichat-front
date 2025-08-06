import { useState } from 'react';
import { apiService, User } from '../services/api';

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (userData: {
    id: string;
    name: string;
    email: string;
    roles: string[];
    filials: string[];
  }) => {
    setIsLoading(true);
    try {
      const user = await apiService.createUser({
        ...userData,
        status: 'online',
        lastSeen: new Date().toISOString(),
        isActive: true
      });
      setCurrentUser(user);
      return user;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  return {
    currentUser,
    isLoading,
    login,
    logout,
    isAuthenticated: !!currentUser
  };
}; 
import React from 'react';
import { LoginForm } from '../../organisms/LoginForm/LoginForm';
import { useAuth } from '../../../hooks/useAuth';

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login, isLoading } = useAuth();

  const handleLogin = async (userData: {
    id: string;
    name: string;
    email: string;
    roles: string[];
    filials: string[];
  }) => {
    try {
      const user = await login(userData);
      onLoginSuccess(user);
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  return (
    <LoginForm onLogin={handleLogin} isLoading={isLoading} />
  );
}; 
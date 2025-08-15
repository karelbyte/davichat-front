import React from 'react';
import { useAuth } from '../../../contexts/auth.context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || !user.roles?.some(role => role.code === 'admin'))) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando permisos de administrador...</p>
        </div>
      </div>
    );
  }

  if (!user || !user.roles?.some(role => role.code === 'admin')) {
    return null;
  }

  return <>{children}</>;
};

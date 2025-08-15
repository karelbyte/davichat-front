'use client';

import { AdminPage } from '../../components/pages/AdminPage/AdminPage';
import { AdminRoute } from '../../components/atoms/AdminRoute/AdminRoute';
import { useAuth, AuthUser } from '../../contexts/auth.context';
import { User } from '../../services/api';

// Función helper para convertir AuthUser a User del chat
const convertAuthUserToChatUser = (authUser: AuthUser): User => {
  return {
    id: authUser.id,
    name: authUser.names || authUser.username,
    email: authUser.email,
    roles: authUser.roles?.map(role => role.code) || ['user'],
    filials: [], // No tenemos esta información en AuthUser
    status: 'online',
    lastSeen: new Date().toISOString(),
    createdAt: authUser.created_at || new Date().toISOString(),
    updatedAt: authUser.updated_at || new Date().toISOString(),
    isActive: authUser.is_active || true,
    isOnline: true
  };
};

export default function AdminPageRoute() {
  const { user } = useAuth();

  // Convertir AuthUser a User del chat si existe
  const chatUser = user ? convertAuthUserToChatUser(user) : undefined;

  return (
    <AdminRoute>
      <AdminPage currentUser={chatUser} />
    </AdminRoute>
  );
}

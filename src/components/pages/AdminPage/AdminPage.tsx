import React, { useState, useEffect } from 'react';
import { Header } from '../../organisms/Header/Header';
import { useAuth } from '../../../contexts/auth.context';
import { useRouter } from 'next/navigation';
import { adminApiService, AdminStats } from '../../../services/adminApi';
import { User, Conversation } from '../../../services/api';
import { Message } from '../../../services/types';
import { toast } from 'react-toastify';

interface AdminPageProps {
  currentUser?: User;
}

// Tipo extendido para mensajes procesados en el admin
interface ProcessedMessage extends Message {
  senderName: string;
}

// Interfaz para el modal de confirmación
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

// Componente Modal de Confirmación
const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Eliminar',
  cancelText = 'Cancelar'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="relative bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export const AdminPage: React.FC<AdminPageProps> = ({ currentUser }) => {
  const { logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    onlineUsers: 0,
    totalConversations: 0,
    totalMessages: 0
  });
  const [users, setUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ProcessedMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para modales de confirmación
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'user' | 'conversation' | 'message' | 'all-messages';
    id: string;
    name: string;
  }>({
    isOpen: false,
    type: 'user',
    id: '',
    name: ''
  });

  // Verificar si el usuario es admin
  useEffect(() => {
    if (currentUser && !currentUser.roles?.includes('admin')) {
      router.push('/');
      return;
    }
  }, [currentUser, router]);

  useEffect(() => {
    if (currentUser?.roles?.includes('admin')) {
      loadAdminData();
      loadMessages(); // Cargar mensajes también
    }
  }, [currentUser]);

  const loadMessages = async () => {
    try {
      const response = await fetch(`${adminApiService.baseUrl}/messages`);
      if (response.ok) {
        const messagesData = await response.json();
        
        // Procesar mensajes para mostrar nombres en lugar de IDs de remitente
        const processedMessages: ProcessedMessage[] = messagesData.map((message: Message) => {
          // Usar el nombre del sender si está disponible, sino buscar en la lista de usuarios
          let senderName = message.sender?.name;
          if (!senderName) {
            const senderUser = users.find(user => user.id === message.senderId);
            senderName = senderUser ? senderUser.name : message.senderId;
          }
          
          return {
            ...message,
            senderName: senderName // Agregar el nombre del remitente
          };
        });
        
        setMessages(processedMessages);
        
        // Actualizar estadísticas con el conteo real de mensajes
        setStats(prevStats => ({
          ...prevStats,
          totalMessages: messagesData.length
        }));
      } else {
        throw new Error('Error al cargar mensajes');
      }
    } catch (error) {
      console.log(error);
      toast.error('Error al cargar mensajes');
    }
  };

  const loadAdminData = async () => {
    setIsLoading(true);
    
    try {
      const [usersData, conversationsData] = await Promise.all([
        adminApiService.getAllUsers(),
        adminApiService.getAllConversations()
      ]);
      
      setUsers(usersData);
      setConversations(conversationsData);
      
      // Calcular estadísticas localmente (como en admin.html)
      setStats(prevStats => ({
        totalUsers: usersData.length,
        onlineUsers: usersData.filter((u: User) => u.isOnline).length,
        totalConversations: conversationsData.length,
        totalMessages: prevStats.totalMessages // Mantener el conteo de mensajes si ya se cargaron
      }));
    } catch (error) {
      toast.error('Error al cargar datos de administración');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: 'delete') => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setConfirmModal({
        isOpen: true,
        type: 'user',
        id: userId,
        name: user.name
      });
    }
  };

  const handleConversationAction = async (conversationId: string, action: 'delete') => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setConfirmModal({
        isOpen: true,
        type: 'conversation',
        id: conversationId,
        name: conversation.name || `Conversación ${conversation.type}`
      });
    }
  };

  const handleMessageAction = async (messageId: string, action: 'delete') => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      setConfirmModal({
        isOpen: true,
        type: 'message',
        id: messageId,
        name: message.content ? message.content.substring(0, 30) + '...' : 'Mensaje'
      });
    }
  };

  const handleDeleteAllMessages = async () => {
    setConfirmModal({
      isOpen: true,
      type: 'all-messages',
      id: '',
      name: `todos los mensajes (${messages.length})`
    });
  };

  // Función para confirmar la eliminación
  const confirmDelete = async () => {
    try {
      switch (confirmModal.type) {
        case 'user':
          await adminApiService.deleteUser(confirmModal.id);
          toast.success('Usuario eliminado correctamente');
          await loadAdminData();
          break;
        case 'conversation':
          await adminApiService.deleteConversation(confirmModal.id);
          toast.success('Conversación eliminada correctamente');
          await loadAdminData();
          break;
        case 'message':
          const response = await fetch(`${adminApiService.baseUrl}/messages/${confirmModal.id}`, {
            method: 'DELETE'
          });
          if (response.ok) {
            toast.success('Mensaje eliminado correctamente');
            await loadMessages();
          } else {
            throw new Error('Error al eliminar mensaje');
          }
          break;
        case 'all-messages':
          const deleteResponse = await adminApiService.deleteAllMessages();
          toast.success(`${deleteResponse.message} (${deleteResponse.deletedCount} mensajes eliminados)`);
          await loadMessages();
          break;
      }
    } catch (error) {
      console.log(error);
      toast.error(`Error al eliminar ${confirmModal.type === 'user' ? 'usuario' : confirmModal.type === 'conversation' ? 'conversación' : confirmModal.type === 'all-messages' ? 'todos los mensajes' : 'mensaje'}`);
    } finally {
      setConfirmModal({ isOpen: false, type: 'user', id: '', name: '' });
    }
  };

  // Función para cerrar el modal
  const closeConfirmModal = () => {
    setConfirmModal({ isOpen: false, type: 'user', id: '', name: '' });
  };

  // Función para obtener el título del modal según el tipo
  const getConfirmModalTitle = () => {
    switch (confirmModal.type) {
      case 'user':
        return `¿Eliminar Usuario?`;
      case 'conversation':
        return `¿Eliminar Conversación?`;
      case 'message':
        return `¿Eliminar Mensaje?`;
      case 'all-messages':
        return `¿Eliminar Todos los Mensajes?`;
      default:
        return `¿Confirmar Acción?`;
    }
  };

  // Función para obtener el mensaje del modal según el tipo
  const getConfirmModalMessage = () => {
    switch (confirmModal.type) {
      case 'user':
        return `¿Estás seguro de que quieres eliminar al usuario "${confirmModal.name}"? Esta acción no se puede deshacer y se perderán todos los datos asociados.`;
      case 'conversation':
        return `¿Estás seguro de que quieres eliminar la conversación "${confirmModal.name}"? Esta acción no se puede deshacer y se perderán todos los mensajes asociados.`;
      case 'message':
        return `¿Estás seguro de que quieres eliminar el mensaje "${confirmModal.name}"? Esta acción no se puede deshacer.`;
      case 'all-messages':
        return `¿Estás seguro de que quieres eliminar ${confirmModal.name}? Esta acción no se puede deshacer y se perderán permanentemente todos los mensajes del sistema.`;
      default:
        return `¿Estás seguro de que quieres realizar esta acción?`;
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!currentUser || !currentUser.roles?.includes('admin')) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header 
        currentUser={currentUser} 
        onLogout={handleLogout}
        unreadMessages={[]}
        onNotificationClick={() => {}}
      />
      
      <div className="px-4 py-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Panel de Administración</h1>
          <p className="text-gray-600">Gestiona usuarios, conversaciones y monitorea el sistema</p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Usuarios Online</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.onlineUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14H9a2 2 0 01-2-2V6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2h-2l-4 4z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Conversaciones</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalConversations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Mensajes</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalMessages}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gestión de Usuarios */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">👥 Usuarios</h2>
              <button
                onClick={loadAdminData}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Recargar Usuarios
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.isOnline ? 'Online' : 'Offline'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleUserAction(user.id, 'delete')}
                          className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Gestión de Conversaciones */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">💬 Conversaciones</h2>
              <button
                onClick={loadAdminData}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Recargar Conversaciones
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participantes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {conversations.map(conversation => (
                    <tr key={conversation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{conversation.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          conversation.type === 'group' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {conversation.type === 'group' ? 'Grupo' : 'Privado'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {conversation.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {conversation.description || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {conversation.participants?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {conversation.createdAt ? new Date(conversation.createdAt).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleConversationAction(conversation.id, 'delete')}
                          className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Gestión de Mensajes */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">📨 Mensajes</h2>
              <div className="flex space-x-2">
                <button
                  onClick={loadMessages}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Cargar Mensajes
                </button>
                <button
                  onClick={() => handleDeleteAllMessages()}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  🗑️ Eliminar Todos
                </button>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversación</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remitente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contenido</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {messages.map(message => (
                    <tr key={message.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{message.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{message.conversationId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{message.senderName}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {message.content ? message.content.substring(0, 50) + '...' : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{message.messageType}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {message.timestamp ? new Date(message.timestamp).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleMessageAction(message.id, 'delete')}
                          className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Botón de recarga general */}
        <div className="text-center">
          <button
            onClick={loadAdminData}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Recargar Todos los Datos
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmDelete}
        title={getConfirmModalTitle()}
        message={getConfirmModalMessage()}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </div>
  );
};

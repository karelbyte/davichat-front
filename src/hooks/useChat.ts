import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService, User, Conversation } from '../services/api';
import { Message } from '../services/types';
import { SocketService } from '../services/socket';
import { toast } from 'react-toastify';

export const useChat = (currentUser: User | null, socketService: SocketService | null) => {
  const [users, setUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [groupUnreadCounts, setGroupUnreadCounts] = useState<Record<string, number>>({});
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado para notificaciones del navegador
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);

  const currentConversationRef = useRef<Conversation | null>(null);

  useEffect(() => {
    currentConversationRef.current = currentConversation;
  }, [currentConversation]);

  const loadUsersAndConversations = useCallback(async () => {
    if (!currentUser) return;

    setIsLoading(true);
    setError(null); // Limpiar errores previos
    
    // Crear un timeout para evitar que se quede colgada indefinidamente
    const timeoutId = setTimeout(() => {
      setError('La carga está tardando más de lo esperado. Por favor, verifica tu conexión.');
      setIsLoading(false);
    }, 30000); // 30 segundos de timeout

    try {
      const [usersData, conversationsData] = await Promise.all([
        apiService.getUsers(),
        apiService.getUserConversations(currentUser.id)
      ]);
      
      clearTimeout(timeoutId); // Limpiar timeout si la carga fue exitosa
      setUsers(usersData);
      setConversations(conversationsData);
                    } catch (error) {
                  clearTimeout(timeoutId); // Limpiar timeout en caso de error
                  console.error('Error loading data:', error);
                  setError('Error al cargar usuarios y conversaciones. Por favor, intenta de nuevo.');
                } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

                const loadMessages = useCallback(async (conversationId: string) => {
                try {
                  const messagesData = await apiService.getMessages(conversationId);
                  setMessages(messagesData);
                } catch (error) {
                  console.error('Error loading messages:', error);
                }
              }, []);

  const startPrivateChat = useCallback(async (otherUserId: string) => {
    if (!currentUser) return;

    try {
      const conversation = await apiService.createConversation({
        type: 'private',
        participants: [currentUser.id, otherUserId],
        createdBy: currentUser.id
      });

      setUnreadCounts(prev => ({ ...prev, [otherUserId]: 0 }));
      localStorage.setItem('selectedConversationId', conversation.id);
      setCurrentConversation(conversation);
      setTypingUsers(new Set());
      loadMessages(conversation.id);
                    } catch (error) {
                  console.error('Error creating private chat:', error);
                }
  }, [currentUser, loadMessages]);

  const joinConversation = useCallback((conversation: Conversation) => {
    console.log('Conversation selected:', conversation.id, 'Type:', conversation.type, 'Name:', conversation.name);
    localStorage.setItem('selectedConversationId', conversation.id);
    setCurrentConversation(conversation);
    setTypingUsers(new Set());

    loadMessages(conversation.id);

    if (conversation.participants) {
      setUnreadCounts(prev => {
        const newCounts = { ...prev };
        conversation.participants.forEach(participantId => {
          if (participantId !== currentUser?.id) {
            newCounts[participantId] = 0;
          }
        });
        return newCounts;
      });
    }

    if (conversation.type === 'group') {
      setGroupUnreadCounts(prev => ({ ...prev, [conversation.id]: 0 }));
    }
  }, [currentUser, loadMessages]);

  const sendMessage = useCallback((content: string, messageType: 'text' | 'file' | 'audio' = 'text') => {
    if (!currentUser || !socketService) return;
    
    if (!currentConversation?.id) {
      return;
    }
    
    socketService.sendMessage(currentConversation.id, currentUser.id, content, messageType);
  }, [currentConversation, currentUser, socketService]);

  const startTyping = useCallback(() => {
    if (!currentConversation || !currentUser || !socketService) return;
    socketService.startTyping(currentConversation.id, currentUser.id);
  }, [currentConversation, currentUser, socketService]);

  const stopTyping = useCallback(() => {
    if (!currentConversation || !currentUser || !socketService) return;
    socketService.stopTyping(currentConversation.id, currentUser.id);
  }, [currentConversation, currentUser, socketService]);

  const createGroup = useCallback((groupData: {
    name: string;
    description: string;
    participants: string[];
  }) => {
    if (!currentUser || !socketService) return;

    socketService.createGroup({
      ...groupData,
      participants: [...groupData.participants, currentUser.id],
      createdBy: currentUser.id
    });
  }, [currentUser, socketService]);

  const addUserToGroup = useCallback((userId: string) => {
    if (!currentConversation || !currentUser || !socketService) return;

    socketService.addUserToGroup(currentConversation.id, userId, currentUser.id);
  }, [currentConversation, currentUser, socketService]);

  const editMessage = useCallback((messageId: string, newContent: string) => {
    if (!currentUser || !socketService) return;

    socketService.editMessage(messageId, newContent, currentUser.id);
  }, [currentUser, socketService]);

  const deleteMessage = useCallback((messageId: string) => {
    if (!currentUser || !socketService) return;

    socketService.deleteMessage(messageId, currentUser.id);
  }, [currentUser, socketService]);

  // Función para solicitar permisos de notificación
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setBrowserNotificationsEnabled(permission === 'granted');
      return permission === 'granted';
    }
    return false;
  }, []);

  // Función para mostrar notificación del navegador
  const showBrowserNotification = useCallback((title: string, options: NotificationOptions) => {
    if (browserNotificationsEnabled && !isPageVisible) {
      new Notification(title, options);
    }
  }, [browserNotificationsEnabled, isPageVisible]);

  // Función para actualizar el título de la pestaña
  const updatePageTitle = useCallback((unreadCount: number) => {
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) DaviChat`;
    } else {
      document.title = 'DaviChat';
    }
  }, []);

  // Función para reproducir sonido de notificación
  const playNotificationSound = useCallback(() => {
    if (!isPageVisible) {
      try {
        const audio = new Audio('/notification.mp3'); // Necesitarás agregar este archivo
        audio.volume = 0.5;
        audio.play().catch(() => {
          // Fallback: usar Web Audio API para generar un beep
          const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = 800;
          oscillator.type = 'sine';
          gainNode.gain.value = 0.1;
          
          oscillator.start();
          setTimeout(() => {
            oscillator.stop();
            audioContext.close();
          }, 200);
        });
      } catch (error) {
        console.log(error);
        console.log('No se pudo reproducir sonido de notificación');
      }
    }
  }, [isPageVisible]);

  // Efecto para manejar la visibilidad de la página
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsPageVisible(isVisible);
      
      // Si la página se vuelve visible, limpiar el título
      if (isVisible) {
        document.title = 'DaviChat';
      }
    };

    const handleFocus = () => {
      setIsPageVisible(true);
      document.title = 'DaviChat';
    };

    const handleBlur = () => {
      setIsPageVisible(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Efecto para solicitar permisos de notificación al montar
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      requestNotificationPermission();
    } else if ('Notification' in window && Notification.permission === 'granted') {
      setBrowserNotificationsEnabled(true);
    }
  }, [requestNotificationPermission]);

  useEffect(() => {
    if (!socketService || !currentUser) return;

    const setupEventListeners = () => {
      
      socketService.on('message_received', (message) => {
        // Agregar el mensaje al estado local si estamos en la conversación correcta
        if (currentConversation && message.conversationId === currentConversation.id) {
          setMessages(prev => [...prev, message]);
        }
        
        // También actualizar el contador de mensajes no leídos
        if (message.conversationId !== currentConversation?.id) {
          // Buscar la conversación para determinar si es privada o de grupo
          const conversation = conversations.find(c => c.id === message.conversationId);
          
          if (conversation && conversation.type === 'private') {
            // Es una conversación privada
            setUnreadCounts(prev => ({
              ...prev,
              [message.senderId]: (prev[message.senderId] || 0) + 1
            }));
          } else {
            // Es una conversación de grupo
            setGroupUnreadCounts(prev => ({
              ...prev,
              [message.conversationId]: (prev[message.conversationId] || 0) + 1
            }));
          }
        }

        // Solo mostrar notificaciones si no es el usuario actual y la página no está visible
        if (message.senderId !== currentUser?.id && !isPageVisible) {
          // Buscar el nombre del usuario en el array users
          const senderUser = users.find(user => user.id === message.senderId);
          const senderName = senderUser?.name || 'Usuario';
          
          // Notificación del navegador
          showBrowserNotification(
            `Nuevo mensaje de ${senderName}`,
            {
              body: message.content,
              icon: '/logo.png', // Usar el logo de tu app
              badge: '/logo.png',
              tag: `message_${message.conversationId}`,
              requireInteraction: false,
              silent: false
            }
          );

          // Sonido de notificación
          playNotificationSound();
        }
      });

      socketService.on('user_status_update', (data) => {
        setUsers(prev => prev.map(user => 
          user.id === data.userId 
            ? { ...user, isOnline: data.status === 'online' }
            : user
        ));
      });

            socketService.on('user_connected', (data) => {
        // ✅ MANEJAR LA ESTRUCTURA REAL QUE LLEGA DEL BACKEND:
        if (data.userId && data.name && data.email) {
          const userData = {
            id: data.userId,
            name: data.name,
            email: data.email,
            roles: [], // Valores por defecto
            filials: [],
            status: data.status || 'online',
            lastSeen: new Date().toISOString(),
            isActive: true,
            isOnline: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          setUsers(prev => {
            // Verificar si el usuario ya existe en la lista
            const existingUser = prev.find(user => user.id === data.userId);
            
            if (existingUser) {
              // Si existe, solo actualizar el estado online
              return prev.map(user => 
                user.id === data.userId 
                  ? { ...user, isOnline: true }
                  : user
              );
            } else {
              // Si no existe, agregarlo a la lista con estado online
              return [...prev, userData];
            }
          });
        }
      });

      socketService.on('user_disconnected', (data) => {
        
        setUsers(prev => prev.map(user => 
          user.id === data.userId 
            ? { ...user, isOnline: false }
            : user
        ));
      });

      socketService.on('user_leave', (data) => {
        setUsers(prev => prev.map(user => 
          user.id === data.userId 
            ? { ...user, isOnline: false }
            : user
        ));
      });

      socketService.on('unread_message_private', (data) => {
        if (currentConversation && currentConversation.participants.includes(data.senderId)) return;
        setUnreadCounts(prev => ({
          ...prev,
          [data.senderId]: (prev[data.senderId] || 0) + 1
        }));
      });

      socketService.on('unread_message_group', (data) => {
        if (currentConversation && currentConversation.id === data.conversationId) return;
        setGroupUnreadCounts(prev => ({
          ...prev,
          [data.conversationId]: (prev[data.conversationId] || 0) + 1
        }));
      });

      socketService.on('typing_indicator', (data) => {
        if (!currentConversation || data.conversationId !== currentConversation.id) return;
        if (data.userId === currentUser?.id) return;

        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (data.isTyping) {
            newSet.add(data.userId);
          } else {
            newSet.delete(data.userId);
          }
          return newSet;
        });
      });

      socketService.on('group_created', (data) => {
        console.log('🎉 Evento group_created recibido:', data);
        if (data.createdBy === currentUser?.id) {
          toast.success('Grupo creado con éxito, se envió notificación a los participantes');
        } else {
          if (data.participants.includes(currentUser?.id || '')) {
            toast.info(`Has sido añadido al grupo "${data.name}"`);
          }
        }
        loadUsersAndConversations();
      });

      socketService.on('user_added_to_group', (data) => {
        console.log('🎉 Evento user_added_to_group recibido:', data);
        
        if (data.userId === currentUser?.id) {
          const groupName = conversations.find(c => c.id === data.conversationId)?.name || 'grupo';
          toast.info(`Has sido añadido al grupo "${groupName}"`);
        }
        
        loadUsersAndConversations();
      });

      socketService.on('message_edited', (updatedMessage) => {
        setMessages(prev => prev.map(msg => 
          msg.id === updatedMessage.id ? updatedMessage : msg
        ));
      });

      socketService.on('message_deleted', (data) => {
        setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
      });

      socketService.on('edit_message_error', (data) => {
        alert(`Error editing message: ${data.error}`);
      });

      socketService.on('delete_message_error', (data) => {
        alert(`Error deleting message: ${data.error}`);
      });

      socketService.on('reply_received', (replyMessage) => {
        setMessages(prev => [...prev, replyMessage]);
      });
    };

    setupEventListeners();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socketService, currentUser, currentConversation, conversations, isPageVisible, showBrowserNotification, playNotificationSound]);

  useEffect(() => {
    if (!socketService || !currentConversation || !currentUser) return;
    
    socketService.joinRoom(currentConversation.id, currentUser.id);
  }, [socketService, currentConversation, currentUser]);

  useEffect(() => {
    loadUsersAndConversations();
  }, [loadUsersAndConversations]);

  const retryLoad = useCallback(() => {
    loadUsersAndConversations();
  }, [loadUsersAndConversations]);

  const sendReply = useCallback((replyTo: string, content: string, messageType: 'text' | 'file' | 'audio' = 'text') => {
    if (!currentUser || !socketService || !currentConversation) return;
    socketService.sendReply({
      conversationId: currentConversation.id,
      senderId: currentUser.id,
      content,
      messageType,
      replyTo
    });
  }, [currentUser, socketService, currentConversation]);

  // Efecto para actualizar el título de la pestaña cuando cambien los mensajes no leídos
  useEffect(() => {
    const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0) +
                        Object.values(groupUnreadCounts).reduce((sum, count) => sum + count, 0);
    
    updatePageTitle(totalUnread);
  }, [unreadCounts, groupUnreadCounts, updatePageTitle]);

  return {
    users,
    conversations,
    currentConversation,
    messages,
    unreadCounts,
    groupUnreadCounts,
    typingUsers: Array.from(typingUsers),
    isLoading,
    error,
    startPrivateChat,
    joinConversation,
    sendMessage,
    startTyping,
    stopTyping,
    createGroup,
    addUserToGroup,
    editMessage,
    deleteMessage,
    sendReply,
    loadUsersAndConversations,
    retryLoad,
    requestNotificationPermission,
    browserNotificationsEnabled,
    isPageVisible,
  };
}; 
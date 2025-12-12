import { useState, useEffect, useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
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
  const [lastMessageTimestamps, setLastMessageTimestamps] = useState<Record<string, string>>({});
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);

  const currentConversationRef = useRef<Conversation | null>(null);

  const generateEventKey = (eventType: string, data: { conversationId: string; userId?: string; action?: string; timestamp?: string; updatedAt?: string }) => {
    const timeKey = data.timestamp || data.updatedAt || 'unknown';
    return `${eventType}_${data.conversationId}_${data.userId || data.action}_${timeKey}`;
  };

  const isDuplicateEvent = (eventType: string, data: { conversationId: string; userId?: string; action?: string; timestamp?: string; updatedAt?: string }): boolean => {
    try {
      const eventKey = generateEventKey(eventType, data);
      const recentEvents = JSON.parse(sessionStorage.getItem('recentEvents') || '{}');
      const now = Date.now();

      Object.keys(recentEvents).forEach(key => {
        if (now - recentEvents[key] > 5000) {
          delete recentEvents[key];
        }
      });

      if (recentEvents[eventKey]) {
        return true;
      }

      recentEvents[eventKey] = now;
      sessionStorage.setItem('recentEvents', JSON.stringify(recentEvents));

      return false;
    } catch (error) {
      console.error('Error en deduplicación:', error);
      return false;
    }
  };

  const showToastIfNotDuplicate = (eventType: string, data: { conversationId: string; userId?: string; action?: string; timestamp?: string; updatedAt?: string }, toastFunction: () => void) => {
    if (!isDuplicateEvent(eventType, data)) {
      toastFunction();
    }
  };

  useEffect(() => {
    currentConversationRef.current = currentConversation;
  }, [currentConversation]);

  const loadUsersAndConversations = useCallback(async () => {
    if (!currentUser) return;

    setIsLoading(true);
    setError(null);

    const timeoutId = setTimeout(() => {
      setError('La carga está tardando más de lo esperado. Por favor, verifica tu conexión.');
      setIsLoading(false);
    }, 30000);

    try {
      const [usersData, conversationsData] = await Promise.all([
        apiService.getUsers(),
        apiService.getUserConversations(currentUser.id)
      ]);

      clearTimeout(timeoutId);

      const usersWithAvatars = usersData.map(user => ({
        ...user,
        avatar: user.avatar ? `${process.env.NEXT_PUBLIC_API_URL}${user.avatar.replace('/api', '')}` : undefined
      }));

      const sortedConversations = [...conversationsData].sort((a, b) => {
        const aUnread = (a.unreadCount ?? 0) > 0;
        const bUnread = (b.unreadCount ?? 0) > 0;

        if (aUnread && !bUnread) return -1;
        if (!aUnread && bUnread) return 1;

        const aLastRead = a.lastReadAt ? new Date(a.lastReadAt).getTime() : 0;
        const bLastRead = b.lastReadAt ? new Date(b.lastReadAt).getTime() : 0;

        return bLastRead - aLastRead;
      });

      setUsers(usersWithAvatars);
      setConversations(sortedConversations);

      if (currentUser) {
        setUnreadCounts(prev => {
          const newCounts = { ...prev };
          conversationsData.forEach(conversation => {
            if (conversation.type === 'private' && 
                conversation.unreadCount !== undefined && 
                conversation.unreadCount > 0) {
              const otherParticipant = conversation.participants.find(p => p !== currentUser.id);
              if (otherParticipant) {
                if (!prev[otherParticipant] || conversation.unreadCount > prev[otherParticipant]) {
                  newCounts[otherParticipant] = conversation.unreadCount;
                }
              }
            }
          });
          return newCounts;
        });

        setGroupUnreadCounts(prev => {
          const newCounts = { ...prev };
          conversationsData.forEach(conversation => {
            if (conversation.type === 'group' && 
                conversation.unreadCount !== undefined && 
                conversation.unreadCount > 0) {
              if (!prev[conversation.id] || conversation.unreadCount > prev[conversation.id]) {
                newCounts[conversation.id] = conversation.unreadCount;
              }
            }
          });
          return newCounts;
        });
      }
    } catch (error) {
      clearTimeout(timeoutId);
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

      const hasUnread = (unreadCounts[otherUserId] || 0) > 0 || (conversation.unreadCount || 0) > 0;
      const now = new Date().toISOString();

      if (hasUnread && socketService) {
        socketService.markMessagesAsRead(conversation.id, currentUser.id);
      }

      if (hasUnread) {
        flushSync(() => {
          setConversations(prev => {
            const otherUnreadCount = prev.reduce((count, conv) => {
              if (conv.id === conversation.id) return count;
              if (conv.type === 'private') {
                const otherPart = conv.participants.find(p => p !== currentUser?.id);
                if (otherPart) {
                  const hasUnreadConv = (unreadCounts[otherPart] || 0) > 0 || (conv.unreadCount || 0) > 0;
                  if (hasUnreadConv) return count + 1;
                }
              } else if (conv.type === 'group') {
                const hasUnreadConv = (groupUnreadCounts[conv.id] || 0) > 0 || (conv.unreadCount || 0) > 0;
                if (hasUnreadConv) return count + 1;
              }
              return count;
            }, 0);

            const shouldUpdateLastRead = otherUnreadCount === 0;

            const updated = prev.map(conv => {
              if (conv.id === conversation.id) {
                return {
                  ...conv,
                  lastReadAt: shouldUpdateLastRead ? now : conv.lastReadAt,
                  unreadCount: 0
                };
              }
              return conv;
            });

            const updatedConversation = updated.find(c => c.id === conversation.id) || conversation;

            setCurrentConversation({
              ...updatedConversation,
              lastReadAt: shouldUpdateLastRead ? now : updatedConversation.lastReadAt,
              unreadCount: 0
            });

            setUnreadCounts(prev => ({ ...prev, [otherUserId]: 0 }));

            return updated;
          });
        });
      } else {
        setCurrentConversation(conversation);
        setUnreadCounts(prev => ({ ...prev, [otherUserId]: 0 }));
      }

      localStorage.setItem('selectedConversationId', conversation.id);
      setTypingUsers(new Set());
      loadMessages(conversation.id);
    } catch (error) {
      console.error('Error creating private chat:', error);
    }
  }, [currentUser, loadMessages, socketService, unreadCounts]);

  const joinConversation = useCallback((conversation: Conversation) => {
    localStorage.setItem('selectedConversationId', conversation.id);
    setTypingUsers(new Set());

    const now = new Date().toISOString();
    let hasUnread = false;
    let otherParticipant: string | undefined;

    if (conversation.type === 'private') {
      otherParticipant = conversation.participants.find(p => p !== currentUser?.id);
      if (otherParticipant) {
        hasUnread = (unreadCounts[otherParticipant] || 0) > 0 || (conversation.unreadCount || 0) > 0;
      }
    } else if (conversation.type === 'group') {
      hasUnread = (groupUnreadCounts[conversation.id] || 0) > 0 || (conversation.unreadCount || 0) > 0;
    }

    if (hasUnread && currentUser && socketService) {
      socketService.markMessagesAsRead(conversation.id, currentUser.id);
    }

    if (hasUnread) {
      flushSync(() => {
        setConversations(prev => {
          const otherUnreadCount = prev.reduce((count, conv) => {
            if (conv.id === conversation.id) return count;
            if (conv.type === 'private') {
              const otherPart = conv.participants.find(p => p !== currentUser?.id);
              if (otherPart) {
                const hasUnreadConv = (unreadCounts[otherPart] || 0) > 0 || (conv.unreadCount || 0) > 0;
                if (hasUnreadConv) return count + 1;
              }
            } else if (conv.type === 'group') {
              const hasUnreadConv = (groupUnreadCounts[conv.id] || 0) > 0 || (conv.unreadCount || 0) > 0;
              if (hasUnreadConv) return count + 1;
            }
            return count;
          }, 0);

          const shouldUpdateLastRead = otherUnreadCount === 0;

          const updated = prev.map(conv => {
            if (conv.id === conversation.id) {
              return {
                ...conv,
                lastReadAt: shouldUpdateLastRead ? now : conv.lastReadAt,
                unreadCount: 0
              };
            }
            return conv;
          });

          const updatedConversation = updated.find(c => c.id === conversation.id) || conversation;

          setCurrentConversation({
            ...updatedConversation,
            lastReadAt: shouldUpdateLastRead ? now : updatedConversation.lastReadAt,
            unreadCount: 0
          });

          if (conversation.type === 'private' && otherParticipant) {
            setUnreadCounts(prev => ({ ...prev, [otherParticipant!]: 0 }));
          } else if (conversation.type === 'group') {
            setGroupUnreadCounts(prev => ({ ...prev, [conversation.id]: 0 }));
          }

          return updated;
        });
      });
    } else {
      setCurrentConversation(conversation);
    }

    loadMessages(conversation.id);
  }, [currentUser, loadMessages, socketService, unreadCounts, groupUnreadCounts]);

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

  const leaveGroup = useCallback((conversationId: string) => {
    if (!currentUser || !socketService) return;

    socketService.leaveGroup(conversationId, currentUser.id);
  }, [currentUser, socketService]);

  const removeMemberFromGroup = useCallback(async (conversationId: string, userId: string) => {
    if (!currentUser) return;

    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation || conversation.type !== 'group') return;

    const isAdmin = conversation.createdBy === currentUser.id;
    
    try {
      if (isAdmin && userId !== currentUser.id) {
        await apiService.removeParticipant(conversationId, userId, currentUser.id);
      } else {
        await apiService.removeParticipant(conversationId, userId);
      }

      setConversations(prev => prev.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            participants: conv.participants.filter(p => p !== userId)
          };
        }
        return conv;
      }));

      if (currentConversationRef.current?.id === conversationId) {
        setCurrentConversation(prev => {
          if (!prev) return null;
          return {
            ...prev,
            participants: prev.participants.filter(p => p !== userId)
          };
        });
      }
    } catch (error) {
      console.error('Error removing participant:', error);
      throw error;
    }
  }, [currentUser, conversations]);

  const editMessage = useCallback((messageId: string, newContent: string) => {
    if (!currentUser || !socketService) return;

    socketService.editMessage(messageId, newContent, currentUser.id);
  }, [currentUser, socketService]);

  const deleteMessage = useCallback((messageId: string) => {
    if (!currentUser || !socketService) return;

    socketService.deleteMessage(messageId, currentUser.id);
  }, [currentUser, socketService]);

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const currentPermission = Notification.permission;
      
      if (currentPermission === 'granted') {
        setBrowserNotificationsEnabled(true);
        return true;
      }
      
      if (currentPermission === 'denied') {
        setBrowserNotificationsEnabled(false);
        return false;
      }
      
      const permission = await Notification.requestPermission();
      setBrowserNotificationsEnabled(permission === 'granted');
      return permission === 'granted';
    }
    return false;
  }, []);

  const showBrowserNotification = useCallback((title: string, options: NotificationOptions) => {
    if (!('Notification' in window)) {
      return;
    }

    if (Notification.permission !== 'granted') {
      return;
    }

    const pageIsHidden = document.hidden || !document.hasFocus();
    
    if (pageIsHidden || !isPageVisible) {
      try {
        const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
        const isWindows = navigator.platform.includes('Win');
        const isChromeWindows = isChrome && isWindows;
        
        const notificationOptions: NotificationOptions = {
          body: options.body || '',
          icon: options.icon || '/logo.png',
          badge: options.badge || '/logo.png',
          tag: options.tag || 'davichat-message',
          requireInteraction: isChromeWindows ? true : (options.requireInteraction ?? false),
          silent: false,
          ...options
        };
        
        const notification = new Notification(title, notificationOptions);
        
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
        
        const closeTimeout = isChromeWindows ? 10000 : 5000;
        setTimeout(() => {
          notification.close();
        }, closeTimeout);
      } catch {
      }
    }
  }, [isPageVisible]);

  const updatePageTitle = useCallback((unreadCount: number) => {
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) DaviChat`;
    } else {
      document.title = 'DaviChat';
    }
  }, []);

  const playNotificationSound = useCallback(() => {
    if (!isPageVisible) {
      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {
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

  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsPageVisible(isVisible);

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
        if (currentConversation && message.conversationId === currentConversation.id) {
          setMessages(prev => [...prev, message]);
          
          if (message.senderId !== currentUser?.id && isPageVisible && socketService) {
            console.log('[message_received] Emitiendo evento markMessagesAsRead:', {
              conversationId: message.conversationId,
              userId: currentUser.id,
              messageId: message.id,
              senderId: message.senderId
            });
            socketService.markMessagesAsRead(message.conversationId, currentUser.id);
            
            if (currentConversation.type === 'private') {
              const otherParticipant = currentConversation.participants.find(p => p !== currentUser?.id);
              if (otherParticipant) {
                setUnreadCounts(prev => ({ ...prev, [otherParticipant]: 0 }));
              }
            } else if (currentConversation.type === 'group') {
              setGroupUnreadCounts(prev => ({ ...prev, [message.conversationId]: 0 }));
            }
          }
        }

        if (message.senderId !== currentUser?.id && !isPageVisible) {
          const senderUser = users.find(user => user.id === message.senderId);
          const senderName = senderUser?.name || 'Usuario';

          const getNotificationBody = (message: Message) => {
            if (message.messageType === 'file') {
              try {
                const fileData = JSON.parse(message.content);
                return `Envió un archivo: ${fileData.fileName || 'archivo'}`;
              } catch {
                return 'Envió un archivo';
              }
            } else if (message.messageType === 'audio') {
              return 'Envió un audio';
            } else {
              return message.content;
            }
          };

          showBrowserNotification(
            `Nuevo mensaje de ${senderName}`,
            {
              body: getNotificationBody(message),
              icon: '/logo.png',
              badge: '/logo.png',
              tag: `message_${message.conversationId}`,
              requireInteraction: false,
              silent: false
            }
          );

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
        if (data.userId && data.name && data.email) {
          const userData = {
            id: data.userId,
            name: data.name,
            email: data.email,
            roles: [],
            filials: [],
            status: data.status || 'online',
            lastSeen: new Date().toISOString(),
            isActive: true,
            isOnline: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          setUsers(prev => {
            const existingUser = prev.find(user => user.id === data.userId);

            if (existingUser) {
              return prev.map(user =>
                user.id === data.userId
                  ? { ...user, isOnline: true }
                  : user
              );
            } else {
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
        if (currentConversation && 
            currentConversation.type === 'private' && 
            currentConversation.participants.includes(data.senderId)) {
          return;
        }
        
        setUnreadCounts(prev => ({
          ...prev,
          [data.senderId]: (prev[data.senderId] || 0) + 1
        }));
        
        if (data.timestamp) {
          setLastMessageTimestamps(prev => ({
            ...prev,
            [data.senderId]: data.timestamp
          }));
        }
      });

      socketService.on('unread_message_group', (data) => {
        if (currentConversation && currentConversation.id === data.conversationId) return;
        
        setGroupUnreadCounts(prev => ({
          ...prev,
          [data.conversationId]: (prev[data.conversationId] || 0) + 1
        }));
        
        if (data.timestamp) {
          setLastMessageTimestamps(prev => ({
            ...prev,
            [data.conversationId]: data.timestamp
          }));
        }
      });

      socketService.on('messages_marked_as_read', (data) => {
        if (data.userId === currentUser?.id) {
          setConversations(prev => {
            const conversation = prev.find(c => c.id === data.conversationId);
            if (conversation) {
              const hasUnread = conversation.type === 'private'
                ? (unreadCounts[conversation.participants.find(p => p !== currentUser.id) || ''] || 0) > 0 || (conversation.unreadCount || 0) > 0
                : (groupUnreadCounts[data.conversationId] || 0) > 0 || (conversation.unreadCount || 0) > 0;

              if (hasUnread) {
                if (conversation.type === 'private') {
                  const otherParticipant = conversation.participants.find(p => p !== currentUser.id);
                  if (otherParticipant) {
                    setUnreadCounts(prevCounts => ({ ...prevCounts, [otherParticipant]: 0 }));
                  }
                } else if (conversation.type === 'group') {
                  setGroupUnreadCounts(prevCounts => ({ ...prevCounts, [data.conversationId]: 0 }));
                }
                
                return prev.map(conv => {
                  if (conv.id === data.conversationId) {
                    const now = new Date().toISOString();
                    const currentLastRead = conv.lastReadAt ? new Date(conv.lastReadAt).getTime() : 0;
                    const newLastRead = new Date(now).getTime();
                    
                    if (!conv.lastReadAt || (newLastRead - currentLastRead > 5000)) {
                      return {
                        ...conv,
                        lastReadAt: now,
                        unreadCount: 0
                      };
                    }
                    return {
                      ...conv,
                      unreadCount: 0
                    };
                  }
                  return conv;
                });
              }
            }
            return prev;
          });
          
          if (currentConversationRef.current?.id === data.conversationId) {
            setCurrentConversation(prev => {
              if (!prev || prev.id !== data.conversationId) return prev;
              const hasUnread = prev.type === 'private'
                ? (unreadCounts[prev.participants.find(p => p !== currentUser.id) || ''] || 0) > 0 || (prev.unreadCount || 0) > 0
                : (groupUnreadCounts[data.conversationId] || 0) > 0 || (prev.unreadCount || 0) > 0;

              if (hasUnread) {
                const now = new Date().toISOString();
                const currentLastRead = prev.lastReadAt ? new Date(prev.lastReadAt).getTime() : 0;
                const newLastRead = new Date(now).getTime();
                
                if (!prev.lastReadAt || (newLastRead - currentLastRead > 5000)) {
                  return {
                    ...prev,
                    lastReadAt: now,
                    unreadCount: 0
                  };
                }
                return {
                  ...prev,
                  unreadCount: 0
                };
              }
              return prev;
            });
          }
        }
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
        if (data.addedBy === currentUser?.id) {
          const addedUserName = users.find(u => u.id === data.userId)?.name || 'Usuario';
          showToastIfNotDuplicate('user_added_to_group', data, () => {
            toast.success(`Se añadió a ${addedUserName} al grupo, se le envió notificación`);
          });
        }

        if (data.userId === currentUser?.id) {
          showToastIfNotDuplicate('user_added_to_group', data, () => {
            toast.info(`Has sido añadido al grupo "${data.conversationName}"`);
          });

          loadUsersAndConversations();
        }

        setConversations(prev => prev.map(conv =>
          conv.id === data.conversationId
            ? {
              ...conv,
              participants: data.updatedParticipants || [...conv.participants, data.userId],
              updatedAt: data.timestamp
            }
            : conv
        ));

        if (currentConversation?.id === data.conversationId) {
          setCurrentConversation(prev => prev ? {
            ...prev,
            participants: data.updatedParticipants || [...prev.participants, data.userId],
            updatedAt: data.timestamp
          } : null);
        }
      });

      socketService.on('group_participants_updated', (data) => {
        setConversations(prev => prev.map(conv => {
          if (conv.id === data.conversationId) {
            const updated = {
              ...conv,
              participants: data.participants,
              updatedAt: data.updatedAt
            };
            
            if (data.action === 'remove' && data.ownershipTransferred && data.newOwnerId) {
              updated.createdBy = data.newOwnerId;
            }
            
            return updated;
          }
          return conv;
        }));

        if (currentConversation?.id === data.conversationId) {
          setCurrentConversation(prev => {
            if (!prev) return null;
            
            const updated = {
              ...prev,
              participants: data.participants,
              updatedAt: data.updatedAt
            };
            
            if (data.action === 'remove' && data.ownershipTransferred && data.newOwnerId) {
              updated.createdBy = data.newOwnerId;
              
              if (data.newOwnerName) {
                toast.info(`La propiedad del grupo fue transferida a ${data.newOwnerName}`);
              }
            }
            
            return updated;
          });
        }

      });

      socketService.on('message_edited', (updatedMessage) => {
        setMessages(prev => prev.map(msg => {
          if (msg.id === updatedMessage.id) {
            return {
              ...updatedMessage,
              isReply: msg.isReply,
              replyPreview: msg.replyPreview,
              replyTo: msg.replyTo
            };
          }
          return msg;
        }));
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
        if (replyMessage.conversationId === currentConversation?.id) {
          setMessages(prev => [...prev, replyMessage]);
        }
      });

      socketService.on('leave_group_success', (data) => {
        const wasViewingGroup = currentConversationRef.current?.id === data.conversationId;
        
        setConversations(prev => prev.filter(conv => conv.id !== data.conversationId));
        
        if (wasViewingGroup) {
          setCurrentConversation(null);
          setMessages([]);
          localStorage.removeItem('selectedConversationId');
        }
        
        setGroupUnreadCounts(prev => {
          const newCounts = { ...prev };
          delete newCounts[data.conversationId];
          return newCounts;
        });
        
        if (data.groupDeleted) {
          toast.warning(
            `El grupo "${data.conversationName}" fue eliminado${data.deletedMessagesCount ? ` (${data.deletedMessagesCount} mensajes eliminados)` : ''}`
          );
        } else {
          toast.info(`Ya no eres miembro del grupo "${data.conversationName}"`);
        }
        
        loadUsersAndConversations();
      });

      socketService.on('leave_group_error', (data) => {
        toast.error(data.error);
      });

      socketService.on('user_left_group', (data) => {
        if (currentConversationRef.current?.id === data.conversationId) {
          setCurrentConversation(prev => {
            if (!prev) return null;
            const updated = {
              ...prev,
              participants: prev.participants.filter(p => p !== data.userId)
            };
            
            if (data.ownershipTransferred && data.newOwnerId) {
              updated.createdBy = data.newOwnerId;
            }
            
            return updated;
          });
          
          if (data.ownershipTransferred && data.newOwnerName) {
            toast.info(`${data.userName} salió del grupo. ${data.newOwnerName} es ahora el administrador.`);
          }
        }
        
        setConversations(prev => prev.map(conv => {
          if (conv.id === data.conversationId) {
            const updated = {
              ...conv,
              participants: conv.participants.filter(p => p !== data.userId)
            };
            
            if (data.ownershipTransferred && data.newOwnerId) {
              updated.createdBy = data.newOwnerId;
            }
            
            return updated;
          }
          return conv;
        }));
      });

      socketService.on('user_removed_from_group', (data) => {
        if (data.userId === currentUser?.id) {
          const wasViewingGroup = currentConversationRef.current?.id === data.conversationId;
          
          setConversations(prev => prev.filter(conv => conv.id !== data.conversationId));
          
          if (wasViewingGroup) {
            setCurrentConversation(null);
            setMessages([]);
            localStorage.removeItem('selectedConversationId');
          }
          
          setGroupUnreadCounts(prev => {
            const newCounts = { ...prev };
            delete newCounts[data.conversationId];
            return newCounts;
          });
          
          if (data.removedBy === data.userId) {
            toast.info(`Saliste del grupo "${data.conversationName}"`);
          } else {
            toast.warning(`Fuiste eliminado del grupo "${data.conversationName}" por ${data.removedByName}`);
          }
        }
      });

      socketService.on('group_deleted', (data) => {
        setConversations(prev => prev.filter(conv => conv.id !== data.conversationId));
        
        if (currentConversationRef.current?.id === data.conversationId) {
          setCurrentConversation(null);
          setMessages([]);
          localStorage.removeItem('selectedConversationId');
        }
        
        setGroupUnreadCounts(prev => {
          const newCounts = { ...prev };
          delete newCounts[data.conversationId];
          return newCounts;
        });
        
        toast.warning(`El grupo "${data.conversationName}" fue eliminado`);
        
        loadUsersAndConversations();
      });
    };

    setupEventListeners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socketService, currentUser, currentConversation, conversations, isPageVisible, showBrowserNotification, playNotificationSound]);

  useEffect(() => {
    if (!socketService || !currentConversation || !currentUser) return;

    socketService.joinRoom(currentConversation.id, currentUser.id);

    let hasUnread = false;

    if (currentConversation.type === 'private') {
      const otherParticipant = currentConversation.participants.find(p => p !== currentUser.id);
      if (otherParticipant) {
        hasUnread = (unreadCounts[otherParticipant] || 0) > 0 || (currentConversation.unreadCount || 0) > 0;
      }
    } else if (currentConversation.type === 'group') {
      hasUnread = (groupUnreadCounts[currentConversation.id] || 0) > 0 || (currentConversation.unreadCount || 0) > 0;
    }

    if (hasUnread) {
      socketService.markMessagesAsRead(currentConversation.id, currentUser.id);
    }
  }, [socketService, currentConversation, currentUser, unreadCounts, groupUnreadCounts]);

  useEffect(() => {
    if (!socketService || !currentConversation || !currentUser || !isPageVisible) return;

    const markAsReadInterval = setInterval(() => {
      const activeConv = currentConversationRef.current;
      if (activeConv && activeConv.id === currentConversation.id && isPageVisible && socketService) {
        console.log('[Interval] Emitiendo evento markMessagesAsRead:', {
          conversationId: currentConversation.id,
          userId: currentUser.id,
          conversationName: currentConversation.name || currentConversation.id,
          type: currentConversation.type
        });
        socketService.markMessagesAsRead(currentConversation.id, currentUser.id);
      }
    }, 1000);

    return () => clearInterval(markAsReadInterval);
  }, [socketService, currentConversation, currentUser, isPageVisible]);

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
    leaveGroup,
    removeMemberFromGroup,
    editMessage,
    deleteMessage,
    sendReply,
    loadUsersAndConversations,
    retryLoad,
    requestNotificationPermission,
    browserNotificationsEnabled,
    isPageVisible,
    lastMessageTimestamps,
  };
}; 
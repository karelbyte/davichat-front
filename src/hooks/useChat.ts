import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService, User, Conversation } from '../services/api';
import { Message } from '../services/types';
import { SocketService } from '../services/socket';

export const useChat = (currentUser: User | null, socketService: SocketService | null) => {
  const [users, setUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [groupUnreadCounts, setGroupUnreadCounts] = useState<Record<string, number>>({});
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const currentConversationRef = useRef<Conversation | null>(null);

  useEffect(() => {
    currentConversationRef.current = currentConversation;
  }, [currentConversation]);

  const loadUsersAndConversations = useCallback(async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      const [usersData, conversationsData] = await Promise.all([
        apiService.getUsers(),
        apiService.getUserConversations(currentUser.id)
      ]);
      setUsers(usersData);
      setConversations(conversationsData);
    } catch (error) {
      console.error('Error loading data:', error);
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
      setCurrentConversation(conversation);
      setTypingUsers(new Set());
      loadMessages(conversation.id);
    } catch (error) {
      console.error('Error creating private chat:', error);
    }
  }, [currentUser, loadMessages]);

  const joinConversation = useCallback((conversation: Conversation) => {
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
    if (!currentConversation || !currentUser || !socketService) return;
    
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

  useEffect(() => {
    if (!socketService || !currentUser) return;

    const setupEventListeners = () => {
      socketService.on('message_received', (message) => {
        if (currentConversationRef.current && message.conversationId === currentConversationRef.current.id) {
          setMessages(prev => [...prev, message]);
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
        if (!data.user) return;
        setUsers(prev => prev.map(user => 
          user.id === data.user.id 
            ? { ...user, isOnline: true }
            : user
        ));
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
        if (currentConversationRef.current && currentConversationRef.current.participants.includes(data.senderId)) return;
        setUnreadCounts(prev => ({
          ...prev,
          [data.senderId]: (prev[data.senderId] || 0) + 1
        }));
      });

      socketService.on('unread_message_group', (data) => {
        if (currentConversationRef.current && currentConversationRef.current.id === data.conversationId) return;
        setGroupUnreadCounts(prev => ({
          ...prev,
          [data.conversationId]: (prev[data.conversationId] || 0) + 1
        }));
      });

      socketService.on('typing_indicator', (data) => {
        if (!currentConversationRef.current || data.conversationId !== currentConversationRef.current.id) return;
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

      socketService.on('group_created', () => {
        loadUsersAndConversations();
      });

      socketService.on('user_added_to_group', () => {
        loadUsersAndConversations();
      });
    };

    setupEventListeners();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socketService, currentUser]);

  useEffect(() => {
    if (!socketService || !currentConversation || !currentUser) return;
    
    socketService.joinRoom(currentConversation.id, currentUser.id);
  }, [socketService, currentConversation, currentUser]);

  useEffect(() => {
    loadUsersAndConversations();
  }, [loadUsersAndConversations]);

  return {
    users,
    conversations,
    currentConversation,
    messages,
    unreadCounts,
    groupUnreadCounts,
    typingUsers: Array.from(typingUsers),
    isLoading,
    startPrivateChat,
    joinConversation,
    sendMessage,
    startTyping,
    stopTyping,
    createGroup,
    addUserToGroup,
    loadUsersAndConversations
  };
}; 
import io, { Socket } from 'socket.io-client';

import { config } from '../config/env';

const SOCKET_URL = config.wsUrl;

export interface SocketEvents {
  connect: () => void;
  disconnect: () => void;
  message_received: (message: any) => void;
  user_status_update: (data: { userId: string; status: string }) => void;
  user_connected: (data: any) => void;
  unread_message_private: (data: any) => void;
  unread_message_group: (data: any) => void;
  typing_indicator: (data: { conversationId: string; userId: string; isTyping: boolean }) => void;
  group_created: (data: any) => void;
  user_added_to_group: (data: any) => void;
  messages_marked_as_read: (data: any) => void;
}

export class SocketService {
  private socket: Socket | null = null;
  private eventListeners: Partial<SocketEvents> = {};

  connect(userId: string): Socket {
    this.socket = io(SOCKET_URL, {
      auth: { userId }
    });

    this.socket.on('connect', () => {
      this.socket?.emit('user_join', { userId });
      this.eventListeners.connect?.();
    });

    this.socket.on('disconnect', () => {
      this.eventListeners.disconnect?.();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    this.socket.on('message_received', (message) => {
      this.eventListeners.message_received?.(message);
    });

    this.socket.on('user_status_update', (data) => {
      this.eventListeners.user_status_update?.(data);
    });

    this.socket.on('user_connected', (data) => {
      this.eventListeners.user_connected?.(data);
    });

    this.socket.on('unread_message_private', (data) => {
      this.eventListeners.unread_message_private?.(data);
    });

    this.socket.on('unread_message_group', (data) => {
      this.eventListeners.unread_message_group?.(data);
    });

    this.socket.on('typing_indicator', (data) => {
      this.eventListeners.typing_indicator?.(data);
    });

    this.socket.on('group_created', (data) => {
      this.eventListeners.group_created?.(data);
    });

    this.socket.on('user_added_to_group', (data) => {
      this.eventListeners.user_added_to_group?.(data);
    });

    this.socket.on('messages_marked_as_read', (data) => {
      this.eventListeners.messages_marked_as_read?.(data);
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]): void {
    this.eventListeners[event] = callback as any;
  }

  emit(event: string, data: any): void {
    this.socket?.emit(event, data);
  }

  joinRoom(conversationId: string, userId: string): void {
    this.emit('join_room', { conversationId, userId });
  }

  leaveRoom(conversationId: string, userId: string): void {
    this.emit('leave_room', { conversationId, userId });
  }

  sendMessage(conversationId: string, senderId: string, content: string, messageType: 'text' | 'file' | 'audio'): void {
    this.emit('send_message', {
      conversationId,
      senderId,
      content,
      messageType
    });
  }

  startTyping(conversationId: string, userId: string): void {
    this.emit('typing_start', { conversationId, userId });
  }

  stopTyping(conversationId: string, userId: string): void {
    this.emit('typing_stop', { conversationId, userId });
  }

  markMessagesAsRead(conversationId: string, userId: string): void {
    this.emit('mark_messages_as_read', { conversationId, userId });
  }

  createGroup(groupData: {
    name: string;
    description: string;
    participants: string[];
    createdBy: string;
  }): void {
    this.emit('create_group', groupData);
  }

  addUserToGroup(conversationId: string, userId: string, addedBy: string): void {
    this.emit('add_user_to_group', { conversationId, userId, addedBy });
  }
} 
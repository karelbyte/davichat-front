import io, { Socket } from 'socket.io-client';

import { config } from '../config/env';
import { GroupCreated, Message, UnreadMessageGroup, UnreadMessagePrivate, UserAddedToGroup, UserConnected, UserDisconnected, UserLeave } from './types';

const SOCKET_URL = config.wsUrl;

export interface SocketEvents {
  connect: () => void;
  disconnect: () => void;
  message_received: (message: Message) => void;
  user_status_update: (data: { userId: string; status: string }) => void;
  user_connected: (data: UserConnected) => void;
  user_disconnected: (data: UserDisconnected) => void;
  user_leave: (data: UserLeave) => void;
  unread_message_private: (data: UnreadMessagePrivate) => void;
  unread_message_group: (data: UnreadMessageGroup) => void;
  typing_indicator: (data: { conversationId: string; userId: string; isTyping: boolean }) => void;
  group_created: (data: GroupCreated) => void;
  user_added_to_group: (data: UserAddedToGroup) => void;
  messages_marked_as_read: (data: { conversationId: string; userId: string }) => void;
}

// Tipos para los datos de emisión
export interface JoinRoomData {
  conversationId: string;
  userId: string;
}

export interface LeaveRoomData {
  conversationId: string;
  userId: string;
}

export interface SendMessageData {
  conversationId: string;
  senderId: string;
  content: string;
  messageType: 'text' | 'file' | 'audio';
}

export interface TypingStartData {
  conversationId: string;
  userId: string;
}

export interface TypingStopData {
  conversationId: string;
  userId: string;
}

export interface MarkMessagesAsReadData {
  conversationId: string;
  userId: string;
}

export interface CreateGroupData {
  name: string;
  description: string;
  participants: string[];
  createdBy: string;
}

export interface AddUserToGroupData {
  conversationId: string;
  userId: string;
  addedBy: string;
}

export interface UserJoinData {
  userId: string;
}

export interface UserLeaveData {
  userId: string;
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

    this.socket.on('user_disconnected', (data) => {
      this.eventListeners.user_disconnected?.(data);
    });

    this.socket.on('user_leave', (data) => {
      this.eventListeners.user_leave?.(data);
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
      const userId = (this.socket.auth as {userId: string})?.userId;
      if (userId) {
        this.socket.emit('user_leave', { userId });
      }
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]): void {
    this.eventListeners[event] = callback;
  }

  emit<T>(event: string, data: T): void {
    this.socket?.emit(event, data);
  }

  joinRoom(conversationId: string, userId: string): void {
    const data: JoinRoomData = { conversationId, userId };
    this.emit('join_room', data);
  }

  leaveRoom(conversationId: string, userId: string): void {
    const data: LeaveRoomData = { conversationId, userId };
    this.emit('leave_room', data);
  }

  sendMessage(conversationId: string, senderId: string, content: string, messageType: 'text' | 'file' | 'audio'): void {
    const data: SendMessageData = {
      conversationId,
      senderId,
      content,
      messageType
    };
    this.emit('send_message', data);
  }

  startTyping(conversationId: string, userId: string): void {
    const data: TypingStartData = { conversationId, userId };
    this.emit('typing_start', data);
  }

  stopTyping(conversationId: string, userId: string): void {
    const data: TypingStopData = { conversationId, userId };
    this.emit('typing_stop', data);
  }

  markMessagesAsRead(conversationId: string, userId: string): void {
    const data: MarkMessagesAsReadData = { conversationId, userId };
    this.emit('mark_messages_as_read', data);
  }

  createGroup(groupData: CreateGroupData): void {
    this.emit('create_group', groupData);
  }

  addUserToGroup(conversationId: string, userId: string, addedBy: string): void {
    const data: AddUserToGroupData = { conversationId, userId, addedBy };
    this.emit('add_user_to_group', data);
  }
} 
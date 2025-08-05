import axios from 'axios';
import { config } from '../config/env';

const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

export interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
  filials: string[];
  status: string;
  lastSeen: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  isOnline?: boolean;
}

export interface Conversation {
  id: string;
  type: 'private' | 'group';
  name?: string;
  description?: string;
  participants: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
  lastMessageAt?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId?: string;
  content: string;
  messageType: 'text' | 'file' | 'audio';
  timestamp: string;
  isEdited: boolean;
  isDeleted: boolean;
  editedAt?: string;
  replyTo?: string;
}

export interface FileUploadResponse {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  thumbnailUrl?: string;
}

export const apiService = {
  async getUsers(): Promise<User[]> {
    const response = await api.get('/users');
    return response.data;
  },

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const response = await api.post('/users', userData);
    return response.data;
  },

  async createConversation(conversationData: {
    type: 'private' | 'group';
    name?: string;
    description?: string;
    participants: string[];
    createdBy: string;
  }): Promise<Conversation> {
    const response = await api.post('/conversations', conversationData);
    return response.data;
  },

  async addParticipant(conversationId: string, participantData: {
    userId: string;
    addedBy: string;
  }): Promise<{ success: boolean; conversationId: string; userId: string }> {
    const response = await api.post(`/conversations/${conversationId}/participants`, participantData);
    return response.data;
  },

  async getUserConversations(userId: string): Promise<Conversation[]> {
    const response = await api.get(`/conversations/user/${userId}`);
    return response.data;
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const response = await api.get(`/messages/${conversationId}`);
    return response.data;
  },

  async uploadFile(file: File): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }
}; 
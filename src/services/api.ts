import axios from 'axios';
import { config } from '../config/env';
import { Message } from './types';

const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
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

export interface FileUploadResponse {
  success: boolean;
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

  async uploadFile(file: File, conversationId: string, senderId: string): Promise<{ success: boolean }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', conversationId);
    formData.append('senderId', senderId);

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }
}; 
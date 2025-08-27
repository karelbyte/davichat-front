import { config } from '../config/env';
import { User, Conversation } from './api';

export interface AdminStats {
  totalUsers: number;
  onlineUsers: number;
  totalConversations: number;
  totalMessages: number;
}

export interface UserActionRequest {
  action: 'activate' | 'deactivate' | 'delete';
  userId: string;
}

export interface ConversationActionRequest {
  action: 'delete';
  conversationId: string;
}

class AdminApiService {
  public baseUrl = config.apiUrl;

  async getAllUsers(): Promise<User[]> {
    try {
      const response = await fetch(`${this.baseUrl}/users`);
      if (!response.ok) {
        throw new Error('Error al obtener usuarios');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async getAllConversations(): Promise<Conversation[]> {
    try {
      const response = await fetch(`${this.baseUrl}/conversations`);
      if (!response.ok) {
        throw new Error('Error al obtener conversaciones');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Error al eliminar usuario');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async deleteConversation(conversationId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/conversations/${conversationId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Error al eliminar conversación');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }

  async getSystemInfo(): Promise<Record<string, unknown>> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/system-info`);
      if (!response.ok) {
        throw new Error('Error al obtener información del sistema');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching system info:', error);
      throw error;
    }
  }

  async deleteAllMessages(): Promise<{ message: string; deletedCount: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Error al eliminar todos los mensajes');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting all messages:', error);
      throw error;
    }
  }
}

export const adminApiService = new AdminApiService();

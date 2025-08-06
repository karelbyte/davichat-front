export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    recipientId?: string;
    content: string;
    messageType: 'text' | 'file' | 'audio';
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    timestamp: string;
    isEdited: boolean;
    isDeleted: boolean;
    editedAt?: string;
    replyTo?: string;
    sender: {
      id: string;
      name: string;
      avatar?: string;
    };
  }


  export interface TypingIndicator {
    conversationId: string;
    userId: string;
    userName: string;
    isTyping: boolean;
  }

  export interface UserConnected {
    user: {
      id: string;
      name: string;
      email: string;
      roles: string[];
      filials: string[];
      status: 'online' | 'offline';
      lastSeen: string;
      avatar?: string;
      createdAt: string;
      updatedAt: string;
      isActive: boolean;
      isOnline: boolean;
    };
  }


  export interface UserDisconnected {
    userId: string;
    lastSeen: string;
  }

  export interface UserLeave {
    userId: string;
  }

  export interface UnreadMessagePrivate {
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    messagePreview: string;
    timestamp: string;
  }

  export interface UnreadMessageGroup {
    conversationId: string;
    conversationName: string;
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    messagePreview: string;
    timestamp: string;
  }

  export interface GroupCreated {
    id: string;
    type: 'group';
    name: string;
    description?: string;
    participants: string[];
    createdBy: string;
    createdAt: string;
    updatedAt: string;
  }

  export interface UserAddedToGroup {
    conversationId: string;
    conversationName: string;
    addedUsers: string[];
    addedBy: string;
  }
  
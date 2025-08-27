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
  replyPreview?: string;
  isReply?: boolean;
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
    userId: string;
    name: string;
    email: string;
    status?: 'online' | 'offline';
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

export interface MessageEdited {
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

export interface MessageDeleted {
  messageId: string;
  conversationId: string;
}

export interface EditMessageError {
  error: string;
}

export interface DeleteMessageError {
  error: string;
}

export interface ReplyMessage {
  conversationId: string;
  senderId: string;
  content: string;
  messageType: 'text' | 'file' | 'audio';
  replyTo: string;
}

export interface ReplyReceived {
  id: string;
  conversationId: string;
  senderId: string;
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
  replyTo: string;
  replyPreview: string;
  isReply: true;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
}
  
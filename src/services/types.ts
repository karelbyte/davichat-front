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
  userId: string;
  addedBy: string;
  updatedParticipants: string[];
  participantCount: number;
  timestamp: string;
}

export interface GroupParticipantsUpdated {
  conversationId: string;
  conversationName: string;
  participants: string[];
  participantCount: number;
  updatedAt: string;
  action: 'add' | 'remove' | 'bulk_update';
  affectedUsers: string[];
  updatedBy?: string;              // ID del usuario que realizó la acción
  leftBy?: string;                 // Nombre del usuario que salió
  ownershipTransferred?: boolean;  // true si el creador salió y se transfirió la propiedad
  newOwnerId?: string;             // ID del nuevo propietario (si hubo transferencia)
  newOwnerName?: string;           // Nombre del nuevo propietario (si hubo transferencia)
}

export interface UserJoinedGroup {
  conversationId: string;
  userId: string;
  addedBy: string;
  timestamp: string;
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

export interface LeaveGroupSuccess {
  conversationId: string;
  conversationName: string;
  timestamp: string;
  groupDeleted?: boolean;         // true si el grupo fue eliminado (último usuario)
  deletedMessagesCount?: number;  // Cantidad de mensajes eliminados (si el grupo fue eliminado)
}

export interface LeaveGroupError {
  error: string;
}

export interface UserLeftGroup {
  conversationId: string;
  conversationName: string;
  userId: string;
  userName: string;
  leftBy: string;
  timestamp: string;
  ownershipTransferred?: boolean;  // true si el creador salió y se transfirió la propiedad
  newOwnerId?: string;            // ID del nuevo propietario (si hubo transferencia)
  newOwnerName?: string;          // Nombre del nuevo propietario (si hubo transferencia)
}

export interface UserRemovedFromGroup {
  conversationId: string;
  conversationName: string;
  userId: string;
  userName: string;
  removedBy: string;
  removedByName: string;
  timestamp: string;
}

export interface GroupDeleted {
  conversationId: string;
  conversationName: string;
  timestamp: string;
}
  
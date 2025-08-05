# API Document - Sistema de Chat NestJS

## Estado Actual del Proyecto

### Dependencias Instaladas
- @nestjs/websockets
- @nestjs/platform-socket.io
- socket.io
- redis
- aws-sdk
- uuid
- class-validator
- class-transformer
- @nestjs/config
- @socket.io/redis-adapter
- @aws-sdk/client-dynamodb
- @aws-sdk/lib-dynamodb

### Variables de Entorno Configuradas
```
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

AWS_ACCESS_KEY_ID=key
AWS_SECRET_ACCESS_KEY=key
AWS_REGION=us-east-1
DYNAMODB_ENDPOINT=http://localhost:8000

PORT=3000
NODE_ENV=development

SOCKET_CORS_ORIGIN=http://localhost:3000

FILE_STORAGE_TYPE=aws
FILE_UPLOAD_MAX_SIZE=10485760
FILE_ALLOWED_TYPES=image/jpeg,image/png,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain
FILE_STORAGE_LOCAL_PATH=./uploads
FILE_STORAGE_S3_BUCKET=chat-file-storage
FILE_STORAGE_S3_REGION=us-east-1
```

### Configuración Implementada

#### Archivo: src/configs/app.config.ts
- Configuración centralizada de variables de entorno
- Configuración para Redis, DynamoDB y Socket.IO
- Uso de registerAs para configuración modular

#### Archivo: src/app.module.ts
- ConfigModule configurado como global
- Carga del archivo de configuración app.config.ts
- Incluye RedisService, DynamoDBService y ChatGateway

#### Archivo: src/app.controller.ts
- Endpoint GET /api/users para obtener lista de usuarios
- Usuarios ordenados por estado online/offline
- Integración con DynamoDBService y RedisService

#### Archivo: src/main.ts
- Configuración para usar ConfigService
- Puerto obtenido desde variables de entorno
- Mensaje de inicio con puerto

### Servicios Implementados

#### Archivo: src/services/redis.service.ts
- Conexión a Redis con createClient
- Métodos para gestión de usuarios online/offline
- Cache de datos de usuario
- Gestión de sesiones activas

#### Archivo: src/services/dynamodb.service.ts
- Conexión a DynamoDB con AWS SDK v3
- Creación automática de tablas al iniciar (OnModuleInit)
- CRUD completo para usuarios, conversaciones, participantes y mensajes
- Método updateParticipantReadStatus para marcar mensajes como leídos
- Configuración de tablas: users, conversations, conversation_participants, messages

### WebSocket Gateway Implementado

#### Archivo: src/gateways/chat.gateway.ts
- Socket.IO Gateway con CORS configurado
- Eventos de conexión/desconexión
- Eventos de usuario: user_join, user_leave, user_status
- Eventos de sala: join_room, leave_room
- Eventos de mensajes: send_message, typing_start, typing_stop
- Eventos de mensajes no leídos: unread_message_private, unread_message_group
- Evento para marcar mensajes como leídos: mark_messages_as_read
- Integración con Redis y DynamoDB

### Estructura de Base de Datos

#### Tabla: users
- id (partition key)
- name, email, roles, filials
- status, lastSeen, avatar
- createdAt, updatedAt, isActive

#### Tabla: conversations
- id (partition key)
- type (private/group), name, participants
- createdBy, createdAt, updatedAt
- lastMessage, lastMessageAt

#### Tabla: conversation_participants
- conversationId (partition key)
- userId (sort key)
- unreadCount, lastReadAt, joinedAt, isActive

#### Tabla: messages
- id (partition key)
- conversationId (sort key)
- senderId, recipientId, content, messageType
- timestamp, isEdited, isDeleted, editedAt, replyTo

### Estructuras de Datos

#### Usuario
```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "roles": ["string"],
  "filials": ["string"],
  "status": "online|offline|away|busy",
  "lastSeen": "timestamp",
  "avatar": "string (URL)",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "isActive": "boolean",
  "isOnline": "boolean"
}
```

#### Conversación
```json
{
  "id": "uuid",
  "type": "private|group",
  "name": "string (solo para grupos)",
  "description": "string (solo para grupos)",
  "participants": ["user_id"],
  "createdBy": "user_id",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "lastMessage": "string",
  "lastMessageAt": "timestamp"
}
```

#### Participante de Conversación
```json
{
  "conversationId": "uuid",
  "userId": "uuid",
  "unreadCount": "number",
  "lastReadAt": "timestamp",
  "joinedAt": "timestamp",
  "isActive": "boolean"
}
```

#### Mensaje
```json
{
  "id": "uuid",
  "conversationId": "uuid",
  "senderId": "uuid",
  "recipientId": "uuid (solo para privadas)",
  "content": "string",
  "messageType": "text|image|file",
  "timestamp": "timestamp",
  "isEdited": "boolean",
  "isDeleted": "boolean",
  "editedAt": "timestamp (opcional)",
  "replyTo": "message_id (opcional)"
}
```

#### Evento de Mensaje No Leído
```json
{
  "type": "private|group",
  "conversationId": "uuid",
  "senderId": "uuid",
  "messageId": "uuid",
  "content": "string",
  "timestamp": "timestamp"
}
```

### Estructura de Archivos Actual
```
src/
├── configs/
│   └── app.config.ts
├── services/
│   ├── redis.service.ts
│   └── dynamodb.service.ts
├── gateways/
│   └── chat.gateway.ts
├── app.controller.ts
├── app.service.ts
├── app.module.ts
└── main.ts
```

### Eventos WebSocket Implementados

#### Cliente → Servidor
- connection/disconnect
- user_join/user_leave
- join_room/leave_room
- send_message (text/file)
- typing_start/typing_stop (indicador de escritura)
- user_status
- mark_messages_as_read
- create_group
- add_user_to_group

#### Servidor → Cliente
- user_status_update
- user_connected (nuevo usuario conectado)
- user_joined/user_left
- message_received
- typing_indicator (está escribiendo...)
- unread_message_private
- unread_message_group
- messages_marked_as_read
- group_created
- user_added_to_group

### Funcionalidades Implementadas
- Sistema de chat en tiempo real
- Conversaciones privadas (1 a 1) con persistencia
- Grupos (1 a N)
- Crear grupos y añadir participantes
- Mensajes no leídos con notificaciones
- Indicadores de escritura ("está escribiendo...")
- Estados de usuario online/offline
- Marcar mensajes como leídos
- Lista de usuarios con estado online/offline
- Lista de conversaciones por usuario
- Persistencia dual: Redis (cache) + DynamoDB (persistencia)
- Creación automática de tablas DynamoDB
- Escalabilidad con Redis Adapter
- Notificaciones en tiempo real de nuevos usuarios conectados
- Badges diferenciados para usuarios y grupos
- Actualización en tiempo real de estados online/offline
- Indicador de "está escribiendo..." para conversaciones privadas y grupos
- Botón "Añadir Participantes" en conversaciones de grupo
- Soporte para archivos (imágenes, documentos, PDFs)

### Arquitectura de Datos

#### Persistencia
- **DynamoDB**: Fuente primaria de datos
  - Usuarios, conversaciones, participantes, mensajes
  - Persistencia permanente y escalable
  - Backup automático en AWS
  - Método updateParticipantReadStatus para actualizar contadores de no leídos

#### Cache y Velocidad
- **Redis**: Cache y datos temporales
  - Estados online/offline de usuarios
  - Cache de datos frecuentemente accedidos
  - Gestión de sesiones activas
  - Mejora velocidad de respuesta

#### Sistema de Notificaciones
- **Backend**: Envía eventos a todos los participantes online
- **Frontend**: Filtra eventos basado en conversación actual
- **Badges**: Contadores en memoria del cliente
- **Limpieza**: Automática al interactuar con conversaciones

### Funcionalidad de Indicador de Escritura

#### Características
- **Tiempo real**: Se muestra instantáneamente cuando alguien empieza a escribir
- **Conversaciones privadas**: Muestra "Juan está escribiendo..."
- **Grupos**: Muestra "Juan y María están escribiendo..." o "Juan y otros están escribiendo..."
- **Auto-limpieza**: Se oculta automáticamente después de 3 segundos de inactividad
- **Cambio de conversación**: Se limpia al cambiar de conversación

#### Flujo de Funcionamiento
1. **Usuario empieza a escribir**: Se emite `typing_start`
2. **Backend reenvía**: A todos los participantes de la conversación
3. **Frontend recibe**: `typing_indicator` con `isTyping: true`
4. **Se muestra indicador**: Con el nombre del usuario escribiendo
5. **Usuario deja de escribir**: Se emite `typing_stop` después de 3 segundos
6. **Se oculta indicador**: Cuando `isTyping: false`

#### Eventos WebSocket
- **Cliente → Servidor**: `typing_start`, `typing_stop`
- **Servidor → Cliente**: `typing_indicator`

### Funcionalidad de Añadir Participantes a Grupos

#### Características
- **Botón dinámico**: Aparece solo en conversaciones de grupo
- **Modal de selección**: Lista usuarios disponibles (no participantes actuales)
- **Selección múltiple**: Permite seleccionar varios usuarios a la vez
- **Notificación**: Confirma usuarios añadidos exitosamente
- **Actualización en tiempo real**: Los nuevos participantes ven el grupo aparecer inmediatamente
- **Sin refrescar**: No requiere recargar la página para ver cambios

#### Flujo de Funcionamiento
1. **Usuario hace clic**: En "Añadir Participantes" en grupo
2. **Se abre modal**: Con lista de usuarios no participantes
3. **Usuario selecciona**: Los usuarios a añadir
4. **Se envían eventos**: `add_user_to_group` para cada usuario
5. **Backend procesa**: Añade participantes a DynamoDB
6. **Se notifica**: A los nuevos participantes via WebSocket
7. **Se actualiza lista**: Los nuevos participantes ven el grupo aparecer en tiempo real
8. **Se cierra modal**: Y se muestra confirmación

#### Eventos WebSocket
- **Cliente → Servidor**: `add_user_to_group`
- **Servidor → Cliente**: `user_added_to_group`

### Funcionalidad de Archivos

#### Características
- **Tipos soportados**: Imágenes (JPEG, PNG, GIF, WebP), PDFs, documentos Word, archivos de texto
- **Almacenamiento dual**: Local o AWS S3 configurable
- **Tamaño máximo**: 10MB por archivo
- **Validación**: Tipo y tamaño de archivo
- **Preview**: Imágenes se muestran directamente, documentos con icono y enlace de descarga
- **Configuración S3**: Bucket configurado con política de acceso público para lectura

#### Flujo de Funcionamiento
1. **Usuario selecciona archivo**: Hace clic en el botón de adjuntar (📎)
2. **Frontend sube archivo**: POST a `/api/upload` con FormData
3. **Backend valida**: Tipo, tamaño y almacena según configuración
4. **Backend retorna**: URL del archivo y metadatos
5. **Frontend envía mensaje**: `send_message` con `messageType: 'file'`
6. **Backend procesa**: Guarda en DynamoDB con metadatos del archivo
7. **Frontend renderiza**: Imágenes como preview, documentos como tarjetas descargables

#### Endpoints REST
- **POST /api/upload**: Subir archivo
  - **Body**: FormData con campo 'file'
  - **Response**: `{ fileUrl, fileName, fileSize, fileType, thumbnailUrl? }`

#### Variables de Entorno
- **FILE_STORAGE_TYPE**: 'local' o 'aws'
- **FILE_UPLOAD_MAX_SIZE**: Tamaño máximo en bytes (default: 10MB)
- **FILE_ALLOWED_TYPES**: Tipos MIME permitidos separados por coma
- **FILE_STORAGE_LOCAL_PATH**: Ruta para almacenamiento local
- **FILE_STORAGE_S3_BUCKET**: Bucket de S3 para almacenamiento AWS
- **FILE_STORAGE_S3_REGION**: Región de S3

#### Configuración AWS S3
- **Bucket Policy**: Configurada para permitir acceso público de lectura
- **URLs generadas**: `https://{bucket}.s3.{region}.amazonaws.com/{filename}`
- **Sin ACL**: No se usa ACL para evitar errores de compatibilidad
- **Acceso directo**: Los archivos son accesibles directamente desde el navegador

### Funcionalidad de Conversaciones Privadas

#### Persistencia de Conversaciones
- **Búsqueda automática**: Al crear una conversación privada, el sistema busca si ya existe una conversación entre los dos usuarios
- **Conversación única**: Si existe, retorna la conversación existente con todo el historial
- **Nueva conversación**: Si no existe, crea una nueva conversación
- **Historial preservado**: Todos los mensajes se mantienen en la misma conversación entre sesiones

#### Flujo de Creación
1. Usuario A hace clic en "Chat" con Usuario B
2. Sistema busca conversación privada existente entre A y B
3. Si existe → retorna conversación existente con historial completo
4. Si no existe → crea nueva conversación

### Endpoints REST Implementados

#### GET /api/users
- **Descripción**: Obtiene lista completa de usuarios
- **Respuesta**: Array de usuarios ordenados por estado (online primero)
- **Formato**: JSON con campo `isOnline` agregado
- **Ejemplo de respuesta**:
```json
[
  {
    "id": "user123",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "isOnline": true,
    "roles": ["user"],
    "filials": ["sucursal1"]
  },
  {
    "id": "user456", 
    "name": "María García",
    "email": "maria@example.com",
    "isOnline": false,
    "roles": ["admin"],
    "filials": ["sucursal2"]
  }
]
```

#### POST /api/conversations
- **Descripción**: Crear nueva conversación (privada o grupo)
- **Body**: `{ type: "private"|"group", name?: string, description?: string, participants: string[], createdBy: string }`
- **Respuesta**: Datos de la conversación creada

#### POST /api/conversations/:id/participants
- **Descripción**: Añadir participante a conversación
- **Body**: `{ userId: string, addedBy: string }`
- **Respuesta**: `{ success: true, conversationId, userId }`

#### GET /api/conversations/user/:userId
- **Descripción**: Obtener conversaciones de un usuario
- **Respuesta**: Array de conversaciones del usuario

## Guía de Uso para Frontend

### Instalación de Dependencias
```bash
npm install socket.io-client axios
```

### Conexión WebSocket
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    userId: 'user_id_here'
  }
});

socket.on('connect', () => {
  console.log('Conectado al servidor');
});

socket.on('disconnect', () => {
  console.log('Desconectado del servidor');
});
```

### Eventos de Usuario
```javascript
// Unirse al chat
socket.emit('user_join', { 
  userId: 'user_id',
  name: 'Juan Pérez',
  email: 'juan@example.com'
});

// Salir del chat
socket.emit('user_leave', { userId: 'user_id' });

// Actualizar estado
socket.emit('user_status', { userId: 'user_id', status: 'online' });

// Escuchar cambios de estado
socket.on('user_status_update', (data) => {
  console.log('Estado actualizado:', data);
});

// Escuchar nuevos usuarios conectados
socket.on('user_connected', (data) => {
  console.log('Nuevo usuario conectado:', data);
  // Recargar lista de usuarios
  loadUsers();
});
```

### Eventos de Sala
```javascript
// Unirse a conversación
socket.emit('join_room', { 
  conversationId: 'conversation_id', 
  userId: 'user_id' 
});

// Salir de conversación
socket.emit('leave_room', { 
  conversationId: 'conversation_id', 
  userId: 'user_id' 
});

// Escuchar usuarios que se unen/salen
socket.on('user_joined', (data) => {
  console.log('Usuario se unió:', data);
});

socket.on('user_left', (data) => {
  console.log('Usuario salió:', data);
});
```

### Envío y Recepción de Mensajes
```javascript
// Enviar mensaje
socket.emit('send_message', {
  conversationId: 'conversation_id',
  senderId: 'user_id',
  content: 'Hola mundo!',
  messageType: 'text'
});

// Recibir mensaje
socket.on('message_received', (message) => {
  console.log('Nuevo mensaje:', message);
});

// Indicadores de escritura
socket.emit('typing_start', { 
  conversationId: 'conversation_id', 
  userId: 'user_id' 
});

socket.emit('typing_stop', { 
  conversationId: 'conversation_id', 
  userId: 'user_id' 
});

socket.on('typing_indicator', (data) => {
  console.log('Usuario escribiendo:', data);
});
```

### Mensajes No Leídos

#### Badges de Mensajes No Leídos
- **Badges en usuarios**: Contador de mensajes privados no leídos junto al nombre del usuario
- **Badges en grupos**: Contador de mensajes de grupo no leídos junto al nombre del grupo
- **Actualización automática**: Se incrementa cuando llegan mensajes de usuarios/grupos no visibles
- **Limpieza automática**: Se resetea cuando se hace clic en el chat del usuario o grupo
- **Interfaz intuitiva**: Badge rojo con número de mensajes no leídos
- **Lógica inteligente**: No muestra badges si el usuario está en la conversación activa
```javascript
// Escuchar mensajes no leídos privados
socket.on('unread_message_private', (data) => {
  // Verificar si está en la conversación actual
  if (currentConversation && currentConversation.id === data.conversationId) {
    return; // No mostrar badge si está en la conversación activa
  }
  // Incrementar contador de mensajes no leídos
  unreadCounts[data.senderId] = (unreadCounts[data.senderId] || 0) + 1;
  renderUsers(); // Actualizar interfaz
});

// Escuchar mensajes no leídos de grupo
socket.on('unread_message_group', (data) => {
  // Verificar si está en la conversación actual
  if (currentConversation && currentConversation.id === data.conversationId) {
    return; // No mostrar badge si está en la conversación activa
  }
  // Incrementar contador de mensajes de grupo no leídos
  groupUnreadCounts[data.conversationId] = (groupUnreadCounts[data.conversationId] || 0) + 1;
  renderUsersAndGroups(); // Actualizar interfaz
});

// Marcar mensajes como leídos
socket.emit('mark_messages_as_read', {
  conversationId: 'conversation_id',
  userId: 'user_id'
});

// Escuchar confirmación de mensajes marcados como leídos
socket.on('messages_marked_as_read', (data) => {
  console.log('Mensajes marcados como leídos:', data);
  // Actualizar UI (quitar badge de notificación)
});

// Crear grupo
socket.emit('create_group', {
  name: 'Mi Grupo',
  description: 'Descripción del grupo',
  participants: ['user1', 'user2', 'user3'],
  createdBy: 'user1'
});

// Añadir usuario a grupo
socket.emit('add_user_to_group', {
  conversationId: 'group_id',
  userId: 'new_user',
  addedBy: 'admin_user'
});

// Escuchar cuando se crea un grupo
socket.on('group_created', (data) => {
  console.log('Grupo creado:', data);
  // Actualizar lista de grupos
});

// Escuchar cuando añaden a un grupo
socket.on('user_added_to_group', (data) => {
  console.log('Añadido a grupo:', data);
  // Actualizar lista de grupos
});
```

### Estrategias de Implementación de Alertas

#### 1. **Sistema de Badges Inteligente**
```javascript
// Variable global para rastrear mensajes no leídos
let unreadCounts = {};

// Función para renderizar usuarios con badges
function renderUsers() {
  users.forEach(user => {
    const unreadCount = unreadCounts[user.id] || 0;
    // Mostrar badge solo si hay mensajes no leídos
    const badge = unreadCount > 0 ? 
      `<span class="bg-red-500 text-white text-xs px-2 py-1 rounded-full">${unreadCount}</span>` : '';
  });
}
```

#### 2. **Lógica de Filtrado en Frontend**
```javascript
// Verificar conversación actual antes de mostrar badge
socket.on('unread_message_private', (data) => {
  if (currentConversation && currentConversation.id === data.conversationId) {
    return; // No mostrar badge si está en la conversación activa
  }
  unreadCounts[data.senderId] = (unreadCounts[data.senderId] || 0) + 1;
  renderUsers();
});
```

#### 3. **Limpieza Automática de Badges**
```javascript
// Limpiar badge al hacer clic en chat
function startPrivateChat(otherUserId) {
  unreadCounts[otherUserId] = 0;
  renderUsers();
  // ... resto de la lógica
}

// Limpiar badges al unirse a conversación
function joinConversation(conversation) {
  conversation.participants.forEach(participantId => {
    if (participantId !== currentUser.id) {
      unreadCounts[participantId] = 0;
    }
  });
  renderUsers();
}
```

#### 4. **Ventajas de esta Estrategia**
- **Simplicidad**: Lógica en frontend es más confiable que en backend
- **Rendimiento**: No requiere búsquedas complejas en Socket.IO
- **Flexibilidad**: Fácil de modificar y extender
- **UX**: Badges aparecen/desaparecen instantáneamente

#### 5. **Solución para Badges de Grupos**
- **Problema resuelto**: Los mensajes de grupo ahora muestran badge en el grupo, no en el remitente
- **Variables separadas**: `unreadCounts` para usuarios, `groupUnreadCounts` para grupos
- **Lógica diferenciada**: Eventos de grupo incrementan badge del grupo, no del usuario
- **Limpieza automática**: Al entrar al grupo se resetea el contador

### Estado Actual del Sistema

#### ✅ Funcionalidades Completadas
- **Chat privado**: Funciona correctamente con persistencia
- **Grupos**: Creación, participación y mensajería
- **Badges**: Diferenciados para usuarios y grupos
- **Estados online/offline**: Actualización en tiempo real
- **Notificaciones**: Mensajes no leídos con badges
- **UX simplificada**: Una sola lista, clic directo
- **Persistencia**: DynamoDB + Redis funcionando
- **Escalabilidad**: Redis Adapter implementado
- **Soporte de archivos**: Subida y visualización de imágenes y documentos
- **Almacenamiento S3**: Configurado y funcionando con acceso público
- **Soporte de audio**: Grabación y reproducción de mensajes de voz

#### 🔧 Problemas Resueltos
- **Conversaciones privadas**: Ahora son persistentes entre sesiones
- **Badges de grupos**: Se muestran en el grupo, no en el remitente
- **Estados offline**: Se actualizan en tiempo real
- **UX**: Simplificada sin tabs, con clic directo
- **S3 ACL**: Eliminado ACL para evitar errores de compatibilidad
- **Acceso público S3**: Configurada política de bucket para acceso de lectura

### API REST con Axios
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Obtener lista de usuarios (ordenados por online/offline)
const getUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};

// Crear usuario
const createUser = async (userData) => {
  const response = await api.post('/users', userData);
  return response.data;
};

// Crear conversación
const createConversation = async (conversationData) => {
  const response = await api.post('/conversations', conversationData);
  return response.data;
};

// Ejemplo de uso para crear grupo
const createGroup = async (groupData) => {
  const response = await api.post('/conversations', {
    type: 'group',
    name: groupData.name,
    description: groupData.description,
    participants: groupData.participants,
    createdBy: groupData.createdBy
  });
  return response.data;
};

// Añadir participante a conversación
const addParticipant = async (conversationId, participantData) => {
  const response = await api.post(`/conversations/${conversationId}/participants`, participantData);
  return response.data;
};

// Obtener conversaciones de usuario
const getUserConversations = async (userId) => {
  const response = await api.get(`/conversations/user/${userId}`);
  return response.data;
};

// Obtener mensajes de conversación
const getMessages = async (conversationId) => {
  const response = await api.get(`/messages/${conversationId}`);
  return response.data;
};
```

### Ejemplo de Uso Completo

```javascript
// Cargar lista de usuarios al iniciar
const loadUsers = async () => {
  try {
    const users = await getUsers();
    console.log('Usuarios cargados:', users);
    // users tendrá formato: [{ id, name, email, isOnline, ... }]
    // Ordenados: online primero, luego offline
  } catch (error) {
    console.error('Error cargando usuarios:', error);
  }
};

// Escuchar cambios de estado en tiempo real
socket.on('user_status_update', (data) => {
  console.log('Estado de usuario cambiado:', data);
  // Actualizar UI con el nuevo estado
  // data: { userId, status }
});

// Combinar REST + WebSocket para lista completa
class UserManager {
  constructor() {
    this.users = [];
    this.socket = io('http://localhost:3000');
    this.setupListeners();
  }

  async loadUsers() {
    this.users = await getUsers();
    this.renderUsers();
  }

  setupListeners() {
    this.socket.on('user_status_update', (data) => {
      const user = this.users.find(u => u.id === data.userId);
      if (user) {
        user.isOnline = data.status === 'online';
        this.renderUsers();
      }
    });
  }

  renderUsers() {
    // Ordenar: online primero
    const sortedUsers = this.users.sort((a, b) => {
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      return 0;
    });
    
    console.log('Lista actualizada:', sortedUsers);
  }
}

// Uso
const userManager = new UserManager();
userManager.loadUsers();
```

### Ejemplo Completo de Chat
```javascript
class ChatManager {
  constructor(userId) {
    this.userId = userId;
    this.socket = io('http://localhost:3000', {
      auth: { userId }
    });
    this.setupListeners();
  }

  setupListeners() {
    this.socket.on('connect', () => {
      this.socket.emit('user_join', { userId: this.userId });
    });

    this.socket.on('message_received', (message) => {
      this.displayMessage(message);
    });

    this.socket.on('unread_message_private', (data) => {
      this.showNotification('Mensaje privado de ' + data.senderId);
    });

    this.socket.on('unread_message_group', (data) => {
      this.showNotification('Mensaje en grupo: ' + data.content);
    });
  }

  joinConversation(conversationId) {
    this.socket.emit('join_room', {
      conversationId,
      userId: this.userId
    });
  }

  sendMessage(conversationId, content) {
    this.socket.emit('send_message', {
      conversationId,
      senderId: this.userId,
      content,
      messageType: 'text'
    });
  }

  startTyping(conversationId) {
    this.socket.emit('typing_start', {
      conversationId,
      userId: this.userId
    });
  }

  stopTyping(conversationId) {
    this.socket.emit('typing_stop', {
      conversationId,
      userId: this.userId
    });
  }

  displayMessage(message) {
    console.log('Mostrar mensaje:', message);
  }

  showNotification(message) {
    console.log('Notificación:', message);
  }
}

// Uso
const chat = new ChatManager('user123');
chat.joinConversation('conversation456');
chat.sendMessage('conversation456', 'Hola!');
```

## Funcionalidades Pendientes de Implementación

### Video Llamadas

#### Nivel de Complejidad: 7/10

#### Tecnología Actual vs Video Llamadas:

##### ✅ Lo que ya tenemos (Ventajas):
- **WebSocket/Socket.IO**: Para señalización en tiempo real
- **Redis Adapter**: Para escalabilidad
- **DynamoDB**: Para persistir datos de llamadas
- **Frontend HTML5**: Para captura de video/audio
- **AWS S3**: Para almacenar grabaciones (opcional)

##### 🆕 Lo que necesitaríamos agregar:

#### 1. Backend (Moderado - 5/10)
- **WebRTC Signaling**: Coordinar conexión P2P
- **STUN/TURN Servers**: Para NAT traversal
- **Gestión de llamadas**: Estado, participantes, duración
- **Eventos WebSocket**: `call_request`, `call_answer`, `call_reject`, `call_end`

#### 2. Frontend (Complejo - 8/10)
- **WebRTC API**: `getUserMedia`, `RTCPeerConnection`
- **Captura de video**: Cámara y micrófono
- **UI compleja**: Botones de llamada, pantalla de video, controles
- **Señalización**: Intercambio de SDP y ICE candidates

#### 3. Infraestructura (Moderado - 6/10)
- **STUN Server**: Para descubrimiento de IP pública
- **TURN Server**: Para relay cuando P2P falla
- **Servicios externos**: Twilio, Agora, o servidores propios

#### Arquitectura Propuesta:

##### Flujo de Video Llamada:
1. **Usuario A** hace clic en "Video Llamada"
2. **Backend** envía `call_request` a Usuario B
3. **Usuario B** recibe notificación y acepta/rechaza
4. **WebRTC** establece conexión P2P
5. **Streams** de video/audio fluyen directamente entre usuarios
6. **Backend** solo maneja señalización, no el video

##### Ventajas de esta arquitectura:
- **Escalable**: Video no pasa por el servidor
- **Baja latencia**: Conexión directa P2P
- **Aprovecha infraestructura**: WebSocket, Redis, DynamoDB
- **Costo eficiente**: No necesitas procesar video en servidor

##### Desafíos:
- **NAT/Firewalls**: Algunos usuarios no pueden hacer P2P
- **Calidad de red**: Depende de la conexión de los usuarios
- **UI compleja**: Muchos estados y controles
- **Compatibilidad**: Diferentes navegadores y dispositivos

#### Tiempo estimado de implementación:
- **Backend**: 2-3 días
- **Frontend**: 4-5 días  
- **Testing**: 2-3 días
- **Total**: 1-2 semanas
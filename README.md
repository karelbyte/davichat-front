# DaviChat Frontend - Next.js 15

Chat interactivo en tiempo real construido con Next.js 15 y Atomic Design.

## 🚀 Características

- **Chat en tiempo real** con WebSocket
- **Conversaciones privadas** y grupales
- **Subida de archivos** (imágenes, documentos, PDFs)
- **Grabación de audio** para mensajes de voz
- **Indicadores de escritura** en tiempo real
- **Badges de mensajes no leídos**
- **Estados online/offline**
- **Atomic Design** para componentes reutilizables

## 📦 Instalación

### 1. Instalar dependencias

```bash
npm install socket.io-client axios lucide-react
npm install -D @types/socket.io-client
```

### 2. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_API_URL=http://localhost:6060/api
NEXT_PUBLIC_WS_API_URL=http://localhost:6060
```

### 3. Ejecutar el proyecto

```bash
npm run dev
```

El proyecto estará disponible en `http://localhost:3000`

## 🏗️ Arquitectura

### Atomic Design

```
src/components/
├── atoms/           # Componentes básicos
│   ├── Button/
│   ├── Input/
│   ├── Badge/
│   └── TypingIndicator/
├── molecules/       # Combinaciones de átomos
│   ├── UserCard/
│   ├── GroupCard/
│   ├── MessageBubble/
│   └── FileMessage/
├── organisms/       # Componentes complejos
│   ├── LoginForm/
│   ├── UserList/
│   ├── MessageInput/
│   └── ChatHeader/
├── templates/       # Layouts
└── pages/          # Páginas completas
    ├── LoginPage/
    └── ChatPage/
```

### Servicios

- **`api.ts`** - Comunicación con API REST
- **`socket.ts`** - Comunicación WebSocket en tiempo real

### Hooks

- **`useAuth.ts`** - Gestión de autenticación
- **`useSocket.ts`** - Gestión de conexión WebSocket
- **`useChat.ts`** - Lógica del chat

## 🔧 Funcionalidades

### Login/Registro
- Creación de usuarios con roles y filiales
- Autenticación automática

### Chat Privado
- Conversaciones 1 a 1
- Persistencia de mensajes
- Indicadores de escritura

### Chat Grupal
- Creación de grupos
- Añadir participantes
- Mensajes grupales

### Archivos y Audio
- Subida de imágenes, documentos, PDFs
- Grabación de mensajes de voz
- Preview de archivos

### Notificaciones
- Badges de mensajes no leídos
- Estados online/offline en tiempo real
- Notificaciones de nuevos usuarios

## 🎯 Uso

1. **Iniciar sesión** con ID, nombre, email, roles y filiales
2. **Seleccionar usuario** para chat privado
3. **Crear grupo** para conversaciones grupales
4. **Enviar mensajes** de texto, archivos o audio
5. **Ver estados** online/offline en tiempo real

## 🔌 API Backend

Este frontend se conecta a un backend NestJS con:
- WebSocket para tiempo real
- DynamoDB para persistencia
- Redis para cache
- AWS S3 para archivos

## 📱 Responsive

Interfaz completamente responsive que funciona en:
- Desktop
- Tablet
- Mobile

## 🎨 UI/UX

- **Tailwind CSS** para estilos
- **Componentes reutilizables**
- **Interfaz intuitiva**
- **Feedback visual** en tiempo real

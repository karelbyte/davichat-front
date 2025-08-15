# Panel de Administración - DaviChat

## Descripción

El Panel de Administración es una interfaz web que permite a los usuarios con rol de 'admin' gestionar y monitorear el sistema de chat interno de Davivienda.

## Características

### 🔐 Control de Acceso
- Solo usuarios con rol 'admin' pueden acceder
- Redirección automática si no se tienen permisos
- Protección de rutas implementada

### 📊 Dashboard de Estadísticas
- **Total de Usuarios**: Número total de usuarios registrados
- **Usuarios Online**: Usuarios conectados actualmente
- **Total de Conversaciones**: Conversaciones privadas y grupales
- **Total de Mensajes**: Mensajes enviados en el sistema

### 👥 Gestión de Usuarios
- **Ver Usuarios**: Lista completa de usuarios con estado online/offline
- **Activar/Desactivar**: Cambiar estado de actividad de usuarios
- **Eliminar**: Remover usuarios del sistema
- **Información**: Ver roles, email y estado de conexión

### 💬 Gestión de Conversaciones
- **Ver Conversaciones**: Lista de chats privados y grupales
- **Eliminar**: Remover conversaciones del sistema
- **Información**: Ver tipo, participantes y detalles

## Acceso

### URL
```
/admin
```

### Requisitos
- Usuario autenticado
- Rol 'admin' en el sistema

### Navegación
- **Header**: Enlace en el menú del usuario (solo para admins)
- **Chat Principal**: Botón en la pantalla de bienvenida (solo para admins)

## API Endpoints Utilizados

### Estadísticas
```
GET /api/admin/stats
```

### Usuarios
```
GET /api/users
PATCH /api/users/{userId}/activate
PATCH /api/users/{userId}/deactivate
DELETE /api/users/{userId}
```

### Conversaciones
```
GET /api/conversations
DELETE /api/conversations/{conversationId}
```

### Información del Sistema
```
GET /api/admin/system-info
```

## Funcionalidades Técnicas

### Protección de Rutas
- Componente `AdminRoute` para verificación de permisos
- Redirección automática si no se tienen permisos
- Loading states durante verificación

### Manejo de Errores
- Mensajes de error claros y descriptivos
- Botón de reintento para operaciones fallidas
- Timeout para operaciones de API

### Estado de la Aplicación
- Carga asíncrona de datos
- Actualización automática después de acciones
- Estados de loading y error

## Estructura de Archivos

```
src/
├── app/
│   └── admin/
│       └── page.tsx              # Página de administración
├── components/
│   ├── atoms/
│   │   └── AdminRoute/
│   │       ├── AdminRoute.tsx    # Componente de protección
│   │       └── index.ts
│   ├── organisms/
│   │   └── Header/
│   │       └── Header.tsx        # Header con enlace admin
│   └── pages/
│       ├── AdminPage/
│       │   └── AdminPage.tsx     # Componente principal
│       └── ChatPage/
│           └── ChatPage.tsx      # Chat con enlace admin
├── services/
│   └── adminApi.ts               # Servicio de API admin
└── config/
    └── env.ts                    # Configuración de URLs
```

## Configuración

### Variables de Entorno
```env
NEXT_PUBLIC_API_URL=http://localhost:6060/api
NEXT_PUBLIC_WS_API_URL=http://localhost:6060
```

### Roles de Usuario
```typescript
interface User {
  roles: string[]; // Debe incluir 'admin' para acceso
}
```

## Uso

### 1. Acceso al Panel
- Iniciar sesión como usuario con rol 'admin'
- Hacer clic en el avatar del usuario en el header
- Seleccionar "🛠️ Panel de Administración"

### 2. Gestión de Usuarios
- Ver lista de usuarios en tiempo real
- Hacer clic en "Activar" o "Desactivar" para cambiar estado
- Hacer clic en "Eliminar" para remover usuario

### 3. Gestión de Conversaciones
- Ver todas las conversaciones del sistema
- Hacer clic en "Eliminar" para remover conversación

### 4. Monitoreo
- Ver estadísticas en tiempo real
- Usar botón "Recargar Datos" para actualizar información

## Seguridad

- Verificación de roles en frontend y backend
- Protección de rutas con redirección automática
- Validación de permisos antes de cada acción
- Logs de auditoría para acciones administrativas

## Mantenimiento

### Actualización de Datos
- Los datos se recargan automáticamente después de cada acción
- Botón manual de recarga disponible
- Estados de loading para mejor UX

### Manejo de Errores
- Captura y display de errores de API
- Mensajes de error en español
- Opción de reintento para operaciones fallidas

## Notas de Desarrollo

- El panel está diseñado para ser responsive
- Utiliza Tailwind CSS para estilos
- Implementa patrones de React modernos (hooks, context)
- Manejo de estado optimizado con React Query (futuro)
- Preparado para expansión de funcionalidades

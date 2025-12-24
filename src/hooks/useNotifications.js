import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3000';

let socket = null;

export function useNotifications(userId, onCocktailUpdate) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Crear conexión de WebSocket
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket conectado');
      setIsConnected(true);
      
      // Unirse a la sala del usuario
      socket.emit('join', userId);
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket desconectado');
      setIsConnected(false);
    });

    // Escuchar notificaciones entrantes
    socket.on('notification', (notification) => {
      console.log('📨 Nueva notificación recibida:', notification);
      
      // Agregar notificación al estado
      setNotifications((prev) => [notification, ...prev]);
      
      // Incrementar contador de no leídas
      if (!notification.read) {
        setUnreadCount((prev) => prev + 1);
      }

      // Mostrar notificación del navegador (si tiene permisos)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('CocktailVerse', {
          body: notification.message,
          icon: '/favicon.ico',
          tag: `notification-${notification.id}`,
        });
      }
    });

    // 🔥 NUEVO: Escuchar actualizaciones de cócteles en tiempo real
    socket.on('cocktail-update', (data) => {
      console.log('🍸 Actualización de cóctel recibida:', data);
      
      // Llamar al callback si existe
      if (onCocktailUpdate) {
        onCocktailUpdate(data);
      }
    });

    // Cleanup al desmontar
    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, [userId, onCocktailUpdate]);

  return {
    notifications,
    unreadCount,
    isConnected,
    setNotifications,
    setUnreadCount,
  };
}

// Solicitar permisos de notificación del navegador
export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then((permission) => {
      console.log('Permiso de notificaciones:', permission);
    });
  }
}

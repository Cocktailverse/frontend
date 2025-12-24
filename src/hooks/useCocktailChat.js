import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3000';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

let chatSocket = null;

/**
 * Hook para gestionar el chat en tiempo real de un cóctel
 * @param {number} cocktailId - ID del cóctel
 * @param {string} token - Token de autenticación (opcional)
 * @returns {Object} { messages, loading, error, sendMessage }
 */
export function useCocktailChat(cocktailId, token) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar mensajes iniciales
  useEffect(() => {
    if (!cocktailId) return;

    const loadMessages = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/cocktails/${cocktailId}/messages`);
        
        if (!response.ok) {
          throw new Error('Error al cargar mensajes');
        }

        const data = await response.json();
        setMessages(data.messages || []);
      } catch (err) {
        console.error('Error cargando mensajes:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [cocktailId]);

  // Conexión WebSocket y eventos en tiempo real
  useEffect(() => {
    if (!cocktailId) return;

    // Crear socket si no existe
    if (!chatSocket) {
      chatSocket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      chatSocket.on('connect', () => {
        console.log('💬 Socket de chat conectado');
      });

      chatSocket.on('disconnect', () => {
        console.log('💬 Socket de chat desconectado');
      });
    }

    // Unirse a la sala del cóctel
    chatSocket.emit('join-cocktail-chat', cocktailId);
    console.log(`💬 Unido al chat del cóctel ${cocktailId}`);

    // Escuchar nuevos mensajes
    const handleNewMessage = (message) => {
      console.log('💬 Nuevo mensaje recibido:', message);
      setMessages((prev) => {
        // Evitar duplicados
        if (prev.some((m) => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });
    };

    chatSocket.on('new-message', handleNewMessage);

    // Cleanup
    return () => {
      chatSocket.emit('leave-cocktail-chat', cocktailId);
      chatSocket.off('new-message', handleNewMessage);
      console.log(`💬 Salió del chat del cóctel ${cocktailId}`);
    };
  }, [cocktailId]);

  // Función para enviar mensaje
  const sendMessage = useCallback(
    async (content) => {
      if (!cocktailId || !token) {
        throw new Error('Se requiere autenticación para enviar mensajes');
      }

      if (!content || content.trim().length === 0) {
        throw new Error('El mensaje no puede estar vacío');
      }

      try {
        const response = await fetch(`${API_BASE_URL}/cocktails/${cocktailId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ content: content.trim() }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al enviar mensaje');
        }

        const data = await response.json();
        
        // El mensaje llegará vía WebSocket, pero lo agregamos optimísticamente
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) {
            return prev;
          }
          return [...prev, data.message];
        });

        return data.message;
      } catch (err) {
        console.error('Error enviando mensaje:', err);
        throw err;
      }
    },
    [cocktailId, token]
  );

  return {
    messages,
    loading,
    error,
    sendMessage,
  };
}

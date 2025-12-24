import { useEffect } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3000';

let globalSocket = null;

/**
 * Hook para escuchar actualizaciones de cócteles en tiempo real
 * @param {Function} onCocktailUpdate - Callback que recibe { action, cocktail }
 */
export function useCocktailUpdates(onCocktailUpdate) {
  useEffect(() => {
    // Si ya existe un socket global, reutilizarlo
    if (!globalSocket) {
      globalSocket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      globalSocket.on('connect', () => {
        console.log('🍸 Socket para actualizaciones de cócteles conectado');
      });

      globalSocket.on('disconnect', () => {
        console.log('🍸 Socket para actualizaciones de cócteles desconectado');
      });
    }

    // Listener para actualizaciones de cócteles
    const handleCocktailUpdate = (data) => {
      console.log('🔄 Actualización de cóctel recibida:', data);
      if (onCocktailUpdate) {
        onCocktailUpdate(data);
      }
    };

    globalSocket.on('cocktail-update', handleCocktailUpdate);

    // Cleanup: remover solo el listener, NO desconectar el socket
    return () => {
      if (globalSocket) {
        globalSocket.off('cocktail-update', handleCocktailUpdate);
      }
    };
  }, [onCocktailUpdate]);

  return globalSocket;
}

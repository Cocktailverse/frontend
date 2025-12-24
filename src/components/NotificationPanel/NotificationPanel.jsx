import { useEffect, useState } from 'react';
import { useAutenticacion } from '../../context/AuthContext';
import { useNotifications, requestNotificationPermission } from '../../hooks/useNotifications';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
} from '../../services/api';
import './NotificationPanel.css';

export default function NotificationPanel() {
  const { usuario } = useAutenticacion();
  const { notifications: realtimeNotifications, unreadCount, isConnected, setNotifications, setUnreadCount } = useNotifications(usuario?.id);
  const [allNotifications, setAllNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Cargar notificaciones iniciales
  useEffect(() => {
    if (usuario) {
      loadNotifications();
      requestNotificationPermission();
    }
  }, [usuario]);

  // Sincronizar notificaciones en tiempo real con las cargadas
  useEffect(() => {
    if (realtimeNotifications.length > 0) {
      setAllNotifications((prev) => {
        const newNotifications = realtimeNotifications.filter(
          (rt) => !prev.some((p) => p.id === rt.id)
        );
        return [...newNotifications, ...prev];
      });
    }
  }, [realtimeNotifications]);

  async function loadNotifications() {
    try {
      setLoading(true);
      const data = await getNotifications();
      setAllNotifications(data.notifications || []);
      
      const unread = data.notifications.filter((n) => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsRead(notificationId) {
    try {
      await markNotificationAsRead(notificationId);
      
      setAllNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await markAllNotificationsAsRead();
      
      setAllNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
    }
  }

  async function handleDeleteNotification(notificationId, event) {
    event.stopPropagation(); // Evitar que se marque como leída al eliminar
    
    try {
      await deleteNotification(notificationId);
      
      const wasUnread = allNotifications.find((n) => n.id === notificationId)?.read === false;
      
      setAllNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
    }
  }

  async function handleDeleteAll() {
    if (!window.confirm('¿Estás seguro de eliminar todas las notificaciones?')) {
      return;
    }
    
    try {
      await deleteAllNotifications();
      
      setAllNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error al eliminar todas las notificaciones:', error);
    }
  }

  function togglePanel() {
    setIsOpen(!isOpen);
  }

  function getNotificationIcon(type) {
    if (type === 'aprobado') return '✅';
    if (type === 'rechazado') return '❌';
    if (type === 'pendiente') return '⏳';
    return '🔔';
  }

  function getNotificationClass(type) {
    if (type === 'aprobado') return 'notification-success';
    if (type === 'rechazado') return 'notification-error';
    if (type === 'pendiente') return 'notification-pending';
    return '';
  }

  if (!usuario) return null;

  return (
    <div className="notification-panel-container">
      <button className="notification-bell" onClick={togglePanel}>
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notificaciones</h3>
            {isConnected && (
              <span className="connection-status" title="Conectado en tiempo real">
                🟢
              </span>
            )}
            <div className="header-actions">
              {unreadCount > 0 && (
                <button
                  className="mark-all-read-btn"
                  onClick={handleMarkAllAsRead}
                  title="Marcar todas como leídas"
                >
                  ✓ Marcar leídas
                </button>
              )}
              {allNotifications.length > 0 && (
                <button
                  className="delete-all-btn"
                  onClick={handleDeleteAll}
                  title="Eliminar todas las notificaciones"
                >
                  🗑️ Limpiar todo
                </button>
              )}
            </div>
          </div>

          <div className="notification-list">
            {loading ? (
              <p className="notification-empty">Cargando...</p>
            ) : allNotifications.length === 0 ? (
              <p className="notification-empty">No tienes notificaciones</p>
            ) : (
              allNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${getNotificationClass(notification.type)} ${
                    notification.read ? 'read' : 'unread'
                  }`}
                  onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <p className="notification-message">{notification.message}</p>
                    <div className="notification-meta">
                      <span className="notification-cocktail">
                        {notification.cocktailName}
                      </span>
                      <span className="notification-time">
                        {new Date(notification.createdAt).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="notification-actions">
                    {!notification.read && (
                      <div className="unread-indicator"></div>
                    )}
                    <button
                      className="delete-notification-btn"
                      onClick={(e) => handleDeleteNotification(notification.id, e)}
                      title="Eliminar notificación"
                      aria-label="Eliminar notificación"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

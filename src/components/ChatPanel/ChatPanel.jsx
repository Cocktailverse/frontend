import React, { useState, useEffect, useRef } from 'react';
import { useAutenticacion } from '../../context/AuthContext';
import { useCocktailChat } from '../../hooks/useCocktailChat';
import './ChatPanel.css';

function timeAgo(iso) {
  try {
    const date = new Date(iso);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  } catch (e) {
    return '';
  }
}

export default function ChatPanel({ cocktailId }) {
  const { usuario, estaAutenticado, token } = useAutenticacion();
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const prevMessagesLengthRef = useRef(0);
  const isFirstLoadRef = useRef(true);
  
  const { messages, loading, error, sendMessage } = useCocktailChat(cocktailId, token);

  // Auto-scroll al final SOLO cuando se añaden nuevos mensajes (no en carga inicial)
  useEffect(() => {
    if (isFirstLoadRef.current) {
      // En la primera carga, solo marcar como cargado sin hacer scroll
      isFirstLoadRef.current = false;
      prevMessagesLengthRef.current = messages.length;
      return;
    }
    
    // Solo hacer scroll si hay mensajes nuevos
    if (messages.length > prevMessagesLengthRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages]);
  
  // Resetear flag cuando cambia el cocktail
  useEffect(() => {
    isFirstLoadRef.current = true;
    prevMessagesLengthRef.current = 0;
  }, [cocktailId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!messageText.trim() || isSending) return;
    
    if (!estaAutenticado) {
      alert('Debes iniciar sesión para enviar mensajes');
      return;
    }

    setIsSending(true);
    try {
      await sendMessage(messageText.trim());
      setMessageText('');
    } catch (err) {
      console.error('Error al enviar mensaje:', err);
      alert(err.message || 'Error al enviar el mensaje');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h4>💬 Chat en Vivo</h4>
        <span className="chat-online-count">{messages.length} mensaje{messages.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="chat-messages">
        {loading && messages.length === 0 ? (
          <div className="chat-loading">Cargando mensajes...</div>
        ) : error ? (
          <div className="chat-error">Error al cargar mensajes</div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">
            <p>🎉 ¡Sé el primero en comentar!</p>
            <p className="chat-empty-subtitle">Inicia la conversación sobre este cóctel</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = usuario && msg.author.id === usuario.id;
            
            return (
              <div
                key={msg.id}
                className={`chat-message ${isOwnMessage ? 'own-message' : 'other-message'}`}
              >
                {!isOwnMessage && (
                  <div className="message-avatar">
                    {msg.author.photo ? (
                      <img src={msg.author.photo} alt={msg.author.name} />
                    ) : (
                      <div className="avatar-placeholder">
                        {msg.author.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="message-content">
                  {!isOwnMessage && (
                    <div className="message-author">{msg.author.name}</div>
                  )}
                  <div className="message-bubble">
                    <p>{msg.content}</p>
                  </div>
                  <div className="message-time">{timeAgo(msg.createdAt)}</div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {estaAutenticado ? (
        <form className="chat-input-form" onSubmit={handleSubmit}>
          <div className="chat-input-container">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe un mensaje..."
              maxLength={1000}
              rows={1}
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={!messageText.trim() || isSending}
              className="chat-send-button"
            >
              {isSending ? '⏳' : '📤'}
            </button>
          </div>
          <div className="chat-input-hint">
            Presiona Enter para enviar, Shift+Enter para nueva línea
          </div>
        </form>
      ) : (
        <div className="chat-login-prompt">
          <p>🔐 Inicia sesión para participar en el chat</p>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import './AvatarSelector.css';

const DRINK_EMOJIS = [
  '🍸', // Martini
  '🍹', // Tropical drink
  '🍺', // Beer
  '🍻', // Beers
  '🥂', // Champagne
  '🍷', // Wine
  '🥃', // Whiskey
  '🍾', // Bottle with popping cork
  '🧉', // Mate (bebida)
  '🍶', // Sake
  '🥤', // Cup with straw
  '🧃', // Juice box
];

const BACKGROUND_COLORS = [
  '#FF7A18', // Naranja primario
  '#FFCD3C', // Amarillo
  '#E74C3C', // Rojo
  '#3498DB', // Azul
  '#2ECC71', // Verde
  '#9B59B6', // Púrpura
  '#1ABC9C', // Turquesa
  '#F39C12', // Naranja oscuro
  '#E91E63', // Rosa
  '#607D8B', // Gris azulado
  '#795548', // Marrón
  '#34495E', // Azul oscuro
];

export default function AvatarSelector({ currentPhotoUrl, currentBgColor = '#FF7A18', onSelectEmoji, onSelectFile, onSelectBgColor }) {
  const [isOpen, setIsOpen] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  // Función para extraer el emoji de un SVG data URI
  const extractEmojiFromSVG = (dataUri) => {
    if (!dataUri || !dataUri.startsWith('data:image/svg+xml;base64,')) return null;
    try {
      const base64 = dataUri.replace('data:image/svg+xml;base64,', '');
      const decoded = decodeURIComponent(escape(atob(base64)));
      // Buscar el emoji en el texto del SVG
      const match = decoded.match(/<text[^>]*>([^<]+)<\/text>/);
      return match ? match[1] : null;
    } catch (e) {
      return null;
    }
  };

  const handleEmojiClick = (emoji) => {
    onSelectEmoji(emoji);
    // No cerramos el modal para que puedan elegir el color también
  };

  const handleColorClick = (color) => {
    onSelectBgColor(color);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      onSelectFile(file);
      setIsOpen(false);
      // Reset file input para permitir seleccionar el mismo archivo nuevamente
      setFileInputKey(Date.now());
    }
  };

  // Detectar si es un emoji simple o un SVG con emoji (data URI)
  const isEmoji = currentPhotoUrl && DRINK_EMOJIS.includes(currentPhotoUrl);
  const isSVGEmoji = currentPhotoUrl && currentPhotoUrl.startsWith('data:image/svg+xml;base64');
  const isEmojiAvatar = isEmoji || isSVGEmoji;
  
  // Obtener el emoji actual (ya sea directo o desde el SVG)
  const currentEmoji = isEmoji ? currentPhotoUrl : (isSVGEmoji ? extractEmojiFromSVG(currentPhotoUrl) : null);
  
  // Verificar si la foto es válida (data URI que NO es SVG emoji, o URL http válida)
  const esFotoValida = currentPhotoUrl && 
    ((currentPhotoUrl.startsWith('data:image/') && !isSVGEmoji) || 
     (currentPhotoUrl.startsWith('http') && !currentPhotoUrl.includes('mockup_usuario')));

  return (
    <div className="avatar-selector-container">
      <div className="avatar-display-wrapper" onClick={() => setIsOpen(true)}>
        <div className="avatar-display" style={{ backgroundColor: (isEmojiAvatar || !esFotoValida) ? currentBgColor : 'transparent' }}>
          {isEmoji ? (
            <div className="avatar-emoji-display">{currentPhotoUrl}</div>
          ) : isSVGEmoji ? (
            <img src={currentPhotoUrl} alt="Avatar" />
          ) : esFotoValida ? (
            <img 
              src={currentPhotoUrl} 
              alt="Avatar"
            />
          ) : (
            <div className="avatar-emoji-display">🍺</div>
          )}
        </div>
        <div className="avatar-edit-overlay">
          <span>✏️ Editar</span>
        </div>
      </div>

      {isOpen && (
        <div className="avatar-selector-modal" onClick={() => setIsOpen(false)}>
          <div className="avatar-selector-content" onClick={(e) => e.stopPropagation()}>
            <div className="avatar-selector-header">
              <h3>Elige tu avatar</h3>
              <button 
                type="button" 
                className="avatar-close-button" 
                onClick={() => setIsOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="avatar-options-section">
              <h4>🍹 Emojis de bebidas</h4>
              <div className="avatar-emoji-grid">
                {DRINK_EMOJIS.map((emoji, index) => {
                  const isSelected = currentEmoji === emoji;
                  const bgColor = isSelected ? currentBgColor : '#f0f0f0';
                  return (
                    <button
                      key={index}
                      type="button"
                      className={`avatar-emoji-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleEmojiClick(emoji)}
                      style={{ 
                        backgroundColor: bgColor,
                        backgroundImage: 'none'
                      }}
                    >
                      {emoji}
                    </button>
                  );
                })}
              </div>
            </div>

            {isEmojiAvatar && (
              <div className="avatar-color-section">
                <h4>🎨 Color de fondo</h4>
                <div className="avatar-color-grid">
                  {BACKGROUND_COLORS.map((color, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`avatar-color-option ${currentBgColor === color ? 'selected' : ''}`}
                      style={{ 
                        backgroundColor: color,
                        backgroundImage: 'none'
                      }}
                      onClick={() => handleColorClick(color)}
                      aria-label={`Seleccionar color ${color}`}
                    >
                      {currentBgColor === color && '✓'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

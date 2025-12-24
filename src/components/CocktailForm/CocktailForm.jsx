import React, { useState, useEffect } from 'react';
import './CocktailForm.css';

export default function CocktailForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData = null,
  isLoading = false,
  error = '',
  mode = 'create',
  userRole = null
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    ingredients: '',
    instructions: '',
  });

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        imageUrl: initialData.imageUrl || '',
        ingredients: Array.isArray(initialData.ingredients) 
          ? initialData.ingredients.join(', ') 
          : (initialData.ingredients || ''),
        instructions: initialData.instructions || '',
      });
    } else if (mode === 'create') {
      setFormData({
        name: '',
        description: '',
        imageUrl: '',
        ingredients: '',
        instructions: '',
      });
    }
    
    // Scroll al inicio del formulario cuando se abre
    if (isOpen) {
      setTimeout(() => {
        const formContent = document.querySelector('.create-modal-content');
        if (formContent) {
          formContent.scrollTop = 0;
          formContent.scrollTo({ top: 0, behavior: 'instant' });
        }
      }, 50);
    }
  }, [initialData, mode, isOpen]);

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(formData);
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      imageUrl: '',
      ingredients: '',
      instructions: '',
    });
    onClose();
  };

  if (!isOpen) return null;

  const isEditMode = mode === 'edit';
  const isAdmin = userRole === 'admin';
  
  const title = isEditMode ? '✏️ Editar Cóctel' : '✨ Crear Nuevo Cóctel';
  
  let submitText;
  if (isEditMode) {
    submitText = isAdmin ? 'Actualizar Cóctel' : 'Solicitar Edición';
  } else {
    submitText = 'Crear Cóctel';
  }

  return (
    <div className="create-modal-overlay" onClick={handleClose}>
      <div className="create-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="create-modal-header">
          <h2 className="create-modal-title">{title}</h2>
          <button onClick={handleClose} className="create-modal-close" aria-label="Cerrar">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-cocktail-form">
          {error && (
            <div className="form-error-message">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="cocktail-name">
              Nombre del Cóctel <span className="required">*</span>
            </label>
            <input
              id="cocktail-name"
              type="text"
              value={formData.name}
              onChange={handleChange('name')}
              placeholder="Ej: Mojito Clásico"
              required
              disabled={isLoading}
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label htmlFor="cocktail-description">Descripción</label>
            <textarea
              id="cocktail-description"
              value={formData.description}
              onChange={handleChange('description')}
              placeholder="Describe tu cóctel..."
              rows={3}
              disabled={isLoading}
              maxLength={500}
            />
          </div>

          <div className="form-group">
            <label htmlFor="cocktail-image">URL de Imagen</label>
            <input
              id="cocktail-image"
              type="url"
              value={formData.imageUrl}
              onChange={handleChange('imageUrl')}
              placeholder="https://ejemplo.com/imagen.jpg"
              disabled={isLoading}
            />
            {formData.imageUrl && (
              <div className="image-preview">
                <img src={formData.imageUrl} alt="Vista previa" onError={(e) => {
                  e.target.style.display = 'none';
                }} />
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="cocktail-ingredients">
              Ingredientes <span className="required">*</span>
            </label>
            <textarea
              id="cocktail-ingredients"
              value={formData.ingredients}
              onChange={handleChange('ingredients')}
              placeholder="Ron, Menta, Azúcar, Lima, Soda"
              rows={4}
              required
              disabled={isLoading}
            />
            <small className="form-hint">Separa los ingredientes con comas</small>
          </div>

          <div className="form-group">
            <label htmlFor="cocktail-instructions">Instrucciones</label>
            <textarea
              id="cocktail-instructions"
              value={formData.instructions}
              onChange={handleChange('instructions')}
              placeholder="Pasos para preparar el cóctel..."
              rows={5}
              disabled={isLoading}
              maxLength={1000}
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleClose}
              className="btn-cancel"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={isLoading}
            >
              {isLoading ? '⏳ Procesando...' : submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

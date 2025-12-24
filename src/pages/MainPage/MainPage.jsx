import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import CocktailModal from '../../components/CocktailModal/CocktailModal';
import CocktailForm from '../../components/CocktailForm/CocktailForm';
import Counter from '../../components/Counter/Counter';
import { useAutenticacion } from '../../context/AuthContext';
import { useCocktailUpdates } from '../../hooks/useCocktailUpdates';
import {
  crearCoctel,
  obtenerCocteles,
  obtenerCoctelPorId,
  actualizarCoctel,
  toggleLike,
} from '../../services/api';
import './MainPage.css';

function normalizarIngredientes(value) {
  if (!value) {return [];}
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item.length > 0);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return [];
}

function normalizarCoctel(rawCocktail) {
  if (!rawCocktail) {return null;}

  const likedBy = Array.isArray(rawCocktail.likedBy)
    ? rawCocktail.likedBy.map((value) => String(value))
    : [];

  return {
    ...rawCocktail,
    name: rawCocktail.name ?? 'Cóctel sin nombre',
    description: rawCocktail.description ?? '',
    instructions: rawCocktail.instructions ?? '',
    ingredients: Array.isArray(rawCocktail.ingredients)
      ? rawCocktail.ingredients
      : [],
    imageUrl: rawCocktail.imageUrl ?? '/assets/cocktail_mockup.png',
    likes: typeof rawCocktail.likes === 'number' ? rawCocktail.likes : 0,
    likedBy,
  };
}

function MainPage() {
  const { usuario, token, estaAutenticado, iniciarSesion } = useAutenticacion();

  const [cocktailsState, setCocktailsState] = useState([]);
  const [loadingCocktails, setLoadingCocktails] = useState(true);
  const [statusMessage, setStatusMessage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCocktail, setSelectedCocktail] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCocktail, setNewCocktail] = useState({
    name: '',
    description: '',
    imageUrl: '',
    ingredients: '',
    instructions: '',
  });
  const [isCreatingCocktail, setIsCreatingCocktail] = useState(false);
  const [createError, setCreateError] = useState('');
  const [demoLoginLoading, setDemoLoginLoading] = useState(false);
  const [likingIds, setLikingIds] = useState([]);

  // Estados para el formulario reutilizable (crear/editar)
  const [showCocktailForm, setShowCocktailForm] = useState(false);
  const [formMode, setFormMode] = useState('create'); // 'create' | 'edit'
  const [editingCocktailId, setEditingCocktailId] = useState(null);
  const [formInitialData, setFormInitialData] = useState(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [formError, setFormError] = useState('');

  const mostrarMensajeEstado = useCallback((variant, text = '') => {
    if (!variant || !text) {
      setStatusMessage(null);
      return;
    }
    setStatusMessage({ variant, text });
  }, []);

  // 🔥 Manejar actualizaciones de cócteles en tiempo real via WebSocket
  const handleCocktailUpdate = useCallback((data) => {
    const { action, cocktail } = data;
    
    setCocktailsState((prevCocktails) => {
      if (action === 'approved') {
        // Si el cóctel fue aprobado, agregarlo a la lista (si no existe ya)
        const exists = prevCocktails.some(c => c.id === cocktail.id);
        if (exists) {
          // Actualizar el cóctel existente
          return prevCocktails.map(c => 
            c.id === cocktail.id ? normalizarCoctel(cocktail) : c
          );
        } else {
          // Agregar el nuevo cóctel aprobado
          return [normalizarCoctel(cocktail), ...prevCocktails];
        }
      } else if (action === 'rejected') {
        // Si el cóctel fue rechazado, eliminarlo de la lista
        return prevCocktails.filter(c => c.id !== cocktail.id);
      }
      
      return prevCocktails;
    });

    // Mostrar mensaje al usuario
    if (action === 'approved') {
      mostrarMensajeEstado('success', `✅ Nuevo cóctel aprobado: "${cocktail.name}"`);
    }
  }, [mostrarMensajeEstado]);

  // Escuchar actualizaciones de cócteles en tiempo real
  useCocktailUpdates(handleCocktailUpdate);

  const cargarCocteles = useCallback(async () => {
    setLoadingCocktails(true);
    mostrarMensajeEstado(null);
    try {
      const datosApi = await obtenerCocteles();
      const preparados = datosApi
        .map(normalizarCoctel)
        .filter((cocktail) => cocktail !== null)
        .filter((cocktail) => cocktail.status === 'aprobado'); // Solo mostrar cocteles aprobados
      setCocktailsState(preparados);
      if (preparados.length === 0) {
        mostrarMensajeEstado(
          'info',
          'Aún no hay cócteles guardados en el backend. Inicia sesión y crea el primero.',
        );
      }
    } catch (error) {
      setCocktailsState([]);
      const message =
        error?.message ?? 'No fue posible conectar con el backend.';
      mostrarMensajeEstado(
        'error',
        `${message} Verifica que el backend esté en ejecución e intenta nuevamente.`,
      );
    } finally {
      setLoadingCocktails(false);
    }
  }, [mostrarMensajeEstado]);

  useEffect(() => {
    cargarCocteles();
  }, [cargarCocteles]);

  const abrirModal = (cocktail) => {
    setSelectedCocktail(cocktail);
    setIsModalOpen(true);
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setSelectedCocktail(null);
  };

  const iniciarSesionDemo = async () => {
    setDemoLoginLoading(true);
    try {
      await iniciarSesion({
        email: 'demo@cocktailverse.com',
        password: 'Demo123!',
      });
      mostrarMensajeEstado(
        'success',
        'Sesión iniciada con la cuenta demo. Ya puedes crear nuevos cócteles.',
      );
    } catch (error) {
      mostrarMensajeEstado(
        'error',
        error?.message ??
          'No fue posible iniciar sesión con la cuenta demo. Intenta desde la página de inicio.',
      );
    } finally {
      setDemoLoginLoading(false);
    }
  };

  const enviarFormularioCoctel = async (event) => {
    event.preventDefault();
    setCreateError('');

    if (!token) {
      setCreateError('Debes iniciar sesión para crear un cóctel.');
      return;
    }

    const payload = {
      name: newCocktail.name.trim(),
      description: newCocktail.description.trim() || undefined,
      instructions: newCocktail.instructions.trim() || undefined,
      imageUrl: newCocktail.imageUrl.trim() || undefined,
      ingredients: normalizarIngredientes(newCocktail.ingredients),
      status: 'pendiente', // Los cocteles de usuarios normales necesitan aprobación
    };

    if (!payload.name) {
      setCreateError('El nombre del cóctel es obligatorio.');
      return;
    }

    setIsCreatingCocktail(true);
    try {
      const response = await crearCoctel(payload, token);
      const createdCocktail = normalizarCoctel(response?.cocktail);
      // No agregamos el cóctel a la lista porque está pendiente de aprobación
      // Solo los cocteles aprobados se muestran en la lista principal
      setShowCreateModal(false);
      setNewCocktail({
        name: '',
        description: '',
        imageUrl: '',
        ingredients: '',
        instructions: '',
      });
      mostrarMensajeEstado(
        'success',
        'Cóctel creado correctamente. Está pendiente de aprobación por un administrador.',
      );
    } catch (error) {
      // Manejar errores de validación específicos
      if (error?.payload?.errors && Array.isArray(error.payload.errors)) {
        const errorMessages = error.payload.errors.map(err => err.msg).join('. ');
        setCreateError(errorMessages);
      } else {
        setCreateError(
          error?.message ?? 'No fue posible crear el cóctel. Intenta nuevamente.',
        );
      }
    } finally {
      setIsCreatingCocktail(false);
    }
  };

  // Abrir formulario en modo creación
  const abrirFormularioCrear = () => {
    setFormError('');
    setFormMode('create');
    setEditingCocktailId(null);
    setFormInitialData(null);
    setShowCocktailForm(true);
  };

  // Abrir formulario en modo edición
  const abrirFormularioEditar = async (cocktailId) => {
    setFormError('');
    setFormMode('edit');
    setEditingCocktailId(cocktailId);
    
    try {
      const response = await obtenerCoctelPorId(cocktailId);
      const cocktailData = response.cocktail || response;
      const normalizedData = normalizarCoctel(cocktailData);
      
      setFormInitialData(normalizedData);
      setShowCocktailForm(true);
    } catch (error) {
      mostrarMensajeEstado(
        'error',
        error?.message ?? 'No fue posible cargar los datos del cóctel.',
      );
    }
  };

  // Manejar envío del formulario (crear o editar)
  const manejarEnvioFormulario = async (formData) => {
    setFormError('');

    if (!token) {
      setFormError('Debes iniciar sesión para realizar esta acción.');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      instructions: formData.instructions.trim() || undefined,
      imageUrl: formData.imageUrl.trim() || undefined,
      ingredients: normalizarIngredientes(formData.ingredients),
    };

    if (!payload.name) {
      setFormError('El nombre del cóctel es obligatorio.');
      return;
    }

    if (!payload.ingredients || payload.ingredients.length === 0) {
      setFormError('Debes agregar al menos un ingrediente.');
      return;
    }

    setIsSubmittingForm(true);
    
    try {
      if (formMode === 'create') {
        payload.status = 'pendiente';
        await crearCoctel(payload, token);
        setShowCocktailForm(false);
        mostrarMensajeEstado(
          'success',
          'Cóctel creado correctamente. Está pendiente de aprobación por un administrador.',
        );
      } else if (formMode === 'edit') {
        const isAdmin = usuario?.role === 'admin';
        
        // Si no es admin, marcar como pendiente para que los admins revisen
        if (!isAdmin) {
          payload.status = 'pendiente';
        }
        
        const response = await actualizarCoctel(editingCocktailId, payload, token);
        const updatedCocktail = normalizarCoctel(response?.cocktail);
        
        // Solo actualizar la lista local si es admin (cambio directo)
        if (isAdmin) {
          setCocktailsState((prev) =>
            prev.map((c) => (c.id === editingCocktailId ? updatedCocktail : c))
          );
        }
        
        setShowCocktailForm(false);
        
        const successMessage = isAdmin
          ? 'Cóctel actualizado correctamente.'
          : 'Solicitud de edición enviada. Los cambios están pendientes de aprobación por un administrador.';
        
        mostrarMensajeEstado('success', successMessage);
      }
    } catch (error) {
      if (error?.payload?.errors && Array.isArray(error.payload.errors)) {
        const errorMessages = error.payload.errors.map(err => err.msg).join('. ');
        setFormError(errorMessages);
      } else {
        setFormError(
          error?.message ?? `No fue posible ${formMode === 'create' ? 'crear' : 'actualizar'} el cóctel. Intenta nuevamente.`,
        );
      }
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const currentUserId = usuario ? String(usuario.id) : null;

  const alternarFavorito = async (cocktailId) => {
    if (!currentUserId || !token) {
      mostrarMensajeEstado(
        'info',
        'Inicia sesión para marcar tus cócteles favoritos.',
      );
      return;
    }

    // Optimistic update: guardar estado previo para revertir si falla
    let previousState;
    setCocktailsState((prev) => {
      previousState = prev;
      return prev.map((cocktail) => {
        if (cocktail.id !== cocktailId) return cocktail;

        const likedBy = Array.isArray(cocktail.likedBy) ? cocktail.likedBy : [];
        const hasLiked = likedBy.includes(currentUserId);

        if (hasLiked) {
          return {
            ...cocktail,
            likes: Math.max(0, (cocktail.likes ?? 0) - 1),
            likedBy: likedBy.filter((id) => id !== currentUserId),
          };
        }

        return {
          ...cocktail,
          likes: (cocktail.likes ?? 0) + 1,
          likedBy: [...likedBy, currentUserId],
        };
      });
    });

    // marcar como en progreso
    setLikingIds((prev) => [...prev, cocktailId]);

    try {
      const resp = await toggleLike(cocktailId, token);
      // Si el servidor responde con liked booleano, asegurar consistencia
      if (resp && typeof resp.liked === 'boolean') {
        setCocktailsState((prev) =>
          prev.map((cocktail) => {
            if (cocktail.id !== cocktailId) return cocktail;
            const likedBy = Array.isArray(cocktail.likedBy) ? cocktail.likedBy : [];
            const hasLikedNow = resp.liked;
            if (hasLikedNow) {
              if (!likedBy.includes(currentUserId)) {
                return {
                  ...cocktail,
                  likes: (cocktail.likes ?? 0) + 1,
                  likedBy: [...likedBy, currentUserId],
                };
              }
              return cocktail;
            }
            // unlike
            return {
              ...cocktail,
              likes: Math.max(0, (cocktail.likes ?? 0) - 1),
              likedBy: likedBy.filter((id) => id !== currentUserId),
            };
          }),
        );
      }
    } catch (err) {
      // Revertir optimistic update
      setCocktailsState(previousState || []);
      const message = err?.message || 'No fue posible actualizar favorito.';
      if (err?.status === 401) {
        mostrarMensajeEstado('info', 'Tu sesión expiró. Inicia sesión de nuevo.');
      } else {
        mostrarMensajeEstado('error', message);
      }
    } finally {
      // quitar de en progreso
      setLikingIds((prev) => prev.filter((id) => id !== cocktailId));
    }
  };

  const filteredCocktails = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();
    if (!normalizedTerm) {
      return cocktailsState;
    }

    return cocktailsState.filter((cocktail) => {
      const haystack = [
        cocktail.name ?? '',
        cocktail.description ?? '',
        ...(Array.isArray(cocktail.ingredients) ? cocktail.ingredients : []),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedTerm);
    });
  }, [cocktailsState, searchTerm]);

  const hasResults = filteredCocktails.length > 0;

  return (
    <div className="main-page-container">
      <Navbar />

      <main className="main-content">
        <div className="search-and-actions">
          <div className="search-bar-container">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar cócteles..."
              className="search-input"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="action-buttons">
            <button
              type="button"
              className="action-btn refresh-btn"
              onClick={cargarCocteles}
              disabled={loadingCocktails}
            >
              {loadingCocktails ? 'Actualizando…' : 'Refrescar lista'}
            </button>
            {estaAutenticado ? (
              <button
                type="button"
                className="action-btn create-btn"
                onClick={abrirFormularioCrear}
              >
                Crear cóctel
              </button>
            ) : (
              <button
                type="button"
                className="action-btn demo-btn"
                onClick={iniciarSesionDemo}
                disabled={demoLoginLoading}
              >
                {demoLoginLoading ? 'Conectando…' : 'Iniciar sesión demo'}
              </button>
            )}
          </div>
        </div>

        <h2 className="main-title">Descubre Cócteles Increíbles</h2>
        <p className="main-subtitle">
          Explora recetas guardadas en el backend de CocktailVerse o comparte
          tus propias creaciones.
        </p>

        {statusMessage ? (
          <div className={`status-message status-message--${statusMessage.variant}`}>
            {statusMessage.text}
          </div>
        ) : null}

        {loadingCocktails ? (
          <p className="loading-message">Cargando cócteles…</p>
        ) : hasResults ? (
          <div className="cocktail-grid">
            {filteredCocktails.map((cocktail) => {
              const likedBy = Array.isArray(cocktail.likedBy)
                ? cocktail.likedBy
                : [];
              const isFavorited =
                currentUserId && likedBy.includes(currentUserId);

              return (
                <article key={cocktail.id} className="cocktail-card">
                  <img
                    src={cocktail.imageUrl || '/assets/cocktail_mockup.png'}
                    alt={cocktail.name}
                    className="card-image"
                    onError={(event) => {
                      if (event.currentTarget.dataset.fallbackApplied) {return;}
                      // Marca para evitar bucles y cambia a la imagen local por defecto.
                      event.currentTarget.dataset.fallbackApplied = 'true';
                      event.currentTarget.src = '/assets/cocktail_mockup.png';
                    }}
                  />

                  <div className="card-content">
                    <h3 className="card-title">{cocktail.name}</h3>
                    <p className="card-description">
                      {cocktail.description || 'Sin descripción disponible.'}
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        alignItems: 'center',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => abrirModal(cocktail)}
                        className="card-button"
                      >
                        Ver receta
                      </button>

                      <button
                        type="button"
                        onClick={() => alternarFavorito(cocktail.id)}
                        className="feature-button"
                        title={
                          estaAutenticado
                            ? isFavorited
                              ? 'Quitar favorito'
                              : 'Marcar favorito'
                            : 'Inicia sesión para marcar favorito'
                        }
                        aria-pressed={isFavorited}
                        disabled={!estaAutenticado || likingIds.includes(cocktail.id)}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          padding: '6px 8px',
                          fontSize: 18,
                          cursor: estaAutenticado ? 'pointer' : 'not-allowed',
                          color: isFavorited ? '#E74C3C' : '#666',
                        }}
                      >
                        {likingIds.includes(cocktail.id) ? '…' : (isFavorited ? '♥' : '♡')}
                        <span
                          style={{
                            marginLeft: 6,
                            fontSize: 13,
                            color: '#333',
                          }}
                        >
                          {cocktail.likes ? cocktail.likes : ''}
                        </span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="no-results">
            No encontramos cócteles que coincidan con “{searchTerm}”. Intenta
            con otro término o crea una nueva receta.
          </p>
        )}
      </main>

      <Counter cocktails={cocktailsState} onShowCocktail={abrirModal} />

      <CocktailModal
        isOpen={isModalOpen}
        onClose={cerrarModal}
        cocktail={selectedCocktail}
        onEditCocktail={abrirFormularioEditar}
      />

      {showCreateModal && (
        <div
          className="create-modal-overlay"
          onClick={() => setShowCreateModal(false)}
        >
          <form
            onSubmit={enviarFormularioCoctel}
            className="create-cocktail-form"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="form-header">
              <h3>✨ Crear Nuevo Cóctel</h3>
              <button
                type="button"
                className="close-button"
                onClick={() => setShowCreateModal(false)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="form-body">
              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">🍸</span>
                  Nombre del cóctel
                </label>
                <input
                  value={newCocktail.name}
                  onChange={(event) =>
                    setNewCocktail((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  className="form-input"
                  placeholder="Ej: Mojito Clásico"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">📝</span>
                  Descripción
                  <span className="optional-badge">opcional</span>
                </label>
                <textarea
                  value={newCocktail.description}
                  onChange={(event) =>
                    setNewCocktail((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  className="form-textarea"
                  rows={3}
                  placeholder="Describe brevemente tu cóctel..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">📋</span>
                  Instrucciones
                  <span className="optional-badge">opcional</span>
                </label>
                <textarea
                  value={newCocktail.instructions}
                  onChange={(event) =>
                    setNewCocktail((prev) => ({
                      ...prev,
                      instructions: event.target.value,
                    }))
                  }
                  className="form-textarea"
                  rows={3}
                  placeholder="1. Agregar hielo al vaso&#10;2. Mezclar ingredientes&#10;3. Decorar y servir"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">🖼️</span>
                  Imagen
                  <span className="optional-badge">opcional</span>
                </label>
                <input
                  value={newCocktail.imageUrl}
                  onChange={(event) =>
                    setNewCocktail((prev) => ({
                      ...prev,
                      imageUrl: event.target.value,
                    }))
                  }
                  className="form-input"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  type="url"
                />
                <small className="form-hint">
                  💡 Usa <a href="https://imgur.com" target="_blank" rel="noopener noreferrer">Imgur</a>, <a href="https://imgbb.com" target="_blank" rel="noopener noreferrer">ImgBB</a> o copia la URL de una imagen desde Google
                </small>
                
                {newCocktail.imageUrl && (
                  <div className="image-preview">
                    <img
                      src={newCocktail.imageUrl}
                      alt="Preview"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <p className="image-error">
                      ⚠️ No se pudo cargar la imagen. Verifica la URL.
                    </p>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">🧪</span>
                  Ingredientes
                </label>
                <input
                  value={newCocktail.ingredients}
                  onChange={(event) =>
                    setNewCocktail((prev) => ({
                      ...prev,
                      ingredients: event.target.value,
                    }))
                  }
                  className="form-input"
                  placeholder="2 oz Ron blanco, 1 oz Jugo de limón, Menta fresca"
                  required
                />
                <small className="form-hint">Separa cada ingrediente con comas</small>
              </div>

              {createError && (
                <div className="form-error">
                  <span className="error-icon">⚠️</span>
                  {createError}
                </div>
              )}
            </div>

            <div className="form-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setShowCreateModal(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-submit"
                disabled={isCreatingCocktail}
              >
                {isCreatingCocktail ? (
                  <>
                    <span className="spinner"></span>
                    Creando...
                  </>
                ) : (
                  <>
                    <span>🎉</span>
                    Crear cóctel
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Formulario reutilizable para crear/editar cócteles */}
      <CocktailForm
        isOpen={showCocktailForm}
        onClose={() => setShowCocktailForm(false)}
        onSubmit={manejarEnvioFormulario}
        initialData={formInitialData}
        isLoading={isSubmittingForm}
        error={formError}
        mode={formMode}
        userRole={usuario?.role}
      />
    </div>
  );
}

export default MainPage;

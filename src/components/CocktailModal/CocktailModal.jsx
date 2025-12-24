import React, { useEffect, useMemo, useState } from 'react';
import './CocktailModal.css';
import { useAutenticacion } from '../../context/AuthContext';
import ChatPanel from '../ChatPanel/ChatPanel';
import {
  obtenerComentarios,
  crearComentario,
  eliminarComentario,
  obtenerEstadisticasVoto,
  obtenerVoto,
} from '../../services/api';

function timeAgo(iso) {
  try {
    const date = new Date(iso);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds} seg`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} h`;
    const days = Math.floor(hours / 24);
    return `${days} d`;
  } catch (e) {
    return iso;
  }
}

function CocktailModal({ 
  isOpen, 
  onClose, 
  cocktail, 
  onEditCocktail,
  isAdminReview = false,
  onApprove,
  onReject,
  isProcessing = false
}) {
  const { usuario, token, estaAutenticado } = useAutenticacion();

  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newText, setNewText] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [deletingIds, setDeletingIds] = useState([]);

  // Votos
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [userVote, setUserVote] = useState(null);
  const [loadingUserVote, setLoadingUserVote] = useState(false);

  const currentUserId = usuario ? String(usuario.id) : null;

  useEffect(() => {
    if (!isOpen || !cocktail) return;
    
    let mounted = true;
    
    // Scroll al inicio del modal cuando se abre (con delay para asegurar renderizado)
    setTimeout(() => {
      const modalBody = document.querySelector('.modal-body');
      if (modalBody && mounted) {
        modalBody.scrollTop = 0;
        modalBody.scrollTo({ top: 0, behavior: 'instant' });
      }
    }, 50);
    // limpiar comentarios previos para evitar que se muestren entre cócteles
    setComments([]);
    // limpiar votos cuando se abre
    setStats(null);
    setUserVote(null);
    const load = async () => {
      setLoadingComments(true);
      try {
        const payload = await obtenerComentarios(cocktail.id);
        const list = Array.isArray(payload) ? payload : (payload?.comments ?? payload?.comentarios ?? []);
        if (!mounted) return;
        setComments(list.map((c) => normalizeComment(c)).filter(Boolean));
      } catch (err) {
        // si el backend no tiene GET de comentarios, obtenerComentarios ya devuelve [] en 404;
        // solo notificar para errores distintos.
        if (err && Number(err.status) !== 404) {
          const msg = err?.message ?? 'No fue posible cargar comentarios.';
          window.alert(msg);
        } else {
          // en 404 o fallback, mantener lista vacía
          if (mounted) setComments([]);
        }
      } finally {
        if (mounted) setLoadingComments(false);
      }
    };
    load();
    // cargar estadísticas y voto del usuario
    const loadVotes = async () => {
      if (!cocktail) return;
      setLoadingStats(true);
      try {
        const s = await obtenerEstadisticasVoto(cocktail.id);
        if (!mounted) return;
        setStats(s);
      } catch (err) {
        // ignorar errores de stats (mostrar nada)
      } finally {
        if (mounted) setLoadingStats(false);
      }

      if (estaAutenticado && token) {
        setLoadingUserVote(true);
        try {
          const v = await obtenerVoto(cocktail.id, token);
          if (!mounted) return;
          // respuesta puede ser { calificacion: 4 } o similar
          const val = v?.calificacion ?? v?.rating ?? v?.vote ?? null;
          setUserVote(typeof val === 'number' ? Number(val) : null);
        } catch (err) {
          // 404 o no existe -> null
          setUserVote(null);
        } finally {
          if (mounted) setLoadingUserVote(false);
        }
      }
    };
    loadVotes();
    return () => {
      mounted = false;
    };
  }, [isOpen, cocktail]);

  const ordenarComentarios = useMemo(() => {
    return [...comments].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [comments]);

  // Verificar si el usuario actual ya tiene un comentario en este cóctel
  const userHasComment = useMemo(() => {
    if (!currentUserId || !comments.length) return false;
    return comments.some((c) => {
      const authorId = c.author?.id ?? c.author?.id_usuario ?? c.author?.userId;
      return String(authorId) === String(currentUserId);
    });
  }, [comments, currentUserId]);

  function normalizeComment(raw) {
    if (!raw) return null;
    const id = raw.idResena ?? raw.idComentario ?? raw.id_comentario ?? raw.id ?? raw._id;
    const texto = raw.descripcion ?? raw.texto ?? raw.text ?? '';
    const fecha = raw.fecha ?? raw.createdAt ?? raw.created_at ?? raw.date ?? new Date().toISOString();
    const calificacion = raw.calificacion ?? raw.rating ?? raw.vote ?? null;
    const authorRaw = raw.author ?? raw.autor ?? raw.user ?? raw.usuario ?? {};
    const author = {
      id: authorRaw.id ?? authorRaw.id_usuario ?? authorRaw.userId ?? authorRaw.idUser,
      name: authorRaw.name ?? authorRaw.nombre ?? authorRaw.fullName ?? authorRaw.email ?? 'Usuario',
      email: authorRaw.email,
      role: authorRaw.role,
      photo: authorRaw.photo ?? authorRaw.photoUrl ?? authorRaw.foto,
      photoUrl: authorRaw.photoUrl ?? authorRaw.photo ?? authorRaw.foto,
    };
    return { 
      idComentario: id, 
      texto, 
      fecha, 
      calificacion,
      author, 
      idCoctel: raw.idCoctel ?? raw.id_coctel ?? raw.cocktailId ?? raw.idCoctel 
    };
  }

  async function fetchCommentsWithRetries(cocktailId, maxAttempts = 3) {
    const delays = [100, 300, 700];
    let lastErr = null;
    for (let i = 0; i < maxAttempts; i += 1) {
      try {
        const payload = await obtenerComentarios(cocktailId);
        const list = Array.isArray(payload) ? payload : (payload?.comments ?? payload?.comentarios ?? []);
        if (Array.isArray(list) && list.length > 0) {
          return list.map((c) => normalizeComment(c)).filter(Boolean);
        }
        // if empty, wait and retry
        lastErr = null;
      } catch (err) {
        lastErr = err;
      }
      const delay = delays[Math.min(i, delays.length - 1)];
      // eslint-disable-next-line no-await-in-loop
      await new Promise((res) => setTimeout(res, delay));
    }
    if (lastErr) throw lastErr;
    return [];
  }

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!cocktail) return;
    if (!estaAutenticado || !token) {
      window.alert('Debes iniciar sesión para comentar.');
      return;
    }
    const texto = (newText || '').trim();
    if (!texto) {
      window.alert('El comentario no puede estar vacío.');
      return;
    }
    if (texto.length > 1000) {
      window.alert('El comentario excede el límite de 1000 caracteres.');
      return;
    }

    // optimistic: crear un comentario temporal con la foto del usuario
    const temp = {
      idComentario: `temp-${Date.now()}`,
      texto,
      fecha: new Date().toISOString(),
      calificacion: userVote,
      author: {
        id: usuario?.id,
        name: usuario?.name ?? usuario?.nombre ?? 'Tú',
        email: usuario?.email,
        photo: usuario?.photoUrl,
        photoUrl: usuario?.photoUrl,
      },
      idCoctel: cocktail.id,
    };
    setComments((prev) => [temp, ...prev]);
    setNewText('');
    setIsCreating(true);
    try {
      const resp = await crearComentario(cocktail.id, texto, token, userVote);
      // servidor responde { resena: { ... } } según backend
      const created = resp?.resena ?? resp?.comentario ?? resp?.comment ?? resp;
      
      // Si se guardó una calificación, actualizar estadísticas y marcar que el usuario ya votó
      if (typeof userVote === 'number') {
        try {
          const s = await obtenerEstadisticasVoto(cocktail.id);
          setStats(s);
        } catch (e) {
          // ignore
        }
      }
      
      // refrescar desde servidor para obtener la representación canonical
      try {
        const list = await fetchCommentsWithRetries(cocktail.id, 3);
        if ((!list || list.length === 0) && created) {
          const norm = normalizeComment(created) || created;
          setComments((prev) => [norm, ...prev.filter((c) => c.idComentario !== temp.idComentario && c.idComentario !== norm.idComentario)]);
        } else {
          setComments(list);
        }
      } catch (reloadErr) {
        // si la recarga falla, usar el objeto creado normalizado si existe
        if (created) {
          const norm = normalizeComment(created) || created;
          setComments((prev) => [norm, ...prev.filter((c) => c.idComentario !== temp.idComentario && c.idComentario !== norm.idComentario)]);
        }
      }
    } catch (err) {
      // revertir optimistic
      setComments((prev) => prev.filter((c) => c.idComentario !== temp.idComentario));
      const msg = err?.message ?? 'No fue posible crear el comentario.';
      if (err?.status === 401) {
        window.alert('Tu sesión expiró. Inicia sesión nuevamente.');
      } else if (err?.status === 422) {
        window.alert('Texto inválido. Por favor revisa tu comentario.');
      } else {
        window.alert(msg);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectVote = (n) => {
    // Solo permitir cambiar si no hay voto guardado en servidor
    if (loadingUserVote === false && userVote !== null) {
      return;
    }
    setUserVote(n);
  };

  const handleDelete = async (comment) => {
    if (!comment) return;
    if (!token) {
      window.alert('Debes iniciar sesión.');
      return;
    }
    const id = comment.idComentario ?? comment.id ?? comment.idComment ?? comment.id_comment;
    if (!id) return;
    if (!window.confirm('¿Eliminar este comentario y su valoración?')) return;
    
    // Verificar si el comentario es del usuario actual
    const commentAuthorId = comment.author?.id ?? comment.author?.id_usuario;
    const isDeletingOwnComment = String(commentAuthorId) === String(currentUserId);
    
    setDeletingIds((prev) => [...prev, id]);
    // Optimistic remove
    const previous = comments;
    const previousUserVote = userVote;
    const previousStats = stats;
    
    setComments((prev) => prev.filter((c) => (c.idComentario ?? c.id) !== id));
    
    // Si es el comentario del usuario actual, resetear su voto
    if (isDeletingOwnComment) {
      setUserVote(null);
    }
    
    try {
      const resp = await eliminarComentario(id, token);
      
      // Refrescar estadísticas (el backend ya eliminó el voto)
      if (isDeletingOwnComment) {
        try {
          const s = await obtenerEstadisticasVoto(cocktail.id);
          setStats(s);
        } catch (e) {
          // ignore
        }
      }
      
      // refrescar lista desde servidor para mantener consistencia (reintentos si es necesario)
      try {
        const list = await fetchCommentsWithRetries(cocktail.id, 3);
        setComments(list);
      } catch (reloadErr) {
        // si falla recarga, mantener estado provisional (ya fue removido optimistically)
      }
    } catch (err) {
      // revertir todo
      setComments(previous);
      if (isDeletingOwnComment) {
        setUserVote(previousUserVote);
        setStats(previousStats);
      }
      const msg = err?.message ?? 'No fue posible eliminar el comentario.';
      if (err?.status === 403) {
        window.alert('No estás autorizado para eliminar este comentario.');
      } else {
        window.alert(msg);
      }
    } finally {
      setDeletingIds((prev) => prev.filter((x) => x !== id));
    }
  };

  if (!isOpen || !cocktail) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Botón cerrar en la esquina */}
        <button onClick={onClose} className="modal-close-button-corner" aria-label="Cerrar">
          ✕
        </button>

        <div className="modal-header">
          <img src={cocktail.imageUrl} alt={cocktail.name} className="modal-image" />
        </div>

        <div className="modal-body">
          <h2 className="modal-cocktail-title">{cocktail.name}</h2>

          {/* Estadísticas generales de votos */}
          <div className="rating-stats-display">
            {loadingStats ? (
              <div className="rating-loading">Cargando calificación…</div>
            ) : stats && stats.votesCount > 0 ? (
              <div className="rating-summary-modern">
                <div className="rating-avg-circle">
                  <span className="rating-number">{Number(stats.avgRating).toFixed(1)}</span>
                  <span className="rating-stars-icon">★</span>
                </div>
                <span className="rating-count-text">{stats.votesCount} {stats.votesCount === 1 ? 'valoración' : 'valoraciones'}</span>
              </div>
            ) : (
              <div className="rating-summary-modern">
                <div className="rating-no-votes">Sin valoraciones</div>
              </div>
            )}
          </div>

          {/* Nombre del cóctel */}
          <h3 className="modal-subtitle">Nombre:</h3>
          <p className="modal-description">{cocktail.pendingChanges?.name || cocktail.name}</p>
          {isAdminReview && cocktail.pendingChanges?.name && cocktail.pendingChanges.name !== cocktail.name && (
            <div className="previous-value">
              <span className="previous-label">📋 Versión actual:</span> {cocktail.name}
            </div>
          )}

          {/* Descripción */}
          {(cocktail.description || cocktail.pendingChanges?.description) && (
            <>
              <h3 className="modal-subtitle">Descripción:</h3>
              <p className="modal-description">{cocktail.pendingChanges?.description || cocktail.description}</p>
              {isAdminReview && cocktail.pendingChanges?.description && cocktail.pendingChanges.description !== cocktail.description && (
                <div className="previous-value">
                  <span className="previous-label">📋 Versión actual:</span> {cocktail.description || '(Sin descripción)'}
                </div>
              )}
            </>
          )}

          <h3 className="modal-subtitle">Ingredientes:</h3>
          <ul className="ingredients-list">
            {(cocktail.pendingChanges?.ingredients || cocktail.ingredients || []).map((ingredient, idx) => (
              <li key={idx}>{ingredient}</li>
            ))}
          </ul>
          {isAdminReview && cocktail.pendingChanges?.ingredients && JSON.stringify(cocktail.pendingChanges.ingredients) !== JSON.stringify(cocktail.ingredients) && (
            <div className="previous-value">
              <span className="previous-label">📋 Versión actual:</span>
              <ul className="ingredients-list-previous">
                {(cocktail.ingredients || []).map((ingredient, idx) => (
                  <li key={idx}>{ingredient}</li>
                ))}
              </ul>
            </div>
          )}

          <h3 className="modal-subtitle">Instrucciones:</h3>
          <p className="modal-instructions">{cocktail.pendingChanges?.instructions || cocktail.instructions}</p>
          {isAdminReview && cocktail.pendingChanges?.instructions && cocktail.pendingChanges.instructions !== cocktail.instructions && (
            <div className="previous-value">
              <span className="previous-label">📋 Versión actual:</span> {cocktail.instructions || '(Sin instrucciones)'}
            </div>
          )}

          <hr className="modal-divider" />

          <section className="comments-section">
            <h3 className="modal-subtitle">Opiniones</h3>

            {estaAutenticado ? (
              userHasComment ? (
                <div className="already-commented-notice">
                  <p className="notice-text">
                    ✅ Ya has compartido tu opinión sobre este cóctel.
                  </p>
                  <p className="notice-subtext">
                    Para modificar tu valoración o comentario, primero elimina tu opinión anterior.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleCreate} className="comment-form-modern">
                <div className="comment-form-header">
                  <div className="comment-user-avatar">
                    {usuario.photoUrl ? (
                      <img src={usuario.photoUrl} alt={usuario.name} />
                    ) : (
                      <div className="comment-avatar-placeholder">
                        {usuario.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <div className="comment-form-fields">
                    <textarea
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      rows={3}
                      placeholder="Comparte tu opinión sobre este cóctel..."
                      maxLength={1000}
                      disabled={isCreating}
                      className="comment-textarea-modern"
                    />
                    <div className="comment-rating-inline">
                      <label>Tu valoración:</label>
                      <div className="rating-buttons-inline">
                        {Array.from({ length: 7 }, (_, i) => i + 1).map((n) => (
                          <button
                            key={n}
                            type="button"
                            className={`rating-star-button ${userVote === n ? 'active' : ''}`}
                            onClick={() => handleSelectVote(n)}
                            disabled={loadingUserVote === false && userVote !== null && userVote !== n}
                            title={loadingUserVote === false && userVote !== null && userVote !== n ? 'Ya has valorado este cóctel' : `Valorar con ${n} estrellas`}
                          >
                            {n}★
                          </button>
                        ))}
                      </div>
                      {userVote !== null && !loadingUserVote && (
                        <p className="rating-info-text">Tu valoración será guardada al publicar tu opinión</p>
                      )}
                    </div>
                    <div className="comment-form-actions">
                      <button 
                        type="submit" 
                        className="submit-comment-button" 
                        disabled={isCreating || !newText.trim()}
                      >
                        {isCreating ? '📤 Publicando…' : '📤 Publicar opinión'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
              )
            ) : (
              <p className="login-prompt">Inicia sesión para dejar tu opinión y valoración.</p>
            )}

            {loadingComments ? (
              <p className="loading-text">Cargando opiniones…</p>
            ) : ordenarComentarios.length === 0 ? (
              <p className="empty-comments">No hay opiniones aún. ¡Sé el primero en compartir la tuya!</p>
            ) : (
              <div className="comments-list-modern">
                {ordenarComentarios.map((c) => {
                  const author = c.author || c.autor || c.user || {};
                  const id = c.idComentario ?? c.id ?? c._id;
                  const canDelete = usuario && (String(usuario.id) === String(author.id) || usuario.role === 'admin');
                  const deleting = deletingIds.includes(id);
                  
                  // Obtener la calificación asociada al comentario (si existe)
                  const commentRating = c.calificacion ?? c.rating ?? null;
                  
                  // Obtener la foto del autor
                  const authorPhoto = author.photo || author.photoUrl;
                  
                  return (
                    <article key={id} className="comment-card-modern">
                      <div className="comment-header-modern">
                        <div className="comment-author-info">
                          <div className="comment-author-avatar">
                            {authorPhoto ? (
                              <img 
                                src={authorPhoto} 
                                alt={author.name || 'Usuario'}
                                onError={(e) => {
                                  console.error('❌ Error cargando foto:', authorPhoto?.substring(0, 100));
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            {!authorPhoto && (
                              <div className="comment-avatar-placeholder">
                                {(author.name || author.nombre || 'U').charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="comment-author-details">
                            <strong className="comment-author-name">{author.name ?? author.nombre ?? 'Usuario'}</strong>
                            <div className="comment-meta">
                              <span className="comment-time">{timeAgo(c.fecha)}</span>
                              {commentRating && (
                                <>
                                  <span className="comment-meta-separator">•</span>
                                  <span className="comment-rating-badge">{commentRating}★</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDelete(c)}
                            disabled={deleting}
                            className="comment-delete-button"
                            aria-label="Eliminar comentario"
                          >
                            {deleting ? '⏳' : '🗑️'}
                          </button>
                        )}
                      </div>
                      <p className="comment-text-modern">{c.texto ?? c.text ?? ''}</p>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* Chat en vivo del cóctel */}
          <section className="chat-section">
            <ChatPanel cocktailId={cocktail.id} />
          </section>

          {/* Botones de administrador para aprobar/rechazar */}
          {isAdminReview && onApprove && onReject && (
            <div className="admin-review-actions">
              <button
                onClick={onApprove}
                disabled={isProcessing}
                className="btn-admin-approve"
              >
                {isProcessing ? 'Procesando...' : '✅ Aprobar'}
              </button>
              <button
                onClick={onReject}
                disabled={isProcessing}
                className="btn-admin-reject"
              >
                {isProcessing ? 'Procesando...' : '❌ Rechazar'}
              </button>
            </div>
          )}

          {/* Botón de editar - disponible para todos los usuarios autenticados (solo si no es revisión de admin) */}
          {!isAdminReview && estaAutenticado && usuario && onEditCocktail && (
            <div className="modal-edit-section">
              <button 
                onClick={() => {
                  onEditCocktail(cocktail.id);
                  onClose();
                }}
                className="btn-edit-cocktail"
                title="Sugerir cambios a este cóctel"
              >
                ✏️ Editar Cóctel
              </button>
              {usuario.role !== 'admin' && (
                <p className="edit-notice">
                  ℹ️ Los cambios deberán ser aprobados por un administrador
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CocktailModal;

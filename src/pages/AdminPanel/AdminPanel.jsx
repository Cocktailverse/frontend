import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutenticacion } from '../../context/AuthContext';
import Navbar from '../../components/Navbar/Navbar';
import CocktailModal from '../../components/CocktailModal/CocktailModal';
import * as api from '../../services/api';
import { useCocktailUpdates } from '../../hooks/useCocktailUpdates';
import './AdminPanel.css';

export default function AdminPanel() {
  const { usuario, estaAutenticado } = useAutenticacion();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState(null);
  const [pendingCocktails, setPendingCocktails] = useState([]);
  const [ratingsList, setRatingsList] = useState([]);
  const [cocktailsMap, setCocktailsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingIds, setProcessingIds] = useState(new Set());
  const [selectedCocktail, setSelectedCocktail] = useState(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  // Verificar si el usuario es admin
  const isAdmin = usuario?.role === 'admin';

  // Hook para actualizaciones en tiempo real de cócteles
  const manejarActualizacionCoctel = useCallback((data) => {
    console.log('🔄 Actualización de cóctel en AdminPanel:', data);
    
    const { action, cocktail } = data;
    
    if (!cocktail) return;

    // Si es un cóctel nuevo o editado con estado pendiente, agregarlo a la lista
    if (action === 'created' && cocktail.status === 'pendiente') {
      setPendingCocktails(prev => {
        // Evitar duplicados
        if (prev.some(c => c.id === cocktail.id)) return prev;
        return [cocktail, ...prev];
      });
      
      // Actualizar stats
      setStats(prev => prev ? {
        ...prev,
        cocktails: {
          ...prev.cocktails,
          pending: prev.cocktails.pending + 1,
          total: prev.cocktails.total + 1,
        },
      } : prev);
    }
    
    // Si es una actualización que cambió a pendiente (solicitud de edición)
    if (action === 'updated' && cocktail.status === 'pendiente') {
      setPendingCocktails(prev => {
        // Si ya existe, actualizarlo; si no, agregarlo
        const exists = prev.some(c => c.id === cocktail.id);
        if (exists) {
          return prev.map(c => c.id === cocktail.id ? cocktail : c);
        }
        return [cocktail, ...prev];
      });
      
      // Actualizar stats solo si es nuevo en pendientes
      setStats(prev => {
        if (!prev) return prev;
        const wasPending = pendingCocktails.some(c => c.id === cocktail.id);
        if (wasPending) return prev;
        
        return {
          ...prev,
          cocktails: {
            ...prev.cocktails,
            pending: prev.cocktails.pending + 1,
          },
        };
      });
    }
    
    // Si cambió de pendiente a aprobado/rechazado, removerlo
    if (action === 'updated' && cocktail.status !== 'pendiente') {
      setPendingCocktails(prev => prev.filter(c => c.id !== cocktail.id));
      
      setStats(prev => prev ? {
        ...prev,
        cocktails: {
          ...prev.cocktails,
          pending: Math.max(0, prev.cocktails.pending - 1),
          ...(cocktail.status === 'aprobado' && { approved: prev.cocktails.approved + 1 }),
          ...(cocktail.status === 'rechazado' && { rejected: prev.cocktails.rejected + 1 }),
        },
      } : prev);
    }
  }, [pendingCocktails]);

  useCocktailUpdates(manejarActualizacionCoctel);

  useEffect(() => {
    if (!estaAutenticado) {
      navigate('/');
      return;
    }

    if (!isAdmin) {
      return;
    }

    loadAdminData();
  }, [estaAutenticado, isAdmin, navigate]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsData, pendingData] = await Promise.all([
        api.getAdminStats(),
        api.getPendingCocktails(),
      ]);

      setStats(statsData);
      setPendingCocktails(pendingData.cocktails || []);
      // intentar obtener ratings y mapa de cocteles para imágenes
      try {
        const [r, allCocktails] = await Promise.all([
          api.obtenerRatingsAdmin().catch(() => null),
          api.obtenerCocteles().catch(() => []),
        ]);

        const list = Array.isArray(r) ? r : r?.ratings ?? [];
        setRatingsList(list);

        // construir mapa id -> cocktail (normalizar imagen similar a MainPage)
        const map = {};
        (Array.isArray(allCocktails) ? allCocktails : []).forEach((c) => {
          const id = c?.id ?? c?.cocktailId ?? c?._id;
          if (!id) return;
          map[id] = {
            ...c,
            imageUrl: c.imageUrl ?? c.image ?? c?.cocktail?.imageUrl ?? c?.cocktail?.image ?? '/assets/cocktail_mockup.png',
            name: c.name ?? c?.cocktail?.name,
          };
        });
        setCocktailsMap(map);
      } catch (e) {
        setRatingsList([]);
        setCocktailsMap({});
      }
    } catch (err) {
      console.error('Error al cargar datos de administración:', err);
      setError(err.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeCocktail = (cocktail) => {
    setSelectedCocktail(cocktail);
    setShowAnalysisModal(true);
  };

  const handleCloseModal = () => {
    setShowAnalysisModal(false);
    setSelectedCocktail(null);
  };

  const handleApprove = async (cocktailId) => {
    if (processingIds.has(cocktailId)) return;

    try {
      setProcessingIds(prev => new Set(prev).add(cocktailId));
      await api.approveCocktail(cocktailId);
      
      // Remover el cóctel de la lista de pendientes
      setPendingCocktails(prev => prev.filter(c => c.id !== cocktailId));
      
      // Actualizar estadísticas
      if (stats) {
        setStats({
          ...stats,
          cocktails: {
            ...stats.cocktails,
            pending: stats.cocktails.pending - 1,
            approved: stats.cocktails.approved + 1,
          },
        });
      }

      // Cerrar modal si está abierto
      handleCloseModal();
    } catch (err) {
      console.error('Error al aprobar cóctel:', err);
      alert('Error al aprobar el cóctel: ' + (err.message || 'Error desconocido'));
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(cocktailId);
        return newSet;
      });
    }
  };

  const handleReject = async (cocktailId) => {
    if (processingIds.has(cocktailId)) return;

    const reason = prompt('¿Razón del rechazo? (opcional)');
    
    try {
      setProcessingIds(prev => new Set(prev).add(cocktailId));
      await api.rejectCocktail(cocktailId, reason);
      
      // Remover el cóctel de la lista de pendientes
      setPendingCocktails(prev => prev.filter(c => c.id !== cocktailId));
      
      // Actualizar estadísticas
      if (stats) {
        setStats({
          ...stats,
          cocktails: {
            ...stats.cocktails,
            pending: stats.cocktails.pending - 1,
            rejected: stats.cocktails.rejected + 1,
          },
        });
      }

      // Cerrar modal si está abierto
      handleCloseModal();
    } catch (err) {
      console.error('Error al rechazar cóctel:', err);
      alert('Error al rechazar el cóctel: ' + (err.message || 'Error desconocido'));
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(cocktailId);
        return newSet;
      });
    }
  };

  // Si no está autenticado o no es admin, mostrar mensaje
  if (!estaAutenticado || !isAdmin) {
    return (
      <div className="access-denied">
        <div className="access-denied-content">
          <h1>🚫 Acceso Denegado</h1>
          <p>Esta página está reservada para administradores del sistema.</p>
          <button className="btn-back" onClick={() => navigate('/')}>
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <Navbar />
      <div className="admin-container">
        <div className="admin-header">
          <h1>👑 Panel de Administración</h1>
          <p>Gestiona los cócteles pendientes de aprobación</p>
        </div>

        {loading ? (
          <div className="loading-state">Cargando datos...</div>
        ) : error ? (
          <div className="error-state">
            <h3>Error</h3>
            <p>{error}</p>
            <button className="btn-back" onClick={loadAdminData}>
              Reintentar
            </button>
          </div>
        ) : (
          <>
            {stats && (
              <div className="admin-stats">
                <div className="stat-card">
                  <h3>Usuarios Totales</h3>
                  <p>{stats.users}</p>
                </div>
                <div className="stat-card">
                  <h3>Cócteles Totales</h3>
                  <p>{stats.cocktails.total}</p>
                </div>
                <div className="stat-card">
                  <h3>Pendientes</h3>
                  <p>{stats.cocktails.pending}</p>
                </div>
                <div className="stat-card">
                  <h3>Aprobados</h3>
                  <p>{stats.cocktails.approved}</p>
                </div>
                <div className="stat-card">
                  <h3>Rechazados</h3>
                  <p>{stats.cocktails.rejected}</p>
                </div>
                <div className="stat-card">
                  <h3>Borradores</h3>
                  <p>{stats.cocktails.draft}</p>
                </div>
              </div>
            )}

            <div className="pending-section">
              <h2>🍹 Cócteles Pendientes de Aprobación</h2>
              
              {pendingCocktails.length === 0 ? (
                <div className="empty-state">
                  <h3>✅ No hay cócteles pendientes</h3>
                  <p>¡Todo al día! No hay cócteles esperando revisión.</p>
                </div>
              ) : (
                <div className="pending-cocktails">
                  {pendingCocktails.map((cocktail) => (
                    <div key={cocktail.id} className="pending-card">
                      {cocktail.imageUrl ? (
                        <img
                          src={cocktail.imageUrl}
                          alt={cocktail.name}
                          className="pending-card-image"
                        />
                      ) : (
                        <div className="pending-card-image" />
                      )}
                      
                      <div className="pending-card-content">
                        <h3 className="pending-card-title">{cocktail.name}</h3>
                        <p className="pending-card-author">
                          Por: {cocktail.author?.name || 'Usuario desconocido'}
                        </p>
                        
                        {cocktail.description && (
                          <p className="pending-card-description">
                            {cocktail.description}
                          </p>
                        )}
                        
                        {cocktail.ingredients && cocktail.ingredients.length > 0 && (
                          <div className="pending-card-ingredients">
                            <h4>Ingredientes:</h4>
                            <ul>
                              {cocktail.ingredients.slice(0, 3).map((ingredient, idx) => (
                                <li key={idx}>{ingredient}</li>
                              ))}
                              {cocktail.ingredients.length > 3 && (
                                <li>... y {cocktail.ingredients.length - 3} más</li>
                              )}
                            </ul>
                          </div>
                        )}
                        
                        <div className="pending-card-actions">
                          <button
                            className="btn-analyze"
                            onClick={() => handleAnalyzeCocktail(cocktail)}
                            disabled={processingIds.has(cocktail.id)}
                          >
                            🔍 Analizar Cóctel
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Ratings por cóctel (tarjetas) */}
            <div className="ratings-section">
              <h2>⭐ Calificaciones</h2>
              {ratingsList.length === 0 ? (
                <div className="empty-state">
                  <p>No hay datos de calificaciones disponibles.</p>
                </div>
              ) : (
                <div className="ratings-grid">
                  {ratingsList
                    .slice()
                    .sort((a, b) => {
                      const aVal = Number(a.avgRating ?? a.avg_rating ?? a.avg ?? 0);
                      const bVal = Number(b.avgRating ?? b.avg_rating ?? b.avg ?? 0);
                      return bVal - aVal;
                    })
                    .map((r) => {
                      const id = r.cocktailId ?? r.id ?? r.cocktail?.id;
                      const name = r.name ?? r.cocktail?.name ?? 'Cóctel';
                      const votes = r.votesCount ?? r.votes ?? r.count ?? 0;
                      const avg = r.avgRating ?? r.avg_rating ?? r.avg ?? null;
                      const rawImage = r.imageUrl ?? r.image ?? r.cocktail?.imageUrl ?? r.cocktail?.image ?? '';
                      const resolveImage = (img) => {
                        if (!img) return '/assets/cocktail_mockup.png';
                        try {
                          const s = String(img);
                          if (s.startsWith('http://') || s.startsWith('https://')) return s;
                          if (s.startsWith('/')) return s;
                          if (s.startsWith('assets/') || s.startsWith('public/assets/')) return `/${s.replace(/^public\//, '')}`;
                          return `/assets/${s}`;
                        } catch (e) {
                          return '/assets/cocktail_mockup.png';
                        }
                      };

                      // Preferir la imagen del mapa de cócteles (igual que MainPage) si existe
                      const mapped = cocktailsMap[id];
                      const image = (mapped && mapped.imageUrl) ? mapped.imageUrl : resolveImage(rawImage);

                      return (
                        <div key={id} className="rating-card">
                          {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
                          <img
                            src={image}
                            alt={`Imagen de ${name}`}
                            className="rating-image"
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/cocktail_mockup.png'; }}
                          />
                          <div className="rating-card-content">
                            <h4 className="rating-name">{name}</h4>
                            <div className="rating-values">
                              <div className="rating-avg">{avg != null ? Number(avg).toFixed(2) : '-'}</div>
                              <div className="rating-count">{votes} votos</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal de análisis de cóctel */}
      {selectedCocktail && (
        <CocktailModal
          isOpen={showAnalysisModal}
          onClose={handleCloseModal}
          cocktail={selectedCocktail}
          isAdminReview={true}
          onApprove={() => handleApprove(selectedCocktail.id)}
          onReject={() => handleReject(selectedCocktail.id)}
          isProcessing={processingIds.has(selectedCocktail.id)}
        />
      )}
    </div>
  );
}

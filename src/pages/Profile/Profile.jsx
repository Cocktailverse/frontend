import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import CocktailModal from '../../components/CocktailModal/CocktailModal';
import AvatarSelector from '../../components/AvatarSelector/AvatarSelector';
import { useAutenticacion } from '../../context/AuthContext';
import { actualizarUsuarioEnServidor, subirFotoUsuario, eliminarUsuarioEnServidor, obtenerUsuarioEnServidor, obtenerListasUsuario, toggleLike } from '../../services/api';
import './Profile.css';

const DRINK_EMOJIS = [
  '🍸', '🍹', '🍺', '🍻', '🥂', '🍷', '🥃', '🍾', '🧉', '🍶', '🥤', '🧃',
];

// Función helper para convertir emoji a SVG data URI
const emojiToDataUri = (emoji, bgColor = '#FF7A18') => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><circle cx="100" cy="100" r="100" fill="${bgColor}"/><text x="100" y="100" font-size="120" text-anchor="middle" dominant-baseline="central">${emoji}</text></svg>`;
  
  // Convertir el SVG a base64 correctamente (soportando Unicode)
  // Primero codificar a UTF-8, luego a base64
  const base64 = btoa(unescape(encodeURIComponent(svg)));
  
  return `data:image/svg+xml;base64,${base64}`;
};

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

export default function Profile() {
  const { usuario, token, estaAutenticado, cerrarSesion, actualizarUsuario } = useAutenticacion();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: usuario?.name ?? '',
    email: usuario?.email ?? '',
    photoUrl: usuario?.photoUrl ?? '',
    bio: usuario?.bio ?? '',
    avatarBgColor: usuario?.avatarBgColor ?? '#FF7A18',
  });
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [listas, setListas] = useState([]);
  const [loadingListas, setLoadingListas] = useState(false);
  const [listError, setListError] = useState('');
  const [likingIds, setLikingIds] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCocktail, setSelectedCocktail] = useState(null);
  const [bioTimeout, setBioTimeout] = useState(null);
  const [nameTimeout, setNameTimeout] = useState(null);
  const [emailTimeout, setEmailTimeout] = useState(null);

  useEffect(() => {
    if (!estaAutenticado) {
      navigate('/', { replace: true });
    }
  }, [estaAutenticado, navigate]);

  useEffect(() => {
    // cuando el usuario cambia en el contexto, sincronizar el formulario
    const inicializarAvatar = async () => {
      // Verificar si el usuario tiene un emoji válido de la lista
      const tieneEmojiValido = usuario?.photoUrl && DRINK_EMOJIS.includes(usuario.photoUrl);
      
      // Verificar si tiene un SVG data URI (guardado previamente como emoji)
      const esSVGDataUri = usuario?.photoUrl && usuario.photoUrl.startsWith('data:image/svg+xml');
      
      // Verificar si tiene una foto personalizada (data URI o URL)
      const tieneFotoPersonalizada = usuario?.photoUrl && (
        (usuario.photoUrl.startsWith('data:image/') && !esSVGDataUri) ||
        (usuario.photoUrl.startsWith('http') && !usuario.photoUrl.includes('mockup_usuario'))
      );
      
      // Si no tiene emoji válido ni foto personalizada ni SVG, asignar emoji de cerveza
      if (!tieneEmojiValido && !tieneFotoPersonalizada && !esSVGDataUri && usuario?.id && token) {
        const emojiDefault = '🍺'; // Emoji de cerveza como predeterminado
        const colorDefault = '#FF7A18';
        const emojiDataUri = emojiToDataUri(emojiDefault, colorDefault);
        
        try {
          const patch = {
            name: usuario.name,
            email: usuario.email,
            photo: emojiDataUri,
          };
          
          if (usuario.bio) {
            patch.biography = usuario.bio;
          }
          
          await actualizarUsuarioEnServidor(usuario.id, patch, token);
          
          // Guardar el data URI completo en el contexto
          actualizarUsuario({
            ...usuario,
            photoUrl: emojiDataUri,
            avatarBgColor: colorDefault,
          });
          
          setForm({
            name: usuario?.name ?? '',
            email: usuario?.email ?? '',
            photoUrl: emojiDataUri,
            bio: usuario?.bio ?? '',
            avatarBgColor: colorDefault,
          });
        } catch (err) {
          console.error('Error asignando emoji predeterminado:', err);
          // Fallback al emoji local sin guardar
          setForm({
            name: usuario?.name ?? '',
            email: usuario?.email ?? '',
            photoUrl: emojiDefault,
            bio: usuario?.bio ?? '',
            avatarBgColor: colorDefault,
          });
        }
      } else {
        setForm({
          name: usuario?.name ?? '',
          email: usuario?.email ?? '',
          photoUrl: usuario?.photoUrl ?? '🍺',
          bio: usuario?.bio ?? '',
          avatarBgColor: usuario?.avatarBgColor ?? '#FF7A18',
        });
      }
    };
    
    inicializarAvatar();
    
    // si el usuario cambia, recargar listas de usuario
    (async () => {
      if (usuario && token) {
        try {
          setLoadingListas(true);
          setListError('');
          const resp = await obtenerListasUsuario(token);
          const fetched = resp?.lists ?? [];
          setListas(fetched);
        } catch (err) {
          setListas([]);
          setListError(err?.message || 'No fue posible obtener tus listas.');
        } finally {
          setLoadingListas(false);
        }
      }
    })();
  }, [usuario]);

  if (!estaAutenticado) return null;

  const handleChange = (key) => (event) => {
    const newValue = event.target.value;
    setForm((prev) => ({ ...prev, [key]: newValue }));

    // Guardar automáticamente después de 1.5 segundos sin cambios
    if (key === 'bio') {
      if (bioTimeout) clearTimeout(bioTimeout);
      const timeout = setTimeout(() => {
        guardarBiografia(newValue);
      }, 1500);
      setBioTimeout(timeout);
    } else if (key === 'name') {
      if (nameTimeout) clearTimeout(nameTimeout);
      const timeout = setTimeout(() => {
        guardarNombre(newValue);
      }, 1500);
      setNameTimeout(timeout);
    } else if (key === 'email') {
      if (emailTimeout) clearTimeout(emailTimeout);
      const timeout = setTimeout(() => {
        guardarEmail(newValue);
      }, 1500);
      setEmailTimeout(timeout);
    }
  };

  const guardarNombre = async (newName) => {
    if (!usuario?.id || !token) return;
    
    const trimmedName = newName?.trim();
    if (!trimmedName) {
      setError('El nombre no puede estar vacío.');
      return;
    }
    
    try {
      setError('');
      const patch = {
        name: trimmedName,
        email: usuario.email,
      };
      
      if (usuario.bio) {
        patch.biography = usuario.bio;
      }
      
      await actualizarUsuarioEnServidor(usuario.id, patch, token);
      
      actualizarUsuario({
        ...usuario,
        name: trimmedName,
      });
      
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.warn('Error al guardar nombre:', err);
      setError(err?.message || 'No fue posible guardar el nombre.');
    }
  };

  const guardarEmail = async (newEmail) => {
    if (!usuario?.id || !token) return;
    
    const trimmedEmail = newEmail?.trim();
    if (!trimmedEmail) {
      setError('El email no puede estar vacío.');
      return;
    }
    
    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('El email no es válido.');
      return;
    }
    
    try {
      setError('');
      const patch = {
        name: usuario.name,
        email: trimmedEmail,
      };
      
      if (usuario.bio) {
        patch.biography = usuario.bio;
      }
      
      await actualizarUsuarioEnServidor(usuario.id, patch, token);
      
      actualizarUsuario({
        ...usuario,
        email: trimmedEmail,
      });
      
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.warn('Error al guardar email:', err);
      setError(err?.message || 'No fue posible guardar el email.');
    }
  };

  const guardarBiografia = async (bioText) => {
    if (!usuario?.id || !token) return;
    
    try {
      const patch = {
        name: usuario.name,
        email: usuario.email,
        biography: bioText?.trim() || undefined,
      };
      
      await actualizarUsuarioEnServidor(usuario.id, patch, token);
      
      // Actualizar el contexto
      actualizarUsuario({
        ...usuario,
        bio: bioText?.trim() || '',
      });
      
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.warn('Error al guardar biografía:', err);
      setError(err?.message || 'No fue posible guardar la biografía.');
    }
  };

  const handleSelectEmoji = async (emoji) => {
    setForm((prev) => ({ ...prev, photoUrl: emoji }));
    setError('');
    
    // Guardar el emoji en el servidor
    if (usuario?.id && token) {
      try {
        setUploading(true);
        
        // Convertir emoji a data URI para que pase la validación del backend
        const emojiDataUri = emojiToDataUri(emoji, form.avatarBgColor);
        
        const patch = {
          name: usuario.name,
          email: usuario.email,
          photo: emojiDataUri,
        };
        
        // Solo incluir biography si existe
        if (usuario.bio) {
          patch.biography = usuario.bio;
        }
        
        console.log('📤 Enviando actualización de emoji:', { emoji, color: form.avatarBgColor });
        await actualizarUsuarioEnServidor(usuario.id, patch, token);
        
        // Guardar el SVG data URI completo en el contexto para que se muestre en comentarios
        actualizarUsuario({
          ...usuario,
          photoUrl: emojiDataUri,
          avatarBgColor: form.avatarBgColor,
        });
        
        // En el formulario local guardamos el emoji para facilitar la detección
        setForm((prev) => ({ ...prev, photoUrl: emoji }));
        
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        console.error('❌ Error al guardar emoji:', err);
        console.error('❌ Response:', err?.response?.data);
        setError(err?.message || 'No fue posible guardar el avatar.');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSelectBgColor = async (color) => {
    setForm((prev) => ({ ...prev, avatarBgColor: color }));
    
    // Obtener el emoji actual (puede ser emoji simple o extraído del SVG)
    const photoUrl = usuario?.photoUrl || form.photoUrl;
    const esEmojiSimple = photoUrl && DRINK_EMOJIS.includes(photoUrl);
    const esSVGEmoji = photoUrl && photoUrl.startsWith('data:image/svg+xml;base64,');
    const emojiActual = esEmojiSimple ? photoUrl : (esSVGEmoji ? extractEmojiFromSVG(photoUrl) : null);
    
    if (emojiActual && usuario?.id && token) {
      try {
        setUploading(true);
        
        // Regenerar el data URI con el nuevo color
        const emojiDataUri = emojiToDataUri(emojiActual, color);
        
        const patch = {
          name: usuario.name,
          email: usuario.email,
          photo: emojiDataUri,
        };
        
        if (usuario.bio) {
          patch.biography = usuario.bio;
        }
        
        console.log('📤 Enviando actualización de color:', { emoji: emojiActual, color });
        await actualizarUsuarioEnServidor(usuario.id, patch, token);
        
        // Actualizar inmediatamente en el contexto
        actualizarUsuario({
          ...usuario,
          photoUrl: emojiDataUri,
          avatarBgColor: color,
        });
        
        // Actualizar también el form local
        setForm((prev) => ({
          ...prev,
          photoUrl: emojiDataUri,
          avatarBgColor: color,
        }));
        
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        console.error('❌ Error al guardar color:', err);
        console.error('❌ Response:', err?.response?.data);
        setError(err?.message || 'No fue posible guardar el color.');
      } finally {
        setUploading(false);
      }
    } else {
      // Solo actualizar el color localmente si no hay emoji o usuario
      console.log('⚠️ No se puede guardar: sin emoji o usuario');
    }
  };

  const handleSelectFile = async (file) => {
    setError('');
    
    // Validar tamaño (5MB) y tipo
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen debe ser menor a 5 MB.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen válida.');
      return;
    }
    
    // Convertir a base64 para preview y guardado
    try {
      setUploading(true);
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Error leyendo archivo'));
        reader.readAsDataURL(file);
      });
      
      setForm((prev) => ({ ...prev, photoUrl: dataUrl }));
      
      // Guardar en el servidor
      if (usuario?.id && token) {
        const patch = {
          name: usuario.name,
          email: usuario.email,
          photo: dataUrl,
        };
        
        // Solo incluir biography si existe
        if (usuario.bio) {
          patch.biography = usuario.bio;
        }
        
        await actualizarUsuarioEnServidor(usuario.id, patch, token);
        
        actualizarUsuario({
          ...usuario,
          photoUrl: dataUrl,
        });
        
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.warn('Error al guardar foto:', err);
      setError(err?.message || 'No fue posible guardar la foto.');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await cerrarSesion();
    navigate('/', { replace: true });
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.');
    if (!confirmed) return;

    try {
      setUploading(true);
      if (usuario?.id && token) {
        await eliminarUsuarioEnServidor(usuario.id, token);
      }
    } catch (err) {
      console.warn('Error eliminando usuario:', err);
      setError(err?.message || 'No fue posible eliminar la cuenta.');
      setUploading(false);
      return;
    }

    // cerrar sesión y redirigir al landing
    await cerrarSesion();
    navigate('/', { replace: true });
  };

  const refetchListas = async () => {
    if (!token) return;
    try {
      setLoadingListas(true);
      setListError('');
      const resp = await obtenerListasUsuario(token);
      setListas(resp?.lists ?? []);
    } catch (err) {
      setListError(err?.message || 'No fue posible obtener tus listas.');
    } finally {
      setLoadingListas(false);
    }
  };

  const handleToggleFromList = async (cocktailId) => {
    if (!token) {
      setListError('Debes iniciar sesión para esta acción.');
      return;
    }
    setLikingIds((prev) => [...prev, cocktailId]);
    try {
      await toggleLike(cocktailId, token);
      await refetchListas();
    } catch (err) {
      setListError(err?.message || 'No fue posible actualizar favorito.');
    } finally {
      setLikingIds((prev) => prev.filter((id) => id !== cocktailId));
    }
  };

  const abrirModal = (cocktail) => {
    setSelectedCocktail(cocktail);
    setIsModalOpen(true);
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setSelectedCocktail(null);
  };

  return (
    <div className="profile-page">
      <Navbar />

      <main className="profile-content">
        <h1 className="profile-welcome">
          Bienvenido,
          <span className="profile-welcome-name"> {usuario?.name ?? 'usuario'}</span>
          {usuario?.role ? (
            <span className="profile-badge-inline">{String(usuario.role).toUpperCase()}</span>
          ) : null}
        </h1>

        <div className="profile-card profile-card--highlight" style={{ position: 'relative' }}>
          <div className="profile-ribbon">Mi espacio</div>
          <div className="avatar-large">
            <AvatarSelector
              currentPhotoUrl={form.photoUrl}
              currentBgColor={form.avatarBgColor}
              onSelectEmoji={handleSelectEmoji}
              onSelectFile={handleSelectFile}
              onSelectBgColor={handleSelectBgColor}
            />
          </div>

          <div className="profile-main">
            <div className="profile-bio-card">
              <h3>Biografía</h3>
              <textarea 
                className="bio-textarea-direct"
                value={form.bio} 
                onChange={handleChange('bio')} 
                rows={4}
                placeholder="Comparte algo sobre ti..."
              />
            </div>

            <div className="profile-fields">
              <div className="form-row">
                <label>
                  Nombre
                  <input type="text" value={form.name} onChange={handleChange('name')} placeholder="Tu nombre" />
                </label>

                <label>
                  Email
                  <input type="email" value={form.email} onChange={handleChange('email')} placeholder="tu@email.com" />
                </label>
              </div>

              {error ? <div className="error">{error}</div> : null}
              {saved ? <p className="save-notice">✅ Guardado automáticamente</p> : null}
              
              <div className="profile-actions">
                <button type="button" className="feature-button" onClick={handleLogout}>Cerrar sesión</button>
              </div>
            </div>

            <div className="danger-panel">
              <p>Eliminar tu cuenta borrará también tus cócteles y tus datos. Esta acción es irreversible.</p>
              <button className="danger-button" type="button" onClick={handleDeleteAccount} disabled={uploading}>Eliminar cuenta</button>
            </div>
          </div>
        </div>
        {/* Sección: listas del usuario (Favoritos, etc.) */}
        <section style={{ marginTop: 24 }}>
          <h2>Mis listas</h2>
          {loadingListas ? (
            <p>Cargando listas…</p>
          ) : listError ? (
            <p className="error">{listError}</p>
          ) : listas.length === 0 ? (
            <p>No tienes listas todavía.</p>
          ) : (
            listas.map((lista) => (
              <div key={lista.id} style={{ marginBottom: 20 }} className="profile-list-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>{lista.name}</h3>
                  <span style={{ fontSize: 14, color: '#555' }}>Cantidad: {lista.cantidad ?? (Array.isArray(lista.cocktails) ? lista.cocktails.length : 0)}</span>
                </div>

                {Array.isArray(lista.cocktails) && lista.cocktails.length > 0 ? (
                  <div className="cocktail-grid">
                    {lista.cocktails.map((cocktail) => {
                      const likedBy = Array.isArray(cocktail.likedBy) ? cocktail.likedBy.map(String) : [];
                      const isFavorited = usuario && likedBy.includes(String(usuario.id));
                      return (
                        <article key={cocktail.id} className="cocktail-card">
                          <img
                            src={cocktail.imageUrl || '/assets/cocktail_mockup.png'}
                            alt={cocktail.name}
                            className="card-image"
                            onError={(event) => {
                              if (event.currentTarget.dataset.fallbackApplied) {return;}
                              event.currentTarget.dataset.fallbackApplied = 'true';
                              event.currentTarget.src = '/assets/cocktail_mockup.png';
                            }}
                          />

                          <div className="card-content">
                            <h3 className="card-title">{cocktail.name}</h3>
                            <p className="card-description">{cocktail.description || 'Sin descripción.'}</p>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <button type="button" className="card-button" onClick={() => abrirModal(cocktail)}>Ver receta</button>
                              <button
                                type="button"
                                className="feature-button"
                                onClick={() => handleToggleFromList(cocktail.id)}
                                disabled={likingIds.includes(cocktail.id)}
                                style={{ backgroundColor: 'transparent', border: 'none', padding: '6px 8px', fontSize: 18, cursor: 'pointer', color: isFavorited ? '#E74C3C' : '#666' }}
                              >
                                {likingIds.includes(cocktail.id) ? '…' : (isFavorited ? '♥' : '♡')}
                                <span style={{ marginLeft: 6, fontSize: 13, color: '#333' }}>{cocktail.likes ?? ''}</span>
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ marginTop: 8, color: '#666' }}>No hay cócteles en esta lista.</p>
                )}
              </div>
            ))
          )}
        </section>
    <CocktailModal isOpen={isModalOpen} onClose={cerrarModal} cocktail={selectedCocktail} />
      </main>
    </div>
  );
}

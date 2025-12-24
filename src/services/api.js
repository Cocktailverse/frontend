const DEFAULT_BASE_URL = 'http://localhost:3000/api';

function obtenerUrlBase() {
  const configured = import.meta.env.VITE_API_BASE_URL;
  const base = configured && configured.trim().length > 0 ? configured.trim() : DEFAULT_BASE_URL;
  return base.replace(/\/+$/, '');
}

function construirUrl(path) {
  const baseUrl = obtenerUrlBase();
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${suffix}`;
}

async function realizarSolicitud(path, { method = 'GET', body, token, headers } = {}) {
  const url = construirUrl(path);

  const mergedHeaders = {
    Accept: 'application/json',
    ...headers,
  };

  let requestBody;
  if (body !== undefined) {
    requestBody = JSON.stringify(body);
    mergedHeaders['Content-Type'] = 'application/json';
  }

  if (token) {
    mergedHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers: mergedHeaders,
    body: requestBody,
  });

  const contentType = response.headers.get('Content-Type') ?? '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json().catch(() => null) : await response.text();

  if (!response.ok) {
    const message =
      (isJson && payload && typeof payload === 'object' && payload.message) ||
      (typeof payload === 'string' && payload) ||
      `Request failed with status ${response.status}`;

    const error = new Error(message);
    error.status = response.status;
    if (payload) {
      error.payload = payload;
    }
    throw error;
  }

  return payload;
}

export async function obtenerCocteles() {
  const data = await realizarSolicitud('/cocktails');
  if (Array.isArray(data)) {
    return data;
  }
  if (data && Array.isArray(data.cocktails)) {
    return data.cocktails;
  }
  return [];
}

export function iniciarSesion(credenciales) {
  return realizarSolicitud('/auth/login', {
    method: 'POST',
    body: credenciales,
  });
}

export function registrarUsuario(payload) {
  return realizarSolicitud('/auth/register', {
    method: 'POST',
    body: payload,
  });
}

export function cerrarSesion(token) {
  return realizarSolicitud('/auth/logout', {
    method: 'POST',
    token,
  });
}

export function crearCoctel(payload, token) {
  return realizarSolicitud('/cocktails', {
    method: 'POST',
    body: payload,
    token,
  });
}

export function obtenerCoctelPorId(cocktailId) {
  return realizarSolicitud(`/cocktails/${cocktailId}`);
}

export function actualizarCoctel(cocktailId, payload, token) {
  return realizarSolicitud(`/cocktails/${cocktailId}`, {
    method: 'PATCH',
    body: payload,
    token,
  });
}

export function consultarSalud() {
  return realizarSolicitud('/health');
}

export function actualizarUsuarioEnServidor(userId, patch, token) {
  return realizarSolicitud(`/users/${userId}`, {
    method: 'PATCH',
    body: patch,
    token,
  });
}

export function obtenerUsuarioEnServidor(userId) {
  return realizarSolicitud(`/users/${userId}`);
}

export function eliminarUsuarioEnServidor(userId, token) {
  return realizarSolicitud(`/users/${userId}`, {
    method: 'DELETE',
    token,
  });
}

export async function subirFotoUsuario(userId, file, token) {
  // Se usa fetch directamente porque es multipart/form-data
  const url = construirUrl(`/users/${userId}/photo`);
  const formData = new FormData();
  formData.append('photo', file);

  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => null);
    const err = new Error(text || `Upload failed with status ${response.status}`);
    err.status = response.status;
    throw err;
  }

  const contentType = response.headers.get('Content-Type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return null;
}

// Toggle like/unlike for a cocktail. Devuelve el payload del endpoint, por ejemplo { liked: true/false }
export function toggleLike(cocktailId, token) {
  if (!cocktailId) throw new Error('cocktailId required');
  return realizarSolicitud(`/cocktails/${cocktailId}/toggle-like`, {
    method: 'POST',
    token,
  });
}

// ======= VOTOS (ratings) =======

// Obtener estadísticas públicas de un cóctel: { cocktailId, name, votesCount, avgRating }
export function obtenerEstadisticasVoto(cocktailId) {
  if (!cocktailId) throw new Error('cocktailId required');
  // endpoint público
  return realizarSolicitud(`/votes/cocktail/${cocktailId}/stats`);
}

// Obtener el voto del usuario autenticado para un cóctel
export function obtenerVoto(cocktailId, token) {
  if (!cocktailId) throw new Error('cocktailId required');
  return realizarSolicitud(`/votes/${cocktailId}`, {
    method: 'GET',
    token,
  });
}

// Endpoint admin: obtener calificaciones para todos los cocteles
export function obtenerRatingsAdmin() {
  const token = obtenerTokenLocal();
  return realizarSolicitud('/admin/ratings', {
    method: 'GET',
    token,
  });
}

// Obtener las listas del usuario autenticado
export function obtenerListasUsuario(token) {
  return realizarSolicitud('/users/me/lists', {
    method: 'GET',
    token,
  });
}

// Comentarios
export async function obtenerComentarios(cocktailId) {
  if (!cocktailId) throw new Error('cocktailId required');
  // Algunos backends no exponen GET /cocktails/:id/comments.
  // Intentar primero ese endpoint; si responde 404, pedir /cocktails/:id y extraer comentarios.
  try {
  const cacheBust = `cacheBust=${Date.now()}`;
  const payload = await realizarSolicitud(`/cocktails/${cocktailId}/comments?${cacheBust}`);
    // payload puede ser un array o un objeto { comments: [...] }
    if (Array.isArray(payload)) return payload;
    return payload?.comments ?? payload?.comentarios ?? [];
  } catch (err) {
    if (err && Number(err.status) === 404) {
      // intentar obtener el coctel y extraer comentarios del mismo
      try {
  const cacheBust2 = `cacheBust=${Date.now()}`;
  const detail = await realizarSolicitud(`/cocktails/${cocktailId}?${cacheBust2}`);
        // formas posibles: { cocktail: { comments: [...] } } o { comments: [...] } o { cocktail: {...} }
        const maybe = detail?.cocktail ?? detail;
        if (Array.isArray(maybe)) return maybe;
        return maybe?.comments ?? maybe?.comentarios ?? [];
      } catch (err2) {
        // devolver lista vacía en caso de fallo al obtener detalles
        return [];
      }
    }
    // re-lanzar errores distintos a 404 para que el llamador pueda manejarlos
    throw err;
  }
}

export function crearComentario(cocktailId, texto, token, calificacion = null) {
  if (!cocktailId) throw new Error('cocktailId required');
  if (typeof texto !== 'string') throw new Error('texto required');
  const body = { descripcion: texto };
  if (typeof calificacion === 'number') {
    body.calificacion = calificacion;
  }
  return realizarSolicitud(`/cocktails/${cocktailId}/comments`, {
    method: 'POST',
    body,
    token,
  });
}

export function eliminarComentario(commentId, token) {
  if (!commentId) throw new Error('commentId required');
  return realizarSolicitud(`/comments/${commentId}`, {
    method: 'DELETE',
    token,
  });
}

// ========== ENDPOINTS DE ADMINISTRACIÓN ==========

/**
 * Obtiene estadísticas generales del sistema (solo admin)
 */
export function getAdminStats() {
  const token = obtenerTokenLocal();
  return realizarSolicitud('/admin/stats', {
    method: 'GET',
    token,
  });
}

/**
 * Obtiene todos los cócteles pendientes de aprobación (solo admin)
 */
export function getPendingCocktails() {
  const token = obtenerTokenLocal();
  return realizarSolicitud('/admin/pending', {
    method: 'GET',
    token,
  });
}

/**
 * Aprueba un cóctel pendiente (solo admin)
 */
export function approveCocktail(cocktailId) {
  const token = obtenerTokenLocal();
  if (!cocktailId) throw new Error('cocktailId required');
  return realizarSolicitud(`/admin/cocktails/${cocktailId}/approve`, {
    method: 'POST',
    token,
  });
}

/**
 * Rechaza un cóctel pendiente (solo admin)
 */
export function rejectCocktail(cocktailId, reason) {
  const token = obtenerTokenLocal();
  if (!cocktailId) throw new Error('cocktailId required');
  return realizarSolicitud(`/admin/cocktails/${cocktailId}/reject`, {
    method: 'POST',
    body: { reason },
    token,
  });
}

// ========== ENDPOINTS DE NOTIFICACIONES ==========

/**
 * Obtiene las notificaciones del usuario autenticado
 */
export function getNotifications(unreadOnly = false) {
  const token = obtenerTokenLocal();
  const query = unreadOnly ? '?unreadOnly=true' : '';
  return realizarSolicitud(`/notifications${query}`, {
    method: 'GET',
    token,
  });
}

/**
 * Marca una notificación como leída
 */
export function markNotificationAsRead(notificationId) {
  const token = obtenerTokenLocal();
  if (!notificationId) throw new Error('notificationId required');
  return realizarSolicitud(`/notifications/${notificationId}/read`, {
    method: 'PATCH',
    token,
  });
}

/**
 * Marca todas las notificaciones como leídas
 */
export function markAllNotificationsAsRead() {
  const token = obtenerTokenLocal();
  return realizarSolicitud('/notifications/read-all', {
    method: 'PATCH',
    token,
  });
}

/**
 * Elimina una notificación específica
 */
export function deleteNotification(notificationId) {
  const token = obtenerTokenLocal();
  if (!notificationId) throw new Error('notificationId required');
  return realizarSolicitud(`/notifications/${notificationId}`, {
    method: 'DELETE',
    token,
  });
}

/**
 * Elimina todas las notificaciones del usuario
 */
export function deleteAllNotifications() {
  const token = obtenerTokenLocal();
  return realizarSolicitud('/notifications', {
    method: 'DELETE',
    token,
  });
}

/**
 * Obtiene el conteo de notificaciones no leídas
 */
export function getUnreadNotificationsCount() {
  const token = obtenerTokenLocal();
  return realizarSolicitud('/notifications/unread-count', {
    method: 'GET',
    token,
  });
}

// Helper para obtener el token del localStorage
function obtenerTokenLocal() {
  try {
    const rawValue = window.localStorage.getItem('cocktailverse:token');
    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
    return null;
  }
}

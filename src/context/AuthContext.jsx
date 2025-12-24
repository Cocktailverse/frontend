import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '../services/api';

const ContextoAutenticacion = createContext(null);

function leerAlmacenamientoLocal(key) {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch (error) {
     
    console.warn(`Failed to parse localStorage key "${key}"`, error);
    return null;
  }
}

function escribirAlmacenamientoLocal(key, value) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    if (value === null || value === undefined) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (error) {
     
    console.warn(`Failed to persist localStorage key "${key}"`, error);
  }
}

export function ProveedorAutenticacion({ children }) {
  const [usuario, setUsuario] = useState(() => leerAlmacenamientoLocal('cocktailverse:user'));
  const [token, setToken] = useState(() => leerAlmacenamientoLocal('cocktailverse:token'));
  const estaAutenticado = Boolean(token);

  useEffect(() => {
    escribirAlmacenamientoLocal('cocktailverse:user', usuario);
  }, [usuario]);

  useEffect(() => {
    escribirAlmacenamientoLocal('cocktailverse:token', token);
  }, [token]);

  const iniciarSesion = async (credenciales) => {
    const response = await api.iniciarSesion(credenciales);
    if (!response?.user || !response?.token) {
      throw new Error('Respuesta inválida del servidor al iniciar sesión.');
    }
    // guardar token primero
    setToken(response.token);
    // intentar obtener versión más completa del usuario desde el servidor
    try {
      const refreshed = await api.obtenerUsuarioEnServidor(response.user.id).catch(() => null);
      const serverUser = (refreshed && (refreshed.user ?? refreshed)) || response.user;
      // Normalizar campos para el frontend
      const normalized = {
        ...serverUser,
        photoUrl: serverUser.photo ?? serverUser.photoUrl ?? '🍺',
        bio: serverUser.biography ?? serverUser.bio,
        avatarBgColor: serverUser.avatarBgColor ?? '#FF7A18', // Color naranja por defecto
      };
      setUsuario(normalized);
      return normalized;
    } catch (err) {
      const normalized = {
        ...response.user,
        photoUrl: response.user.photo ?? response.user.photoUrl ?? '🍺',
        bio: response.user.biography ?? response.user.bio,
        avatarBgColor: response.user.avatarBgColor ?? '#FF7A18', // Color naranja por defecto
      };
      setUsuario(normalized);
      return normalized;
    }
  };

  const actualizarUsuario = (patch) => {
    // permite pasar un objeto parcial para actualizar campos del usuario
    setUsuario((prev) => {
      if (!prev) return patch || null;
      if (!patch) return prev;
      return { ...prev, ...patch };
    });
  };

  const registrarUsuario = async (payload) => {
    const response = await api.registrarUsuario(payload);
    if (!response?.user || !response?.token) {
      throw new Error('Respuesta inválida del servidor al registrar la cuenta.');
    }
    setToken(response.token);
    try {
      const refreshed = await api.obtenerUsuarioEnServidor(response.user.id).catch(() => null);
      const serverUser = (refreshed && (refreshed.user ?? refreshed)) || response.user;
      const normalized = {
        ...serverUser,
        photoUrl: serverUser.photo ?? serverUser.photoUrl ?? '🍺',
        bio: serverUser.biography ?? serverUser.bio,
        avatarBgColor: serverUser.avatarBgColor ?? '#FF7A18', // Color naranja por defecto
      };
      setUsuario(normalized);
      return normalized;
    } catch (err) {
      const normalized = {
        ...response.user,
        photoUrl: response.user.photo ?? response.user.photoUrl ?? '🍺',
        bio: response.user.biography ?? response.user.bio,
        avatarBgColor: response.user.avatarBgColor ?? '#FF7A18', // Color naranja por defecto
      };
      setUsuario(normalized);
      return normalized;
    }
  };

  const cerrarSesion = async () => {
    if (token) {
      try {
        await api.cerrarSesion(token);
      } catch (error) {
         
        console.warn('Error al cerrar sesión en el backend', error);
      }
    }
    setUsuario(null);
    setToken(null);
  };

  const value = useMemo(
    () => ({
      usuario,
      token,
      estaAutenticado,
      iniciarSesion,
      registrarUsuario,
      cerrarSesion,
      actualizarUsuario,
    }),
    [usuario, token, estaAutenticado],
  );

  return <ContextoAutenticacion.Provider value={value}>{children}</ContextoAutenticacion.Provider>;
}

export function useAutenticacion() {
  const context = useContext(ContextoAutenticacion);
  if (!context) {
    throw new Error('useAutenticacion debe utilizarse dentro de un ProveedorAutenticacion.');
  }
  return context;
}

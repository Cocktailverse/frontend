import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';
import { useAutenticacion } from '../../context/AuthContext';
import NotificationPanel from '../NotificationPanel/NotificationPanel';
import DarkMode from '../DarkMode/DarkMode';

const DRINK_EMOJIS = [
  '🍸', '🍹', '🍺', '🍻', '🥂', '🍷', '🥃', '🍾', '🧉', '🍶', '🥤', '🧃',
];

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { estaAutenticado, usuario, cerrarSesion } = useAutenticacion();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const opcionesNavegacion = estaAutenticado
    ? [
      { label: 'Explorar', to: '/main' },
      { label: 'About Us', to: '/about' },
      { label: 'Instrucciones', to: '/docs' },
      ...(usuario?.role === 'admin' ? [{ label: '👑 Admin', to: '/admin' }] : []),
    ]
    : [
      { label: 'Inicio', to: '/' },
      { label: 'Explorar', to: '/main' },
      { label: 'About Us', to: '/about' },
      { label: 'Instrucciones', to: '/docs' },
    ];

  const manejarCerrarSesion = async () => {
    await cerrarSesion();
    navigate('/');
  };

  useEffect(() => {
    if (estaAutenticado && location.pathname === '/') {
      navigate('/main', { replace: true });
    }
  }, [estaAutenticado, location.pathname, navigate]);

  // Cerrar menú al cambiar de ruta
  useEffect(() => {
    setMenuAbierto(false);
  }, [location.pathname]);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <button
          type="button"
          className="navbar-logo"
          onClick={() => navigate('/')}
          aria-label="Ir al inicio"
        >
          <div className="logo-icon-wrapper">
            <span className="logo-icon" role="img" aria-hidden>
              🍸
            </span>
          </div>
          <span className="logo-text">CocktailVerse</span>
        </button>

        {/* Navbar desktop (oculto en móvil) */}
        <div className="navbar-center navbar-desktop">
          <ul className="navbar-links">
            {opcionesNavegacion.map(({ label, to }) => (
              <li key={to}>
                <button
                  type="button"
                  className={`nav-link-button ${location.pathname === to ? 'active' : ''}`}
                  onClick={() => navigate(to)}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="navbar-right">
          <DarkMode />
          {estaAutenticado && <NotificationPanel />}
          
          <div className="navbar-auth navbar-desktop">
            {estaAutenticado ? (
              <>
                <button
                  type="button"
                  className="navbar-profile-avatar"
                  onClick={() => navigate('/perfil')}
                  aria-label="Ir a mi perfil"
                  style={{ 
                    backgroundColor: (usuario?.photoUrl && DRINK_EMOJIS.includes(usuario.photoUrl)) || !usuario?.photoUrl || usuario?.photoUrl === '🍺'
                      ? (usuario?.avatarBgColor || '#FF7A18')
                      : 'transparent'
                  }}
                >
                  {(usuario?.photoUrl && DRINK_EMOJIS.includes(usuario.photoUrl)) || !usuario?.photoUrl || usuario?.photoUrl === '🍺' ? (
                    <div className="navbar-avatar-emoji">{usuario?.photoUrl || '🍺'}</div>
                  ) : (
                    <img 
                      src={usuario?.photoUrl || '/assets/mockup_usuario.png'} 
                      alt="Perfil" 
                      onError={(e) => { 
                        e.currentTarget.src = '/assets/mockup_usuario.png';
                      }} 
                    />
                  )}
                </button>
                <button
                  type="button"
                  className="navbar-button navbar-logout-button"
                  onClick={manejarCerrarSesion}
                >
                  <span className="button-icon">👋</span>
                  <span className="button-text">Salir</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                className="navbar-button navbar-login-button"
                onClick={() => navigate('/')}
              >
                <span className="button-icon">🔐</span>
                <span className="button-text">Iniciar sesión</span>
              </button>
            )}
          </div>

          {/* Botón hamburguesa para móvil */}
          <button
            type="button"
            className="navbar-hamburger"
            onClick={() => setMenuAbierto(!menuAbierto)}
            aria-label="Menú"
          >
            <span className={`hamburger-line ${menuAbierto ? 'open' : ''}`}></span>
            <span className={`hamburger-line ${menuAbierto ? 'open' : ''}`}></span>
            <span className={`hamburger-line ${menuAbierto ? 'open' : ''}`}></span>
          </button>
        </div>
      </div>

      {/* Overlay oscuro para móvil */}
      {menuAbierto && (
        <div 
          className="navbar-overlay"
          onClick={() => setMenuAbierto(false)}
          aria-hidden="true"
        />
      )}

      {/* Menú móvil lateral */}
      <div className={`navbar-mobile-menu ${menuAbierto ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <h2 className="mobile-menu-title">Menú</h2>
          <button
            type="button"
            className="mobile-menu-close"
            onClick={() => setMenuAbierto(false)}
            aria-label="Cerrar menú"
          >
            ✕
          </button>
        </div>

        {estaAutenticado && (
          <div className="mobile-menu-profile">
            <button
              type="button"
              className="mobile-profile-avatar"
              onClick={() => {
                navigate('/perfil');
                setMenuAbierto(false);
              }}
              style={{ 
                backgroundColor: (usuario?.photoUrl && DRINK_EMOJIS.includes(usuario.photoUrl)) || !usuario?.photoUrl || usuario?.photoUrl === '🍺'
                  ? (usuario?.avatarBgColor || '#FF7A18')
                  : 'transparent'
              }}
            >
              {(usuario?.photoUrl && DRINK_EMOJIS.includes(usuario.photoUrl)) || !usuario?.photoUrl || usuario?.photoUrl === '🍺' ? (
                <div className="mobile-avatar-emoji">{usuario?.photoUrl || '🍺'}</div>
              ) : (
                <img 
                  src={usuario?.photoUrl || '/assets/mockup_usuario.png'} 
                  alt="Perfil" 
                  onError={(e) => { 
                    e.currentTarget.src = '/assets/mockup_usuario.png';
                  }} 
                />
              )}
            </button>
            <div className="mobile-profile-info">
              <p className="mobile-profile-name">{usuario?.username || 'Usuario'}</p>
              <p className="mobile-profile-email">{usuario?.email || ''}</p>
            </div>
          </div>
        )}

        <nav className="mobile-menu-nav">
          <ul className="mobile-menu-links">
            {opcionesNavegacion.map(({ label, to }) => (
              <li key={to}>
                <button
                  type="button"
                  className={`mobile-nav-link ${location.pathname === to ? 'active' : ''}`}
                  onClick={() => {
                    navigate(to);
                    setMenuAbierto(false);
                  }}
                >
                  <span className="mobile-nav-icon">
                    {label === 'Explorar' && '🔍'}
                    {label === 'About Us' && '👥'}
                    {label === 'Instrucciones' && '📖'}
                    {label === 'Inicio' && '🏠'}
                    {label === '👑 Admin' && '👑'}
                  </span>
                  <span>{label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {estaAutenticado && (
          <div className="mobile-menu-footer">
            <button
              type="button"
              className="mobile-logout-button"
              onClick={() => {
                manejarCerrarSesion();
                setMenuAbierto(false);
              }}
            >
              <span className="mobile-nav-icon">👋</span>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;

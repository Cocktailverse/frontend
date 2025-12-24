import { useState } from 'react';
import './landing.css';
import Navbar from '../../components/Navbar/Navbar';
import Piano from '../../components/Piano/Piano';

import { useNavigate } from 'react-router-dom';
import { useAutenticacion } from '../../context/AuthContext';

export default function Landing() {
  const navigate = useNavigate();
  const { iniciarSesion, registrarUsuario, estaAutenticado, usuario } = useAutenticacion();
  
  // Estado del formulario
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [formState, setFormState] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (isRegisterMode) {
        // Validar que las contraseñas coincidan
        if (formState.password !== formState.confirmPassword) {
          setErrorMessage('Las contraseñas no coinciden.');
          setIsSubmitting(false);
          return;
        }

        // Registro - no enviar photo ni biography (serán null en el backend)
        const payload = {
          email: formState.email.trim(),
          password: formState.password,
          name: formState.name.trim(),
        };
        console.log('📤 Enviando datos de registro:', payload);
        await registrarUsuario(payload);
        setSuccessMessage('¡Cuenta creada exitosamente!');
        setTimeout(() => navigate('/main'), 1500);
      } else {
        // Login
        await iniciarSesion({
          email: formState.email.trim(),
          password: formState.password,
        });
        setSuccessMessage('Sesión iniciada correctamente.');
        setTimeout(() => navigate('/main'), 1000);
      }
    } catch (error) {
      setErrorMessage(error.message || 'No fue posible completar la operación. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setErrorMessage('');
    setSuccessMessage('');
    // Mantener email y password al cambiar de modo
    setFormState((prev) => ({
      email: prev.email,
      password: prev.password,
      confirmPassword: '',
      name: '',
    }));
  };

  const handleFillDemoCredentials = () => {
    setFormState({
      email: 'demo@cocktailverse.com',
      password: 'Demo123!',
    });
    setSuccessMessage('Credenciales demo cargadas. Haz clic en “Entrar” para continuar.');
  };

  return (
    <div className="landing-page">
      <Navbar />

      <main className="hero">
        <div className="hero-content">
          {/* 1. Texto */}
          <div className="hero-text">
            <span className="gradient-accent">Experiencias líquidas en tiempo real</span>
            <h1>Crea, comparte y mejora recetas de cócteles con una comunidad apasionada.</h1>
            <p>
              CocktailVerse es un hub social para mixólogos jóvenes. Descubre recetas vibrantes,
              aporta tus propias creaciones y coordina degustaciones en minutos.
            </p>
          </div>

          {/* 2. Foto */}
          <div className="hero-image">
            <img src="/assets/cocktail_landing.webp" alt="Cócteles elegantes en una barra" />
          </div>

          {/* 3. Iniciar sesión */}
          <form className="login-form glass-panel" onSubmit={handleSubmit}>
            <h3>{isRegisterMode ? 'Crear cuenta' : 'Inicia sesión'}</h3>
            {estaAutenticado ? (
              <p style={{ marginBottom: 12 }}>
                Ya has iniciado sesión como <strong>{usuario?.name ?? usuario?.email}</strong>.
              </p>
            ) : null}
            
            {/* Campos adicionales para registro - con animación slide */}
            <div className={`register-fields ${isRegisterMode ? 'active' : ''}`}>
              <input
                type="text"
                name="name"
                placeholder="Nombre completo"
                value={formState.name}
                onChange={handleInputChange}
                required={isRegisterMode}
                disabled={isSubmitting}
              />
            </div>

            {/* Email */}
            <input
              type="email"
              name="email"
              placeholder="Correo electrónico"
              value={formState.email}
              onChange={handleInputChange}
              required
              autoComplete="email"
              disabled={isSubmitting}
            />
            
            {/* Campo de contraseña con toggle de visibilidad */}
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Contraseña"
                value={formState.password}
                onChange={handleInputChange}
                required
                autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
                disabled={isSubmitting}
              />
              <span
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? '🙈' : '🙉'}
              </span>
            </div>

            {/* Campo de confirmación de contraseña - solo en registro */}
            <div className={`register-fields ${isRegisterMode ? 'active' : ''}`}>
              <div className="password-field">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Confirmar contraseña"
                  value={formState.confirmPassword}
                  onChange={handleInputChange}
                  required={isRegisterMode}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
                <span
                  className="toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => e.key === 'Enter' && setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showConfirmPassword ? '🙈' : '🙉'}
                </span>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Procesando…' : (isRegisterMode ? 'Crear cuenta' : 'Entrar')}
            </button>

            <div className="form-toggle">
              <button 
                type="button" 
                onClick={toggleMode} 
                disabled={isSubmitting}
                className="toggle-btn"
              >
                {isRegisterMode ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
              </button>
            </div>

            {!isRegisterMode && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button type="button" onClick={handleFillDemoCredentials} disabled={isSubmitting}>
                  Usar cuenta demo
                </button>
                <small style={{ color: 'var(--muted-foreground, #5A4A42)' }}>
                  Demo: demo@cocktailverse.com · Demo123!
                </small>
              </div>
            )}
            
            {errorMessage ? (
              <p style={{ marginTop: 12, color: '#E74C3C' }}>{errorMessage}</p>
            ) : null}
            {successMessage ? (
              <p style={{ marginTop: 12, color: '#2ECC71' }}>{successMessage}</p>
            ) : null}
          </form>
        </div>
      </main>
      <Piano />


      <footer>
        <p>&copy; 2025 CocktailVerse. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}

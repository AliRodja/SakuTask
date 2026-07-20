import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Wallet, ListTodo } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.friendlyMessage || 'Login gagal.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Animated background */}
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
        <div className="auth-grid" />
      </div>

      <div className="auth-container">
        {/* Left branding panel — desktop only */}
        <div className="auth-brand-panel">
          <div className="auth-brand-content">
            <div className="auth-brand-logo">
              <div className="auth-logo-icon">
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <h1 className="auth-logo-text">SakuTask</h1>
            </div>
            <p className="auth-brand-tagline">
              Kelola keuangan & tugasmu dalam satu aplikasi cerdas.
            </p>
            <div className="auth-brand-features">
              <div className="auth-feature-item">
                <div className="auth-feature-dot" />
                <span>Pencatatan keuangan harian</span>
              </div>
              <div className="auth-feature-item">
                <div className="auth-feature-dot" />
                <span>To-do list interaktif</span>
              </div>
              <div className="auth-feature-item">
                <div className="auth-feature-dot" />
                <span>Pengingat otomatis via WhatsApp</span>
              </div>
            </div>
          </div>
          <p className="auth-brand-footer">
            © 2026 SakuTask — Ali Imran Rodja
          </p>
        </div>

        {/* Form card */}
        <div className="auth-card">
          <div className="auth-card-inner">
            {/* Mobile logo */}
            <div className="auth-mobile-logo">
              <div className="auth-logo-icon-sm">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <span className="auth-mobile-logo-text">SakuTask</span>
            </div>

            <div className="auth-card-header">
              <h2 className="auth-card-title">Selamat Datang!</h2>
              <p className="auth-card-subtitle">
                Masuk ke akun SakuTask kamu
              </p>
            </div>

            {error && (
              <div className="auth-error" role="alert">
                <div className="auth-error-dot" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              {/* Email */}
              <div className="auth-field">
                <div className="auth-field-icon">
                  <Mail className="w-4.5 h-4.5" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=" "
                  className="auth-input"
                  required
                  autoComplete="email"
                />
                <label htmlFor="login-email" className="auth-label">
                  Email
                </label>
              </div>

              {/* Password */}
              <div className="auth-field">
                <div className="auth-field-icon">
                  <Lock className="w-4.5 h-4.5" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder=" "
                  className="auth-input auth-input-password"
                  required
                  autoComplete="current-password"
                />
                <label htmlFor="login-password" className="auth-label">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-password-toggle"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4.5 h-4.5" />
                  ) : (
                    <Eye className="w-4.5 h-4.5" />
                  )}
                </button>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="auth-submit"
              >
                <span>{submitting ? 'Memproses...' : 'Masuk'}</span>
                {!submitting && <ArrowRight className="w-4.5 h-4.5" />}
                {submitting && <div className="auth-spinner" />}
              </button>
            </form>

            <div className="auth-divider">
              <div className="auth-divider-line" />
              <span className="auth-divider-text">atau</span>
              <div className="auth-divider-line" />
            </div>

            <p className="auth-switch">
              Belum punya akun?{' '}
              <Link to="/register" className="auth-switch-link">
                Daftar sekarang
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style>{authStyles}</style>
    </div>
  );
}

const authStyles = `
  /* ═══════════════════════════════════════════
     AUTH PAGE — SHARED STYLES (Login & Register)
     ═══════════════════════════════════════════ */

  .auth-page {
    min-height: 100vh;
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    background: #0a0a1a;
  }

  /* ── Animated background ── */
  .auth-bg {
    position: fixed;
    inset: 0;
    z-index: 0;
    overflow: hidden;
  }

  .auth-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 60px 60px;
  }

  .auth-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.5;
    animation: auth-float 20s ease-in-out infinite;
  }
  .auth-orb-1 {
    width: 500px; height: 500px;
    background: radial-gradient(circle, #6366f1 0%, transparent 70%);
    top: -10%; left: -10%;
    animation-duration: 22s;
  }
  .auth-orb-2 {
    width: 400px; height: 400px;
    background: radial-gradient(circle, #06b6d4 0%, transparent 70%);
    bottom: -10%; right: -5%;
    animation-duration: 18s;
    animation-delay: -5s;
  }
  .auth-orb-3 {
    width: 300px; height: 300px;
    background: radial-gradient(circle, #8b5cf6 0%, transparent 70%);
    top: 40%; left: 50%;
    animation-duration: 25s;
    animation-delay: -10s;
  }

  @keyframes auth-float {
    0%, 100% { transform: translate(0, 0) scale(1); }
    25% { transform: translate(30px, -40px) scale(1.05); }
    50% { transform: translate(-20px, 20px) scale(0.95); }
    75% { transform: translate(15px, 30px) scale(1.02); }
  }

  /* ── Container ── */
  .auth-container {
    position: relative;
    z-index: 1;
    display: flex;
    width: 100%;
    max-width: 960px;
    min-height: 580px;
    margin: 16px;
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 0 0 1px rgba(255,255,255,0.08), 0 24px 80px -12px rgba(0,0,0,0.5);
    animation: auth-card-enter 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  @keyframes auth-card-enter {
    from { opacity: 0; transform: translateY(24px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* ── Brand panel (left) ── */
  .auth-brand-panel {
    display: none;
    width: 420px;
    flex-shrink: 0;
    padding: 40px;
    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%);
    position: relative;
    overflow: hidden;
    flex-direction: column;
    justify-content: space-between;
  }
  .auth-brand-panel::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 20% 80%, rgba(99,102,241,0.3) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(6,182,212,0.2) 0%, transparent 50%);
  }

  @media (min-width: 1024px) {
    .auth-brand-panel { display: flex; }
  }

  .auth-brand-content { position: relative; z-index: 1; }

  .auth-brand-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 32px;
  }

  .auth-logo-icon {
    width: 48px; height: 48px;
    border-radius: 14px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 8px 24px rgba(99,102,241,0.4);
  }

  .auth-logo-text {
    font-size: 1.75rem;
    font-weight: 800;
    color: #fff;
    letter-spacing: -0.02em;
  }

  .auth-brand-tagline {
    font-size: 1.125rem;
    line-height: 1.6;
    color: rgba(255,255,255,0.7);
    font-weight: 300;
    margin-bottom: 40px;
  }

  .auth-brand-features {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .auth-feature-item {
    display: flex;
    align-items: center;
    gap: 12px;
    color: rgba(255,255,255,0.8);
    font-size: 0.875rem;
    font-weight: 400;
  }

  .auth-feature-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1, #06b6d4);
    flex-shrink: 0;
    box-shadow: 0 0 12px rgba(99,102,241,0.6);
  }

  .auth-brand-footer {
    position: relative; z-index: 1;
    font-size: 0.75rem;
    color: rgba(255,255,255,0.3);
  }

  /* ── Form card (right) ── */
  .auth-card {
    flex: 1;
    background: rgba(15, 15, 30, 0.8);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px 24px;
  }

  @media (min-width: 1024px) {
    .auth-card {
      padding: 48px;
    }
  }

  .auth-card-inner {
    width: 100%;
    max-width: 380px;
  }

  /* ── Mobile logo ── */
  .auth-mobile-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 32px;
  }
  @media (min-width: 1024px) {
    .auth-mobile-logo { display: none; }
  }
  .auth-logo-icon-sm {
    width: 36px; height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 16px rgba(99,102,241,0.4);
  }
  .auth-mobile-logo-text {
    font-size: 1.25rem;
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.02em;
  }

  /* ── Card header ── */
  .auth-card-header { margin-bottom: 28px; }

  .auth-card-title {
    font-size: 1.625rem;
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.02em;
    margin-bottom: 6px;
  }

  .auth-card-subtitle {
    font-size: 0.875rem;
    color: rgba(255,255,255,0.45);
    font-weight: 400;
  }

  /* ── Error ── */
  .auth-error {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 12px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    margin-bottom: 20px;
    font-size: 0.8125rem;
    color: #fca5a5;
    animation: auth-shake 0.4s ease;
  }
  .auth-error-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #ef4444;
    flex-shrink: 0;
  }
  @keyframes auth-shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-6px); }
    75% { transform: translateX(6px); }
  }

  /* ── Form ── */
  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* ── Input field ── */
  .auth-field {
    position: relative;
  }

  .auth-field-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(255,255,255,0.3);
    pointer-events: none;
    transition: color 0.2s;
    z-index: 2;
    display: flex;
  }

  .auth-input {
    width: 100%;
    padding: 16px 14px 8px 42px;
    border-radius: 12px;
    border: 1.5px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);
    color: #fff;
    font-size: 0.9375rem;
    font-family: 'Inter', sans-serif;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
    outline: none;
    box-sizing: border-box;
  }
  .auth-input-password {
    padding-right: 44px;
  }
  .auth-input:hover {
    border-color: rgba(255,255,255,0.2);
    background: rgba(255,255,255,0.06);
  }
  .auth-input:focus {
    border-color: #6366f1;
    background: rgba(99,102,241,0.06);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
  }
  .auth-input:focus ~ .auth-field-icon,
  .auth-input:not(:placeholder-shown) ~ .auth-field-icon {
    /* icon stays same position */
  }
  .auth-field:focus-within .auth-field-icon {
    color: #818cf8;
  }

  /* ── Floating label ── */
  .auth-label {
    position: absolute;
    left: 42px;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(255,255,255,0.35);
    font-size: 0.9375rem;
    font-weight: 400;
    pointer-events: none;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    transform-origin: left center;
  }
  .auth-input:focus + .auth-label,
  .auth-input:not(:placeholder-shown) + .auth-label {
    top: 10px;
    transform: translateY(0);
    font-size: 0.6875rem;
    color: #818cf8;
    font-weight: 500;
    letter-spacing: 0.02em;
  }

  /* ── Password toggle ── */
  .auth-password-toggle {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: rgba(255,255,255,0.3);
    cursor: pointer;
    padding: 4px;
    display: flex;
    border-radius: 6px;
    transition: color 0.2s, background 0.2s;
  }
  .auth-password-toggle:hover {
    color: rgba(255,255,255,0.6);
    background: rgba(255,255,255,0.06);
  }

  /* ── Submit button ── */
  .auth-submit {
    width: 100%;
    margin-top: 4px;
    padding: 14px 20px;
    border: none;
    border-radius: 12px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff;
    font-size: 0.9375rem;
    font-weight: 600;
    font-family: 'Inter', sans-serif;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 4px 24px rgba(99,102,241,0.3);
    position: relative;
    overflow: hidden;
  }
  .auth-submit::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #818cf8, #a78bfa);
    opacity: 0;
    transition: opacity 0.25s;
  }
  .auth-submit:hover::before {
    opacity: 1;
  }
  .auth-submit:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 32px rgba(99,102,241,0.4);
  }
  .auth-submit:active {
    transform: translateY(0);
  }
  .auth-submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  .auth-submit span,
  .auth-submit svg {
    position: relative; z-index: 1;
  }

  /* ── Spinner ── */
  .auth-spinner {
    width: 18px; height: 18px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: auth-spin 0.6s linear infinite;
    position: relative; z-index: 1;
  }
  @keyframes auth-spin {
    to { transform: rotate(360deg); }
  }

  /* ── Divider ── */
  .auth-divider {
    display: flex;
    align-items: center;
    gap: 16px;
    margin: 24px 0;
  }
  .auth-divider-line {
    flex: 1;
    height: 1px;
    background: rgba(255,255,255,0.08);
  }
  .auth-divider-text {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.25);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 500;
  }

  /* ── Switch link ── */
  .auth-switch {
    text-align: center;
    font-size: 0.8125rem;
    color: rgba(255,255,255,0.4);
  }
  .auth-switch-link {
    color: #818cf8;
    font-weight: 600;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    transition: color 0.2s, gap 0.2s;
  }
  .auth-switch-link:hover {
    color: #a5b4fc;
    gap: 8px;
  }
`;
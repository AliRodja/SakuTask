import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Pencil,
  MessageCircle,
  Send,
  Moon,
  Sun,
  Bell,
  KeyRound,
  Laptop,
  Smartphone,
  Trash2,
  AlertTriangle,
  Check,
  X,
} from 'lucide-react';
import api from '../lib/api';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { timeAgo } from '../lib/format';

function initials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className="settings-toggle"
      style={{
        background: checked ? 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' : 'rgba(var(--ink-rgb),0.12)',
      }}
    >
      <span className="settings-toggle-knob" style={{ transform: checked ? 'translateX(18px)' : 'translateX(0)' }} />
    </button>
  );
}

export default function Settings() {
  const { user, updateUser, clearSession } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [waStatus, setWaStatus] = useState(null);
  const [checkingWa, setCheckingWa] = useState(true);

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: user.name, whatsapp_number: user.whatsapp_number });
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [notifEnabled, setNotifEnabled] = useState(user.wa_notifications_enabled ?? true);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    checkWaStatus();
    loadSessions();
  }, []);

  function checkWaStatus() {
    setCheckingWa(true);
    api
      .get('/whatsapp/status')
      .then(({ data }) => setWaStatus(data.connected))
      .catch(() => setWaStatus(false))
      .finally(() => setCheckingWa(false));
  }

  function loadSessions() {
    setLoadingSessions(true);
    api
      .get('/sessions')
      .then(({ data }) => setSessions(data))
      .finally(() => setLoadingSessions(false));
  }

  async function saveProfile(e) {
    e.preventDefault();
    setProfileError('');
    setSavingProfile(true);
    try {
      const { data } = await api.put('/user', profileForm);
      updateUser(data);
      setEditingProfile(false);
    } catch (err) {
      setProfileError(err.friendlyMessage || 'Gagal menyimpan profil.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleToggleNotif(value) {
    setNotifEnabled(value);
    try {
      const { data } = await api.put('/user/preferences', { wa_notifications_enabled: value });
      updateUser(data);
    } catch {
      setNotifEnabled(!value);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    setSavingPassword(true);
    try {
      await api.put('/user/password', passwordForm);
      setPasswordSuccess('Password berhasil diperbarui.');
      setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
      setTimeout(() => setShowPasswordForm(false), 1200);
    } catch (err) {
      setPasswordError(err.friendlyMessage || 'Gagal mengubah password.');
    } finally {
      setSavingPassword(false);
    }
  }

  async function revokeSession(id) {
    await api.delete(`/sessions/${id}`);
    loadSessions();
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== 'HAPUS') return;
    setDeletingAccount(true);
    try {
      await api.delete('/user');
      clearSession();
      navigate('/login');
    } catch {
      setDeletingAccount(false);
    }
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="settings-root">
      <h2 className="text-lg font-semibold text-hi">Pengaturan</h2>

      {/* Profile + WhatsApp gateway */}
      <div className="settings-top-grid">
        <div className="glass-card p-5">
          <div className="flex items-start gap-4">
            <div className="settings-avatar">{initials(user.name)}</div>
            <div className="flex-1 min-w-0">
              {!editingProfile ? (
                <>
                  <p className="text-base font-semibold text-hi">{user.name}</p>
                  <p className="text-sm text-faint mt-0.5">{user.email}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="settings-pill">
                      <MessageCircle className="w-3.5 h-3.5" style={{ color: 'var(--color-success)' }} />
                      {user.whatsapp_number}
                    </span>
                  </div>
                </>
              ) : (
                <form onSubmit={saveProfile} className="space-y-2">
                  {profileError && (
                    <div className="app-error"><div className="app-error-dot" /><span>{profileError}</span></div>
                  )}
                  <input
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="app-input py-2 text-sm"
                    placeholder="Nama"
                    required
                  />
                  <input
                    value={profileForm.whatsapp_number}
                    onChange={(e) => setProfileForm({ ...profileForm, whatsapp_number: e.target.value })}
                    className="app-input py-2 text-sm"
                    placeholder="Nomor WhatsApp"
                    required
                  />
                  <div className="flex gap-2">
                    <button type="submit" disabled={savingProfile} className="gradient-btn text-xs px-3 py-1.5">
                      <span>{savingProfile ? 'Menyimpan...' : 'Simpan'}</span>
                    </button>
                    <button type="button" onClick={() => setEditingProfile(false)} className="ghost-btn text-xs px-3 py-1.5">
                      Batal
                    </button>
                  </div>
                </form>
              )}
            </div>
            {!editingProfile && (
              <button
                onClick={() => {
                  setProfileForm({ name: user.name, whatsapp_number: user.whatsapp_number });
                  setEditingProfile(true);
                }}
                className="settings-icon-btn"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.15)' }}>
              <MessageCircle className="w-4.5 h-4.5" style={{ color: 'var(--color-success)' }} />
            </div>
            {!checkingWa && (
              <span className={`settings-badge ${waStatus ? 'settings-badge-good' : 'settings-badge-bad'}`}>
                {waStatus ? 'TERHUBUNG' : 'TERPUTUS'}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-hi">Gateway WhatsApp</p>
          <p className="text-xs text-faint mt-1 mb-4">
            Sinkronisasi otomatis untuk pengingat tugas dan ringkasan keuangan.
          </p>
          <button onClick={checkWaStatus} disabled={checkingWa} className="ghost-btn text-sm px-4 py-2 flex items-center gap-2">
            <Send className="w-3.5 h-3.5" />
            {checkingWa ? 'Mengecek...' : 'Tes Koneksi'}
          </button>
        </div>
      </div>

      {/* Preferensi + Keamanan */}
      <div className="settings-mid-grid">
        <div className="glass-card p-1">
          <p className="text-xs font-medium text-muted uppercase tracking-wide px-4 pt-3 pb-1">Preferensi</p>

          <div className="settings-row">
            <div className="settings-row-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>
              {theme === 'dark' ? <Moon className="w-4 h-4" style={{ color: 'var(--color-primary-light)' }} /> : <Sun className="w-4 h-4" style={{ color: 'var(--color-primary-light)' }} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-hi">Tampilan</p>
              <p className="text-xs text-faint">{theme === 'dark' ? 'Gelap' : 'Terang'}</p>
            </div>
            <Toggle checked={theme === 'light'} onChange={toggleTheme} />
          </div>

          <div className="settings-row">
            <div className="settings-row-icon" style={{ background: 'rgba(239,68,68,0.12)' }}>
              <Bell className="w-4 h-4 text-rose-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-hi">Notifikasi WhatsApp</p>
              <p className="text-xs text-faint">{notifEnabled ? 'Pengingat tugas aktif' : 'Pengingat dimatikan'}</p>
            </div>
            <Toggle checked={notifEnabled} onChange={handleToggleNotif} />
          </div>
        </div>

        <div className="glass-card p-1">
          <p className="text-xs font-medium text-muted uppercase tracking-wide px-4 pt-3 pb-1">Keamanan & Sesi</p>

          <div className="settings-row">
            <div className="settings-row-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>
              <KeyRound className="w-4 h-4" style={{ color: 'var(--color-primary-light)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-hi">Kata Sandi</p>
              <p className="text-xs text-faint">Ubah password akun kamu</p>
            </div>
            <button
              onClick={() => setShowPasswordForm((v) => !v)}
              className="text-xs font-medium"
              style={{ color: 'var(--color-primary-light)' }}
            >
              {showPasswordForm ? 'Tutup' : 'Ubah'}
            </button>
          </div>

          {showPasswordForm && (
            <form onSubmit={savePassword} className="px-4 pb-4 space-y-2">
              {passwordError && <div className="app-error"><div className="app-error-dot" /><span>{passwordError}</span></div>}
              {passwordSuccess && (
                <div className="app-error" style={{ background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.2)', color: '#86efac' }}>
                  <Check className="w-3.5 h-3.5 shrink-0" /><span>{passwordSuccess}</span>
                </div>
              )}
              <input
                type="password"
                placeholder="Password saat ini"
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                className="app-input py-2 text-sm"
                required
              />
              <input
                type="password"
                placeholder="Password baru"
                value={passwordForm.password}
                onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                className="app-input py-2 text-sm"
                required
              />
              <input
                type="password"
                placeholder="Konfirmasi password baru"
                value={passwordForm.password_confirmation}
                onChange={(e) => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })}
                className="app-input py-2 text-sm"
                required
              />
              <button type="submit" disabled={savingPassword} className="gradient-btn text-xs px-3 py-1.5 w-full">
                <span>{savingPassword ? 'Menyimpan...' : 'Simpan Password'}</span>
              </button>
            </form>
          )}

          <div className="settings-row" style={{ borderBottom: 'none' }}>
            <div className="settings-row-icon" style={{ background: 'rgba(56,189,248,0.15)' }}>
              <Laptop className="w-4 h-4" style={{ color: '#38bdf8' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-hi">Sesi Aktif</p>
              <p className="text-xs text-faint">{sessions.length} perangkat aktif</p>
            </div>
          </div>

          {loadingSessions ? (
            <Spinner label="Memuat sesi..." />
          ) : (
            <div className="px-4 pb-3 space-y-1.5">
              {sessions.map((s) => (
                <div key={s.id} className="settings-session-row">
                  <Smartphone className="w-3.5 h-3.5 text-faint shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-mid">
                      {s.is_current ? 'Perangkat ini' : 'Perangkat lain'}
                      {s.is_current && <span className="settings-current-badge">AKTIF SEKARANG</span>}
                    </p>
                    <p className="text-xs text-faint">
                      {s.last_used_at ? `Terakhir aktif ${timeAgo(s.last_used_at)}` : 'Belum pernah dipakai'}
                    </p>
                  </div>
                  {!s.is_current && (
                    <button onClick={() => revokeSession(s.id)} className="text-faint hover:text-rose-400 transition-colors shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Zona Bahaya */}
      <div className="settings-danger-zone">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-rose-400">Zona Bahaya</p>
            <p className="text-xs text-faint mt-1">Hapus akun kamu dan semua data tugas/keuangan secara permanen.</p>

            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)} className="settings-danger-btn mt-3">
                <Trash2 className="w-3.5 h-3.5" /> Hapus Akun
              </button>
            ) : (
              <div className="mt-3 space-y-2 max-w-xs">
                <p className="text-xs text-faint">Ketik <strong className="text-hi">HAPUS</strong> untuk konfirmasi.</p>
                <input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="app-input py-2 text-sm"
                  placeholder="HAPUS"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== 'HAPUS' || deletingAccount}
                    className="settings-danger-btn"
                  >
                    {deletingAccount ? 'Menghapus...' : 'Konfirmasi Hapus'}
                  </button>
                  <button
                    onClick={() => {
                      setConfirmDelete(false);
                      setDeleteConfirmText('');
                    }}
                    className="ghost-btn text-xs px-3 py-1.5"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{settingsStyles}</style>
    </div>
  );
}

const settingsStyles = `
  .settings-root {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .settings-top-grid, .settings-mid-grid {
    display: grid;
    gap: 16px;
  }
  @media (min-width: 1024px) {
    .settings-top-grid, .settings-mid-grid { grid-template-columns: 1fr 1fr; }
  }
  .settings-avatar {
    width: 56px; height: 56px;
    border-radius: 16px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff;
    font-weight: 700;
    font-size: 1.125rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .settings-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    color: rgba(var(--ink-rgb),0.7);
    background: rgba(var(--ink-rgb),0.05);
    border: 1px solid rgba(var(--ink-rgb),0.08);
    border-radius: 99px;
    padding: 4px 10px;
  }
  .settings-icon-btn {
    width: 30px; height: 30px;
    border-radius: 10px;
    background: rgba(var(--ink-rgb),0.06);
    border: 1px solid rgba(var(--ink-rgb),0.08);
    color: rgba(var(--ink-rgb),0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.2s;
  }
  .settings-icon-btn:hover { color: rgba(var(--ink-rgb),0.9); }
  .settings-badge {
    font-size: 0.625rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    padding: 3px 10px;
    border-radius: 99px;
  }
  .settings-badge-good { background: rgba(34,197,94,0.15); color: #4ade80; }
  .settings-badge-bad { background: rgba(239,68,68,0.15); color: #f87171; }

  .settings-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(var(--ink-rgb),0.06);
  }
  .settings-row-icon {
    width: 34px; height: 34px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .settings-toggle {
    width: 40px; height: 22px;
    border-radius: 99px;
    border: none;
    cursor: pointer;
    position: relative;
    transition: background 0.2s;
    flex-shrink: 0;
    padding: 2px;
  }
  .settings-toggle-knob {
    width: 18px; height: 18px;
    border-radius: 50%;
    background: #fff;
    display: block;
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  }

  .settings-session-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 8px;
    border-radius: 10px;
  }
  .settings-session-row:hover { background: rgba(var(--ink-rgb),0.04); }
  .settings-current-badge {
    margin-left: 6px;
    font-size: 0.5625rem;
    font-weight: 700;
    color: #4ade80;
    letter-spacing: 0.04em;
  }

  .settings-danger-zone {
    border-radius: 16px;
    padding: 18px;
    background: rgba(239,68,68,0.06);
    border: 1px solid rgba(239,68,68,0.2);
  }
  .settings-danger-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8125rem;
    font-weight: 600;
    color: #f87171;
    background: transparent;
    border: 1.5px solid rgba(239,68,68,0.4);
    border-radius: 10px;
    padding: 8px 16px;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'Inter', sans-serif;
  }
  .settings-danger-btn:hover { background: rgba(239,68,68,0.12); }
  .settings-danger-btn:disabled { opacity: 0.5; cursor: not-allowed; }
`;

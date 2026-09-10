import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, Building2, Briefcase, ArrowRight, ShieldAlert, Loader2 } from 'lucide-react';
import { User, UserRole } from '../types';
import { loginWithEmail, registerWithEmail, formatAuthErrorMessage } from '../services/authService';
import { AppLogo } from './AppLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (user: User) => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [accountType, setAccountType] = useState<'user' | 'company'>('user');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'register') {
      if (!name.trim()) {
        setError('Nama lengkap / PIC wajib diisi');
        return;
      }
      if (accountType === 'company' && !companyName.trim()) {
        setError('Nama perusahaan / instansi wajib diisi');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setError('Format alamat email tidak valid');
        return;
      }
      if (password.length < 6) {
        setError('Kata sandi minimal 6 karakter');
        return;
      }
      if (password !== confirmPassword) {
        setError('Konfirmasi kata sandi tidak cocok');
        return;
      }

      setLoading(true);
      try {
        const newUser = await registerWithEmail(
          name,
          email,
          password,
          accountType,
          accountType === 'company' ? companyName : undefined
        );
        if (onLoginSuccess) onLoginSuccess(newUser);
        onClose();
      } catch (err: any) {
        setError(formatAuthErrorMessage(err));
      } finally {
        setLoading(false);
      }
    } else {
      if (!email.trim()) {
        setError('Email wajib diisi');
        return;
      }
      if (!password) {
        setError('Kata sandi wajib diisi');
        return;
      }

      setLoading(true);
      try {
        const { profile } = await loginWithEmail(email, password);
        if (profile && onLoginSuccess) {
          onLoginSuccess(profile);
        }
        onClose();
      } catch (err: any) {
        setError(formatAuthErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div
      id="auth-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        id="auth-modal-content"
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white p-6 relative">
          <button
            id="btn-close-auth-modal"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="p-2.5 rounded-2xl bg-white/95 shadow-md w-fit mb-3 flex items-center justify-center">
            <AppLogo size="md" />
          </div>
          <h3 className="text-xl font-extrabold tracking-tight">
            {mode === 'login' ? 'Masuk ke DIGAWE YUK' : 'Daftar Akun Baru'}
          </h3>
          <p className="text-xs text-blue-100 mt-1">
            {mode === 'login'
              ? 'Terhubung dengan Firebase Authentication.'
              : 'Daftar sekarang gratis untuk mulai mencari pekerjaan.'}
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'register' && (
            <>
              {/* Account Type Selector: Pencari Kerja vs Perusahaan / Recruiter */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Daftar Sebagai
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    id="btn-role-user"
                    onClick={() => setAccountType('user')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      accountType === 'user'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Pencari Kerja</span>
                  </button>

                  <button
                    type="button"
                    id="btn-role-company"
                    onClick={() => setAccountType('company')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      accountType === 'company'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Perusahaan</span>
                  </button>
                </div>
              </div>

              {accountType === 'company' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Perusahaan / Instansi
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      id="auth-input-company-name"
                      type="text"
                      required
                      placeholder="Contoh: PT Sumber Daya Mandiri"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {accountType === 'company' ? 'Nama PIC / Rekruter' : 'Nama Lengkap'}
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    id="auth-input-name"
                    type="text"
                    required
                    placeholder={accountType === 'company' ? 'Nama perwakilan recruiter' : 'Contoh: Budi Santoso'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="auth-input-email"
                type="email"
                required
                placeholder="email@anda.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="auth-input-password"
                type="password"
                required
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Konfirmasi Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="auth-input-confirm-password"
                  type="password"
                  required
                  placeholder="Ulangi kata sandi"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Submission button */}
          <button
            id="btn-submit-auth"
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <span>{mode === 'login' ? 'Masuk' : 'Daftar'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Toggle mode link */}
          <div className="pt-2 text-center text-xs text-slate-500">
            {mode === 'login' ? (
              <p>
                Belum punya akun?{' '}
                <button
                  type="button"
                  id="btn-switch-to-register"
                  onClick={() => {
                    setError(null);
                    setMode('register');
                  }}
                  className="font-bold text-blue-600 hover:underline ml-1"
                >
                  Daftar
                </button>
              </p>
            ) : (
              <p>
                Sudah punya akun?{' '}
                <button
                  type="button"
                  id="btn-switch-to-login"
                  onClick={() => {
                    setError(null);
                    setMode('login');
                  }}
                  className="font-bold text-blue-600 hover:underline ml-1"
                >
                  Masuk
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  Bot,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';

export function AuthModal() {
  const isOpen = useAuthStore((s) => s.isAuthModalOpen);
  const mode = useAuthStore((s) => s.authModalMode);
  const setAuthModalOpen = useAuthStore((s) => s.setAuthModalOpen);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);

  const signInWithPassword = useAuthStore((s) => s.signInWithPassword);
  const signUpWithPassword = useAuthStore((s) => s.signUpWithPassword);

  const language = useSettingsStore((s) => s.language);

  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setLocalError(null);
      setSuccessMessage(null);
    }
  }, [isOpen, mode]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) {
      setLocalError(language === 'id' ? 'Silakan isi email dan kata sandi.' : 'Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);

    if (mode === 'login') {
      const { error } = await signInWithPassword(email.trim(), password);
      setIsSubmitting(false);
      if (error) {
        setLocalError(error.message);
      } else {
        setAuthModalOpen(false);
      }
    } else {
      const { error } = await signUpWithPassword(email.trim(), password);
      setIsSubmitting(false);
      if (error) {
        setLocalError(error.message);
      } else {
        setSuccessMessage(
          language === 'id'
            ? 'Akun berhasil dibuat! Silakan cek email Anda untuk tautan verifikasi.'
            : 'Account created! Please check your email for the verification link.'
        );
      }
    }
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 999999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setAuthModalOpen(false);
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: 'var(--bg-surface, #1e1e1e)',
          border: '1px solid var(--border-strong, rgba(255,255,255,0.15))',
          borderRadius: 'var(--radius-xl, 16px)',
          boxShadow: 'var(--shadow-2xl, 0 25px 50px -12px rgba(0, 0, 0, 0.5))',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0073EA, #A25DDC)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 2px 8px rgba(0,115,234,0.3)',
              }}
            >
              <Bot size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {mode === 'login'
                  ? language === 'id'
                    ? 'Masuk ke Anticeil'
                    : 'Sign in to Anticeil'
                  : language === 'id'
                  ? 'Daftar Akun Baru'
                  : 'Create Anticeil Account'}
              </h2>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                {mode === 'login'
                  ? language === 'id'
                    ? 'Masuk untuk mulai chat & simpan riwayat'
                    : 'Sign in to chat & sync your history'
                  : language === 'id'
                  ? 'Gratis & 100% kedaulatan data pribadi'
                  : 'Free & 100% private data sovereignty'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAuthModalOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {localError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: 'var(--accent-danger, #ef4444)',
                fontSize: '12.5px',
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{localError}</span>
            </div>
          )}

          {successMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                color: 'var(--accent-success, #10b981)',
                fontSize: '12.5px',
              }}
            >
              <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              {language === 'id' ? 'Kata Sandi' : 'Password'}
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '9px 36px 9px 36px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              marginTop: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--brand-primary, #0073EA)',
              color: '#ffffff',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
              transition: 'background 0.15s ease',
              boxShadow: '0 2px 8px rgba(0, 115, 234, 0.3)',
            }}
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <span>
                  {mode === 'login'
                    ? language === 'id'
                      ? 'Masuk'
                      : 'Sign In'
                    : language === 'id'
                    ? 'Daftar Sekarang'
                    : 'Create Account'}
                </span>
                <ArrowRight size={15} />
              </>
            )}
          </button>

          {/* Switch Mode Footer */}
          <div style={{ textAlign: 'center', marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
            {mode === 'login' ? (
              <span>
                {language === 'id' ? 'Belum punya akun?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => openAuthModal('register')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--brand-primary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '12px',
                  }}
                >
                  {language === 'id' ? 'Daftar gratis' : 'Sign up free'}
                </button>
              </span>
            ) : (
              <span>
                {language === 'id' ? 'Sudah punya akun?' : 'Already have an account?'}{' '}
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--brand-primary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '12px',
                  }}
                >
                  {language === 'id' ? 'Masuk' : 'Sign in'}
                </button>
              </span>
            )}
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

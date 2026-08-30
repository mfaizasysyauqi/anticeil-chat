'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Lock,
  Mail,
  Phone,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Bot,
  Send,
  ExternalLink,
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
  const isId = language === 'id';

  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Telegram verification
  const [telegramToken, setTelegramToken] = useState<string | null>(null);
  const [telegramBotUrl, setTelegramBotUrl] = useState<string | null>(null);
  const [isWaitingTelegram, setIsWaitingTelegram] = useState(false);
  const [isTelegramVerified, setIsTelegramVerified] = useState(false);
  const [isTelegramLoading, setIsTelegramLoading] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Reset all state when mode or open changes
  useEffect(() => {
    if (isOpen) {
      setLocalError(null);
      setSuccessMessage(null);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setPhone('');
      setTelegramToken(null);
      setTelegramBotUrl(null);
      setIsWaitingTelegram(false);
      setIsTelegramVerified(false);
    }
  }, [isOpen, mode]);

  // Poll Telegram verification status every 3s while waiting
  useEffect(() => {
    if (!telegramToken || !isWaitingTelegram || isTelegramVerified) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/auth/telegram-verify?token=${telegramToken}`);
        const data = await res.json();
        if (data.verified) {
          setIsTelegramVerified(true);
          setIsWaitingTelegram(false);
        }
      } catch { /* ignore */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [telegramToken, isWaitingTelegram, isTelegramVerified]);

  const handleStartTelegramVerify = async () => {
    if (!phone.trim()) {
      setLocalError(isId ? 'Masukkan nomor HP terlebih dahulu.' : 'Please enter your phone number first.');
      return;
    }
    setLocalError(null);
    setIsTelegramLoading(true);
    try {
      const res = await fetch('/api/auth/telegram-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-session', phone: phone.trim() }),
      });
      const data = await res.json();
      if (data.token) {
        setTelegramToken(data.token);
        setTelegramBotUrl(data.botUrl);
        setIsWaitingTelegram(true);
        if (data.botUrl) window.open(data.botUrl, '_blank');
      } else {
        setLocalError(data.error || (isId ? 'Gagal memulai verifikasi.' : 'Failed to start verification.'));
      }
    } catch {
      setLocalError(isId ? 'Terjadi kesalahan jaringan.' : 'Network error.');
    } finally {
      setIsTelegramLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) {
      setLocalError(isId ? 'Silakan isi email dan kata sandi.' : 'Please enter both email and password.');
      return;
    }

    if (mode === 'register') {
      if (!confirmPassword.trim()) {
        setLocalError(isId ? 'Silakan konfirmasi kata sandi.' : 'Please confirm your password.');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError(isId ? 'Kata sandi tidak cocok.' : 'Passwords do not match.');
        return;
      }
      if (!phone.trim()) {
        setLocalError(isId ? 'Masukkan nomor HP untuk verifikasi Telegram.' : 'Enter your phone number for Telegram verification.');
        return;
      }
      if (!isTelegramVerified) {
        setLocalError(isId ? 'Verifikasi Telegram diperlukan sebelum mendaftar.' : 'Telegram verification is required before registering.');
        return;
      }
    }

    setIsSubmitting(true);

    if (mode === 'login') {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      setIsSubmitting(false);
      if (!res.ok) {
        const msg: string = data.error ?? '';
        const lower = msg.toLowerCase();
        if (lower.includes('email not confirmed')) {
          setLocalError(isId ? 'Email belum diverifikasi. Cek Inbox atau SPAM kamu.' : 'Email not confirmed. Check your Inbox or SPAM.');
        } else if (lower.includes('invalid login') || lower.includes('invalid credentials')) {
          setLocalError(isId ? 'Email atau kata sandi tidak cocok.' : 'Invalid email or password.');
        } else {
          setLocalError(msg || (isId ? 'Login gagal.' : 'Login failed.'));
        }
      } else {
        setAuthModalOpen(false);
        window.location.reload();
      }
    } else {
      const { error } = await signUpWithPassword(email.trim(), password);
      setIsSubmitting(false);
      if (error) {
        setLocalError(error.message);
      } else {
        setSuccessMessage(
          isId
            ? 'Akun berhasil dibuat! Cek email Anda untuk tautan verifikasi.'
            : 'Account created! Check your email for the verification link.'
        );
      }
    }
  };

  if (!isOpen || !mounted) return null;

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px 9px 36px',
    borderRadius: '8px',
    border: '1px solid var(--border-subtle)',
    background: 'var(--bg-subtle)',
    color: 'var(--text-primary)',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
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
        overflowY: 'auto',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) setAuthModalOpen(false); }}
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
          margin: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, #0073EA, #A25DDC)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 2px 8px rgba(0,115,234,0.3)' }}>
              <Bot size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {mode === 'login'
                  ? (isId ? 'Masuk ke Anticeil' : 'Sign in to Anticeil')
                  : (isId ? 'Daftar Akun Baru' : 'Create Anticeil Account')}
              </h2>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                {mode === 'login'
                  ? (isId ? 'Masuk untuk chat & simpan riwayat' : 'Sign in to chat & sync your history')
                  : (isId ? 'Gratis & 100% privat' : 'Free & 100% private data sovereignty')}
              </p>
            </div>
          </div>
          <button type="button" onClick={() => setAuthModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {localError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: 'var(--accent-danger, #ef4444)', fontSize: '12.5px' }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{localError}</span>
            </div>
          )}

          {successMessage && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', color: 'var(--accent-success, #10b981)', fontSize: '12.5px' }}>
              <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" required style={inputStyle} />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              {isId ? 'Kata Sandi' : 'Password'}
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required style={{ ...inputStyle, padding: '9px 36px 9px 36px' }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Confirm Password — register only */}
          {mode === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                {isId ? 'Konfirmasi Kata Sandi' : 'Confirm Password'}
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required style={inputStyle} />
              </div>
            </div>
          )}

          {/* Phone + Telegram — register only */}
          {mode === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                {isId ? 'Nomor HP (Telegram)' : 'Phone Number (Telegram)'}
              </label>
              {/* Phone Input */}
              <div style={{ position: 'relative', marginBottom: '8px' }}>
                <Phone size={15} color={isTelegramVerified ? '#00C875' : 'var(--text-muted)'} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+62 812 xxxx xxxx"
                  disabled={isTelegramVerified}
                  style={{
                    ...inputStyle,
                    border: isTelegramVerified ? '1px solid #00C875' : '1px solid var(--border-subtle)',
                    background: isTelegramVerified ? 'rgba(0, 200, 117, 0.06)' : 'var(--bg-subtle)',
                    opacity: isTelegramVerified ? 0.8 : 1,
                  }}
                />
              </div>

              {/* Telegram Verification Box */}
              {!isTelegramVerified ? (
                <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Send size={14} color="#0088cc" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {isId ? 'Verifikasi via Telegram' : 'Verify via Telegram'}
                    </span>
                  </div>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                    {isId
                      ? 'Klik tombol di bawah untuk membuka bot Telegram kami, lalu konfirmasi nomor HP kamu.'
                      : 'Click the button below to open our Telegram bot and confirm your phone number.'}
                  </p>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={handleStartTelegramVerify}
                      disabled={isTelegramLoading || isWaitingTelegram}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#0088cc',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: isTelegramLoading || isWaitingTelegram ? 'not-allowed' : 'pointer',
                        opacity: isTelegramLoading || isWaitingTelegram ? 0.7 : 1,
                      }}
                    >
                      {isTelegramLoading ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : isWaitingTelegram ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>{isId ? 'Menunggu konfirmasi...' : 'Waiting for confirmation...'}</span>
                        </>
                      ) : (
                        <>
                          <ExternalLink size={13} />
                          <span>{isId ? 'Buka Bot Telegram' : 'Open Telegram Bot'}</span>
                        </>
                      )}
                    </button>

                    {/* Re-open bot link if already waiting */}
                    {isWaitingTelegram && telegramBotUrl && (
                      <button
                        type="button"
                        onClick={() => window.open(telegramBotUrl, '_blank')}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer' }}
                      >
                        <ExternalLink size={13} />
                      </button>
                    )}
                  </div>

                  {isWaitingTelegram && (
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, textAlign: 'center' }}>
                      {isId ? 'Halaman ini akan otomatis lanjut setelah verifikasi.' : 'This page will automatically proceed after verification.'}
                    </p>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: 'rgba(0, 200, 117, 0.08)', border: '1px solid rgba(0, 200, 117, 0.3)', borderRadius: '8px' }}>
                  <CheckCircle2 size={15} color="#00C875" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#00C875' }}>
                    {isId ? 'Nomor HP terverifikasi ✓' : 'Phone number verified ✓'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || (mode === 'register' && !isTelegramVerified)}
            style={{
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              background: (mode === 'register' && !isTelegramVerified) ? 'var(--text-muted)' : 'var(--brand-primary, #0073EA)',
              color: '#ffffff',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: (isSubmitting || (mode === 'register' && !isTelegramVerified)) ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
              transition: 'background 0.15s ease',
              boxShadow: (mode === 'register' && !isTelegramVerified) ? 'none' : '0 2px 8px rgba(0, 115, 234, 0.3)',
            }}
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <span>
                  {mode === 'login'
                    ? (isId ? 'Masuk' : 'Sign In')
                    : (isId ? 'Daftar Sekarang' : 'Create Account')}
                </span>
                <ArrowRight size={15} />
              </>
            )}
          </button>

          {/* Switch Mode */}
          <div style={{ textAlign: 'center', marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
            {mode === 'login' ? (
              <span>
                {isId ? 'Belum punya akun?' : "Don't have an account?"}{' '}
                <button type="button" onClick={() => openAuthModal('register')} style={{ background: 'transparent', border: 'none', color: 'var(--brand-primary)', fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: '12px' }}>
                  {isId ? 'Daftar gratis' : 'Sign up free'}
                </button>
              </span>
            ) : (
              <span>
                {isId ? 'Sudah punya akun?' : 'Already have an account?'}{' '}
                <button type="button" onClick={() => openAuthModal('login')} style={{ background: 'transparent', border: 'none', color: 'var(--brand-primary)', fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: '12px' }}>
                  {isId ? 'Masuk' : 'Sign in'}
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

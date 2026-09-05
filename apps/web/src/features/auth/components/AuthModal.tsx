'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Phone,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Send,
  ExternalLink,
  ShieldCheck,
  LogOut,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';

export function AuthModal() {
  const isOpen = useAuthStore((s) => s.isAuthModalOpen);
  const mode = useAuthStore((s) => s.authModalMode);
  const setAuthModalOpen = useAuthStore((s) => s.setAuthModalOpen);
  const user = useAuthStore((s) => s.user);
  const needsPhoneVerification = useAuthStore((s) => s.needsPhoneVerification);
  const signOut = useAuthStore((s) => s.signOut);
  const saveVerifiedPhone = useAuthStore((s) => s.saveVerifiedPhone);
  const signInWithOAuth = useAuthStore((s) => s.signInWithOAuth);

  const language = useSettingsStore((s) => s.language);
  const isId = language === 'id';

  const [mounted, setMounted] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Phone & Telegram Verification State
  const [phone, setPhone] = useState('');
  const [telegramToken, setTelegramToken] = useState<string | null>(null);
  const [telegramBotUrl, setTelegramBotUrl] = useState<string | null>(null);
  const [isWaitingTelegram, setIsWaitingTelegram] = useState(false);
  const [isTelegramVerified, setIsTelegramVerified] = useState(false);
  const [isTelegramLoading, setIsTelegramLoading] = useState(false);
  const [telegramCooldown, setTelegramCooldown] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cooldown countdown timer for telegram button
  useEffect(() => {
    if (telegramCooldown <= 0) return;
    const timer = setInterval(() => {
      setTelegramCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [telegramCooldown]);

  // Reset state when mode or open changes
  useEffect(() => {
    if (isOpen) {
      setLocalError(null);
      setSuccessMessage(null);
      setIsGoogleLoading(false);
      if (!needsPhoneVerification) {
        setPhone('');
        setTelegramToken(null);
        setTelegramBotUrl(null);
        setIsWaitingTelegram(false);
        setIsTelegramVerified(false);
      }
    }
  }, [isOpen, mode, needsPhoneVerification]);

  // Poll Telegram verification status every 2.5s while waiting
  useEffect(() => {
    if (!telegramToken || !isWaitingTelegram || isTelegramVerified) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/auth/telegram-verify?token=${telegramToken}`);
        const data = await res.json();
        if (data.verified) {
          setIsTelegramVerified(true);
          setIsWaitingTelegram(false);
          setSuccessMessage(
            isId ? 'Nomor HP Berhasil Diverifikasi!' : 'Phone Number Verified Successfully!'
          );

          // Save verified phone to Supabase user metadata
          if (data.phone) {
            await saveVerifiedPhone(data.phone, data.telegramUserId);
          }

          setTimeout(() => {
            setAuthModalOpen(false);
            window.location.reload();
          }, 1200);
        }
      } catch {
        // Silent poll error
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [telegramToken, isWaitingTelegram, isTelegramVerified, saveVerifiedPhone, setAuthModalOpen, isId]);

  const handleStartTelegramVerify = async () => {
    if (!phone.trim()) {
      setLocalError(
        isId ? 'Harap masukkan nomor WhatsApp/HP Anda' : 'Please enter your phone number'
      );
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
        setTelegramCooldown(60);
        if (data.botUrl) window.open(data.botUrl, '_blank');
      } else {
        if (data.remainingSeconds) {
          setTelegramCooldown(data.remainingSeconds);
        }
        setLocalError(
          data.error || (isId ? 'Gagal memulai verifikasi Telegram' : 'Failed to start Telegram verification')
        );
      }
    } catch {
      setLocalError(isId ? 'Terjadi kesalahan jaringan' : 'Network error occurred');
    } finally {
      setIsTelegramLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    setSuccessMessage(null);
    setIsGoogleLoading(true);
    const { error } = await signInWithOAuth('google');
    setIsGoogleLoading(false);
    if (error) {
      setLocalError(error.message);
    }
  };

  if (!isOpen || !mounted) return null;

  const isPhoneGateMode = mode === 'verify_phone' || needsPhoneVerification;

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px 9px 36px',
    borderRadius: 'var(--radius-md, 8px)',
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
      }}
      onClick={(e) => {
        if (!isPhoneGateMode && e.target === e.currentTarget) {
          setAuthModalOpen(false);
        }
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '430px',
          backgroundColor: 'var(--bg-surface, #18181b)',
          border: '1px solid var(--border-strong, rgba(255,255,255,0.15))',
          borderRadius: 'var(--radius-lg, 16px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          color: 'var(--text-primary)',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isPhoneGateMode ? (
                <>
                  <ShieldCheck size={20} color="var(--brand-primary, #0073EA)" />
                  <span>{isId ? 'Verifikasi Nomor HP' : 'Verify Phone Number'}</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} color="#f59e0b" />
                  <span>{isId ? 'Masuk ke Anticeil' : 'Welcome to Anticeil'}</span>
                </>
              )}
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: 1.45 }}>
              {isPhoneGateMode
                ? isId
                  ? `Akun Anda (${user?.email || 'Google'}) terhubung. Untuk keamanan dan mengaktifkan kuota AI, verifikasi nomor HP 1 kali via Bot Telegram.`
                  : `Your account (${user?.email || 'Google'}) is connected. To prevent bots and activate AI credits, verify your phone once via Telegram Bot.`
                : isId
                ? 'Masuk atau daftar dengan Akun Google untuk sinkronisasi workspace cloud, backup multi-perangkat, dan jatah AI harian.'
                : 'Sign in or sign up with your Google Account for instant cloud sync, multi-device backup, and daily AI credits.'}
            </p>
          </div>
          {!isPhoneGateMode && (
            <button
              type="button"
              onClick={() => setAuthModalOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Feedback Alerts */}
        {localError && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-md, 8px)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--accent-danger, #ef4444)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--accent-danger, #ef4444)',
              fontSize: '12px',
            }}
          >
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{localError}</span>
          </div>
        )}

        {successMessage && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-md, 8px)',
              background: 'rgba(0, 200, 117, 0.1)',
              border: '1px solid var(--accent-success, #00C875)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--accent-success, #00C875)',
              fontSize: '12px',
            }}
          >
            <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ── MODE: PHONE VERIFICATION GATE (FOR NEW ACCOUNTS) ── */}
        {isPhoneGateMode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}
              >
                {isId ? 'Nomor HP / WhatsApp' : 'Phone Number'}
              </label>
              <div style={{ position: 'relative' }}>
                <Phone
                  size={15}
                  color={isTelegramVerified ? 'var(--accent-success, #00C875)' : 'var(--text-muted)'}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={isId ? '+62 812-3456-7890' : '+1 234 567 8900'}
                  disabled={isTelegramVerified || isWaitingTelegram}
                  style={{
                    ...inputStyle,
                    border: isTelegramVerified
                      ? '1px solid var(--accent-success, #00C875)'
                      : '1px solid var(--border-subtle)',
                    background: isTelegramVerified ? 'rgba(0, 200, 117, 0.06)' : 'var(--bg-subtle)',
                  }}
                />
              </div>
            </div>

            {/* Telegram Action Box */}
            {!isTelegramVerified ? (
              <div
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md, 10px)',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Send size={15} color="#0088cc" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {isId ? 'Verifikasi Instan via Telegram Bot' : 'Instant Verification via Telegram Bot'}
                  </span>
                </div>
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                  {isId
                    ? 'Klik tombol di bawah untuk membuka Bot Telegram Anticeil, lalu tekan Start dan Bagikan Kontak untuk verifikasi otomatis.'
                    : 'Click below to open Anticeil Telegram Bot, then press Start and Share Contact to verify automatically.'}
                </p>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleStartTelegramVerify}
                    disabled={isTelegramLoading || telegramCooldown > 0}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md, 8px)',
                      border: 'none',
                      background: '#0088cc',
                      color: '#fff',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: isTelegramLoading || telegramCooldown > 0 ? 'not-allowed' : 'pointer',
                      opacity: isTelegramLoading || telegramCooldown > 0 ? 0.7 : 1,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isTelegramLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : telegramCooldown > 0 ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>{isId ? `Tunggu ${telegramCooldown}s` : `Wait ${telegramCooldown}s`}</span>
                      </>
                    ) : (
                      <>
                        <ExternalLink size={14} />
                        <span>{isId ? 'Buka Bot Telegram' : 'Open Telegram Bot'}</span>
                      </>
                    )}
                  </button>

                  {isWaitingTelegram && telegramBotUrl && (
                    <button
                      type="button"
                      onClick={() => window.open(telegramBotUrl, '_blank')}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md, 8px)',
                        border: '1px solid var(--border-subtle)',
                        background: 'transparent',
                        color: 'var(--text-secondary)',
                        fontSize: '12.5px',
                        cursor: 'pointer',
                      }}
                      title={isId ? 'Buka Ulang Link Bot' : 'Re-open Bot Link'}
                    >
                      <ExternalLink size={14} />
                    </button>
                  )}
                </div>

                {isWaitingTelegram && (
                  <p style={{ fontSize: '11px', color: '#0088cc', margin: 0, textAlign: 'center', fontWeight: 500 }}>
                    {isId
                      ? '🔄 Mendeteksi otomatis... Setelah menekan Start di Telegram, browser akan langsung lanjut.'
                      : '🔄 Auto-detecting... After pressing Start in Telegram, your browser will advance automatically.'}
                  </p>
                )}
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px',
                  background: 'rgba(0, 200, 117, 0.08)',
                  border: '1px solid rgba(0, 200, 117, 0.3)',
                  borderRadius: 'var(--radius-md, 8px)',
                }}
              >
                <CheckCircle2 size={16} color="var(--accent-success, #00C875)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-success, #00C875)' }}>
                  {isId ? 'Nomor HP Terverifikasi' : 'Phone Number Verified'}
                </span>
              </div>
            )}

            {/* Logout / Switch Account option */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => signOut()}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <LogOut size={13} />
                <span>{isId ? 'Ganti akun / Keluar' : 'Switch account / Sign out'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* ── MODE: 100% GOOGLE OAUTH ONLY ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '4px' }}>
            {/* Value Highlights */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '12px 14px',
                background: 'var(--bg-main, rgba(255,255,255,0.03))',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={14} color="#f59e0b" style={{ flexShrink: 0 }} />
                <span>{isId ? 'Login instan 1-klik tanpa repot mengingat password' : 'Instant 1-click sign in without password hassle'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={14} color="#10b981" style={{ flexShrink: 0 }} />
                <span>{isId ? 'Keamanan data dan autentikasi resmi Google OAuth 2.0' : 'Official Google OAuth 2.0 enterprise-grade security'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={14} color="#3b82f6" style={{ flexShrink: 0 }} />
                <span>{isId ? 'Gratis 50 kuota AI kredit harian otomatis aktif' : 'Free 50 daily AI credits automatically activated'}</span>
              </div>
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '12px 18px',
                borderRadius: '10px',
                border: '1px solid var(--border-strong, rgba(255,255,255,0.2))',
                background: 'var(--bg-surface, #ffffff)',
                color: 'var(--text-primary, #111827)',
                fontSize: '14px',
                fontWeight: 650,
                cursor: isGoogleLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
                transition: 'all 0.15s ease',
              }}
            >
              {isGoogleLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{isId ? 'Lanjutkan dengan Google' : 'Continue with Google'}</span>
            </button>

            {/* Privacy & Trust Footer */}
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', margin: '4px 0 0', lineHeight: 1.5 }}>
              {isId
                ? 'Dengan melanjutkan, Anda menyetujui Ketentuan Layanan & Kebijakan Privasi Anticeil. 100% Aman & Bebas Password.'
                : "By continuing, you agree to Anticeil's Terms of Service & Privacy Policy. 100% Secure & Passwordless."}
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

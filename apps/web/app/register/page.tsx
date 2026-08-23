'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  Phone,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Eye,
  EyeOff,
  ExternalLink,
  Loader2,
  Check,
  Send,
} from 'lucide-react';
import { useAuthStore } from '../../src/features/auth/store/useAuthStore';
import { useSettingsStore } from '../../src/features/settings/store/useSettingsStore';
import { getTranslation } from '@anticeil/core';
import { TurnstileWidget } from '../../src/shared/components/TurnstileWidget';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isFocusedEmail, setIsFocusedEmail] = useState(false);
  const [isFocusedPhone, setIsFocusedPhone] = useState(false);
  const [isFocusedPassword, setIsFocusedPassword] = useState(false);
  const [isFocusedConfirm, setIsFocusedConfirm] = useState(false);

  // Telegram verification states
  const [telegramToken, setTelegramToken] = useState<string | null>(null);
  const [telegramBotUrl, setTelegramBotUrl] = useState<string | null>(null);
  const [isWaitingTelegram, setIsWaitingTelegram] = useState(false);
  const [isTelegramVerified, setIsTelegramVerified] = useState(false);

  // Cloudflare Turnstile state
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const authError = useAuthStore((s) => s.error);
  const signUpWithPassword = useAuthStore((s) => s.signUpWithPassword);
  const initializeAuth = useAuthStore((s) => s.initializeAuth);
  const clearError = useAuthStore((s) => s.clearError);

  const language = useSettingsStore((s) => s.language);
  const ta = getTranslation(language).auth;

  useEffect(() => {
    initializeAuth();
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [initializeAuth]);

  // If already logged in, redirect to /chat
  useEffect(() => {
    if (user) {
      router.push('/chat');
    }
  }, [user, router]);

  // Polling Telegram verification status
  useEffect(() => {
    if (!telegramToken || !isWaitingTelegram || isTelegramVerified) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/auth/telegram-verify?token=${telegramToken}`);
        const data = await res.json();
        if (data.verified) {
          setIsTelegramVerified(true);
          setIsWaitingTelegram(false);
          clearInterval(interval);
        }
      } catch (err) {
        console.warn('Telegram poll error:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [telegramToken, isWaitingTelegram, isTelegramVerified]);

  const handleStartTelegramVerify = async () => {
    if (!phone.trim()) {
      setLocalError(language === 'id' ? 'Silakan masukkan nomor HP terlebih dahulu.' : 'Please enter your phone number first.');
      return;
    }
    setLocalError(null);
    try {
      const res = await fetch('/api/auth/telegram-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-session', phone: phone.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setTelegramToken(data.token);
        setTelegramBotUrl(data.botUrl);
        setIsWaitingTelegram(true);
        // Open Telegram Bot in new tab
        if (typeof window !== 'undefined') {
          window.open(data.botUrl, '_blank', 'noopener,noreferrer');
        }
      }
    } catch (err) {
      console.error('Failed to initiate Telegram verify:', err);
    }
  };

  // Instant simulate verification for quick dev testing or direct manual confirm
  const handleSimulateTelegramConfirm = async () => {
    if (!telegramToken) return;
    try {
      const res = await fetch('/api/auth/telegram-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm', token: telegramToken, phone: phone.trim() }),
      });
      const data = await res.json();
      if (data.verified) {
        setIsTelegramVerified(true);
        setIsWaitingTelegram(false);
      }
    } catch (err) {
      console.error('Manual confirm error:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);
    clearError();

    if (!email.trim() || !password || !confirmPassword || !phone.trim()) {
      setLocalError(ta.errorFillAll);
      return;
    }

    if (password !== confirmPassword) {
      setLocalError(ta.errorPasswordMatch);
      return;
    }

    if (password.length < 6) {
      setLocalError(ta.errorPasswordLength);
      return;
    }

    if (!isTelegramVerified) {
      setLocalError(ta.errorTelegramRequired);
      return;
    }

    const { error } = await signUpWithPassword(email.trim(), password);
    if (!error) {
      setSuccessMessage(ta.registerSuccess);
      setTimeout(() => {
        router.push(`/login?registered=true&email=${encodeURIComponent(email.trim())}`);
      }, 1500);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FAF9F5',
        padding: '90px 24px 40px 24px',
        color: '#181B34',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* 1. Apple/Linear-Style Floating Frosted Glass Capsule App Bar */}
      <header
        style={{
          position: 'fixed',
          top: '12px',
          left: 0,
          right: 0,
          zIndex: 1000,
          padding: '0',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            maxWidth: '1180px',
            width: '100%',
            height: '56px',
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: '9999px',
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid rgba(230, 225, 215, 0.85)',
            boxShadow: '0 8px 28px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
            pointerEvents: 'auto',
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Left: Brand Logo */}
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              textDecoration: 'none',
              color: '#181B34',
            }}
          >
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0073EA 0%, #784BD1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0, 115, 234, 0.3)',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 6px)', gap: '3px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#E2445C' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00C875' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FDAB3D' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFFFFF' }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
              <span style={{ fontWeight: 800, fontSize: '17.5px', letterSpacing: '-0.03em', color: '#181B34' }}>
                anticeil
              </span>
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#0073EA', background: 'rgba(0, 115, 234, 0.08)', padding: '1px 5px', borderRadius: '4px', border: '1px solid rgba(0, 115, 234, 0.2)' }}>
                .os
              </span>
            </div>
          </Link>

          {/* Right: Action Hub */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                color: '#4B5563',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 600,
                padding: '6px 14px',
                borderRadius: '9999px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#0073EA';
                e.currentTarget.style.background = 'rgba(0, 115, 234, 0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#4B5563';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <ArrowLeft size={14} />
              <span>{ta.backToHome}</span>
            </Link>

            <Link
              href="/login"
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#FFFFFF',
                textDecoration: 'none',
                padding: '8px 18px',
                borderRadius: '9999px',
                background: 'linear-gradient(135deg, #0073EA 0%, #0056B3 100%)',
                boxShadow: '0 4px 14px rgba(0, 115, 234, 0.35)',
                transition: 'all 0.15s ease',
              }}
              className="btn-monday-primary"
            >
              {ta.signIn}
            </Link>
          </div>
        </div>
      </header>

      {/* Background Soft Chromatic Glow */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '750px',
          height: '450px',
          background: 'radial-gradient(ellipse at center, rgba(120, 75, 209, 0.12) 0%, rgba(0, 115, 234, 0.06) 50%, transparent 80%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Main Card */}
      <div
        className="light-auth-card"
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#FFFFFF',
          border: '1.5px solid #D0D4E4',
          borderRadius: '20px',
          padding: '40px 32px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.06), 0 0 25px rgba(0, 115, 234, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '22px',
          zIndex: 1,
          position: 'relative',
        }}
      >
        {/* Card Title */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '6px', color: '#181B34' }}>
            {ta.registerTitle}
          </h1>
          <p style={{ fontSize: '14px', color: '#5F6377', lineHeight: 1.5 }}>
            {ta.registerSubtitle}
          </p>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              background: 'rgba(0, 200, 117, 0.1)',
              border: '1px solid rgba(0, 200, 117, 0.35)',
              borderRadius: '10px',
              color: '#08834F',
              fontSize: '13px',
              lineHeight: 1.4,
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={17} style={{ flexShrink: 0, color: '#00C875' }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {(localError || authError) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              background: 'rgba(226, 68, 92, 0.08)',
              border: '1px solid rgba(226, 68, 92, 0.3)',
              borderRadius: '10px',
              color: '#D11C38',
              fontSize: '13px',
              lineHeight: 1.4,
              fontWeight: 500,
            }}
          >
            <AlertCircle size={17} style={{ flexShrink: 0, color: '#E2445C' }} />
            <span>{localError || authError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Email Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: '#181B34' }}>
              {ta.emailLabel}
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: '#FFFFFF',
                border: isFocusedEmail ? '1.5px solid #0073EA' : '1.5px solid #D0D4E4',
                boxShadow: isFocusedEmail ? '0 0 0 3px rgba(0, 115, 234, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.04)',
                borderRadius: '10px',
                padding: '12px 14px',
                transition: 'all 0.2s ease',
              }}
            >
              <Mail size={16} color={isFocusedEmail ? '#0073EA' : '#8D91A5'} style={{ flexShrink: 0 }} />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsFocusedEmail(true)}
                onBlur={() => setIsFocusedEmail(false)}
                required
                className="light-input"
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#181B34',
                  fontSize: '14px',
                  fontWeight: 500,
                  width: '100%',
                }}
              />
            </div>
          </div>

          {/* Phone Number Input + Telegram Verification */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#181B34' }}>
                {ta.phoneLabel}
              </label>
              {isTelegramVerified && (
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#00A86B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={13} /> {ta.telegramVerified}
                </span>
              )}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: isTelegramVerified ? '#F4FBF7' : '#FFFFFF',
                border: isTelegramVerified
                  ? '1.5px solid #00C875'
                  : isFocusedPhone
                  ? '1.5px solid #0073EA'
                  : '1.5px solid #D0D4E4',
                boxShadow: isFocusedPhone ? '0 0 0 3px rgba(0, 115, 234, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.04)',
                borderRadius: '10px',
                padding: '12px 14px',
                transition: 'all 0.2s ease',
              }}
            >
              <Phone size={16} color={isTelegramVerified ? '#00C875' : isFocusedPhone ? '#0073EA' : '#8D91A5'} style={{ flexShrink: 0 }} />
              <input
                type="tel"
                placeholder={ta.phonePlaceholder}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onFocus={() => setIsFocusedPhone(true)}
                onBlur={() => setIsFocusedPhone(false)}
                required
                disabled={isTelegramVerified}
                className="light-input"
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#181B34',
                  fontSize: '14px',
                  fontWeight: 500,
                  width: '100%',
                }}
              />
            </div>

            {/* Telegram Deep Link Verification Box */}
            {!isTelegramVerified ? (
              <div
                style={{
                  marginTop: '4px',
                  padding: '12px',
                  background: '#F0F7FF',
                  border: '1px solid #C2E0FF',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#0056B3', fontWeight: 600 }}>
                  <Send size={14} color="#0073EA" />
                  <span>{ta.verifyTelegram}</span>
                </div>
                <p style={{ fontSize: '11.5px', color: '#4A6282', lineHeight: 1.4, margin: 0 }}>
                  {ta.telegramPrompt}
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleStartTelegramVerify}
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      background: '#0073EA',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0, 115, 234, 0.25)',
                    }}
                  >
                    {isWaitingTelegram ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>{ta.telegramVerifying}</span>
                      </>
                    ) : (
                      <>
                        <ExternalLink size={13} />
                        <span>{ta.telegramOpenBtn}</span>
                      </>
                    )}
                  </button>

                  {/* Dev / Quick Test Instant Verification */}
                  {isWaitingTelegram && (
                    <button
                      type="button"
                      onClick={handleSimulateTelegramConfirm}
                      style={{
                        padding: '8px 10px',
                        background: '#E8F5E9',
                        color: '#2E7D32',
                        border: '1px solid #A5D6A7',
                        borderRadius: '8px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                      title="Simulasi otomatis konfirmasi bot untuk pengujian"
                    >
                      ✓ Konfirmasi Instan
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div
                style={{
                  marginTop: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: '#08834F',
                  fontWeight: 600,
                }}
              >
                <CheckCircle2 size={14} color="#00C875" />
                <span>Nomor HP siap digunakan (100% Free Anti-Sybil Proof)</span>
              </div>
            )}
          </div>

          {/* Password Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: '#181B34' }}>
              {ta.passwordLabel}
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: '#FFFFFF',
                border: isFocusedPassword ? '1.5px solid #0073EA' : '1.5px solid #D0D4E4',
                boxShadow: isFocusedPassword ? '0 0 0 3px rgba(0, 115, 234, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.04)',
                borderRadius: '10px',
                padding: '12px 14px',
                transition: 'all 0.2s ease',
              }}
            >
              <Lock size={16} color={isFocusedPassword ? '#0073EA' : '#8D91A5'} style={{ flexShrink: 0 }} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={ta.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsFocusedPassword(true)}
                onBlur={() => setIsFocusedPassword(false)}
                required
                className="light-input"
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#181B34',
                  fontSize: '14px',
                  fontWeight: 500,
                  width: '100%',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#8D91A5',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: '#181B34' }}>
              {ta.confirmPasswordLabel}
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: '#FFFFFF',
                border: isFocusedConfirm ? '1.5px solid #0073EA' : '1.5px solid #D0D4E4',
                boxShadow: isFocusedConfirm ? '0 0 0 3px rgba(0, 115, 234, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.04)',
                borderRadius: '10px',
                padding: '12px 14px',
                transition: 'all 0.2s ease',
              }}
            >
              <Lock size={16} color={isFocusedConfirm ? '#0073EA' : '#8D91A5'} style={{ flexShrink: 0 }} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={ta.confirmPasswordPlaceholder}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={() => setIsFocusedConfirm(true)}
                onBlur={() => setIsFocusedConfirm(false)}
                required
                className="light-input"
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#181B34',
                  fontSize: '14px',
                  fontWeight: 500,
                  width: '100%',
                }}
              />
            </div>
          </div>

          {/* Cloudflare Turnstile Bot Protection Widget */}
          <TurnstileWidget
            onVerify={(token) => setTurnstileToken(token)}
            theme="light"
          />

          {/* Privacy Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: '#5F6377',
              padding: '2px 0',
            }}
          >
            <ShieldCheck size={15} color="#00C875" />
            <span>{ta.privacyBadge}</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !isTelegramVerified}
            style={{
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: !isTelegramVerified ? '#8D91A5' : '#0073EA',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              padding: '13px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: isLoading || !isTelegramVerified ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              boxShadow: isTelegramVerified ? '0 4px 18px rgba(0, 115, 234, 0.4)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <span>{isLoading ? ta.creatingAccount : ta.createFreeAccount}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Footer Link */}
        <div style={{ textAlign: 'center', fontSize: '13.5px', color: '#5F6377', marginTop: '2px' }}>
          {ta.alreadyHaveAccount}{' '}
          <Link
            href="/login"
            style={{
              color: '#0073EA',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            {ta.signIn}
          </Link>
        </div>
      </div>

      {/* Trust Badges Footer */}
      <div
        style={{
          marginTop: '28px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          fontSize: '12.5px',
          color: '#5F6377',
          zIndex: 1,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <ShieldCheck size={15} color="#00C875" /> {ta.trustClientSide}
        </span>
        <span style={{ color: '#D0D4E4' }}>•</span>
        <span style={{ fontWeight: 600 }}>{ta.trustZeroProxy}</span>
        <span style={{ color: '#D0D4E4' }}>•</span>
        <span style={{ fontWeight: 600 }}>{ta.trustEncrypted}</span>
      </div>
    </div>
  );
}

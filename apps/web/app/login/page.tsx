'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  Zap,
  CheckCircle2,
  Send,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '../../src/features/auth/store/useAuthStore';
import { useSettingsStore } from '../../src/features/settings/store/useSettingsStore';
import { getTranslation } from '@anticeil/core';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isFocusedEmail, setIsFocusedEmail] = useState(false);
  const [isFocusedPassword, setIsFocusedPassword] = useState(false);

  // Email Verification & Cooldown states
  const [isJustRegistered, setIsJustRegistered] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [resendStatusMsg, setResendStatusMsg] = useState<string | null>(null);

  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const authError = useAuthStore((s) => s.error);
  const signInWithPassword = useAuthStore((s) => s.signInWithPassword);
  const initializeAuth = useAuthStore((s) => s.initializeAuth);
  const clearError = useAuthStore((s) => s.clearError);

  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const ta = getTranslation(language).auth;

  useEffect(() => {
    initializeAuth();
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [initializeAuth]);

  // Read URL query parameters
  useEffect(() => {
    if (searchParams) {
      const isReg = searchParams.get('registered') === 'true';
      const emailParam = searchParams.get('email');
      if (isReg) {
        setIsJustRegistered(true);
        // Start first 60s cooldown immediately upon registration
        setResendCooldown(60);
      }
      if (emailParam) {
        setEmail(decodeURIComponent(emailParam));
      }
    }
  }, [searchParams]);

  // 60-Second Cooldown Timer Tick
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // If already logged in, redirect to /chat
  useEffect(() => {
    if (user) {
      router.push('/chat');
    }
  }, [user, router]);

  const handleResendEmail = async () => {
    if (!email.trim() || resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setResendStatusMsg(null);

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setResendCooldown(60);
        setResendStatusMsg(ta.resendSuccess);
      } else {
        setResendStatusMsg(data.error || 'Gagal mengirim ulang email.');
      }
    } catch (err) {
      console.error('Failed to resend verification email:', err);
      setResendStatusMsg('Terjadi kesalahan jaringan. Coba lagi.');
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email.trim() || !password) {
      setLocalError(ta.errorFillEmail);
      return;
    }

    const { error } = await signInWithPassword(email.trim(), password);
    if (!error) {
      router.push('/chat');
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
              gap: '10px',
              textDecoration: 'none',
            }}
          >
            <img
      src="/anticeil-logo.png"
      alt="Anticeil Logo"
      style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '6px' }}
    />
    <span style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.03em', color: '#181B34' }}>
      Anticeil
    </span>
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
              href="/register"
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
              {ta.createAccount}
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
          background: 'radial-gradient(ellipse at center, rgba(0, 115, 234, 0.12) 0%, rgba(120, 75, 209, 0.06) 50%, transparent 80%)',
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
          gap: '20px',
          zIndex: 1,
          position: 'relative',
        }}
      >
        {/* Card Title */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '6px', color: '#181B34' }}>
            {ta.loginTitle}
          </h1>
          <p style={{ fontSize: '14px', color: '#5F6377', lineHeight: 1.5 }}>
            {ta.loginSubtitle}
          </p>
        </div>

        {/* Just Registered / Email Verification Banner */}
        {isJustRegistered && (
          <div
            style={{
              padding: '14px',
              background: '#F0F9FF',
              border: '1.5px solid #BAE6FD',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0369A1', fontWeight: 700, fontSize: '13px' }}>
              <CheckCircle2 size={16} color="#0284C7" style={{ flexShrink: 0 }} />
              <span>Akun Berhasil Dibuat!</span>
            </div>
            <p style={{ fontSize: '12px', color: '#334155', lineHeight: 1.45, margin: 0 }}>
              {ta.emailVerificationSent}
            </p>

            {/* Resend Action with 60s cooldown */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid #E0F2FE' }}>
              <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                Belum menerima email?
              </span>
              <button
                type="button"
                onClick={handleResendEmail}
                disabled={resendCooldown > 0 || isResending}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: resendCooldown > 0 ? '#94A3B8' : '#0284C7',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: resendCooldown > 0 || isResending ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '2px 6px',
                }}
              >
                {isResending ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    <span>Mengirim...</span>
                  </>
                ) : resendCooldown > 0 ? (
                  <span>{ta.resendCooldown} ({resendCooldown}s)</span>
                ) : (
                  <>
                    <Send size={12} />
                    <span>{ta.resendEmail}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Resend Status Toast / Message */}
        {resendStatusMsg && (
          <div
            style={{
              padding: '10px 12px',
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: '8px',
              color: '#166534',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <CheckCircle2 size={14} color="#22C55E" />
            <span>{resendStatusMsg}</span>
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
                transition: 'all 0.15s ease',
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
                transition: 'all 0.15s ease',
              }}
            >
              <Lock size={16} color={isFocusedPassword ? '#0073EA' : '#8D91A5'} style={{ flexShrink: 0 }} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: '#0073EA',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              padding: '13px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              boxShadow: '0 4px 18px rgba(0, 115, 234, 0.4)',
              transition: 'all 0.15s ease',
            }}
          >
            <span>{isLoading ? ta.signingIn : ta.signInButton}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ flex: 1, height: '1px', background: '#E8E2D5' }} />
          <span style={{ fontSize: '11px', color: '#8D91A5', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
            {ta.or}
          </span>
          <div style={{ flex: 1, height: '1px', background: '#E8E2D5' }} />
        </div>

        {/* Guest Mode CTA */}
        <Link
          href="/chat"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: '#F8FAFC',
            border: '1.5px solid #D8DCE8',
            borderRadius: '10px',
            padding: '12px',
            color: '#181B34',
            fontSize: '13.5px',
            fontWeight: 700,
            textDecoration: 'none',
            transition: 'all 0.15s ease',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
          }}
        >
          <Zap size={15} color="#0073EA" />
          <span>{ta.continueAsGuest}</span>
        </Link>

        {/* Footer Link */}
        <div style={{ textAlign: 'center', fontSize: '13.5px', color: '#5F6377', marginTop: '2px' }}>
          {ta.noAccount}{' '}
          <Link
            href="/register"
            style={{
              color: '#0073EA',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            {ta.createFree}
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#FAF9F5' }} />}>
      <LoginForm />
    </Suspense>
  );
}

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
  Send,
  ExternalLink,
} from 'lucide-react';
import { getTranslation } from '@anticeil/core';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';

export function AuthModal() {
  const isOpen = useAuthStore((s) => s.isAuthModalOpen);
  const mode = useAuthStore((s) => s.authModalMode);
  const setAuthModalOpen = useAuthStore((s) => s.setAuthModalOpen);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);

  const signUpWithPassword = useAuthStore((s) => s.signUpWithPassword);

  const language = useSettingsStore((s) => s.language);
  const t = getTranslation(language);
  const ta = t.auth;

  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Email verification resend state
  const [isEmailUnverified, setIsEmailUnverified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResendingEmail, setIsResendingEmail] = useState(false);

  // Telegram verification
  const [telegramToken, setTelegramToken] = useState<string | null>(null);
  const [telegramBotUrl, setTelegramBotUrl] = useState<string | null>(null);
  const [isWaitingTelegram, setIsWaitingTelegram] = useState(false);
  const [isTelegramVerified, setIsTelegramVerified] = useState(false);
  const [isTelegramLoading, setIsTelegramLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cooldown countdown timer for resend email
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

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
      setIsEmailUnverified(false);
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
      } catch {
        /* ignore */
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [telegramToken, isWaitingTelegram, isTelegramVerified]);

  const handleStartTelegramVerify = async () => {
    if (!phone.trim()) {
      setLocalError(ta.enterPhoneFirst);
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
        setLocalError(data.error || ta.failedStartVerification);
      }
    } catch {
      setLocalError(ta.networkError);
    } finally {
      setIsTelegramLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const targetEmail = email.trim();
    if (!targetEmail || resendCooldown > 0 || isResendingEmail) return;

    setIsResendingEmail(true);
    setLocalError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setResendCooldown(60);
        setSuccessMessage(ta.verificationEmailResent);
      } else {
        if (data.remainingSeconds) {
          setResendCooldown(data.remainingSeconds);
        }
        setLocalError(data.error || ta.failedResendEmail);
      }
    } catch {
      setLocalError(ta.networkError);
    } finally {
      setIsResendingEmail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) {
      setLocalError(ta.enterEmailAndPassword);
      return;
    }

    if (mode === 'register') {
      if (!confirmPassword.trim()) {
        setLocalError(ta.confirmPasswordReq);
        return;
      }
      if (password !== confirmPassword) {
        setLocalError(ta.passwordsDoNotMatch);
        return;
      }
      if (!phone.trim()) {
        setLocalError(ta.phoneRequired);
        return;
      }
      if (!isTelegramVerified) {
        setLocalError(ta.telegramRequired);
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
          setIsEmailUnverified(true);
          setLocalError(ta.emailNotConfirmed);
        } else if (lower.includes('invalid login') || lower.includes('invalid credentials')) {
          setIsEmailUnverified(false);
          setLocalError(ta.invalidCredentials);
        } else {
          setIsEmailUnverified(false);
          setLocalError(msg || ta.loginFailed);
        }
      } else {
        setIsEmailUnverified(false);
        setAuthModalOpen(false);
        window.location.reload();
      }
    } else {
      const { error } = await signUpWithPassword(email.trim(), password);
      setIsSubmitting(false);
      if (error) {
        setLocalError(error.message);
      } else {
        setSuccessMessage(ta.accountCreatedCheckEmail);
      }
    }
  };

  if (!isOpen || !mounted) return null;

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
        overflowY: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setAuthModalOpen(false);
      }}
    >
      <div
        className="modal-responsive-container"
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
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
            <img
              src="/anticeil-logo.png"
              alt="Anticeil Logo"
              style={{ width: '32px', height: '32px', objectFit: 'contain', flexShrink: 0 }}
            />
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {mode === 'login' ? ta.signInTitle : ta.createAccountTitle}
              </h2>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                {mode === 'login' ? ta.signInSubtitle : ta.createAccountSubtitle}
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
              borderRadius: 'var(--radius-sm, 6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}
        >
          {localError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-md, 8px)',
                color: 'var(--accent-danger, #ef4444)',
                fontSize: '12.5px',
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{localError}</span>
            </div>
          )}

          {/* Conditional Resend Email Verification Button with 60s Cooldown */}
          {isEmailUnverified && mode === 'login' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md, 8px)',
                fontSize: '12px',
              }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>{ta.didntGetEmail}</span>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isResendingEmail || resendCooldown > 0}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--brand-primary, #0073EA)',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: resendCooldown > 0 || isResendingEmail ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '2px 4px',
                  transition: 'color 0.15s ease',
                }}
              >
                {isResendingEmail ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    <span>{ta.sending}</span>
                  </>
                ) : resendCooldown > 0 ? (
                  <span>{`${ta.resendCooldownPrefix} (${resendCooldown}s)`}</span>
                ) : (
                  <span>{ta.resendVerificationEmail}</span>
                )}
              </button>
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
                borderRadius: 'var(--radius-md, 8px)',
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
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              {ta.emailLabel}
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={15}
                color="var(--text-muted)"
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={ta.emailPlaceholder}
                required
                style={inputStyle}
              />
            </div>
          </div>

          {/* Password */}
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
              {ta.passwordLabel}
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={15}
                color="var(--text-muted)"
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={ta.passwordPlaceholder}
                required
                style={{ ...inputStyle, padding: '9px 36px 9px 36px' }}
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

          {/* Confirm Password — register only */}
          {mode === 'register' && (
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
                {ta.confirmPasswordLabel}
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={15}
                  color="var(--text-muted)"
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={ta.passwordPlaceholder}
                  required
                  style={inputStyle}
                />
              </div>
            </div>
          )}

          {/* Phone + Telegram — register only */}
          {mode === 'register' && (
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
                {ta.phoneLabel}
              </label>
              {/* Phone Input */}
              <div style={{ position: 'relative', marginBottom: '8px' }}>
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
                  placeholder={ta.phonePlaceholder}
                  disabled={isTelegramVerified}
                  style={{
                    ...inputStyle,
                    border: isTelegramVerified
                      ? '1px solid var(--accent-success, #00C875)'
                      : '1px solid var(--border-subtle)',
                    background: isTelegramVerified ? 'rgba(0, 200, 117, 0.06)' : 'var(--bg-subtle)',
                    opacity: isTelegramVerified ? 0.8 : 1,
                  }}
                />
              </div>

              {/* Telegram Verification Box */}
              {!isTelegramVerified ? (
                <div
                  style={{
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md, 10px)',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Send size={14} color="#0088cc" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {ta.telegramVerifyTitle}
                    </span>
                  </div>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                    {ta.telegramVerifyDesc}
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
                        borderRadius: 'var(--radius-md, 8px)',
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
                          <span>{ta.waitingTelegram}</span>
                        </>
                      ) : (
                        <>
                          <ExternalLink size={13} />
                          <span>{ta.openTelegramBot}</span>
                        </>
                      )}
                    </button>

                    {/* Re-open bot link if already waiting */}
                    {isWaitingTelegram && telegramBotUrl && (
                      <button
                        type="button"
                        onClick={() => window.open(telegramBotUrl, '_blank')}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-md, 8px)',
                          border: '1px solid var(--border-subtle)',
                          background: 'transparent',
                          color: 'var(--text-secondary)',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        <ExternalLink size={13} />
                      </button>
                    )}
                  </div>

                  {isWaitingTelegram && (
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, textAlign: 'center' }}>
                      {ta.telegramAutoProceed}
                    </p>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    background: 'rgba(0, 200, 117, 0.08)',
                    border: '1px solid rgba(0, 200, 117, 0.3)',
                    borderRadius: 'var(--radius-md, 8px)',
                  }}
                >
                  <CheckCircle2 size={15} color="var(--accent-success, #00C875)" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--accent-success, #00C875)' }}>
                    {ta.phoneVerified}
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
              borderRadius: 'var(--radius-md, 8px)',
              border: 'none',
              background:
                mode === 'register' && !isTelegramVerified
                  ? 'var(--text-muted)'
                  : 'var(--brand-primary, #0073EA)',
              color: '#ffffff',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: isSubmitting || (mode === 'register' && !isTelegramVerified) ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
              transition: 'background 0.15s ease',
              boxShadow:
                mode === 'register' && !isTelegramVerified ? 'none' : 'var(--shadow-sm)',
            }}
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <span>{mode === 'login' ? ta.signInBtn : ta.createAccountBtn}</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>

          {/* Switch Mode */}
          <div style={{ textAlign: 'center', marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
            {mode === 'login' ? (
              <span>
                {ta.dontHaveAccount}{' '}
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
                  {ta.signUpFree}
                </button>
              </span>
            ) : (
              <span>
                {ta.alreadyHaveAccount}{' '}
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
                  {ta.signInLink}
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

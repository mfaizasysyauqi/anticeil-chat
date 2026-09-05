import React from 'react';
import { Sparkles, CheckCircle2, RefreshCw, ArrowRight, FileText, Check } from 'lucide-react';
import { useSettingsStore } from '../../settings/store/useSettingsStore';

interface DocsGeneratingViewProps {
  promptText: string;
  generatedContent: string;
  isFinished: boolean;
  onViewResult: () => void;
}

export function DocsGeneratingView({
  promptText,
  generatedContent,
  isFinished,
  onViewResult,
}: DocsGeneratingViewProps) {
  const language = useSettingsStore((s) => s.language);

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: 'var(--bg-main)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 20px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '620px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '20px',
          border: '1px solid var(--border-strong)',
          boxShadow: 'var(--shadow-xl, 0 25px 50px -12px rgba(0, 0, 0, 0.35))',
          padding: '28px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
        }}
      >
        {/* Animated Icon Header */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            backgroundColor: isFinished ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0, 115, 234, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isFinished ? 'var(--accent-success, #10B981)' : 'var(--brand-primary)',
            transition: 'all 0.3s ease',
          }}
        >
          {isFinished ? (
            <CheckCircle2 size={28} />
          ) : (
            <RefreshCw size={26} className="spin" />
          )}
        </div>

        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
            {isFinished
              ? language === 'id'
                ? 'Dokumen Anda Siap!'
                : 'Your Document is Ready!'
              : language === 'id'
              ? 'AI Sedang Menyusun Dokumen...'
              : 'AI is Crafting Your Document...'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>
            "{promptText.slice(0, 80)}{promptText.length > 80 ? '...' : ''}"
          </p>
        </div>

        {/* Step Progress Checklist */}
        <div
          style={{
            width: '100%',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: '12px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--text-primary)' }}>
            <CheckCircle2 size={15} color="var(--accent-success, #10B981)" />
            <span>
              {language === 'id'
                ? 'Menganalisis kebutuhan & merancang kerangka ilmiah'
                : 'Analyzing requirements & structuring scientific outline'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: isFinished ? 'var(--text-primary)' : 'var(--brand-primary)' }}>
            {isFinished ? (
              <CheckCircle2 size={15} color="var(--accent-success, #10B981)" />
            ) : (
              <RefreshCw size={14} className="spin" color="var(--brand-primary)" />
            )}
            <span>
              {language === 'id'
                ? 'Menulis formulasi LaTeX, tabel data, & sitasi referensi'
                : 'Drafting LaTeX formulas, data tables, & references'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: isFinished ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            {isFinished ? (
              <CheckCircle2 size={15} color="var(--accent-success, #10B981)" />
            ) : (
              <div style={{ width: '15px', height: '15px', borderRadius: '50%', border: '2px solid var(--border-subtle)' }} />
            )}
            <span>
              {language === 'id'
                ? 'Validasi sintaks KaTeX & kompilasi lembar Overleaf'
                : 'Validating KaTeX syntax & compiling document view'}
            </span>
          </div>
        </div>

        {/* Snippet Preview */}
        {generatedContent && (
          <div
            style={{
              width: '100%',
              maxHeight: '140px',
              overflowY: 'auto',
              backgroundColor: 'var(--bg-main)',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              padding: '10px 12px',
              fontSize: '11.5px',
              fontFamily: "'JetBrains Mono', monospace",
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
            }}
          >
            {generatedContent.slice(0, 300)}...
          </div>
        )}

        {/* Main Action Button */}
        {isFinished ? (
          <button
            type="button"
            onClick={onViewResult}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 20px',
              borderRadius: '12px',
              backgroundColor: 'var(--brand-primary)',
              border: 'none',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(0, 115, 234, 0.35)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <Sparkles size={16} />
            <span>{language === 'id' ? 'Lihat Hasil Dokumen' : 'View Document'}</span>
            <ArrowRight size={16} />
          </button>
        ) : (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {language === 'id' ? 'Mohon tunggu beberapa detik...' : 'Please wait a moment...'}
          </div>
        )}
      </div>
    </div>
  );
}

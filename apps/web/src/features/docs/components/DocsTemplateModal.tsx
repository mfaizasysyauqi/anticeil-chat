import React from 'react';
import { X, Sparkles, GraduationCap, Cpu, Sigma, FileText, Check } from 'lucide-react';
import { DOC_TEMPLATES, DocTemplate } from '../data/docTemplates';
import { useSettingsStore } from '../../settings/store/useSettingsStore';

interface DocsTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateId: string) => void;
}

export function DocsTemplateModal({ isOpen, onClose, onSelectTemplate }: DocsTemplateModalProps) {
  const language = useSettingsStore((s) => s.language);
  if (!isOpen) return null;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'GraduationCap':
        return <GraduationCap size={20} color="var(--brand-primary, #0073EA)" />;
      case 'Cpu':
        return <Cpu size={20} color="var(--accent-success, #10B981)" />;
      case 'Sigma':
        return <Sigma size={20} color="var(--brand-secondary, #8B5CF6)" />;
      case 'FileText':
        return <FileText size={20} color="#EC4899" />;
      default:
        return <Sparkles size={20} color="var(--brand-primary, #0073EA)" />;
    }
  };

  const catMap: Record<string, string> = {
    academic: language === 'id' ? 'Akademik' : 'Academic',
    technical: language === 'id' ? 'Teknis' : 'Technical',
    business: language === 'id' ? 'Bisnis' : 'Business',
    notes: language === 'id' ? 'Catatan' : 'Notes',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '85vh',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '16px',
          border: '1px solid var(--border-strong)',
          boxShadow: 'var(--shadow-xl, 0 25px 50px -12px rgba(0, 0, 0, 0.35))',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-main)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(0, 115, 234, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-primary)',
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {language === 'id' ? 'Galeri Template Akademik & Dokumen' : 'Academic & Document Template Gallery'}
              </h2>
              <p style={{ fontSize: '12px', margin: 0, color: 'var(--text-muted)' }}>
                {language === 'id'
                  ? 'Pilih template Markdown, Typst & LaTeX ilmiah siap pakai'
                  : 'Choose ready-to-use scientific Markdown, Typst & LaTeX templates'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
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
            <X size={18} />
          </button>
        </div>

        {/* Templates Grid */}
        <div
          style={{
            padding: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '14px',
            overflowY: 'auto',
          }}
        >
          {DOC_TEMPLATES.map((tpl) => (
            <div
              key={tpl.id}
              onClick={() => {
                onSelectTemplate(tpl.id);
                onClose();
              }}
              className="clickable-card"
              style={{
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-card, var(--bg-surface))',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--brand-primary)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {getIcon(tpl.icon)}
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {catMap[tpl.category] || tpl.category}
                </span>
              </div>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 650, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                  {tpl.title}
                </h3>
                <p style={{ fontSize: '12px', margin: 0, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {language === 'id' ? tpl.description : (tpl.descriptionEn || tpl.description)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

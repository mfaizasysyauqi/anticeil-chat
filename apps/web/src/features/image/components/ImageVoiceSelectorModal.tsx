'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Check,
  Mic,
  Search,
  Volume2,
  VolumeX,
  Music,
  Sparkles,
  Globe,
  Radio,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { useSettingsStore } from '../../settings/store/useSettingsStore';

export interface VoiceItem {
  id: string;
  label: string;
  lang?: string;
  category?: 'id' | 'en' | 'music' | 'global' | 'custom';
  gender?: 'female' | 'male' | 'neutral' | 'music';
}

interface ImageVoiceSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoiceId: string;
  onSelectVoice: (voiceId: string) => void;
  availableVoices: { id: string; label: string }[];
  currentModelName: string;
  isLoading?: boolean;
}

export function ImageVoiceSelectorModal({
  isOpen,
  onClose,
  selectedVoiceId,
  onSelectVoice,
  availableVoices,
  currentModelName,
  isLoading = false,
}: ImageVoiceSelectorModalProps) {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const language = useSettingsStore((s) => s.language);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Categorize voices intelligently
  const enrichedVoices: VoiceItem[] = useMemo(() => {
    return availableVoices.map((v) => {
      const lower = (v.label + ' ' + v.id).toLowerCase();
      let category: VoiceItem['category'] = 'global';
      let gender: VoiceItem['gender'] = 'neutral';

      if (lower.includes('indonesia') || lower.includes('id-id') || lower.includes('gadis') || lower.includes('ardi') || lower.includes('andika')) {
        category = 'id';
      } else if (lower.includes('english') || lower.includes('en-us') || lower.includes('en-gb') || lower.includes('jenny') || lower.includes('guy') || lower.includes('david') || lower.includes('zira') || lower.includes('mark') || lower.includes('alloy') || lower.includes('echo') || lower.includes('nova') || lower.includes('onyx') || lower.includes('shimmer')) {
        category = 'en';
      } else if (lower.includes('synth') || lower.includes('piano') || lower.includes('beat') || lower.includes('pop') || lower.includes('lofi') || lower.includes('jazz') || lower.includes('rock') || lower.includes('orchestral') || lower.includes('ambient')) {
        category = 'music';
      }

      if (lower.includes('female') || lower.includes('wanita') || lower.includes('gadis') || lower.includes('jenny') || lower.includes('zira') || lower.includes('nova') || lower.includes('shimmer')) {
        gender = 'female';
      } else if (lower.includes('male') || lower.includes('pria') || lower.includes('ardi') || lower.includes('guy') || lower.includes('david') || lower.includes('mark') || lower.includes('andika') || lower.includes('echo') || lower.includes('onyx')) {
        gender = 'male';
      } else if (category === 'music') {
        gender = 'music';
      }

      return {
        id: v.id,
        label: v.label,
        category,
        gender,
      };
    });
  }, [availableVoices]);

  // Categories list
  const categories = useMemo(() => {
    const isMusicModel = currentModelName.toLowerCase().includes('suno') || currentModelName.toLowerCase().includes('udio');

    if (isMusicModel) {
      return [
        { id: 'all', label: language === 'id' ? 'Semua Style Musik' : 'All Music Styles', count: enrichedVoices.length },
        { id: 'music', label: language === 'id' ? 'Genre & Preset' : 'Genres & Presets', count: enrichedVoices.length },
      ];
    }

    const idCount = enrichedVoices.filter((v) => v.category === 'id').length;
    const enCount = enrichedVoices.filter((v) => v.category === 'en').length;
    const globalCount = enrichedVoices.filter((v) => v.category === 'global').length;
    const musicCount = enrichedVoices.filter((v) => v.category === 'music').length;

    const list = [
      { id: 'all', label: language === 'id' ? 'Semua Suara' : 'All Voices', count: enrichedVoices.length },
    ];

    if (idCount > 0) list.push({ id: 'id', label: 'Bahasa Indonesia (ID)', count: idCount });
    if (enCount > 0) list.push({ id: 'en', label: 'English (US / UK)', count: enCount });
    if (musicCount > 0) list.push({ id: 'music', label: language === 'id' ? 'Preset Musik' : 'Music Presets', count: musicCount });
    if (globalCount > 0) list.push({ id: 'global', label: language === 'id' ? 'Bahasa Global' : 'Global Languages', count: globalCount });

    return list;
  }, [enrichedVoices, language, currentModelName]);

  // Filtered voices
  const filteredVoices = useMemo(() => {
    return enrichedVoices.filter((v) => {
      const matchCat = activeCategory === 'all' || v.category === activeCategory;
      const matchSearch =
        searchQuery.trim() === '' ||
        v.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [enrichedVoices, activeCategory, searchQuery]);

  // Preview Voice Sample using Web Speech API
  const handlePreviewVoice = (e: React.MouseEvent, voice: VoiceItem) => {
    e.stopPropagation();

    if (previewingVoiceId === voice.id) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setPreviewingVoiceId(null);
      return;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setPreviewingVoiceId(voice.id);

      const isIndo = voice.category === 'id' || voice.label.toLowerCase().includes('indonesia');
      const text = isIndo
        ? 'Halo, ini adalah contoh pratinjau suara saya di Anticeil Studio.'
        : 'Hello, this is a live voice preview sample in Anticeil Studio.';

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = voice.gender === 'female' ? 1.1 : voice.gender === 'male' ? 0.85 : 1.0;

      const voices = window.speechSynthesis.getVoices();
      const targetVoice =
        voices.find((v) => v.voiceURI === voice.id || v.name === voice.id) ||
        voices.find((v) => (isIndo ? v.lang.startsWith('id') : v.lang.startsWith('en')));

      if (targetVoice) {
        utterance.voice = targetVoice;
      }

      utterance.onend = () => setPreviewingVoiceId(null);
      utterance.onerror = () => setPreviewingVoiceId(null);

      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!isOpen || !mounted) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '920px',
          height: '580px',
          maxHeight: '90vh',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-xl, 16px)',
          boxShadow: 'var(--shadow-2xl, 0 25px 50px -12px rgba(0, 0, 0, 0.5))',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(0, 115, 234, 0.12)',
                color: 'var(--brand-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Mic size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    margin: 0,
                  }}
                >
                  {language === 'id' ? 'Katalog Karakter Suara & Audio' : 'Voice & Audio Catalog'}
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 650,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: 'var(--bg-subtle)',
                    color: 'var(--brand-primary)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {currentModelName.split('(')[0].trim()}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                {language === 'id'
                  ? `Pilih karakter vokal, intonasi, atau genre musik (${enrichedVoices.length} pilihan tersedia).`
                  : `Select vocal character, pitch, or music style (${enrichedVoices.length} available).`}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Search input in header */}
            <div style={{ position: 'relative', width: '220px' }}>
              <input
                type="text"
                placeholder={language === 'id' ? 'Cari nama suara...' : 'Search voice name...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px 6px 30px',
                  borderRadius: '8px',
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
              <Search
                size={13}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)' }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '6px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '2px',
                  }}
                >
                  <X size={12} />
                </button>
              )}
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
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Modal Body: 2 Columns ── */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Column: Categories List */}
          <div
            style={{
              width: '240px',
              borderRight: '1px solid var(--border-subtle)',
              background: 'var(--bg-main)',
              overflowY: 'auto',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                padding: '6px 8px 4px 8px',
              }}
            >
              {language === 'id' ? 'Kategori Bahasa & Vokal' : 'Language & Vocal Types'}
            </div>

            {categories.map((cat) => {
              const active = cat.id === activeCategory;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid',
                    borderColor: active ? 'var(--brand-primary)' : 'transparent',
                    background: active ? 'rgba(0, 115, 234, 0.08)' : 'transparent',
                    color: active ? 'var(--brand-primary)' : 'var(--text-primary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {cat.id === 'id' ? (
                      <span>🇮🇩</span>
                    ) : cat.id === 'en' ? (
                      <span>🇺🇸</span>
                    ) : cat.id === 'music' ? (
                      <span>🎵</span>
                    ) : (
                      <Globe size={14} color={active ? 'var(--brand-primary)' : 'var(--text-muted)'} />
                    )}
                    <span style={{ fontSize: '13px', fontWeight: active ? 700 : 500 }}>
                      {cat.label}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '11px',
                      color: active ? 'var(--brand-primary)' : 'var(--text-muted)',
                      background: active ? 'rgba(0, 115, 234, 0.12)' : 'var(--bg-subtle)',
                      padding: '1px 6px',
                      borderRadius: '9999px',
                      fontWeight: 600,
                    }}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Column: Voice Cards Grid */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              background: 'var(--bg-surface)',
            }}
          >
            {/* Header info in right column */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '8px',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {categories.find((c) => c.id === activeCategory)?.label || 'Daftar Suara'}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  • {filteredVoices.length} {language === 'id' ? 'suara siap pakai' : 'voices ready'}
                </span>
              </div>

              {isLoading && (
                <span style={{ fontSize: '11px', color: 'var(--brand-primary)', fontWeight: 600 }}>
                  {language === 'id' ? 'Sedang memuat suara...' : 'Fetching voices...'}
                </span>
              )}
            </div>

            {/* Empty State */}
            {filteredVoices.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <Mic size={32} style={{ margin: '0 auto 10px auto', opacity: 0.4 }} />
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {language === 'id' ? 'Tidak ada suara yang cocok' : 'No voices found'}
                </p>
                <p style={{ fontSize: '12px' }}>
                  {language === 'id' ? 'Coba ubah kata kunci pencarian atau pilih kategori lain.' : 'Try changing your search query or select another category.'}
                </p>
              </div>
            )}

            {/* Voice Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
              {filteredVoices.map((voice) => {
                const isSelected = selectedVoiceId === voice.id;
                const isPreviewing = previewingVoiceId === voice.id;

                return (
                  <div
                    key={voice.id}
                    onClick={() => {
                      onSelectVoice(voice.id);
                      onClose();
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: `1.5px solid ${isSelected ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                      background: isSelected ? 'rgba(0, 115, 234, 0.05)' : 'var(--bg-main)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 0 0 1px var(--brand-primary)' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--border-strong)';
                        e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        e.currentTarget.style.backgroundColor = 'var(--bg-main)';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                      {/* Avatar / Category Indicator */}
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: isSelected
                            ? 'var(--brand-primary)'
                            : voice.category === 'music'
                            ? 'rgba(162, 93, 220, 0.15)'
                            : 'rgba(0, 115, 234, 0.1)',
                          color: isSelected
                            ? '#FFFFFF'
                            : voice.category === 'music'
                            ? '#A25DDC'
                            : 'var(--brand-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '13px',
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {voice.category === 'music' ? (
                          <Music size={16} />
                        ) : voice.gender === 'female' ? (
                          '♀'
                        ) : voice.gender === 'male' ? (
                          '♂'
                        ) : (
                          <Mic size={15} />
                        )}
                      </div>

                      {/* Text info */}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: isSelected ? 700 : 600,
                            color: isSelected ? 'var(--brand-primary)' : 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {voice.label}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <span
                            style={{
                              fontSize: '10px',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              background: 'var(--bg-surface)',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-muted)',
                              fontWeight: 600,
                            }}
                          >
                            {voice.category === 'id'
                              ? '🇮🇩 ID'
                              : voice.category === 'en'
                              ? '🇺🇸 EN'
                              : voice.category === 'music'
                              ? '🎵 Preset'
                              : '🌐 Global'}
                          </span>

                          {voice.gender !== 'neutral' && (
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                              • {voice.gender === 'female' ? 'Wanita' : voice.gender === 'male' ? 'Pria' : 'Music'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right actions: Audio Preview button + Checkmark */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      {voice.category !== 'music' && (
                        <button
                          type="button"
                          onClick={(e) => handlePreviewVoice(e, voice)}
                          title={language === 'id' ? 'Dengarkan sampel suara' : 'Listen to preview'}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-subtle)',
                            background: isPreviewing ? 'var(--brand-primary)' : 'var(--bg-surface)',
                            color: isPreviewing ? '#FFFFFF' : 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!isPreviewing) {
                              e.currentTarget.style.color = 'var(--brand-primary)';
                              e.currentTarget.style.borderColor = 'var(--brand-primary)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isPreviewing) {
                              e.currentTarget.style.color = 'var(--text-muted)';
                              e.currentTarget.style.borderColor = 'var(--border-subtle)';
                            }
                          }}
                        >
                          {isPreviewing ? <VolumeX size={13} /> : <Volume2 size={13} />}
                        </button>
                      )}

                      {isSelected && (
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: 'var(--brand-primary)',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

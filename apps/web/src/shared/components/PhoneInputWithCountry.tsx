'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check, Phone } from 'lucide-react';

export interface CountryInfo {
  code: string;
  name: string;
  nameId: string;
  dialCode: string;
  flag: string;
  placeholder: string;
}

export const COUNTRIES: CountryInfo[] = [
  { code: 'ID', name: 'Indonesia', nameId: 'Indonesia', dialCode: '+62', flag: '🇮🇩', placeholder: '812 3456 7890' },
  { code: 'MY', name: 'Malaysia', nameId: 'Malaysia', dialCode: '+60', flag: '🇲🇾', placeholder: '12 345 6789' },
  { code: 'SG', name: 'Singapore', nameId: 'Singapura', dialCode: '+65', flag: '🇸🇬', placeholder: '8123 4567' },
  { code: 'US', name: 'United States', nameId: 'Amerika Serikat', dialCode: '+1', flag: '🇺🇸', placeholder: '202 555 0123' },
  { code: 'GB', name: 'United Kingdom', nameId: 'Inggris', dialCode: '+44', flag: '🇬🇧', placeholder: '7911 123456' },
  { code: 'AU', name: 'Australia', nameId: 'Australia', dialCode: '+61', flag: '🇦🇺', placeholder: '412 345 678' },
  { code: 'JP', name: 'Japan', nameId: 'Jepang', dialCode: '+81', flag: '🇯🇵', placeholder: '90 1234 5678' },
  { code: 'KR', name: 'South Korea', nameId: 'Korea Selatan', dialCode: '+82', flag: '🇰🇷', placeholder: '10 1234 5678' },
  { code: 'IN', name: 'India', nameId: 'India', dialCode: '+91', flag: '🇮🇳', placeholder: '98765 43210' },
  { code: 'SA', name: 'Saudi Arabia', nameId: 'Arab Saudi', dialCode: '+966', flag: '🇸🇦', placeholder: '50 123 4567' },
  { code: 'AE', name: 'United Arab Emirates', nameId: 'Uni Emirat Arab', dialCode: '+971', flag: '🇦🇪', placeholder: '50 123 4567' },
  { code: 'PH', name: 'Philippines', nameId: 'Filipina', dialCode: '+63', flag: '🇵🇭', placeholder: '917 123 4567' },
  { code: 'TH', name: 'Thailand', nameId: 'Thailand', dialCode: '+66', flag: '🇹🇭', placeholder: '81 234 5678' },
  { code: 'VN', name: 'Vietnam', nameId: 'Vietnam', dialCode: '+84', flag: '🇻🇳', placeholder: '91 234 5678' },
  { code: 'DE', name: 'Germany', nameId: 'Jerman', dialCode: '+49', flag: '🇩🇪', placeholder: '151 12345678' },
  { code: 'FR', name: 'France', nameId: 'Prancis', dialCode: '+33', flag: '🇫🇷', placeholder: '6 12 34 56 78' },
  { code: 'NL', name: 'Netherlands', nameId: 'Belanda', dialCode: '+31', flag: '🇳🇱', placeholder: '6 12345678' },
  { code: 'CA', name: 'Canada', nameId: 'Kanada', dialCode: '+1', flag: '🇨🇦', placeholder: '416 555 0123' },
  { code: 'BR', name: 'Brazil', nameId: 'Brasil', dialCode: '+55', flag: '🇧🇷', placeholder: '11 91234 5678' },
  { code: 'TR', name: 'Turkey', nameId: 'Turki', dialCode: '+90', flag: '🇹🇷', placeholder: '532 123 4567' },
  { code: 'ES', name: 'Spain', nameId: 'Spanyol', dialCode: '+34', flag: '🇪🇸', placeholder: '612 34 56 78' },
  { code: 'IT', name: 'Italy', nameId: 'Italia', dialCode: '+39', flag: '🇮🇹', placeholder: '312 345 6789' },
  { code: 'RU', name: 'Russia', nameId: 'Rusia', dialCode: '+7', flag: '🇷🇺', placeholder: '912 345 6789' },
  { code: 'CN', name: 'China', nameId: 'Tiongkok', dialCode: '+86', flag: '🇨🇳', placeholder: '138 0013 8000' },
  { code: 'HK', name: 'Hong Kong', nameId: 'Hong Kong', dialCode: '+852', flag: '🇭🇰', placeholder: '9123 4567' },
  { code: 'TW', name: 'Taiwan', nameId: 'Taiwan', dialCode: '+886', flag: '🇹🇼', placeholder: '912 345 678' },
  { code: 'NZ', name: 'New Zealand', nameId: 'Selandia Baru', dialCode: '+64', flag: '🇳🇿', placeholder: '21 123 4567' },
  { code: 'EG', name: 'Egypt', nameId: 'Mesir', dialCode: '+20', flag: '🇪🇬', placeholder: '100 123 4567' },
  { code: 'ZA', name: 'South Africa', nameId: 'Afrika Selatan', dialCode: '+27', flag: '🇿🇦', placeholder: '71 123 4567' },
  { code: 'NG', name: 'Nigeria', nameId: 'Nigeria', dialCode: '+234', flag: '🇳🇬', placeholder: '802 123 4567' },
  { code: 'PK', name: 'Pakistan', nameId: 'Pakistan', dialCode: '+92', flag: '🇵🇰', placeholder: '301 2345678' },
  { code: 'BD', name: 'Bangladesh', nameId: 'Bangladesh', dialCode: '+880', flag: '🇧🇩', placeholder: '1712 345678' },
];

/**
 * Sanitizes phone input:
 * 1. Strips non-digits
 * 2. Removes duplicate country dial code if user pasted with code
 * 3. Tolerates and automatically removes any leading '0'
 */
export function sanitizeNationalDigits(raw: string, dialCode: string): string {
  if (!raw) return '';
  let digits = raw.replace(/\D/g, '');

  const dialDigits = dialCode.replace(/\D/g, '');
  if (dialDigits && digits.startsWith(dialDigits) && digits.length > dialDigits.length) {
    digits = digits.slice(dialDigits.length);
  }

  // Tolerates and automatically removes leading zeros
  digits = digits.replace(/^0+/, '');
  return digits;
}

/** Formats digits into standard readable chunks (e.g. 812 3456 7890) */
export function formatPhoneDigits(digits: string): string {
  if (!digits) return '';
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  if (digits.length <= 11) return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 13)}`;
}

export function CountryFlag({ code, name }: { code: string; name: string }) {
  const [hasError, setHasError] = useState(false);
  const codeLower = code.toLowerCase();

  if (hasError) {
    return <span style={{ fontSize: '12px', fontWeight: 700, lineHeight: 1 }}>{code}</span>;
  }

  return (
    <img
      src={`https://flagcdn.com/24x18/${codeLower}.png`}
      srcSet={`https://flagcdn.com/48x36/${codeLower}.png 2x`}
      width={20}
      height={14}
      alt={name}
      loading="lazy"
      onError={() => setHasError(true)}
      style={{
        width: '20px',
        height: '14px',
        borderRadius: '2px',
        objectFit: 'cover',
        display: 'inline-block',
        flexShrink: 0,
        boxShadow: '0 0 1px rgba(0,0,0,0.5)',
      }}
    />
  );
}

export interface PhoneInputWithCountryProps {
  value: string; // Clean national digits (without leading zero)
  onChange: (nationalDigits: string, fullE164: string, country: CountryInfo) => void;
  selectedCountry?: CountryInfo;
  onCountryChange?: (country: CountryInfo) => void;
  disabled?: boolean;
  isVerified?: boolean;
  language?: 'id' | 'en';
}

export function PhoneInputWithCountry({
  value,
  onChange,
  selectedCountry: propCountry,
  onCountryChange,
  disabled = false,
  isVerified = false,
  language = 'id',
}: PhoneInputWithCountryProps) {
  const [internalCountry, setInternalCountry] = useState<CountryInfo>(COUNTRIES[0]);
  const activeCountry = propCountry || internalCountry;

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isDropdownOpen]);

  const filteredCountries = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.nameId.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleSelectCountry = (country: CountryInfo) => {
    if (onCountryChange) {
      onCountryChange(country);
    } else {
      setInternalCountry(country);
    }
    setIsDropdownOpen(false);
    setSearchQuery('');

    // Re-calculate full E.164
    const cleanDigits = sanitizeNationalDigits(value, country.dialCode);
    const full = cleanDigits ? `${country.dialCode}${cleanDigits}` : '';
    onChange(cleanDigits, full, country);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const clean = sanitizeNationalDigits(raw, activeCountry.dialCode);
    const full = clean ? `${activeCountry.dialCode}${clean}` : '';
    onChange(clean, full, activeCountry);
  };

  const formattedDisplay = formatPhoneDigits(value);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', position: 'relative' }}>
      <div
        ref={dropdownRef}
        style={{
          display: 'flex',
          alignItems: 'center',
          borderRadius: 'var(--radius-md, 8px)',
          border: isVerified
            ? '1px solid var(--accent-success, #00C875)'
            : '1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))',
          backgroundColor: isVerified
            ? 'rgba(0, 200, 117, 0.06)'
            : 'var(--bg-subtle, rgba(255, 255, 255, 0.04))',
          overflow: 'visible',
          transition: 'all 0.15s ease',
          position: 'relative',
        }}
      >
        {/* Country Code Trigger Button */}
        <button
          type="button"
          onClick={() => {
            if (!disabled && !isVerified) {
              setIsDropdownOpen((prev) => !prev);
            }
          }}
          disabled={disabled || isVerified}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 10px 10px 12px',
            background: 'transparent',
            border: 'none',
            borderRight: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
            color: 'var(--text-primary)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: disabled || isVerified ? 'default' : 'pointer',
            flexShrink: 0,
            transition: 'background 0.15s ease',
          }}
          className={disabled || isVerified ? '' : 'hover-subtle'}
          title={language === 'id' ? 'Pilih Kode Negara' : 'Select Country Code'}
        >
          <CountryFlag code={activeCountry.code} name={activeCountry.name} />
          <span style={{ fontSize: '13px', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            {activeCountry.dialCode}
          </span>
          {!isVerified && <ChevronDown size={13} color="var(--text-muted)" />}
        </button>

        {/* National Phone Number Input */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            type="tel"
            value={formattedDisplay}
            onChange={handleInputChange}
            placeholder={activeCountry.placeholder}
            disabled={disabled || isVerified}
            autoComplete="tel-national"
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '13.5px',
              fontWeight: 500,
              fontFamily: 'inherit',
              letterSpacing: '0.02em',
            }}
          />
        </div>

        {/* Country Dropdown Popover */}
        {isDropdownOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              width: '280px',
              maxHeight: '260px',
              backgroundColor: 'var(--bg-surface, #1e1e24)',
              border: '1px solid var(--border-strong, rgba(255, 255, 255, 0.18))',
              borderRadius: 'var(--radius-lg, 12px)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Search Country Input */}
            <div
              style={{
                padding: '8px 10px',
                borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--bg-subtle, rgba(255, 255, 255, 0.03))',
              }}
            >
              <Search size={13} color="var(--text-muted)" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'id' ? 'Cari negara / kode...' : 'Search country or code...'}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                }}
              />
            </div>

            {/* List of Countries */}
            <div
              className="custom-scrollbar"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              {filteredCountries.length === 0 ? (
                <div style={{ padding: '12px', textAlign: 'center', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  {language === 'id' ? 'Negara tidak ditemukan' : 'No country found'}
                </div>
              ) : (
                filteredCountries.map((c) => {
                  const isSelected = c.code === activeCountry.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleSelectCountry(c)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '7px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        background: isSelected ? 'rgba(0, 115, 234, 0.15)' : 'transparent',
                        color: isSelected ? 'var(--brand-primary, #0073ea)' : 'var(--text-primary)',
                        cursor: 'pointer',
                        fontSize: '12px',
                        textAlign: 'left',
                        transition: 'background 0.1s ease',
                      }}
                      className="hover-subtle"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CountryFlag code={c.code} name={c.name} />
                        <span style={{ fontWeight: isSelected ? 600 : 400 }}>
                          {language === 'id' ? c.nameId : c.name}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 500 }}>
                          {c.dialCode}
                        </span>
                        {isSelected && <Check size={13} color="var(--brand-primary, #0073ea)" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Auto-Formatted E.164 preview helper */}
      {value && !isVerified && (
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', paddingLeft: '2px' }}>
          <span>{language === 'id' ? 'Format terkirim: ' : 'Standard format: '}</span>
          <strong style={{ color: 'var(--text-secondary)' }}>
            {activeCountry.dialCode} {formattedDisplay}
          </strong>
        </div>
      )}
    </div>
  );
}

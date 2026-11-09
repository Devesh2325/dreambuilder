import React, { useEffect, useState } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';

export interface LanguageOption {
  code: string;
  label: string;
  native: string;
}

export const GLOBAL_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'es', label: 'Spanish', native: 'Español' },
  { code: 'fr', label: 'French', native: 'Français' },
  { code: 'de', label: 'German', native: 'Deutsch' },
  { code: 'ja', label: 'Japanese', native: '日本語' },
  { code: 'zh-CN', label: 'Chinese (Simplified)', native: '简体中文' },
  { code: 'ar', label: 'Arabic', native: 'العربية' },
  { code: 'ru', label: 'Russian', native: 'Русский' },
  { code: 'pt', label: 'Portuguese', native: 'Português' },
  { code: 'it', label: 'Italian', native: 'Italiano' },
  { code: 'ko', label: 'Korean', native: '한국어' },
];

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement: new (
          options: { pageLanguage: string; includedLanguages: string; autoDisplay: boolean },
          elementId: string
        ) => void;
      };
    };
    googleTranslateElementInit?: () => void;
  }
}

function getStoredLanguage(): string {
  try {
    const match = document.cookie.match(/(?:^|;\s*)googtrans=([^;]*)/);
    if (match?.[1]) {
      const parts = decodeURIComponent(match[1]).split('/');
      const code = parts[parts.length - 1];
      if (GLOBAL_LANGUAGES.some((lang) => lang.code === code)) return code;
    }
    const local = localStorage.getItem('fp_selected_language');
    if (local && GLOBAL_LANGUAGES.some((lang) => lang.code === local)) return local;
  } catch {
    // fallback
  }
  return 'en';
}

function setLanguageCookie(code: string) {
  const value = `/en/${code}`;
  const host = window.location.hostname;
  document.cookie = `googtrans=${encodeURIComponent(value)}; path=/; max-age=31536000`;
  if (host.includes('.')) {
    const rootDomain = '.' + host.split('.').slice(-2).join('.');
    document.cookie = `googtrans=${encodeURIComponent(value)}; domain=${rootDomain}; path=/; max-age=31536000`;
  }
  try {
    localStorage.setItem('fp_selected_language', code);
  } catch {
    // ignore
  }
}

let isScriptLoaded = false;

export function loadGoogleTranslateScript() {
  if (isScriptLoaded || typeof document === 'undefined') return;
  isScriptLoaded = true;

  window.googleTranslateElementInit = () => {
    if (window.google?.translate?.TranslateElement) {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: GLOBAL_LANGUAGES.map((l) => l.code).join(','),
          autoDisplay: false,
        },
        'google_translate_element'
      );
    }
  };

  const script = document.createElement('script');
  script.id = 'google-translate-script';
  script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  script.async = true;
  document.body.appendChild(script);
}

export const GoogleTranslateSelector: React.FC<{
  className?: string;
  variant?: 'header' | 'compact' | 'pill';
  onLanguageChange?: (code: string) => void;
}> = ({ className = '', variant = 'header', onLanguageChange }) => {
  const [selected, setSelected] = useState(getStoredLanguage);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadGoogleTranslateScript();
  }, []);

  const changeLanguage = (code: string) => {
    setSelected(code);
    setLanguageCookie(code);
    setIsOpen(false);
    onLanguageChange?.(code);

    // Apply translation through select element if available
    const select = document.querySelector<HTMLSelectElement>('.goog-te-combo');
    if (select) {
      select.value = code;
      select.dispatchEvent(new Event('change'));
    } else {
      // Reload lightly or trigger google translation
      window.location.reload();
    }
  };

  const current = GLOBAL_LANGUAGES.find((lang) => lang.code === selected) ?? GLOBAL_LANGUAGES[0];

  return (
    <div className={`relative inline-block text-left ${className}`}>
      {/* Hidden element for Google Translate widget */}
      <div id="google_translate_element" className="hidden" aria-hidden="true" />

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Language: ${current.label}. Click to switch.`}
        aria-expanded={isOpen}
        title={`Language: ${current.label} (${current.native})`}
        className={
          variant === 'pill'
            ? 'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-400 transition-colors shadow-sm'
            : variant === 'compact'
            ? 'p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors'
            : 'inline-flex items-center gap-2 h-8 px-2.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors shadow-sm'
        }
      >
        <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" aria-hidden="true" />
        {variant !== 'compact' && (
          <>
            <span className="truncate max-w-[80px]">{current.native}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true" />
          </>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            role="menu"
            aria-label="Select global language"
            className="absolute right-0 mt-1.5 w-52 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 py-1.5 max-h-72 overflow-y-auto no-scrollbar font-sans"
          >
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Google Translation
            </div>
            {GLOBAL_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                role="menuitem"
                type="button"
                onClick={() => changeLanguage(lang.code)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                  selected === lang.code
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex flex-col">
                  <span>{lang.native}</span>
                  <span className="text-[10px] text-slate-400 font-normal">{lang.label}</span>
                </div>
                {selected === lang.code && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};


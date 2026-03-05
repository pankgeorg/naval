import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'el', label: 'EL' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <div className="flex items-center gap-1.5">
      <Globe className="w-4 h-4 text-gray-400" />
      {LANGUAGES.map((lang, i) => (
        <span key={lang.code} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-gray-300">|</span>}
          <button
            onClick={() => i18n.changeLanguage(lang.code)}
            className={`text-sm font-medium transition-colors ${
              i18n.language === lang.code || (i18n.language.startsWith(lang.code) && lang.code.length === 2)
                ? 'text-maritime-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {lang.label}
          </button>
        </span>
      ))}
    </div>
  );
}

import { Languages } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function LanguageSelector({ compact = false, inverted = false }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <label className={`inline-flex items-center gap-2 rounded-[12px] border px-3 py-2 text-[12px] font-black uppercase tracking-widest shadow-sm ${
      inverted
        ? 'border-white/10 bg-white/10 text-white'
        : 'border-[#E0DBD5] bg-white text-[#3D2B1F]'
    }`}>
      <Languages size={14} />
      {!compact && <span>{t('language')}</span>}
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className={`bg-transparent text-[12px] font-black uppercase outline-none ${
          inverted ? 'text-white' : 'text-[#3D2B1F]'
        }`}
        aria-label={t('language')}
      >
        <option value="en">{compact ? 'EN' : t('english')}</option>
        <option value="si">{compact ? 'සිං' : t('sinhala')}</option>
        <option value="ta">{compact ? 'TA' : t('tamil')}</option>
      </select>
    </label>
  );
}

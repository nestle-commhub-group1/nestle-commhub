import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

const STORAGE_KEY = 'commhub_privacy_ack';

export default function PrivacyBanner() {
  const [visible, setVisible] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    setVisible(localStorage.getItem(STORAGE_KEY) !== 'true');
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] max-h-[42svh] overflow-y-auto border-t border-[#E0DBD5] bg-white/95 px-4 py-2.5 shadow-2xl backdrop-blur sm:py-3">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <p className="text-[11px] font-medium leading-snug text-gray-600 sm:text-[13px] sm:leading-relaxed">
          {t('Nestle CommHub uses browser storage to keep you signed in and protect your session. Operational data is used for support, promotions, stock orders, and compliance workflows.')}
          {' '}
          <Link to="/privacy" className="font-black text-[#3D2B1F] underline underline-offset-2">
            {t('Privacy Notice')}
          </Link>
        </p>
        <button
          type="button"
          onClick={accept}
          className="shrink-0 rounded-[10px] bg-[#3D2B1F] px-5 py-2 text-[11px] font-black uppercase tracking-widest text-white transition-colors hover:bg-[#2C1810] sm:py-2.5 sm:text-[12px]"
        >
          {t('Accept')}
        </button>
      </div>
    </div>
  );
}

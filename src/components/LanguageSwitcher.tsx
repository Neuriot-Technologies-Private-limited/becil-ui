import React from 'react';
import { useTranslation } from 'react-i18next';

interface LanguageSwitcherProps {
  className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = '' }) => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const currentLanguage = i18n.language;

  return (
    <div className={`flex gap-2 ${className}`}>
      <button
        onClick={() => changeLanguage('en')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
          currentLanguage === 'en' || currentLanguage.startsWith('en')
            ? 'bg-white text-black border-2 border-white shadow-lg'
            : 'bg-transparent text-white border border-gray-600 hover:border-gray-400'
        }`}
      >
        US
      </button>
      <button
        onClick={() => changeLanguage('pt')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
          currentLanguage === 'pt' || currentLanguage.startsWith('pt')
            ? 'bg-white text-black border-2 border-white shadow-lg'
            : 'bg-transparent text-white border border-gray-600 hover:border-gray-400'
        }`}
      >
        BR
      </button>
    </div>
  );
};

export default LanguageSwitcher;

import React from 'react';
import { Palette, Sparkles, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Header: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  return (
    <header className="bg-white border-b border-orange-100 py-3 sticky top-0 z-30 shadow-sm flex-shrink-0">
      <div className="w-full px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-orange-500 to-rose-500 p-2 rounded-xl text-white shadow-lg shadow-orange-200 transform -rotate-3">
            <Palette size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight leading-none">
              Sticker<span className="text-orange-500">{t('title_suffix')}</span>
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           {/* Language Switcher */}
          <button 
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-stone-500 hover:bg-orange-50 hover:text-orange-600 transition-colors text-xs font-bold border border-transparent hover:border-orange-100"
          >
            <Globe size={14} />
            <span>{language === 'en' ? '中文' : 'English'}</span>
          </button>

          <div className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-orange-50 to-rose-50 px-3 py-1.5 rounded-full text-orange-700 text-xs font-bold border border-orange-100">
            <Sparkles size={14} />
            <span>{t('powered_by')}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
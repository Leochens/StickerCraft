import React from 'react';
import { Palette, Images } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import NotificationBadge from './ui/NotificationBadge';

export type MobileTab = 'create' | 'gallery';

interface MobileTabBarProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  galleryCount: number;
  isGenerating: boolean;
}

const MobileTabBar: React.FC<MobileTabBarProps> = ({
  activeTab,
  onTabChange,
  galleryCount,
  isGenerating,
}) => {
  const { t } = useLanguage();

  const tabs: Array<{ id: MobileTab; label: string; icon: typeof Palette }> = [
    { id: 'create', label: t('mobile_tab_create'), icon: Palette },
    { id: 'gallery', label: t('mobile_tab_gallery'), icon: Images },
  ];

  return (
    <nav
      className="md:hidden flex-shrink-0 border-t border-orange-100 bg-white/95 backdrop-blur-sm pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      aria-label={t('mobile_tab_nav')}
    >
      <div className="grid grid-cols-2 gap-1 p-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const showBadge = tab.id === 'gallery' && (galleryCount > 0 || isGenerating);

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              aria-busy={tab.id === 'gallery' && isGenerating ? true : undefined}
              className={`relative flex cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl py-2.5 text-[11px] font-black transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 ${
                isActive
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                  : 'text-stone-500 hover:bg-orange-50 hover:text-orange-700'
              }`}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
              {showBadge && (
                <NotificationBadge tabActive={isActive} busy={isGenerating}>
                  {isGenerating ? '…' : galleryCount > 99 ? '99+' : galleryCount}
                </NotificationBadge>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileTabBar;

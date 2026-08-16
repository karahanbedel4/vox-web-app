import React from 'react';
import { motion } from 'motion/react';
import { Newspaper, Headphones, LibraryBig, User } from 'lucide-react';
import { TabType } from '../types';
import { triggerHapticImpact } from '../lib/haptics';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  isPlaying?: boolean;
  isHidden?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab, isPlaying, isHidden = false }) => {
  const handleTabClick = (tabId: TabType) => {
    triggerHapticImpact('light').catch(() => {});
    onChangeTab(tabId);
  };

  const tabs: Array<{ id: TabType; label: string; icon: React.ElementType }> = [
    { id: 'read', label: 'Oku', icon: Newspaper },
    { id: 'focus', label: 'Odaklan', icon: Headphones },
    { id: 'library', label: 'Kitaplık', icon: LibraryBig },
    { id: 'profile', label: 'Profil', icon: User }
  ];

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-40 bg-surface-container/95 backdrop-blur-md border-t border-card-border pb-[calc(0.75rem+env(safe-area-inset-bottom,16px))] pt-2 px-4 max-w-xl md:max-w-2xl mx-auto shadow-2xl transition-all duration-300 ease-in-out md:rounded-t-3xl ${
      isHidden ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
    }`}>
      <div className="flex justify-between items-center h-14 relative">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`relative flex flex-col items-center justify-center py-2 px-4 rounded-2xl transition-colors duration-200 min-w-[72px] ${
                isActive ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeBottomTabPill"
                  className="absolute inset-0 bg-primary/15 border border-primary/40 rounded-2xl shadow-sm z-0"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="relative">
                  <motion.div
                    animate={{ scale: isActive ? 1.15 : 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.div>
                  {tab.id === 'focus' && isPlaying && (
                    <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 rounded-full bg-primary shadow-sm animate-ping" />
                  )}
                </div>
                <span className={`text-[11px] tracking-wide mt-1 transition-all ${isActive ? 'font-black text-primary' : 'font-medium'}`}>
                  {tab.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

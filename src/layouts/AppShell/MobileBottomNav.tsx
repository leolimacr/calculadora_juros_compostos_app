import React from 'react';
import { navigationItems } from '../../config/navigation.config';

interface MobileBottomNavProps {
  activeItemId: string;
  setActiveItemId: (id: string) => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeItemId, setActiveItemId }) => {
  return (
    <nav className="h-16 border-t border-slate-200 bg-white flex justify-around items-center">
      {navigationItems
        .filter((item) => item.mobile)
        .map((item) => {
          const isActive = item.id === activeItemId;
          return (
            <button
              key={item.id}
              onClick={() => !item.disabled && setActiveItemId(item.id)}
              disabled={item.disabled}
              className={`flex flex-col items-center justify-center p-1 rounded transition-colors duration-200 ${
                isActive ? 'text-blue-700 font-semibold' : 'text-slate-600'
              } ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className="text-[10px] mt-1">{item.label}</span>
            </button>
          );
        })}
    </nav>
  );
};

export default MobileBottomNav;

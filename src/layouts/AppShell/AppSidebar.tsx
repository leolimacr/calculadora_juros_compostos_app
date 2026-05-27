import React from 'react';
import { navigationItems } from '../../config/navigation.config';

interface AppSidebarProps {
  activeItemId: string;
  setActiveItemId: (id: string) => void;
}

const AppSidebar: React.FC<AppSidebarProps> = ({ activeItemId, setActiveItemId }) => {
  return (
    <nav className="flex flex-col w-full p-4 space-y-2">
      {navigationItems
        .filter((item) => item.desktop)
        .map((item) => {
          const isActive = item.id === activeItemId;
          return (
            <button
              key={item.id}
              onClick={() => !item.disabled && setActiveItemId(item.id)}
              disabled={item.disabled}
              className={`p-2 text-left rounded transition-colors duration-200 ${
                isActive
                  ? 'bg-blue-100 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              } ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {item.label}
            </button>
          );
        })}
    </nav>
  );
};

export default AppSidebar;

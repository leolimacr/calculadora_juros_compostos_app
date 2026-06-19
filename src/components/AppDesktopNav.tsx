import React, { useCallback, useEffect, useState } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useNavigation } from '../hooks/useNavigation';
import { PRIMARY_NAV_ITEMS } from '../config/appPrimaryNav';
import type { PrimaryNavItem } from '../config/appPrimaryNav';

const SESSION_KEY = 'fpi-desktop-nav-expanded';

function readExpandedPreference(): boolean {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored === '0') return false;
    if (stored === '1') return true;
  } catch {
    /* sessionStorage indisponível */
  }
  return true;
}

function persistExpandedPreference(expanded: boolean) {
  try {
    sessionStorage.setItem(SESSION_KEY, expanded ? '1' : '0');
  } catch {
    /* ignora */
  }
}

interface NavItemProps {
  item: PrimaryNavItem;
  isActive: boolean;
  showLabels: boolean;
  onNavigate: (toolId: string) => void;
}

const NavItem: React.FC<NavItemProps> = ({ item, isActive, showLabels, onNavigate }) => {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={() => onNavigate(item.toolId)}
      title={!showLabels ? item.label : undefined}
      className={`w-full flex items-center rounded-xl text-left transition-all active:scale-[0.98] ${
        showLabels ? 'items-start gap-3 px-3 py-3' : 'justify-center p-2.5'
      } ${
        isActive
          ? 'bg-emerald-50 border border-emerald-200/80 shadow-sm'
          : 'border border-transparent hover:bg-slate-50 hover:border-slate-100'
      }`}
      aria-current={isActive ? 'page' : undefined}
      aria-label={!showLabels ? item.label : undefined}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
          showLabels ? 'mt-0.5' : ''
        } ${
          isActive
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : 'bg-slate-50 border-slate-100 text-slate-500'
        }`}
      >
        <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
      </div>
      {showLabels && (
        <div className="min-w-0 flex-1">
          <span
            className={`block text-sm font-black tracking-tight ${
              isActive ? 'text-emerald-800' : 'text-slate-800'
            }`}
          >
            {item.label}
          </span>
          <span className="block text-[11px] text-slate-500 leading-snug mt-0.5">{item.description}</span>
        </div>
      )}
    </button>
  );
};

const AppDesktopNav: React.FC = () => {
  const { currentTool, handleNavigate } = useNavigation();
  const [expanded, setExpanded] = useState(readExpandedPreference);
  const [isPeeking, setIsPeeking] = useState(false);

  const showLabels = expanded || isPeeking;

  useEffect(() => {
    persistExpandedPreference(expanded);
  }, [expanded]);

  const toggleExpanded = useCallback(() => {
    setIsPeeking(false);
    setExpanded((prev) => !prev);
  }, []);

  const handleMouseEnter = () => {
    if (!expanded) setIsPeeking(true);
  };

  const handleMouseLeave = () => {
    setIsPeeking(false);
  };

  const navList = (
    <nav className="flex flex-col gap-1 flex-1 min-h-0">
      {showLabels && (
        <p className="px-3 pt-2 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 shrink-0">
          Navegação
        </p>
      )}
      <div className={`flex flex-col gap-1 flex-1 ${showLabels ? 'px-3' : 'px-2'}`}>
        {PRIMARY_NAV_ITEMS.map((item) => (
          <NavItem
            key={item.toolId}
            item={item}
            isActive={currentTool === item.toolId}
            showLabels={showLabels}
            onNavigate={handleNavigate}
          />
        ))}
      </div>
    </nav>
  );

  return (
    <div
      className="hidden lg:flex shrink-0 relative h-[calc(100vh-4rem)] sticky top-16 self-start z-[90]"
      onMouseLeave={handleMouseLeave}
    >
      <aside
        className={`flex flex-col h-full border-r border-slate-200/80 bg-white/90 backdrop-blur-sm transition-[width] duration-200 ease-out ${
          expanded ? 'w-56' : 'w-[4.25rem]'
        }`}
        aria-label="Navegação principal"
        onMouseEnter={handleMouseEnter}
      >
        <div className="flex flex-col flex-1 min-h-0 py-3">
          {expanded ? navList : (
            <nav className="flex flex-col gap-1 flex-1 px-2">
              {PRIMARY_NAV_ITEMS.map((item) => (
                <NavItem
                  key={item.toolId}
                  item={item}
                  isActive={currentTool === item.toolId}
                  showLabels={false}
                  onNavigate={handleNavigate}
                />
              ))}
            </nav>
          )}

          <div className={`shrink-0 pt-2 border-t border-slate-100 mt-2 ${expanded ? 'px-3' : 'px-2'}`}>
            <button
              type="button"
              onClick={toggleExpanded}
              className={`w-full flex items-center gap-2 rounded-xl py-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors ${
                expanded ? 'justify-start px-3' : 'justify-center'
              }`}
              aria-expanded={expanded}
              aria-label={expanded ? 'Recolher navegação' : 'Expandir navegação'}
              title={expanded ? 'Recolher' : 'Expandir'}
            >
              {expanded ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
              {expanded && (
                <span className="text-[11px] font-bold uppercase tracking-wider">Recolher</span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {!expanded && isPeeking && (
        <aside
          className="absolute left-full top-0 h-full w-56 border-r border-slate-200/80 bg-white shadow-lg shadow-slate-200/50 backdrop-blur-sm flex flex-col py-3 z-[95]"
          aria-hidden="true"
          onMouseEnter={handleMouseEnter}
        >
          {navList}
        </aside>
      )}
    </div>
  );
};

export default AppDesktopNav;

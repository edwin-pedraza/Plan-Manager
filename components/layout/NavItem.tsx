import React from 'react';

interface NavItemProps {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
  collapsed: boolean;
  color?: string;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick, collapsed, color }) => (
  <button
    onClick={onClick}
    aria-label={label}
    aria-current={active ? 'page' : undefined}
    className={`w-full flex items-center p-3.5 rounded-2xl transition-all duration-300 ${
      active ? 'text-white shadow-lg translate-x-1' : 'text-slate-400 hover:text-white'
    }`}
    style={active ? { background: '#4299E1', boxShadow: '0 4px 14px rgba(26,54,93,0.5)' } : undefined}
    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#2D3748'; }}
    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = ''; }}
  >
    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-none ${active ? 'bg-white/20' : ''}`}>
      <i className={`fas ${icon} text-sm ${active ? 'text-white' : color || ''}`}></i>
    </div>
    {!collapsed && <span className={`ml-4 font-black text-[11px] uppercase tracking-widest`}>{label}</span>}
    {active && !collapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: '#63B3ED' }}></div>}
  </button>
);

export default NavItem;

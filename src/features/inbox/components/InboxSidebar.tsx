import React from 'react';
import { Inbox, MessageSquare, LogOut } from 'lucide-react';
import { cn } from '../../../lib/utils';

const NavItem = ({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-left',
      active ? 'bg-[#0F1A2B] text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
    )}
  >
    <Icon className={cn('w-5 h-5 shrink-0', active ? 'text-white' : 'text-slate-400 group-hover:text-slate-800')} />
    <span className="font-medium">{label}</span>
  </button>
);

export interface InboxSidebarProps {
  onNavigatePublicChat: () => void;
  onSignOut: () => void;
  onNavigateComplete?: () => void;
}

export function InboxSidebar({ onNavigatePublicChat, onSignOut, onNavigateComplete }: InboxSidebarProps) {
  const wrap = (fn: () => void) => () => {
    fn();
    onNavigateComplete?.();
  };

  return (
    <>
      <div className="flex items-center gap-3 mb-8 px-2">
        <img src="/Shotcount-Logo.png" alt="Shotcount" className="w-10 h-10 rounded-xl object-contain shrink-0" />
        <span className="text-xl font-bold tracking-tight text-slate-800 truncate">Shotcount</span>
      </div>

      <nav className="flex-1 space-y-2 min-h-0 overflow-y-auto">
        <NavItem icon={Inbox} label="Inbox" active onClick={() => {}} />
        <NavItem icon={MessageSquare} label="Public Chat" onClick={wrap(onNavigatePublicChat)} />
      </nav>

      <div className="pt-6 mt-auto border-t border-slate-200 space-y-2 shrink-0">
        <NavItem icon={LogOut} label="Sign Out" onClick={wrap(onSignOut)} />
      </div>
    </>
  );
}

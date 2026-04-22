import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Menu } from 'lucide-react';
import { LeadList } from './components/LeadList';
import { InboxSidebar } from './components/InboxSidebar';
import { LeadThreadModal } from './components/LeadThreadModal';
import { useInbox } from './hooks/useInbox';
import { cn } from '../../lib/utils';

export function InboxPage() {
  const {
    leads,
    loadingLeads,
    selectedLead,
    setSelectedLead,
    adminReplyValue,
    setAdminReplyValue,
    modalChatEndRef,
    searchQuery,
    setSearchQuery,
    sidebarOpen,
    openSidebar,
    closeSidebar,
    handleSelectLead,
    handleAdminReply,
    handleDeleteLead,
    handleSignOut,
  } = useInbox();

  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-50 font-sans selection:bg-[#0F1A2B] selection:text-white">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-label="Close menu"
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={closeSidebar}
          />
        )}
      </AnimatePresence>

      {/* Sidebar: drawer on mobile, fixed rail on md+ */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-full min-h-0 w-[min(18rem,88vw)] flex-col border-r border-slate-200 bg-white p-5 transition-transform duration-300 ease-out md:w-64',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        <InboxSidebar
          onSignOut={handleSignOut}
          onNavigateComplete={closeSidebar}
        />
      </aside>

      <div className="flex min-h-screen min-h-[100dvh] flex-col md:ml-64">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md md:hidden">
          <button
            type="button"
            onClick={openSidebar}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-800">Lead Inbox</p>
            <p className="truncate text-xs text-slate-500">Shotcount</p>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 md:p-10">
          <LeadList
            leads={leads}
            loading={loadingLeads}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectLead={handleSelectLead}
            onDeleteLead={handleDeleteLead}
          />
        </main>
      </div>

      <AnimatePresence>
        {selectedLead && (
          <LeadThreadModal
            key={selectedLead.id}
            lead={selectedLead}
            adminReplyValue={adminReplyValue}
            onAdminReplyChange={setAdminReplyValue}
            onAdminReplySubmit={handleAdminReply}
            onClose={() => setSelectedLead(null)}
            onDelete={id => {
              void handleDeleteLead(id);
            }}
            chatEndRef={modalChatEndRef}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

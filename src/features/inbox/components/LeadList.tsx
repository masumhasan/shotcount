import React from 'react';
import { Inbox, Search, User, Trash2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { Lead } from '../../../types';

function StatusBadge({ status }: { status: Lead['status'] }) {
  return (
    <span
      className={cn(
        'text-[10px] px-2 py-1 rounded-lg font-bold uppercase tracking-wider whitespace-nowrap',
        status === 'New'
          ? 'bg-blue-50 text-blue-600'
          : status === 'Booked'
            ? 'bg-emerald-50 text-emerald-600'
            : status === 'In Progress'
              ? 'bg-amber-50 text-amber-600'
              : 'bg-slate-100 text-slate-500',
      )}
    >
      {status}
    </span>
  );
}

function LeadRowDesktop({
  lead,
  onSelect,
  onDelete,
}: {
  lead: Lead;
  onSelect: (lead: Lead) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <tr
      onClick={() => onSelect(lead)}
      className="hover:bg-slate-50 transition-colors group cursor-pointer"
    >
      <td className="px-4 lg:px-6 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-slate-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">{lead.name || lead.type}</p>
            <p className="text-xs text-slate-500 truncate">{lead.timestamp}</p>
          </div>
        </div>
      </td>
      <td className="px-4 lg:px-6 py-4">
        <p className="text-sm text-slate-700 font-medium">{lead.phone || '-'}</p>
        <p className="text-xs text-slate-500 truncate max-w-[12rem]">{lead.email || '-'}</p>
      </td>
      <td className="px-4 lg:px-6 py-4 hidden lg:table-cell">
        <p className="text-sm text-slate-700 font-medium line-clamp-2">{lead.projectType || 'N/A'}</p>
        <p className="text-xs text-slate-500">{lead.serviceType || 'N/A'}</p>
      </td>
      <td className="px-4 lg:px-6 py-4 hidden xl:table-cell">
        <p className="text-sm font-bold text-slate-800">{lead.budget || 'N/A'}</p>
        <p className="text-xs text-slate-500">{lead.timeline || 'N/A'}</p>
      </td>
      <td className="px-4 lg:px-6 py-4 hidden xl:table-cell">
        <div className="flex flex-wrap gap-1">
          {lead.tags.map(tag => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
              {tag}
            </span>
          ))}
        </div>
      </td>
      <td className="px-4 lg:px-6 py-4">
        <StatusBadge status={lead.status} />
      </td>
      <td className="px-4 lg:px-6 py-4 text-right w-px">
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onDelete(lead.id);
          }}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full md:opacity-0 md:group-hover:opacity-100 transition-all"
          title="Delete lead"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}

function LeadCardMobile({
  lead,
  onSelect,
  onDelete,
}: {
  lead: Lead;
  onSelect: (lead: Lead) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(lead)}
      className="w-full text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 hover:shadow-md transition-all active:scale-[0.99]"
    >
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
          <User className="w-5 h-5 text-slate-400" />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-sm font-bold text-slate-800">{lead.name || lead.type}</p>
            <StatusBadge status={lead.status} />
          </div>
          <p className="text-xs text-slate-500">{lead.timestamp}</p>
          <div className="grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-2">
            <p>
              <span className="text-slate-400 font-semibold">Phone </span>
              <span className="text-slate-700 font-medium">{lead.phone || '-'}</span>
            </p>
            <p className="min-w-0 break-all">
              <span className="text-slate-400 font-semibold">Email </span>
              <span className="text-slate-700 font-medium">{lead.email || '-'}</span>
            </p>
            <p className="sm:col-span-2">
              <span className="text-slate-400 font-semibold">Project </span>
              <span className="text-slate-700">{lead.projectType || 'N/A'}</span>
            </p>
            <p>
              <span className="text-slate-400 font-semibold">Budget </span>
              <span className="text-slate-800 font-bold">{lead.budget || 'N/A'}</span>
            </p>
            <p>
              <span className="text-slate-400 font-semibold">Timeline </span>
              <span className="text-slate-700">{lead.timeline || 'N/A'}</span>
            </p>
          </div>
          {lead.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {lead.tags.map(tag => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 flex justify-end border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onDelete(lead.id);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </button>
      </div>
    </button>
  );
}

export interface LeadListProps {
  leads: Lead[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectLead: (lead: Lead) => void;
  onDeleteLead: (id: string) => void;
}

export function LeadList({
  leads,
  loading,
  searchQuery,
  onSearchChange,
  onSelectLead,
  onDeleteLead,
}: LeadListProps) {
  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="hidden text-3xl font-bold text-slate-800 md:block">Lead Inbox</h1>
        <div className="relative w-full md:max-w-xs md:shrink-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search leads..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
            autoComplete="off"
          />
        </div>
      </div>

      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center">
            <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-[#0F1A2B] border-t-transparent" />
            <p className="text-sm text-slate-500">Loading leads...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center px-4">
            <Inbox className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-500">
              No leads yet. New conversations from the public chat will appear here.
            </p>
          </div>
        ) : (
          leads.map(lead => (
            <LeadCardMobile key={lead.id} lead={lead} onSelect={onSelectLead} onDelete={onDeleteLead} />
          ))
        )}
      </div>

      <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 lg:px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Lead Details
                </th>
                <th className="px-4 lg:px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Contact
                </th>
                <th className="hidden px-4 lg:px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 lg:table-cell">
                  Project Info
                </th>
                <th className="hidden px-4 lg:px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 xl:table-cell">
                  Investment
                </th>
                <th className="hidden px-4 lg:px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 xl:table-cell">
                  Tags
                </th>
                <th className="px-4 lg:px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="px-4 lg:px-6 py-4" aria-hidden />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-[#0F1A2B] border-t-transparent" />
                    <p className="text-sm text-slate-500">Loading leads...</p>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <Inbox className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                    <p className="text-sm text-slate-500">
                      No leads yet. New conversations from the public chat will appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                leads.map(lead => (
                  <LeadRowDesktop key={lead.id} lead={lead} onSelect={onSelectLead} onDelete={onDeleteLead} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

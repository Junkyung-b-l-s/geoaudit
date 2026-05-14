'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardCheck, X, Menu } from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';

const NAV_SECTIONS = [
  {
    title: 'Audit',
    items: [
      { icon: ClipboardCheck, label: 'GEO Readiness Audit', href: '/' },
    ],
  },
];

function NavSection({ title, items }: { title: string; items: { icon: React.ComponentType<{ className?: string }>; label: string; href: string }[] }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-2">
      <div className="px-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
        {title}
      </div>
      <div className="flex flex-col gap-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function AppSidebar() {
  const { isOpen, close } = useSidebar();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 h-full border-r border-slate-100 bg-white shrink-0 transition-transform duration-200 ease-out md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:!translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between pl-4 pr-2.5 pt-5 pb-2.5">
            <Link href="/" className="flex items-center gap-2">
              <img
                src="/images/BOIDA_logo_black.png"
                alt="BOIDA Logo"
                className="h-[28px] w-auto object-contain"
              />
            </Link>
            <button
              type="button"
              onClick={close}
              className="md:hidden p-1.5 rounded-md hover:bg-slate-100 text-slate-500"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Product badge */}
          <div className="px-4 pb-4">
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#0035DA] bg-blue-50 border border-blue-100">
              Technical GEO Audit
            </span>
          </div>

          {/* Nav */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-6 px-3 py-2">
            {NAV_SECTIONS.map((section) => (
              <NavSection key={section.title} title={section.title} items={section.items} />
            ))}
          </div>

          {/* Footer — Powered by */}
          <div className="border-t border-slate-100 px-4 py-4">
            <div className="flex items-center gap-2">
              <img
                src="/images/designovel.png"
                alt="Designovel"
                className="h-[22px] w-auto object-contain"
              />
            </div>
            <div className="mt-1.5 text-[9px] text-slate-300 font-medium tracking-wide uppercase">
              Powered by Designovel
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export function HamburgerButton() {
  const { open } = useSidebar();
  return (
    <button
      type="button"
      onClick={open}
      className="md:hidden p-2 -ml-1 rounded-md hover:bg-slate-100 text-slate-700 shrink-0"
      aria-label="Open menu"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}

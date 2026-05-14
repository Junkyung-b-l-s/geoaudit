'use client';

import { HamburgerButton } from './AppSidebar';

export default function AppHeader() {
  return (
    <header className="self-stretch border-b border-slate-100 bg-white px-3 md:px-5 py-3 md:py-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <HamburgerButton />
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-lg font-semibold text-slate-900 font-inter truncate">
              Technical GEO Audit
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2.5 rounded-full border border-slate-200 bg-white px-4 py-1.5">
            <span className="whitespace-nowrap text-[13px] font-medium text-slate-700">54개 항목</span>
            <span className="h-3 w-px bg-slate-200" />
            <span className="whitespace-nowrap text-[13px] font-medium text-slate-700">6개 카테고리</span>
          </div>
        </div>
      </div>
    </header>
  );
}

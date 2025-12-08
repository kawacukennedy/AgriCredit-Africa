import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export interface DashboardLayoutProps {
  header: React.ReactNode;
  sidebar: React.ReactNode;
  main: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function DashboardLayout({
  header,
  sidebar,
  main,
  footer,
  className,
}: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className={cn('min-h-screen bg-neutral-50', className)}>
      {/* Desktop Layout */}
      <div className="hidden md:grid md:grid-cols-[240px_1fr] md:grid-rows-[64px_1fr_auto] lg:grid-cols-[240px_1fr] lg:grid-rows-[64px_1fr_auto]">
        {/* Header */}
        <header className="col-start-1 col-end-3 row-start-1 row-end-2 bg-white border-b border-neutral-200 flex items-center justify-between px-6">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="md:hidden lg:block p-2 rounded hover:bg-neutral-100 mr-4"
            >
              ☰
            </button>
            {header}
          </div>
        </header>

        {/* Sidebar */}
        <aside
          className={cn(
            'row-start-2 row-end-4 bg-white border-r border-neutral-200 transition-all duration-300',
            sidebarCollapsed ? 'md:w-16 lg:w-16' : 'md:w-60 lg:w-60'
          )}
        >
          {sidebar}
        </aside>

        {/* Main Content */}
        <main className="row-start-2 row-end-3 bg-neutral-50 p-6 overflow-auto">
          {main}
        </main>

        {/* Footer */}
        {footer && (
          <footer className="col-start-2 col-end-3 row-start-3 row-end-4 bg-white border-t border-neutral-200 flex items-center px-6 h-12">
            {footer}
          </footer>
        )}
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="bg-white border-b border-neutral-200 flex items-center justify-between px-4 h-16">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded hover:bg-neutral-100"
          >
            ☰
          </button>
          {header}
        </header>

        {/* Mobile Sidebar (when expanded) */}
        {sidebarCollapsed && (
          <aside className="bg-white border-b border-neutral-200 p-4">
            {sidebar}
          </aside>
        )}

        {/* Mobile Main Content */}
        <main className="flex-1 bg-neutral-50 p-4 overflow-auto">
          {main}
        </main>

        {/* Mobile Footer */}
        {footer && (
          <footer className="bg-white border-t border-neutral-200 flex items-center px-4 h-12">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}

export default DashboardLayout;
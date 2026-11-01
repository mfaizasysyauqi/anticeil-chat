import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';

export interface SettingsNavItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  isDanger?: boolean;
  onClick?: () => void;
  /** Sub-items shown as indented scroll-spy nav (Discord "Data & Privacy" style) */
  subItems?: { id: string; label: string }[];
}

export interface SettingsNavGroup {
  key?: string;
  title?: string;
  items: SettingsNavItem[];
}

export interface TwoPaneSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  sidebarHeader?: React.ReactNode;
  groups: SettingsNavGroup[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  footerAction?: React.ReactNode;
  children: React.ReactNode;
  contentClassName?: string;
  className?: string;
  initialMobileView?: 'menu' | 'detail';
  /** Ref to the scrollable content div so scroll-spy can attach */
  contentScrollRef?: React.RefObject<HTMLDivElement | null>;
}

export function TwoPaneSettingsDialog({
  open,
  onOpenChange,
  title = 'Pengaturan',
  sidebarHeader,
  groups,
  activeSection,
  onSectionChange,
  footerAction,
  children,
  contentClassName,
  className,
  initialMobileView = 'menu',
  contentScrollRef: externalScrollRef,
}: TwoPaneSettingsDialogProps) {
  const { t } = useTranslation();
  const [mobileView, setMobileView] = useState<'menu' | 'detail'>(initialMobileView);
  const [activeSubId, setActiveSubId] = useState<string>('');
  const internalScrollRef = useRef<HTMLDivElement>(null);
  const scrollRef = externalScrollRef ?? internalScrollRef;

  useEffect(() => {
    if (open) {
      setMobileView(initialMobileView);
    }
  }, [open, initialMobileView]);

  // Reset sub-item when section changes
  useEffect(() => {
    setActiveSubId('');
  }, [activeSection]);

  const activeItem = useMemo(() => {
    for (const group of groups) {
      const found = group.items.find((i) => i.id === activeSection);
      if (found) return found;
    }
    return null;
  }, [groups, activeSection]);

  // Scroll-spy: watch content pane scroll and highlight matching sub-item
  useEffect(() => {
    const subItems = activeItem?.subItems;
    if (!subItems || subItems.length === 0) {
      setActiveSubId('');
      return;
    }

    const container = scrollRef.current;
    if (!container) return;

    let ticking = false;

    const updateSpy = () => {
      const containerTop = container.getBoundingClientRect().top;
      const threshold = containerTop + 80;

      let current = subItems[0].id;
      for (const sub of subItems) {
        const el = container.querySelector(`#${CSS.escape(sub.id)}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= threshold) {
            current = sub.id;
          }
        }
      }
      setActiveSubId(current);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateSpy);
        ticking = true;
      }
    };

    // Run once on mount / section switch
    updateSpy();

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, [activeSection, activeItem?.subItems, scrollRef]);

  const scrollToSubItem = useCallback(
    (subId: string) => {
      const container = scrollRef.current;
      if (!container) return;
      const el = container.querySelector(`#${CSS.escape(subId)}`);
      if (el) {
        const containerTop = container.getBoundingClientRect().top;
        const elTop = el.getBoundingClientRect().top;
        const offset = elTop - containerTop + container.scrollTop - 70;
        container.scrollTo({ top: offset, behavior: 'smooth' });
      }
      setActiveSubId(subId);
    },
    [scrollRef],
  );

  const handleSelectSection = (item: SettingsNavItem) => {
    if (item.onClick) {
      item.onClick();
    } else {
      onSectionChange(item.id);
      setMobileView('detail');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          'p-0 w-full h-full md:w-[calc(100vw-2.5rem)] md:h-[calc(100dvh-3.5rem)] max-w-[1020px] max-h-[760px] overflow-hidden bg-background border border-border flex flex-col md:flex-row rounded-none md:rounded-[20px] shadow-2xl gap-0',
          className,
        )}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>

        {/* ── Left Sidebar / Master Pane ── */}
        <aside
          className={cn(
            'bg-sidebar border-r border-sidebar-border flex-col overflow-y-auto select-none shrink-0 [scrollbar-width:thin]',
            mobileView === 'menu' ? 'flex w-full h-full md:w-52 lg:w-60' : 'hidden md:flex md:w-52 lg:w-60',
          )}
        >
          {/* Mobile Menu Header */}
          <div className="flex md:hidden items-center justify-between px-4 py-3 border-b border-sidebar-border bg-sidebar shrink-0">
            <span className="text-sm font-bold text-foreground truncate">{title}</span>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors cursor-pointer"
              aria-label={t('Tutup')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-3 md:py-5 md:px-3 flex-1 flex flex-col min-h-0">
            {/* Sidebar header (e.g. Colony info or User card) */}
            {sidebarHeader && <div className="mb-4">{sidebarHeader}</div>}

            {/* Navigation groups */}
            <div className="space-y-4 flex-1 overflow-y-auto [scrollbar-width:thin]">
              {groups.map((group, groupIdx) => (
                <div key={group.key || group.title || groupIdx} className="space-y-0.5">
                  {group.title && (
                    <div className="text-[10px] md:text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-2.5 py-1">
                      {group.title}
                    </div>
                  )}
                  {group.items.map((item) => {
                    const isActive = activeSection === item.id;
                    return (
                      <div key={item.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectSection(item)}
                          className={cn(
                            'w-full flex items-center gap-2.5 px-3 py-2.5 md:py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left',
                            isActive
                              ? 'bg-sidebar-accent text-foreground font-bold shadow-2xs'
                              : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground',
                            item.isDanger && 'text-destructive hover:bg-destructive/10 hover:text-destructive',
                          )}
                        >
                          {item.icon && <span className="shrink-0">{item.icon}</span>}
                          <span className="truncate flex-1">{item.label}</span>
                          {item.badge && <span className="ml-auto mr-1">{item.badge}</span>}
                          <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground/50 md:hidden shrink-0" />
                        </button>

                        {/* Discord-style sub-items with scroll-spy */}
                        {isActive && item.subItems && item.subItems.length > 0 && (
                          <div className="ml-3 mt-0.5 mb-1 relative">
                            {/* Vertical line */}
                            <div className="absolute left-2 top-0 bottom-0 w-px bg-sidebar-border" />
                            <div className="space-y-0.5">
                              {item.subItems.map((sub) => {
                                const isSubActive = activeSubId === sub.id || (!activeSubId && item.subItems![0].id === sub.id);
                                return (
                                  <button
                                    key={sub.id}
                                    type="button"
                                    onClick={() => scrollToSubItem(sub.id)}
                                    className={cn(
                                      'w-full text-left pl-5 pr-2 py-1 text-[11px] rounded-md transition-colors cursor-pointer relative',
                                      isSubActive
                                        ? 'text-foreground font-bold'
                                        : 'text-muted-foreground/70 hover:text-foreground font-medium',
                                    )}
                                  >
                                    {/* Active indicator tick */}
                                    {isSubActive && (
                                      <span className="absolute left-[7px] top-1/2 -translate-y-1/2 w-[2px] h-3.5 bg-foreground rounded-full shadow-xs" />
                                    )}
                                    {sub.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Footer action (Logout or Delete Colony) */}
            {footerAction && (
              <div className="pt-3 border-t border-sidebar-border mt-auto shrink-0">
                {footerAction}
              </div>
            )}
          </div>
        </aside>

        {/* ── Right Content / Detail Pane ── */}
        <section
          className={cn(
            'flex-1 min-w-0 bg-background flex-col relative overflow-hidden',
            mobileView === 'detail' ? 'flex w-full h-full' : 'hidden md:flex',
          )}
        >
          {/* Mobile Detail Top Navigation Bar */}
          <div className="flex md:hidden items-center justify-between px-3 py-2.5 border-b border-border bg-background/95 backdrop-blur-xs sticky top-0 z-20 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setMobileView('menu')}
              className="h-8 px-2 gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground -ml-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{t('Kembali')}</span>
            </Button>
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground truncate max-w-[200px]">
              {activeItem?.icon && <span className="shrink-0">{activeItem.icon}</span>}
              <span className="truncate">{activeItem?.label || title}</span>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
              aria-label={t('Tutup')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Desktop/Tablet Signature ESC Close Button */}
          <div className="hidden md:flex absolute top-4 right-5 z-20">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex flex-col items-center gap-0.5 group cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
              title={t('Tutup (ESC)')}
            >
              <div className="size-8 rounded-full border border-border group-hover:border-foreground flex items-center justify-center transition-colors bg-card shadow-2xs">
                <X className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="text-[9px] font-bold tracking-wider uppercase opacity-75 group-hover:opacity-100">
                ESC
              </span>
            </button>
          </div>

          {/* Scrollable Content Container */}
          <div
            ref={scrollRef as React.RefObject<HTMLDivElement>}
            className={cn(
              'flex-1 overflow-y-auto px-4 py-5 sm:px-6 md:px-8 md:py-7 [scrollbar-width:thin] w-full min-w-0',
              contentClassName,
            )}
          >
            {children}
          </div>
        </section>
      </DialogContent>
    </Dialog>
  );
}

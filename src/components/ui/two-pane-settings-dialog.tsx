import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { LAYOUT_DIALOG_SPACING } from '@/lib/layout-constants';

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
  const [activeSubIds, setActiveSubIds] = useState<string[]>([]);
  const internalScrollRef = useRef<HTMLDivElement>(null);
  const scrollRef = externalScrollRef ?? internalScrollRef;

  useEffect(() => {
    if (open) {
      setMobileView(initialMobileView);
    }
  }, [open, initialMobileView]);

  // Reset scroll to top and clear sub-items when section changes
  useEffect(() => {
    setActiveSubIds([]);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [activeSection, scrollRef]);

  const activeItem = useMemo(() => {
    for (const group of groups) {
      const found = group.items.find((i) => i.id === activeSection);
      if (found) return found;
    }
    return null;
  }, [groups, activeSection]);

  // Dynamic Multi-Heading Scroll Spy (matching Anticeil docs TOC)
  useEffect(() => {
    const subItems = activeItem?.subItems;
    if (!subItems || subItems.length === 0) {
      setActiveSubIds([]);
      return;
    }

    const container = scrollRef.current;
    if (!container) return;

    let ticking = false;

    const updateSpy = () => {
      const containerRect = container.getBoundingClientRect();
      const containerTop = containerRect.top;
      const containerBottom = containerRect.bottom;

      // 1. Find all subItem sections physically visible in the content viewport
      const visibleIds: string[] = [];
      for (const sub of subItems) {
        const el = container.querySelector(`#${CSS.escape(sub.id)}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          // Element is visible if its top is above bottom threshold and bottom is below top threshold
          const isVisible = rect.top < containerBottom - 40 && rect.bottom > containerTop + 30;
          if (isVisible) {
            visibleIds.push(sub.id);
          }
        }
      }

      // 2. If nothing is in view (e.g. scrolled between or above), fallback to current top section
      if (visibleIds.length === 0) {
        let currentTop = subItems[0].id;
        for (const sub of subItems) {
          const el = container.querySelector(`#${CSS.escape(sub.id)}`);
          if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= containerTop + 100) {
              currentTop = sub.id;
            }
          }
        }
        visibleIds.push(currentTop);
      }

      setActiveSubIds(visibleIds);
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
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [activeSection, activeItem?.subItems, scrollRef]);

  const scrollToSubItem = useCallback(
    (subId: string) => {
      const container = scrollRef.current;
      if (!container) return;
      const el = container.querySelector(`#${CSS.escape(subId)}`);
      if (el) {
        const containerTop = container.getBoundingClientRect().top;
        const elTop = el.getBoundingClientRect().top;
        const offset = elTop - containerTop + container.scrollTop - 20;
        container.scrollTo({ top: offset, behavior: 'smooth' });
      }
      setActiveSubIds([subId]);
    },
    [scrollRef],
  );

  const handleSelectSection = (item: SettingsNavItem) => {
    if (item.onClick) {
      item.onClick();
    } else {
      onSectionChange(item.id);
      setMobileView('detail');
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        onCloseAutoFocus={(e) => e.preventDefault()}
        className={cn(
          LAYOUT_DIALOG_SPACING.TWO_PANE_CONTAINER,
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

                        {/* Discord / Anticeil docs style multi-heading sub-items with scroll-spy */}
                        {isActive && item.subItems && item.subItems.length > 0 && (
                          <div className="ml-3 mt-0.5 mb-1 relative">
                            {/* Inactive base vertical guide rail */}
                            <div className="absolute left-2 top-0 bottom-0 w-px bg-sidebar-border" />
                            <div className="space-y-0.5">
                              {item.subItems.map((sub, idx) => {
                                const isSubActive =
                                  activeSubIds.includes(sub.id) ||
                                  (activeSubIds.length === 0 && idx === 0);
                                const isPrevActive =
                                  idx > 0 &&
                                  (activeSubIds.includes(item.subItems![idx - 1].id) ||
                                    (activeSubIds.length === 0 && idx === 1));
                                const isNextActive =
                                  idx < item.subItems!.length - 1 &&
                                  activeSubIds.includes(item.subItems![idx + 1].id);

                                return (
                                  <button
                                    key={sub.id}
                                    type="button"
                                    onClick={() => scrollToSubItem(sub.id)}
                                    className={cn(
                                      'w-full text-left pl-5 pr-2 py-1 text-[11px] rounded-md transition-colors cursor-pointer relative',
                                      isSubActive
                                        ? 'text-foreground font-bold'
                                        : 'text-muted-foreground/60 hover:text-foreground font-medium',
                                    )}
                                  >
                                    {/* Connected active indicator rail */}
                                    {isSubActive && (
                                      <span
                                        className={cn(
                                          'absolute left-[7.5px] w-[2px] bg-foreground shadow-xs z-10 transition-all duration-150',
                                          isPrevActive ? '-top-0.5' : 'top-1 rounded-t-full',
                                          isNextActive ? '-bottom-0.5' : 'bottom-1 rounded-b-full',
                                        )}
                                      />
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
          {/* Top App Bar Header (Discord 1:1 Parity) */}
          <div className={LAYOUT_DIALOG_SPACING.HEADER_CONTAINER}>
            {/* Left: Mobile back button (when in detail view) + Section Title */}
            <div className="flex items-center gap-2.5 min-w-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setMobileView('menu')}
                className="md:hidden h-8 px-2 gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground -ml-2 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{t('Menu')}</span>
              </Button>
              <div className="flex items-center gap-2 min-w-0">
                {activeItem?.icon && <span className="shrink-0 text-muted-foreground">{activeItem.icon}</span>}
                <h1 className="text-base font-bold text-foreground truncate tracking-tight">
                  {activeItem?.label || title}
                </h1>
              </div>
            </div>

            {/* Right Suffix: Discord Close (X) Button with ESC Badge */}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/80 transition-colors cursor-pointer group"
              title={t('Tutup (ESC)')}
              aria-label={t('Tutup')}
            >
              <span className="hidden sm:inline-block text-[10px] font-bold tracking-wider uppercase opacity-60 group-hover:opacity-100 border border-border/80 px-1.5 py-0.5 rounded">
                ESC
              </span>
              <X className="w-4 h-4 stroke-[2.2] group-hover:scale-110 transition-transform" />
            </button>
          </div>

          {/* Scrollable Content Container */}
          <div
            ref={scrollRef as React.RefObject<HTMLDivElement>}
            className={cn(
              LAYOUT_DIALOG_SPACING.BODY_PADDING,
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

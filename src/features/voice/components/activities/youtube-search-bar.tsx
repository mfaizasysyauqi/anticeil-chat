import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface YouTubeSearchBarProps {
  query: string;
  setQuery: (q: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  onPasteUrl?: (url: string) => void;
  placeholder?: string;
  className?: string;
}

export const YouTubeSearchBar: React.FC<YouTubeSearchBarProps> = ({
  query,
  setQuery,
  onSubmit,
  onPasteUrl,
  placeholder = 'Ketik lalu tekan Enter / Paste URL YouTube...',
  className,
}) => {
  return (
    <form
      onSubmit={onSubmit}
      className={cn('relative w-full shrink-0 flex items-center', className)}
    >
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onPaste={(e) => {
          const pasted = e.clipboardData.getData('text');
          const match = pasted.match(
            /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
          );
          if (match && onPasteUrl) {
            e.preventDefault();
            onPasteUrl(pasted);
          }
        }}
        placeholder={placeholder}
        className="w-full bg-muted/60 border border-border rounded-full pl-5 pr-20 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
      />
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            title="Hapus pencarian"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          type="submit"
          className="p-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors cursor-pointer active:scale-95"
          title="Cari (Enter)"
          aria-label="Cari"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
};

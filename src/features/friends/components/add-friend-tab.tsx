import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/core/i18n';

interface AddFriendTabProps {
  onAddFriend: (username: string) => Promise<void> | void;
  isAddingFriend?: boolean;
}

export function AddFriendTab({ onAddFriend, isAddingFriend = false }: AddFriendTabProps) {
  const { t } = useTranslation();
  const [inputVal, setInputVal] = useState('');

  const handleSubmit = () => {
    if (!inputVal.trim() || isAddingFriend) return;
    onAddFriend(inputVal.trim());
    setInputVal('');
  };

  return (
    <div className="w-full">
      <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-1">
        {t('Tambah Teman')}
      </h2>
      <p className="text-xs text-muted-foreground mb-4">
        {t('Kamu bisa menambahkan teman menggunakan nama pengguna mereka.')}
      </p>

      <div className="relative flex items-center rounded-lg bg-card border border-border focus-within:border-primary transition-colors p-2 shadow-2xs">
        <Input
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder={t('Kamu bisa menambahkan teman menggunakan nama pengguna mereka')}
          className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-xs px-2 h-8 placeholder:text-muted-foreground/60 flex-1 text-foreground"
        />
        <Button
          onClick={handleSubmit}
          disabled={!inputVal.trim() || isAddingFriend}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-8 px-4 shrink-0 transition-all cursor-pointer disabled:opacity-50"
        >
          {isAddingFriend ? t('Mengirim...') : t('Kirim Permintaan Pertemanan')}
        </Button>
      </div>

      <Separator className="my-8" />

      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">
          {t('Mulai berteman di Anticeil!')}
        </h3>
        <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
          {t(
            'Bagikan username Anda kepada teman atau masukkan username mereka di atas untuk mulai mengobrol dan berkolaborasi.'
          )}
        </p>
      </div>
    </div>
  );
}

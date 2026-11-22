import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Smile, Trash2, Plus, CalendarPlus, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface PollAnswerDraft {
  id: number;
  text: string;
  emoji?: string;
}

export interface CreatePollModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitPoll: (
    question: string,
    options: Array<{ text: string; emoji?: string }> | string[],
    allowMultiple?: boolean,
    durationHours?: number
  ) => void;
  onSchedulePoll?: () => void;
}

const COMMON_EMOJIS = ['👍', '👎', '❤️', '🔥', '🎉', '😂', '✨', '🚀', '💡', '🍕', '☕', '✅', '❌', '💯', '🤔', '👀', '🎮', '🎵'];

const DURATION_OPTIONS = [
  { label: '1 hour', value: 1 },
  { label: '4 hours', value: 4 },
  { label: '8 hours', value: 8 },
  { label: '24 hours', value: 24 },
  { label: '3 days', value: 72 },
  { label: '1 week', value: 168 },
];

export function CreatePollModal({
  open,
  onOpenChange,
  onSubmitPoll,
  onSchedulePoll,
}: CreatePollModalProps) {
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState<PollAnswerDraft[]>([
    { id: 1, text: '', emoji: '' },
    { id: 2, text: '', emoji: '' },
  ]);
  const [durationHours, setDurationHours] = useState<number>(24);
  const [allowMultiple, setAllowMultiple] = useState<boolean>(false);
  const [activeEmojiIndex, setActiveEmojiIndex] = useState<number | null>(null);

  const handleAddAnswer = () => {
    if (answers.length >= 10) {
      toast.error('Maksimal 10 opsi jajak pendapat');
      return;
    }
    setAnswers((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), text: '', emoji: '' },
    ]);
  };

  const handleRemoveAnswer = (index: number) => {
    if (answers.length <= 2) {
      toast.error('Minimal 2 opsi');
      return;
    }
    setAnswers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTextChange = (index: number, val: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], text: val.slice(0, 55) };
      return next;
    });
  };

  const handleSelectEmoji = (index: number, emoji: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], emoji };
      return next;
    });
    setActiveEmojiIndex(null);
  };

  const handleClearEmoji = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], emoji: '' };
      return next;
    });
  };

  const filledAnswers = answers.filter((a) => a.text.trim().length > 0);
  const isValid = question.trim().length > 0 && filledAnswers.length >= 2;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanQuestion = question.trim();
    if (!cleanQuestion) {
      toast.error('Pertanyaan jajak pendapat wajib diisi');
      return;
    }
    if (filledAnswers.length < 2) {
      toast.error('Harap isi minimal 2 opsi jawaban');
      return;
    }

    const payloadOptions = filledAnswers.map((a) => ({
      text: a.text.trim(),
      emoji: a.emoji?.trim() || undefined,
    }));

    onSubmitPoll(cleanQuestion, payloadOptions, allowMultiple, durationHours);
    onOpenChange(false);

    // Reset state
    setQuestion('');
    setAnswers([
      { id: 1, text: '', emoji: '' },
      { id: 2, text: '', emoji: '' },
    ]);
    setDurationHours(24);
    setAllowMultiple(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" className="p-0 bg-card text-foreground border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-border/40">
          <DialogTitle className="text-base font-bold text-foreground tracking-normal">
            Create a Poll
          </DialogTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* 1. Question Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Question
            </label>
            <div className="relative">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value.slice(0, 300))}
                placeholder="What question do you want to ask?"
                rows={2}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none transition-all"
              />
              <div className="text-right text-[10px] text-muted-foreground font-medium mt-0.5">
                {question.length} / 300
              </div>
            </div>
          </div>

          {/* 2. Answers Section */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Answers
            </label>

            <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
              {answers.map((ans, i) => (
                <div
                  key={ans.id}
                  className="flex items-center gap-2 bg-background border border-border rounded-lg px-2.5 py-1.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all"
                >
                  {/* Emoji Picker Popover */}
                  <Popover
                    open={activeEmojiIndex === i}
                    onOpenChange={(isOpen) => setActiveEmojiIndex(isOpen ? i : null)}
                  >
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
                        title="Pilih emoji"
                      >
                        {ans.emoji ? (
                          <span className="text-base leading-none">{ans.emoji}</span>
                        ) : (
                          <Smile className="w-4 h-4 opacity-70 hover:opacity-100" />
                        )}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      side="bottom"
                      align="start"
                      className="w-56 p-2 bg-popover border border-border text-popover-foreground rounded-xl shadow-xl z-50"
                    >
                      <div className="text-[10px] font-bold text-muted-foreground uppercase px-1 mb-1.5">
                        Pilih Emoji
                      </div>
                      <div className="grid grid-cols-6 gap-1">
                        {COMMON_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleSelectEmoji(i, emoji)}
                            className="w-7 h-7 rounded hover:bg-muted flex items-center justify-center text-base cursor-pointer transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                      {ans.emoji && (
                        <button
                          type="button"
                          onClick={(e) => handleClearEmoji(i, e)}
                          className="mt-2 w-full text-center text-[11px] text-destructive hover:underline pt-1 border-t border-border cursor-pointer"
                        >
                          Hapus Emoji
                        </button>
                      )}
                    </PopoverContent>
                  </Popover>

                  {/* Answer Text Input */}
                  <input
                    type="text"
                    value={ans.text}
                    onChange={(e) => handleTextChange(i, e.target.value)}
                    placeholder="Type your answer"
                    maxLength={55}
                    className="flex-1 bg-transparent border-0 outline-none p-0 text-xs text-foreground placeholder:text-muted-foreground/70"
                  />

                  {/* Remove Option Button */}
                  {answers.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAnswer(i)}
                      className="p-1 text-muted-foreground hover:text-destructive hover:bg-muted rounded transition-colors cursor-pointer shrink-0"
                      title="Hapus opsi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* + Add another answer button */}
            {answers.length < 10 && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleAddAnswer}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:border-border/80 bg-background text-xs text-foreground font-medium hover:bg-muted/50 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add another answer</span>
                </button>
              </div>
            )}
          </div>

          {/* 3. Duration Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Duration
            </label>
            <Select
              value={String(durationHours)}
              onValueChange={(val) => setDurationHours(Number(val))}
            >
              <SelectTrigger className="w-full bg-background border-border rounded-lg text-xs font-medium text-foreground h-9 focus:ring-1 focus:ring-primary">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-popover-foreground rounded-lg shadow-xl">
                {DURATION_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={String(opt.value)}
                    className="text-xs hover:bg-muted focus:bg-muted cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{opt.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 4. Bottom Footer: Allow Multiple Answers & Post */}
          <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-3">
            {/* Allow Multiple Answers Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <Checkbox
                checked={allowMultiple}
                onCheckedChange={(checked) => setAllowMultiple(Boolean(checked))}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary border-border"
              />
              <span className="text-xs font-medium text-foreground">
                Allow Multiple Answers
              </span>
            </label>

            {/* Right Buttons: Calendar & Post */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onSchedulePoll}
                className="w-8 h-8 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                title="Schedule Poll"
              >
                <CalendarPlus className="w-4 h-4" />
              </button>

              <button
                type="submit"
                disabled={!isValid}
                className={cn(
                  'px-5 py-2 rounded-md text-xs font-bold transition-all shadow-md',
                  isValid
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground active:scale-95 cursor-pointer'
                    : 'bg-primary/50 text-primary-foreground/60 cursor-not-allowed'
                )}
              >
                Post
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

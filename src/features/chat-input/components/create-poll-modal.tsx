import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BarChart2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export interface CreatePollModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitPoll: (question: string, options: string[]) => void;
}

export function CreatePollModal({
  open,
  onOpenChange,
  onSubmitPoll,
}: CreatePollModalProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);

  const handleAddOption = () => {
    if (options.length >= 8) {
      toast.error('Maksimal 8 opsi jajak pendapat');
      return;
    }
    setOptions((prev) => [...prev, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      toast.error('Minimal 2 opsi');
      return;
    }
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, val: string) => {
    setOptions((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuestion = question.trim();
    if (!cleanQuestion) {
      toast.error('Pertanyaan jajak pendapat wajib diisi');
      return;
    }
    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    if (cleanOptions.length < 2) {
      toast.error('Harap masukkan minimal 2 opsi');
      return;
    }

    onSubmitPoll(cleanQuestion, cleanOptions);
    onOpenChange(false);
    setQuestion('');
    setOptions(['', '']);
    toast.success('Jajak pendapat berhasil dibuat! 📊');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] bg-[#1e1f22] text-[#dbdee1] border border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
            <BarChart2 className="w-5 h-5 text-primary" />
            Buat Jajak Pendapat (Create Poll)
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Ajukan pertanyaan dan biarkan rekan di saluran ini memilih opsi mereka.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogBody className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white">Pertanyaan</label>
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Apa yang ingin kamu tanyakan?"
                className="bg-[#111214] border-white/10 text-white placeholder:text-muted-foreground text-xs"
                maxLength={200}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-white flex items-center justify-between">
                <span>Opsi Jawaban</span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  {options.length}/8 opsi
                </span>
              </label>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-4 text-center">
                      {i + 1}.
                    </span>
                    <Input
                      value={opt}
                      onChange={(e) => handleOptionChange(i, e.target.value)}
                      placeholder={`Opsi ${i + 1}`}
                      className="bg-[#111214] border-white/10 text-white placeholder:text-muted-foreground text-xs flex-1"
                      maxLength={100}
                      required
                    />
                    {options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveOption(i)}
                        className="h-8 w-8 text-muted-foreground hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {options.length < 8 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddOption}
                  className="w-full text-xs font-medium border-dashed border-white/20 hover:border-white/40 cursor-pointer gap-1.5 h-8 mt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Opsi
                </Button>
              )}
            </div>
          </DialogBody>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-xs cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-semibold cursor-pointer"
            >
              Kirim Poll
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

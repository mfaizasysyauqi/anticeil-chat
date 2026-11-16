import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { CommunityCustomRole } from '@/chat/chat-types';

export interface RoleLinksSubtabProps {
  requirements: Array<{ id: string; platform: string; condition: string }>;
  setRequirements: React.Dispatch<React.SetStateAction<Array<{ id: string; platform: string; condition: string }>>>;
  isAddingRequirement: boolean;
  setIsAddingRequirement: (val: boolean) => void;
  t: (key: string) => string;
}

export function RoleLinksSubtab({
  requirements,
  setRequirements,
  isAddingRequirement,
  setIsAddingRequirement,
  t,
}: RoleLinksSubtabProps) {
  return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                {t('Create Linked Role')}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {t(
                  'Linking a connection or app requires members to connect their accounts before being added to the role.',
                )}{' '}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    toast.info(t('Linked roles require verified third-party connections.'));
                  }}
                  className="text-blue-400 hover:underline font-semibold"
                >
                  {t('Learn more about Linked Roles.')}
                </a>
              </p>
            </div>

            {/* Add requirement button */}
            <div>
              <Button
                onClick={() => setIsAddingRequirement(true)}
                className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold h-10 rounded-lg cursor-pointer"
              >
                {t('Add requirement')}
              </Button>
            </div>

            {/* Requirements list */}
            {requirements.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-muted-foreground uppercase">
                  {t('Active Requirements')} ({requirements.length})
                </span>
                <div className="rounded-xl border border-border/80 bg-[#1e1f22] divide-y divide-border/60 overflow-hidden">
                  {requirements.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between p-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm">🔗</span>
                        <div>
                          <span className="text-xs font-bold text-foreground block">
                            {req.platform}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {req.condition}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setRequirements((prev) =>
                            prev.filter((r) => r.id !== req.id),
                          )
                        }
                        className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add requirement modal */}
            {isAddingRequirement && (
              <div className="p-4 rounded-xl border border-border/80 bg-[#1e1f22] space-y-3">
                <span className="text-xs font-bold text-foreground block">
                  {t('Pilih Platform Koneksi')}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { name: 'Steam', cond: 'Steam account verified (> 1 game)' },
                    { name: 'Spotify', cond: 'Spotify connected' },
                    { name: 'GitHub', cond: 'GitHub account (> 5 followers)' },
                    { name: 'YouTube', cond: 'YouTube channel verified' },
                    { name: 'Reddit', cond: 'Reddit account karma > 50' },
                    { name: 'X / Twitter', cond: 'X account followers > 10' },
                  ].map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => {
                        setRequirements((prev) => [
                          ...prev,
                          {
                            id: `req_${Date.now()}`,
                            platform: p.name,
                            condition: p.cond,
                          },
                        ]);
                        setIsAddingRequirement(false);
                        toast.success(
                          t(`Persyaratan ${p.name} berhasil ditambahkan!`),
                        );
                      }}
                      className="p-2.5 rounded-lg border border-border/60 bg-[#2b2d31]/70 hover:bg-[#35373c] text-xs font-semibold text-left transition-colors cursor-pointer"
                    >
                      <span className="text-foreground block">{p.name}</span>
                      <span className="text-[10px] text-muted-foreground truncate block">
                        {p.cond}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="pt-1 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingRequirement(false)}
                    className="text-xs h-8"
                  >
                    {t('Batal')}
                  </Button>
                </div>
              </div>
            )}
          </div>
  );
}

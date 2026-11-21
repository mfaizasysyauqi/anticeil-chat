import React, { useState, useMemo } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DiscordPollData, DiscordPollAnswer } from '@/chat/chat-types';
import { messagesApi } from '@/features/chat/api/messages-api';
import { toast } from 'sonner';

export interface DiscordPollCardProps {
  messageId: string;
  channelId: string;
  poll: DiscordPollData;
  currentUser?: any;
  onUpdatePoll?: (updatedPoll: DiscordPollData) => void;
  t?: (key: string) => string;
}

export function DiscordPollCard({
  messageId,
  channelId,
  poll,
  currentUser,
  onUpdatePoll,
  t = (s: string) => s,
}: DiscordPollCardProps) {
  const currentUserId = String(currentUser?.id || 'me');

  // Find answers the user voted for
  const userVotedIds = useMemo(() => {
    return (poll.answers || [])
      .filter((a) => (a.votes || []).includes(currentUserId))
      .map((a) => a.id);
  }, [poll.answers, currentUserId]);

  const hasVoted = userVotedIds.length > 0;

  // Selected answers for voting
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>(userVotedIds);
  const [isShowingResults, setIsShowingResults] = useState<boolean>(hasVoted);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Expiration calculation
  const { isExpired, timeLeftText } = useMemo(() => {
    if (poll.closed) {
      return { isExpired: true, timeLeftText: t('Final results') };
    }
    if (!poll.expiresAt) {
      return { isExpired: false, timeLeftText: '24h left' };
    }
    const expTime = new Date(poll.expiresAt).getTime();
    const now = Date.now();
    const diffMs = expTime - now;
    if (diffMs <= 0) {
      return { isExpired: true, timeLeftText: t('Final results') };
    }
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours >= 24) {
      const days = Math.round(diffHours / 24);
      return { isExpired: false, timeLeftText: `${days}d left` };
    }
    if (diffHours >= 1) {
      return { isExpired: false, timeLeftText: `${diffHours}h left` };
    }
    const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    return { isExpired: false, timeLeftText: `${diffMins}m left` };
  }, [poll.expiresAt, poll.closed, t]);

  // Total unique voters
  const totalVotes = useMemo(() => {
    const allVoters = new Set<string>();
    (poll.answers || []).forEach((a) => {
      (a.votes || []).forEach((v) => allVoters.add(v));
    });
    return allVoters.size;
  }, [poll.answers]);

  // Max votes on any single answer for highlight
  const maxVotes = useMemo(() => {
    let max = 0;
    (poll.answers || []).forEach((a) => {
      const count = a.votes?.length || 0;
      if (count > max) max = count;
    });
    return max;
  }, [poll.answers]);

  const handleToggleOption = (answerId: string | number) => {
    if (isExpired) return;
    if (poll.allowMultiselect) {
      setSelectedIds((prev) =>
        prev.includes(answerId) ? prev.filter((id) => id !== answerId) : [...prev, answerId]
      );
    } else {
      setSelectedIds((prev) => (prev.includes(answerId) ? [] : [answerId]));
    }
  };

  const handleVote = async () => {
    if (selectedIds.length === 0 || isExpired) return;
    setIsSubmitting(true);
    try {
      const res = await messagesApi.votePoll(messageId, selectedIds, currentUserId, channelId);
      if (res && res.poll) {
        onUpdatePoll?.(res.poll);
      }
      setIsShowingResults(true);
      toast.success(t('Pilihan Anda berhasil disimpan!'));
    } catch {
      toast.error(t('Gagal mengirim suara'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveVote = async () => {
    setIsSubmitting(true);
    try {
      const res = await messagesApi.votePoll(messageId, [], currentUserId, channelId);
      if (res && res.poll) {
        onUpdatePoll?.(res.poll);
      }
      setSelectedIds([]);
      setIsShowingResults(false);
      toast.info(t('Suara berhasil dibatalkan'));
    } catch {
      toast.error(t('Gagal membatalkan suara'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const showResultsActive = isShowingResults || isExpired;

  return (
    <div className="my-2 max-w-md w-full rounded-2xl bg-[#1e1f22]/95 dark:bg-[#1e1f22] border border-white/5 p-4 space-y-3.5 shadow-lg select-none">
      {/* Question Header */}
      <div>
        <h4 className="text-base font-bold text-white tracking-normal leading-snug break-words">
          {poll.question}
        </h4>
        <p className="text-xs text-[#949ba4] font-medium mt-1">
          {poll.allowMultiselect
            ? t('Select one or more answers')
            : t('Select one answer')}
        </p>
      </div>

      {/* Answers Options List */}
      <div className="space-y-2">
        {(poll.answers || []).map((ans: DiscordPollAnswer) => {
          const voteCount = ans.votes?.length || 0;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const isSelected = selectedIds.includes(ans.id);
          const isUserVote = (ans.votes || []).includes(currentUserId);
          const isWinner = maxVotes > 0 && voteCount === maxVotes;

          return (
            <div
              key={ans.id}
              onClick={() => {
                if (!showResultsActive || !hasVoted) {
                  handleToggleOption(ans.id);
                }
              }}
              className={cn(
                'group relative overflow-hidden w-full p-3 rounded-xl border transition-all text-xs font-semibold flex items-center justify-between',
                showResultsActive
                  ? 'cursor-default border-white/5 bg-[#2b2d31]/50'
                  : 'cursor-pointer border-white/5 bg-[#2b2d31]/80 hover:bg-[#35373c] hover:border-white/10'
              )}
            >
              {/* Progress Bar Background */}
              {showResultsActive && (
                <div
                  className={cn(
                    'absolute left-0 top-0 bottom-0 transition-all duration-500 rounded-l-xl',
                    isWinner
                      ? 'bg-[#5865f2]/30 dark:bg-[#5865f2]/35'
                      : 'bg-white/10 dark:bg-white/10'
                  )}
                  style={{ width: `${percentage}%` }}
                />
              )}

              {/* Answer Content Left */}
              <div className="relative z-10 flex items-center gap-2.5 min-w-0 pr-2">
                {ans.emoji && (
                  <span className="text-base leading-none shrink-0">{ans.emoji}</span>
                )}
                <span className={cn(
                  'truncate text-white font-medium',
                  isWinner && showResultsActive && 'font-bold'
                )}>
                  {ans.text}
                </span>
                {showResultsActive && isUserVote && (
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#5865f2] text-white shrink-0" title={t('Pilihan Anda')}>
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
              </div>

              {/* Answer Right: Radio/Checkbox or Vote Count */}
              <div className="relative z-10 flex items-center gap-2 shrink-0 ml-2">
                {showResultsActive ? (
                  <span className="text-xs text-[#949ba4] font-medium font-mono">
                    {voteCount} {voteCount === 1 ? 'vote' : 'votes'} • {percentage}%
                  </span>
                ) : (
                  <>
                    {poll.allowMultiselect ? (
                      /* Checkbox for Multiple Choice */
                      <div
                        className={cn(
                          'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
                          isSelected
                            ? 'border-[#5865f2] bg-[#5865f2] text-white'
                            : 'border-[#949ba4] group-hover:border-white'
                        )}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    ) : (
                      /* Radio Circle for Single Choice */
                      <div
                        className={cn(
                          'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                          isSelected
                            ? 'border-[#5865f2] bg-[#5865f2]'
                            : 'border-[#949ba4] group-hover:border-white'
                        )}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info & Actions */}
      <div className="pt-1 flex items-center justify-between text-xs text-[#949ba4]">
        {/* Left Stats */}
        <span className="font-medium text-[11px] text-[#949ba4]">
          {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} • {timeLeftText}
        </span>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Show / Hide Results Toggle */}
          <button
            type="button"
            onClick={() => setIsShowingResults(!isShowingResults)}
            className="text-xs font-semibold text-[#949ba4] hover:text-white transition-colors cursor-pointer px-1 py-1"
          >
            {isShowingResults ? t('Hide results') : t('Show results')}
          </button>

          {/* Vote / Remove Vote Button */}
          {hasVoted && isShowingResults ? (
            <button
              type="button"
              disabled={isSubmitting || isExpired}
              onClick={handleRemoveVote}
              className="px-3.5 py-1.5 rounded-md text-xs font-semibold text-white/90 hover:text-white hover:bg-white/10 border border-white/20 transition-all cursor-pointer disabled:opacity-40"
            >
              {t('Remove vote')}
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting || selectedIds.length === 0 || isExpired}
              onClick={handleVote}
              className="px-4 py-1.5 rounded-md text-xs font-semibold text-white bg-[#5865f2] hover:bg-[#4752c4] transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t('Vote')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

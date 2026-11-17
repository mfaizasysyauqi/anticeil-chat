import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import confetti from 'canvas-confetti';
import {
  HelpCircle,
  Trophy,
  Timer,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Users,
  Flame,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { ColonyChannel } from '@/chat/chat-types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface TriviaGameProps {
  channel: ColonyChannel;
  socket: Socket | null;
  currentUserName?: string;
  currentUser?: any;
  participants?: any[];
}

interface Question {
  id: number;
  question: string;
  category: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const TRIVIA_QUESTIONS: Question[] = [
  {
    id: 1,
    question: 'Protokol apa yang digunakan oleh WebRTC untuk negosiasi koneksi peer-to-peer secara langsung?',
    category: 'Networking',
    options: ['HTTP/2', 'SDP (Session Description Protocol)', 'WebSocket', 'GraphQL'],
    correctAnswer: 1,
    explanation: 'SDP digunakan untuk bertukar metadata koneksi, codec, dan parameter jaringan antar peer.',
  },
  {
    id: 2,
    question: 'Tahun berapakah bahasa pemrograman TypeScript pertama kali dirilis ke publik oleh Microsoft?',
    category: 'Web Dev',
    options: ['2008', '2010', '2012', '2015'],
    correctAnswer: 2,
    explanation: 'TypeScript 0.8 dirilis oleh Microsoft pada Oktober 2012 yang dipimpin oleh Anders Hejlsberg.',
  },
  {
    id: 3,
    question: 'Dalam arsitektur React, konsep apa yang memungkinkan komponen server merender langsung tanpa bundle JS ke client?',
    category: 'Frontend',
    options: ['Virtual DOM', 'React Server Components (RSC)', 'Redux Thunk', 'Microfrontend'],
    correctAnswer: 1,
    explanation: 'RSC dieksekusi murni di server dan menghasilkan format stream JSON tanpa membebani client bundle.',
  },
  {
    id: 4,
    question: 'Algoritma konsensus apa yang digunakan oleh Bitcoin untuk memvalidasi blok transaksi?',
    category: 'Crypto & Tech',
    options: ['Proof of Stake (PoS)', 'Proof of Authority (PoA)', 'Proof of Work (PoW)', 'Raft Consensus'],
    correctAnswer: 2,
    explanation: 'Bitcoin menggunakan PoW dengan algoritma hash SHA-256 untuk mencapai konsensus terdistribusi.',
  },
  {
    id: 5,
    question: 'Game legendaris apa yang pertama kali mempopulerkan format multiplayer battle royale modern?',
    category: 'Gaming',
    options: ['Fortnite', 'PUBG (PlayerUnknown\'s Battlegrounds)', 'Apex Legends', 'Call of Duty: Warzone'],
    correctAnswer: 1,
    explanation: 'PUBG dirilis pada 2017 dan menjadi pelopor revolusi tren battle royale global.',
  },
];

interface PlayerScore {
  userId: string;
  userName: string;
  userAvatar?: string | null;
  score: number;
  streak: number;
}

export function TriviaGame({
  channel,
  socket,
  currentUserName = 'Pemain',
  currentUser,
  participants = [],
}: TriviaGameProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerLocked, setIsAnswerLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [scores, setScores] = useState<Record<string, PlayerScore>>({});
  const [isGameOver, setIsGameOver] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const myId = currentUser?.id || currentUserName || 'user-me';
  const myName = currentUserName || currentUser?.firstName || 'Pemain';

  const currentQ = TRIVIA_QUESTIONS[currentQuestionIndex];

  // Inisialisasi & sinkronisasi skor pemain
  useEffect(() => {
    setScores((prev) => {
      if (!prev[myId]) {
        return {
          ...prev,
          [myId]: {
            userId: myId,
            userName: myName,
            userAvatar: currentUser?.imageUrl,
            score: 0,
            streak: 0,
          },
        };
      }
      return prev;
    });
  }, [myId, myName, currentUser?.imageUrl]);

  // Socket listener untuk trivia events
  useEffect(() => {
    if (!socket) return;

    const handleTriviaEvent = (data: {
      channelId?: string;
      action: string;
      payload?: any;
    }) => {
      if (!data || data.channelId !== channel.id) return;

      if (data.action === 'TRIVIA_ANSWER') {
        const { userId, userName, userAvatar, isCorrect, pointsEarned } = data.payload || {};
        if (userId) {
          setScores((prev) => {
            const current = prev[userId] || {
              userId,
              userName: userName || 'Pemain',
              userAvatar,
              score: 0,
              streak: 0,
            };
            return {
              ...prev,
              [userId]: {
                ...current,
                score: current.score + (pointsEarned || 0),
                streak: isCorrect ? current.streak + 1 : 0,
              },
            };
          });
        }
      } else if (data.action === 'TRIVIA_NEXT_QUESTION') {
        const { nextIndex } = data.payload || {};
        if (typeof nextIndex === 'number') {
          setCurrentQuestionIndex(nextIndex);
          setSelectedOption(null);
          setIsAnswerLocked(false);
          setTimeLeft(15);
          if (nextIndex >= TRIVIA_QUESTIONS.length) {
            setIsGameOver(true);
            confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
          }
        }
      } else if (data.action === 'TRIVIA_RESTART') {
        setCurrentQuestionIndex(0);
        setSelectedOption(null);
        setIsAnswerLocked(false);
        setTimeLeft(15);
        setIsGameOver(false);
        setScores({});
      }
    };

    socket.on('COMMUNITY_CALL_ACTIVITY_EVENT', handleTriviaEvent);
    return () => {
      socket.off('COMMUNITY_CALL_ACTIVITY_EVENT', handleTriviaEvent);
    };
  }, [socket, channel.id]);

  // Countdown timer per pertanyaan
  useEffect(() => {
    if (isGameOver || isAnswerLocked) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsAnswerLocked(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuestionIndex, isGameOver, isAnswerLocked]);

  const handleSelectOption = (index: number) => {
    if (isAnswerLocked || isGameOver) return;

    setSelectedOption(index);
    setIsAnswerLocked(true);

    const isCorrect = index === currentQ.correctAnswer;
    const speedBonus = timeLeft * 10;
    const points = isCorrect ? 100 + speedBonus : 0;

    setScores((prev) => {
      const me = prev[myId] || {
        userId: myId,
        userName: myName,
        userAvatar: currentUser?.imageUrl,
        score: 0,
        streak: 0,
      };
      return {
        ...prev,
        [myId]: {
          ...me,
          score: me.score + points,
          streak: isCorrect ? me.streak + 1 : 0,
        },
      };
    });

    if (isCorrect) {
      toast.success(`Benar! +${points} Poin (Bonus Kecepatan: +${speedBonus}) ⚡`);
    } else {
      toast.error('Jawaban belum tepat!');
    }

    socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
      channelId: channel.id,
      action: 'TRIVIA_ANSWER',
      payload: {
        userId: myId,
        userName: myName,
        userAvatar: currentUser?.imageUrl,
        isCorrect,
        pointsEarned: points,
      },
    });
  };

  const handleNextQuestion = () => {
    const nextIdx = currentQuestionIndex + 1;
    if (nextIdx >= TRIVIA_QUESTIONS.length) {
      setIsGameOver(true);
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });
    } else {
      setCurrentQuestionIndex(nextIdx);
      setSelectedOption(null);
      setIsAnswerLocked(false);
      setTimeLeft(15);
    }

    socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
      channelId: channel.id,
      action: 'TRIVIA_NEXT_QUESTION',
      payload: { nextIndex: nextIdx },
    });
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswerLocked(false);
    setTimeLeft(15);
    setIsGameOver(false);
    setScores({});

    socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
      channelId: channel.id,
      action: 'TRIVIA_RESTART',
    });
  };

  const sortedLeaderboard = Object.values(scores).sort((a, b) => b.score - a.score);

  return (
    <div className="w-full h-full flex flex-col bg-background text-foreground select-none overflow-y-auto p-4 sm:p-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-border/60 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">Cyber Trivia Battle</h2>
              <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-500 border-indigo-500/30">
                LIVE VOICE QUIZ
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Pertanyaan {Math.min(currentQuestionIndex + 1, TRIVIA_QUESTIONS.length)} dari {TRIVIA_QUESTIONS.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {!isGameOver && (
            <div className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-black transition-colors',
              timeLeft <= 5
                ? 'bg-destructive/15 border-destructive/40 text-destructive animate-pulse'
                : 'bg-card border-border text-foreground'
            )}>
              <Timer className="w-3.5 h-3.5" />
              <span>{timeLeft}s</span>
            </div>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleRestart}
            className="h-8 gap-1.5 text-xs border-border/80 hover:bg-muted cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Kuis</span>
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      {!isGameOver && currentQ ? (
        <div className="flex-1 flex flex-col lg:flex-row gap-6 my-4 min-h-0 items-center justify-center">
          {/* Question & Options Column */}
          <div className="flex-1 max-w-[620px] w-full flex flex-col gap-4">
            {/* Category Pill */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md">
                Kategori: {currentQ.category}
              </span>
            </div>

            {/* Question Text Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs">
              <h3 className="text-base sm:text-lg font-bold text-foreground leading-relaxed">
                {currentQ.question}
              </h3>
            </div>

            {/* 4 Choices Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQ.options.map((option, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentQ.correctAnswer;
                let btnStyle = 'border-border/70 bg-card hover:bg-muted/80 text-foreground';

                if (isAnswerLocked) {
                  if (isCorrect) {
                    btnStyle = 'border-emerald-500 bg-emerald-500/20 text-emerald-400 font-bold';
                  } else if (isSelected && !isCorrect) {
                    btnStyle = 'border-destructive bg-destructive/20 text-destructive font-bold';
                  } else {
                    btnStyle = 'border-border/40 bg-card/40 text-muted-foreground opacity-60';
                  }
                } else if (isSelected) {
                  btnStyle = 'border-primary ring-2 ring-primary/40 bg-card';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isAnswerLocked}
                    onClick={() => handleSelectOption(idx)}
                    className={cn(
                      'p-3.5 rounded-xl border text-left text-xs sm:text-sm transition-all duration-200 cursor-pointer flex items-center justify-between shadow-2xs',
                      btnStyle,
                      isAnswerLocked && 'cursor-default'
                    )}
                  >
                    <span className="font-medium pr-2">{option}</span>
                    {isAnswerLocked && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                    {isAnswerLocked && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-destructive shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Explanation & Next Button if Locked */}
            {isAnswerLocked && (
              <div className="p-3.5 rounded-xl bg-muted/60 border border-border/80 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
                <p className="text-xs text-muted-foreground flex-1">
                  💡 <strong className="text-foreground">Fakta:</strong> {currentQ.explanation}
                </p>
                <Button
                  size="sm"
                  onClick={handleNextQuestion}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shrink-0 cursor-pointer"
                >
                  {currentQuestionIndex + 1 >= TRIVIA_QUESTIONS.length ? 'Lihat Papan Skor 🏆' : 'Pertanyaan Berikutnya ➡️'}
                </Button>
              </div>
            )}
          </div>

          {/* Right Leaderboard Sidecard */}
          <div className="w-full lg:w-[260px] bg-card border border-border rounded-2xl p-4 flex flex-col shadow-xs">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/60">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                Papan Skor Live
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {sortedLeaderboard.map((player, rank) => (
                <div
                  key={player.userId}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/40 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black',
                      rank === 0 ? 'bg-amber-500 text-black' : 'bg-muted text-muted-foreground'
                    )}>
                      {rank + 1}
                    </span>
                    <CommunityAvatar
                      name={player.userName}
                      imageUrl={player.userAvatar}
                      size={20}
                      showStatus={false}
                    />
                    <span className="truncate font-semibold text-foreground max-w-[90px]">
                      {player.userName}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {player.streak > 1 && (
                      <span className="text-[10px] text-amber-500 flex items-center">
                        <Flame className="w-3 h-3 fill-amber-500" /> {player.streak}
                      </span>
                    )}
                    <span className="font-bold text-primary">{player.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Game Over Podium Screen */
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500 mb-4 shadow-lg">
            <Trophy className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-foreground mb-1">Kuis Trivia Selesai!</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mb-6">
            Hasil skor battle trivia peserta saluran #{channel.name}
          </p>

          <div className="w-full max-w-[400px] flex flex-col gap-2 mb-6">
            {sortedLeaderboard.slice(0, 3).map((player, rank) => (
              <div
                key={player.userId}
                className={cn(
                  'flex items-center justify-between p-3.5 rounded-xl border shadow-xs',
                  rank === 0
                    ? 'bg-amber-500/10 border-amber-500/40 text-foreground ring-1 ring-amber-500/30'
                    : 'bg-card border-border text-foreground'
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-black">{rank === 0 ? '🥇' : rank === 1 ? '🥈' : '🥉'}</span>
                  <CommunityAvatar
                    name={player.userName}
                    imageUrl={player.userAvatar}
                    size={28}
                    showStatus={false}
                  />
                  <div className="text-left">
                    <p className="text-sm font-bold text-foreground">{player.userName}</p>
                    <p className="text-[11px] text-muted-foreground">Peringkat {rank + 1}</p>
                  </div>
                </div>
                <span className="text-base font-black text-primary">{player.score} Poin</span>
              </div>
            ))}
          </div>

          <Button
            onClick={handleRestart}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Main Kuis Lagi</span>
          </Button>
        </div>
      )}
    </div>
  );
}

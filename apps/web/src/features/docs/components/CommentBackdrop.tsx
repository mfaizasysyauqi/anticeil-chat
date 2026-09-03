import React from 'react';
import { DocComment } from '../store/useDocsStore';
import { calculateCommentRanges, SpanRange } from '../utils/commentUtils';

interface CommentBackdropProps {
  rawText: string;
  comments: DocComment[];
  activeHighlightedCommentId?: string | null;
  isAddingComment?: boolean;
  draftSelectedText?: string;
  draftFromLine?: number;
  draftToLine?: number;
  draftCharStart?: number | null;
  draftCharEnd?: number | null;
  scrollTop?: number;
  scrollLeft?: number;
  fontStyle?: React.CSSProperties;
  backdropRef?: React.RefObject<HTMLDivElement | null>;
}

export const CommentBackdrop: React.FC<CommentBackdropProps> = ({
  rawText,
  comments,
  activeHighlightedCommentId,
  isAddingComment = false,
  draftSelectedText,
  draftFromLine,
  draftToLine,
  draftCharStart,
  draftCharEnd,
  scrollTop = 0,
  scrollLeft = 0,
  fontStyle,
  backdropRef,
}) => {
  if (!rawText) return null;

  const ranges: SpanRange[] = calculateCommentRanges(rawText, comments, isAddingComment, {
    selectedText: draftSelectedText,
    fromLine: draftFromLine,
    toLine: draftToLine,
    charStart: draftCharStart,
    charEnd: draftCharEnd,
  });

  const renderContent = () => {
    if (ranges.length === 0) {
      return <span>{rawText}</span>;
    }

    const elements: React.ReactNode[] = [];
    let currIdx = 0;

    for (let i = 0; i < ranges.length; i++) {
      const r = ranges[i];
      if (r.start > currIdx) {
        elements.push(
          <span key={`txt_${currIdx}`}>
            {rawText.substring(currIdx, r.start)}
          </span>
        );
      }

      const segStart = Math.max(currIdx, r.start);
      const segEnd = Math.min(rawText.length, Math.max(segStart, r.end));

      if (segEnd > segStart) {
        const isSelected = r.commentId && activeHighlightedCommentId === r.commentId;
        const bg = r.isDraft
          ? 'rgba(0, 115, 234, 0.22)'
          : isSelected
          ? 'rgba(245, 158, 11, 0.35)'
          : 'rgba(245, 158, 11, 0.18)';
        const borderB = r.isDraft
          ? '2px solid var(--brand-primary)'
          : isSelected
          ? '2px solid #F59E0B'
          : '1.5px dashed rgba(245, 158, 11, 0.6)';

        elements.push(
          <mark
            key={`mark_${i}_${segStart}`}
            data-comment-mark={r.commentId || (r.isDraft ? 'draft' : undefined)}
            style={{
              backgroundColor: bg,
              color: 'transparent',
              borderRadius: '3px',
              borderBottom: borderB,
              boxDecorationBreak: 'clone',
              WebkitBoxDecorationBreak: 'clone',
              padding: '1px 2px',
              margin: '0 -1px',
            }}
          >
            {rawText.substring(segStart, segEnd)}
          </mark>
        );
        currIdx = segEnd;
      }
    }

    if (currIdx < rawText.length) {
      elements.push(
        <span key={`txt_end_${currIdx}`}>
          {rawText.substring(currIdx)}
        </span>
      );
    }

    return elements;
  };

  return (
    <div
      ref={backdropRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        boxSizing: 'border-box',
        color: 'transparent',
        whiteSpace: 'pre',
        wordWrap: 'normal',
        wordBreak: 'normal',
        transform: `translate(${-scrollLeft}px, ${-scrollTop}px)`,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: '13px',
        lineHeight: '1.6',
        padding: '16px 20px',
        ...fontStyle,
      }}
    >
      {renderContent()}
    </div>
  );
};

import { Loader2, Volume2 } from 'lucide-react';

import { useEnglishAudio } from '../utils/englishAudio';
import type { EnglishAudioSourceType } from '../utils/englishAudio';

type EnglishAudioButtonProps = {
  sourceType: EnglishAudioSourceType;
  sourceId: string;
  lessonId?: number;
  label: string;
  className?: string;
  compact?: boolean;
};

export function EnglishAudioButton({
  sourceType,
  sourceId,
  lessonId,
  label,
  className,
  compact = false,
}: EnglishAudioButtonProps) {
  const { audioUrl, hasAudio, isLoading, play, resolvedSourceId, matchType } = useEnglishAudio(sourceType, sourceId, lessonId);

  if (!isLoading && !hasAudio) return null;

  const disabled = isLoading || !audioUrl;

  return (
    <button
      type="button"
      onClick={() => void play()}
      disabled={disabled}
      title={disabled ? 'Audio đang tải' : `Nghe: ${label}`}
      aria-label={disabled ? 'Audio đang tải' : `Nghe ${label}`}
      data-audio-source-type={sourceType}
      data-audio-source-id={sourceId}
      data-audio-resolved-source-id={resolvedSourceId ?? undefined}
      data-audio-match-type={matchType ?? undefined}
      className={[
        'inline-flex min-w-0 items-center justify-center gap-2 rounded-full border text-xs font-black transition',
        compact ? 'h-8 px-2.5' : 'h-9 px-3',
        disabled
          ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
          : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-indigo-300 hover:bg-indigo-100 hover:text-indigo-800',
        className ?? '',
      ].join(' ')}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
      {compact ? null : <span className="hidden sm:inline">Nghe</span>}
    </button>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';

export type EnglishAudioSourceType = 'lesson-card' | 'question' | 'vocabulary-word' | 'question-option';

export type EnglishAudioSourceRef = {
  sourceType: EnglishAudioSourceType;
  sourceId: string;
  lessonId?: number;
};

export type EnglishAudioManifestItem = {
  sourceType: EnglishAudioSourceType;
  sourceId: string;
  lessonId: number;
  r2ObjectKey: string;
  url: string;
};

export type EnglishAudioManifestMatch = {
  item: EnglishAudioManifestItem;
  matchType: 'exact' | 'slug';
};

export type EnglishAudioManifest = {
  version: string;
  generatedAt: string;
  profileId: string;
  language: 'en';
  subject: 'english';
  baseUrl: string;
  totalItems: number;
  items: Record<string, EnglishAudioManifestItem>;
};

const MANIFEST_URL = 'audio/tts/manifest.json';

let manifestPromise: Promise<EnglishAudioManifest | null> | null = null;
let manifestCache: EnglishAudioManifest | null = null;
let currentAudio: HTMLAudioElement | null = null;
let currentAudioResolve: ((value: boolean) => void) | null = null;

function getManifestKey(sourceType: EnglishAudioSourceType, sourceId: string) {
  return `${sourceType}:${sourceId}`;
}

function getSourceSlug(sourceId: string) {
  const normalizedSourceId = String(sourceId ?? '').trim();
  if (!normalizedSourceId) return '';
  const parts = normalizedSourceId.split('-');
  if (parts.length < 2) return normalizedSourceId;
  return parts.slice(0, -1).join('-');
}

export function resolveEnglishAudioManifestItem(
  manifest: EnglishAudioManifest | null | undefined,
  sourceType: EnglishAudioSourceType,
  sourceId: string,
  lessonId?: number,
): EnglishAudioManifestMatch | null {
  const exactKey = getManifestKey(sourceType, sourceId);
  const exactItem = manifest?.items?.[exactKey];
  if (exactItem) {
    return { item: exactItem, matchType: 'exact' };
  }

  const sourceSlug = getSourceSlug(sourceId);
  if (!sourceSlug || !manifest?.items) return null;

  const candidates = Object.values(manifest.items).filter(
    (item) => item.sourceType === sourceType && item.sourceId.startsWith(`${sourceSlug}-`),
  );

  if (!candidates.length) return null;

  const lessonCandidates = typeof lessonId === 'number' ? candidates.filter((item) => Number(item.lessonId) === lessonId) : [];
  const sortedCandidates = (lessonCandidates.length ? lessonCandidates : candidates).slice().sort((a, b) =>
    a.sourceId.localeCompare(b.sourceId),
  );

  return {
    item: sortedCandidates[0],
    matchType: 'slug',
  };
}

async function readEnglishAudioManifest() {
  if (manifestCache) return manifestCache;
  if (!manifestPromise) {
    manifestPromise = fetch(MANIFEST_URL, { cache: 'force-cache' })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as EnglishAudioManifest;
      })
      .catch(() => null)
      .then((manifest) => {
        manifestCache = manifest;
        return manifest;
      });
  }
  return manifestPromise;
}

export async function getEnglishAudioManifest() {
  return readEnglishAudioManifest();
}

export function getEnglishAudioUrlFromManifest(
  manifest: EnglishAudioManifest | null | undefined,
  sourceType: EnglishAudioSourceType,
  sourceId: string,
  lessonId?: number,
) {
  return resolveEnglishAudioManifestItem(manifest, sourceType, sourceId, lessonId)?.item.url ?? null;
}

function stopCurrentAudio(resolvePlayback = false) {
  if (currentAudioResolve) {
    const resolve = currentAudioResolve;
    currentAudioResolve = null;
    resolve(resolvePlayback);
  }

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

async function playEnglishAudioUrl(url: string) {
  stopCurrentAudio(false);

  try {
    const audio = new Audio(url);
    audio.preload = 'auto';
    currentAudio = audio;

    return await new Promise<boolean>((resolve) => {
      let settled = false;
      currentAudioResolve = (value: boolean) => {
        if (settled) return;
        settled = true;
        if (currentAudio === audio) currentAudio = null;
        if (currentAudioResolve) currentAudioResolve = null;
        resolve(value);
      };

      audio.onended = () => {
        if (currentAudioResolve) currentAudioResolve(true);
      };
      audio.onerror = () => {
        if (currentAudioResolve) currentAudioResolve(false);
      };

      void audio.play().catch(() => {
        if (currentAudioResolve) currentAudioResolve(false);
      });
    });
  } catch {
    stopCurrentAudio(false);
    return false;
  }
}

export function stopEnglishAudioPlayback() {
  stopCurrentAudio(false);
}

export async function playEnglishAudio(sourceType: EnglishAudioSourceType, sourceId: string, lessonId?: number) {
  const manifest = await readEnglishAudioManifest();
  const url = getEnglishAudioUrlFromManifest(manifest, sourceType, sourceId, lessonId);
  if (!url) return false;
  return playEnglishAudioUrl(url);
}

export async function playEnglishAudioSequence(items: EnglishAudioSourceRef[]) {
  const manifest = await readEnglishAudioManifest();
  if (!manifest) return false;

  let playedAny = false;
  for (const item of items) {
    const url = getEnglishAudioUrlFromManifest(manifest, item.sourceType, item.sourceId, item.lessonId);
    if (!url) continue;
    const played = await playEnglishAudioUrl(url);
    if (!played) break;
    playedAny = true;
  }

  return playedAny;
}

export function useEnglishAudio(sourceType: EnglishAudioSourceType, sourceId: string, lessonId?: number) {
  const [manifest, setManifest] = useState<EnglishAudioManifest | null>(manifestCache);
  const [isLoading, setIsLoading] = useState(!manifestCache);

  useEffect(() => {
    let cancelled = false;
    void readEnglishAudioManifest().then((nextManifest) => {
      if (cancelled) return;
      setManifest(nextManifest);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const audioUrl = useMemo(
    () => getEnglishAudioUrlFromManifest(manifest, sourceType, sourceId, lessonId),
    [lessonId, manifest, sourceId, sourceType],
  );

  const resolvedMatch = useMemo(
    () => resolveEnglishAudioManifestItem(manifest, sourceType, sourceId, lessonId),
    [lessonId, manifest, sourceId, sourceType],
  );

  useEffect(() => {
    if (isLoading || audioUrl) return;
    const meta = import.meta as ImportMeta & { env?: { DEV?: boolean } };
    if (meta.env?.DEV) {
      console.warn(
        `[EnglishAudio] missing audio for sourceType=${sourceType} sourceId=${sourceId}${typeof lessonId === 'number' ? ` lessonId=${lessonId}` : ''}`,
      );
    }
  }, [audioUrl, isLoading, lessonId, sourceId, sourceType]);

  useEffect(() => {
    if (!resolvedMatch || resolvedMatch.matchType === 'exact') return;
    const meta = import.meta as ImportMeta & { env?: { DEV?: boolean } };
    if (meta.env?.DEV) {
      console.info(
        `[EnglishAudio] fallback match sourceType=${sourceType} sourceId=${sourceId} resolvedSourceId=${resolvedMatch.item.sourceId}${
          typeof lessonId === 'number' ? ` lessonId=${lessonId}` : ''
        }`,
      );
    }
  }, [lessonId, resolvedMatch, sourceId, sourceType]);

  const play = useCallback(async () => {
    if (audioUrl) {
      return playEnglishAudio(sourceType, sourceId, lessonId);
    }

    const nextManifest = await readEnglishAudioManifest();
    const nextUrl = getEnglishAudioUrlFromManifest(nextManifest, sourceType, sourceId, lessonId);
    if (!nextUrl) return false;
    return playEnglishAudio(sourceType, sourceId, lessonId);
  }, [audioUrl, lessonId, sourceId, sourceType]);

  return {
    audioUrl,
    resolvedSourceId: resolvedMatch?.item.sourceId ?? null,
    matchType: resolvedMatch?.matchType ?? null,
    isLoading,
    hasAudio: Boolean(audioUrl),
    play,
  };
}

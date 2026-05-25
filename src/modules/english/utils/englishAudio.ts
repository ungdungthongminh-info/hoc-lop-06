import { useCallback, useEffect, useMemo, useState } from 'react';

export type EnglishAudioSourceType = 'lesson-card' | 'question' | 'vocabulary-word' | 'question-option';

export type EnglishAudioSourceRef = {
  sourceType: EnglishAudioSourceType;
  sourceId: string;
};

export type EnglishAudioManifestItem = {
  sourceType: EnglishAudioSourceType;
  sourceId: string;
  lessonId: number;
  r2ObjectKey: string;
  url: string;
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
) {
  return manifest?.items?.[getManifestKey(sourceType, sourceId)]?.url ?? null;
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

export async function playEnglishAudio(sourceType: EnglishAudioSourceType, sourceId: string) {
  const manifest = await readEnglishAudioManifest();
  const url = getEnglishAudioUrlFromManifest(manifest, sourceType, sourceId);
  if (!url) return false;
  return playEnglishAudioUrl(url);
}

export async function playEnglishAudioSequence(items: EnglishAudioSourceRef[]) {
  const manifest = await readEnglishAudioManifest();
  if (!manifest) return false;

  let playedAny = false;
  for (const item of items) {
    const url = getEnglishAudioUrlFromManifest(manifest, item.sourceType, item.sourceId);
    if (!url) continue;
    const played = await playEnglishAudioUrl(url);
    if (!played) break;
    playedAny = true;
  }

  return playedAny;
}

export function useEnglishAudio(sourceType: EnglishAudioSourceType, sourceId: string) {
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
    () => getEnglishAudioUrlFromManifest(manifest, sourceType, sourceId),
    [manifest, sourceId, sourceType],
  );

  useEffect(() => {
    if (isLoading || audioUrl) return;
    const meta = import.meta as ImportMeta & { env?: { DEV?: boolean } };
    if (meta.env?.DEV) {
      console.warn(`[EnglishAudio] missing audio for sourceId=${sourceId}`);
    }
  }, [audioUrl, isLoading, sourceId]);

  const play = useCallback(async () => {
    if (audioUrl) {
      return playEnglishAudio(sourceType, sourceId);
    }

    const nextManifest = await readEnglishAudioManifest();
    const nextUrl = getEnglishAudioUrlFromManifest(nextManifest, sourceType, sourceId);
    if (!nextUrl) return false;
    return playEnglishAudio(sourceType, sourceId);
  }, [audioUrl, sourceId, sourceType]);

  return {
    audioUrl,
    isLoading,
    hasAudio: Boolean(audioUrl),
    play,
  };
}

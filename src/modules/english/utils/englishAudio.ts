import { useCallback, useEffect, useMemo, useState } from 'react';

export type EnglishAudioSourceType = 'lesson-card' | 'question';

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

const MANIFEST_URL = '/audio/tts/manifest.json';

let manifestPromise: Promise<EnglishAudioManifest | null> | null = null;
let manifestCache: EnglishAudioManifest | null = null;
let currentAudio: HTMLAudioElement | null = null;

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

export function getEnglishAudioUrlFromManifest(
  manifest: EnglishAudioManifest | null | undefined,
  sourceType: EnglishAudioSourceType,
  sourceId: string,
) {
  return manifest?.items?.[getManifestKey(sourceType, sourceId)]?.url ?? null;
}

export async function playEnglishAudio(sourceType: EnglishAudioSourceType, sourceId: string) {
  const manifest = await readEnglishAudioManifest();
  const url = getEnglishAudioUrlFromManifest(manifest, sourceType, sourceId);
  if (!url) return false;

  try {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }

    const audio = new Audio(url);
    audio.preload = 'auto';
    currentAudio = audio;

    await audio.play();
    audio.onended = () => {
      if (currentAudio === audio) currentAudio = null;
    };
    audio.onerror = () => {
      if (currentAudio === audio) currentAudio = null;
    };
    return true;
  } catch {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    return false;
  }
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

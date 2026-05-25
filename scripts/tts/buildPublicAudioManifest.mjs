import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../..');

const SOURCE_MANIFEST = path.join(REPO_ROOT, 'docs/audio/english-audio-manifest-full.json');
const PUBLIC_MANIFEST = path.join(REPO_ROOT, 'public/audio/tts/manifest.json');
const DEFAULT_BASE_URL = 'https://audio.hochungkhoi.site';
const EXPECTED_TOTAL_ITEMS = 1728;

function nowIso() {
  return new Date().toISOString();
}

function parseArgs(argv) {
  const result = {
    baseUrl: DEFAULT_BASE_URL,
    sourceManifest: SOURCE_MANIFEST,
    output: PUBLIC_MANIFEST,
    sampleCount: 5,
  };

  for (const arg of argv.slice(2)) {
    if (arg.startsWith('--baseUrl=')) {
      const value = arg.slice('--baseUrl='.length).trim();
      if (value) result.baseUrl = value;
    } else if (arg.startsWith('--source=')) {
      result.sourceManifest = arg.slice('--source='.length).trim();
    } else if (arg.startsWith('--output=')) {
      result.output = arg.slice('--output='.length).trim();
    } else if (arg.startsWith('--sampleCount=')) {
      const value = Number(arg.slice('--sampleCount='.length));
      if (Number.isFinite(value) && value > 0) result.sampleCount = Math.max(1, Math.floor(value));
    }
  }

  return result;
}

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

function buildItems(manifest, baseUrl) {
  const sourceItems = manifest?.items || {};
  const entries = Object.entries(sourceItems);
  const seen = new Set();
  const items = {};

  for (const [key, item] of entries) {
    const sourceType = normalizeText(item.sourceType);
    const sourceId = normalizeText(item.sourceId);
    const lessonId = Number(item.lessonId);
    const r2ObjectKey = normalizeText(item.r2ObjectKey);
    if (!sourceType || !sourceId || !r2ObjectKey || !Number.isFinite(lessonId)) {
      throw new Error(`invalid-item:${key}`);
    }
    if (seen.has(key)) {
      throw new Error(`duplicate-key:${key}`);
    }
    seen.add(key);
    items[key] = {
      sourceType,
      sourceId,
      lessonId,
      r2ObjectKey,
      url: `${baseUrl}/${r2ObjectKey}`,
    };
  }

  return items;
}

async function headCheck(url) {
  const response = await fetch(url, { method: 'HEAD' });
  const contentType = String(response.headers.get('content-type') || '').toLowerCase();
  return {
    ok: response.status === 200,
    status: response.status,
    contentType,
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const source = await readJson(args.sourceManifest);
  const items = buildItems(source, args.baseUrl);
  const itemKeys = Object.keys(items);
  if (itemKeys.length !== EXPECTED_TOTAL_ITEMS) {
    throw new Error(`expected-total-items-${EXPECTED_TOTAL_ITEMS}-got-${itemKeys.length}`);
  }

  const manifest = {
    version: '1.0.0',
    generatedAt: nowIso(),
    profileId: source.profileId || 'en-v1',
    language: 'en',
    subject: 'english',
    baseUrl: args.baseUrl,
    totalItems: itemKeys.length,
    items,
  };

  await fs.mkdir(path.dirname(args.output), { recursive: true });
  await fs.writeFile(args.output, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  const sampleKeys = [
    ...itemKeys.slice(0, args.sampleCount),
  ];
  const sample = [];
  for (const key of sampleKeys) {
    const entry = items[key];
    const result = await headCheck(entry.url);
    sample.push({
      key,
      url: entry.url,
      status: result.status,
      contentType: result.contentType,
      ok: result.ok,
    });
    if (!result.ok) {
      throw new Error(`sample-head-failed:${key}:${result.status}`);
    }
    if (!/audio\/(mpeg|mp3)/i.test(result.contentType)) {
      throw new Error(`sample-content-type-unexpected:${key}:${result.contentType || 'missing'}`);
    }
  }

  console.log(JSON.stringify({
    output: args.output,
    totalItems: itemKeys.length,
    sampleCount: sample.length,
    sample,
  }, null, 2));
}

main().catch((error) => {
  console.error(String(error?.message || error));
  process.exitCode = 1;
});

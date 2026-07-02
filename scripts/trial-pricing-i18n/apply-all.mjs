#!/usr/bin/env node
/**
 * Expand www pricing + trial page JSON (EN SSOT + 13 locale overlays).
 * Run: node scripts/trial-pricing-i18n/apply-all.mjs && npm run verify
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PAGE_DEFS } from './en-keys.mjs'
import { LOCALE_OVERLAYS } from './locale-overlays.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..')
const SOURCES_EN_WWW = join(ROOT, 'sources/en/www')
const LOCALES_WWW = join(ROOT, 'locales')

const NON_EN_LOCALES = ['ja', 'ko', 'zh', 'ar', 'vi', 'th', 'id', 'ms', 'si', 'ur', 'hi', 'ru', 'my']

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

function mergePageDoc(enDoc, overlayKeys, metaPatch = {}) {
  return {
    ...enDoc,
    keys: { ...enDoc.keys, ...overlayKeys },
    meta: { ...enDoc.meta, ...metaPatch },
  }
}

function pageKeyFromFile(file) {
  return file.replace('.page.json', '')
}

for (const def of PAGE_DEFS) {
  const enPath = join(SOURCES_EN_WWW, def.file)
  let enDoc
  if (existsSync(enPath)) {
    enDoc = JSON.parse(readFileSync(enPath, 'utf8'))
  } else {
    enDoc = {
      pageId: def.pageId,
      surface: 'www',
      route: def.route,
      version: 1,
      sourceHash: 'sha256:pending',
      keys: {},
      meta: {
        productRepo: 'web-public',
        githubPath: `www/${def.file}`,
      },
    }
  }
  enDoc.keys = { ...def.keys }
  enDoc.pageId = def.pageId
  enDoc.route = def.route
  writeJson(enPath, enDoc)

  const pageKey = pageKeyFromFile(def.file)

  for (const locale of NON_EN_LOCALES) {
    const locPath = join(LOCALES_WWW, locale, 'www', def.file)
    let locDoc = existsSync(locPath) ? JSON.parse(readFileSync(locPath, 'utf8')) : { ...enDoc }
    const overlay = LOCALE_OVERLAYS[locale]?.[pageKey] ?? {}
    const isKoReviewed = locale === 'ko'
    locDoc = mergePageDoc(enDoc, overlay, {
      translationStatus: isKoReviewed ? 'reviewed' : 'ai_draft',
      method: isKoReviewed ? 'human-review' : 'cursor-ai',
    })
    writeJson(locPath, locDoc)
  }
}

console.log('Applied trial/pricing i18n to EN +', NON_EN_LOCALES.length, 'locales ×', PAGE_DEFS.length, 'pages')

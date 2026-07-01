#!/usr/bin/env node
/**
 * Build locale files from scripts/translation-packs/data/{locale}.json + EN sources.
 * Usage: node scripts/build-locale-data.mjs th id ms ru my
 */
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { PATHS } from './lib/constants.mjs'
import { deepClone } from './lib/flatten-keys.mjs'

const DATA_DIR = join(dirname(new URL(import.meta.url).pathname), 'translation-packs/data')
const LOCALES = process.argv.slice(2).length > 0 ? process.argv.slice(2) : ['th', 'id', 'ms']

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

function mergeKeys(target, overlay) {
  if (!overlay || typeof overlay !== 'object') return
  for (const [k, v] of Object.entries(overlay)) {
    if (typeof v === 'string') {
      target[k] = v
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      if (!target[k] || typeof target[k] !== 'object' || Array.isArray(target[k])) {
        target[k] = {}
      }
      mergeKeys(target[k], v)
    }
  }
}

function loadData(locale) {
  const path = join(DATA_DIR, `${locale}.json`)
  if (!existsSync(path)) {
    throw new Error(`Missing ${path} — run generate-locale-data.py or generate-sea-data.py`)
  }
  return JSON.parse(readFileSync(path, 'utf8'))
}

function applyScoped(locale, data) {
  let updated = 0
  for (const dir of ['account', 'app']) {
    for (const f of readdirSync(join(PATHS.sourcesEn, dir)).filter((x) => x.endsWith('.page.json'))) {
      const enFile = join(PATHS.sourcesEn, dir, f)
      const enDoc = JSON.parse(readFileSync(enFile, 'utf8'))
      const overlay = data[enDoc.pageId]
      if (!overlay) {
        console.warn(`build-locale-data: no data for ${locale} ${enDoc.pageId}`)
        continue
      }
      const locDoc = deepClone(enDoc)
      mergeKeys(locDoc.keys, overlay)
      locDoc.sourceHash = enDoc.sourceHash
      locDoc.meta = {
        ...enDoc.meta,
        ...locDoc.meta,
        translationStatus: 'ai_draft',
        method: 'cursor-ai',
      }
      writeJson(join(PATHS.locales, locale, dir, f), locDoc)
      updated++
    }
  }

  const homeEn = join(PATHS.sourcesEn, 'www', 'home.page.json')
  const homeDoc = JSON.parse(readFileSync(homeEn, 'utf8'))
  const homeOverlay = data['www.home']
  if (homeOverlay) {
    const locDoc = deepClone(homeDoc)
    mergeKeys(locDoc.keys, homeOverlay)
    locDoc.sourceHash = homeDoc.sourceHash
    locDoc.meta = {
      ...homeDoc.meta,
      ...locDoc.meta,
      translationStatus: 'ai_draft',
      method: 'cursor-ai',
    }
    writeJson(join(PATHS.locales, locale, 'www', 'home.page.json'), locDoc)
    updated++
  }

  return updated
}

let total = 0
for (const locale of LOCALES) {
  const data = loadData(locale)
  const n = applyScoped(locale, data)
  console.log(`build-locale-data: ${locale} updated ${n} files`)
  total += n
}
console.log(`build-locale-data: total ${total} files`)

#!/usr/bin/env node
/**
 * Apply th / id / ms translation packs to account (full), app (full), and www/home.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { PATHS } from './lib/constants.mjs'
import { deepClone } from './lib/flatten-keys.mjs'
import { thPages } from './translation-packs/th-pages.mjs'
import { idPages } from './translation-packs/id-pages.mjs'
import { msPages } from './translation-packs/ms-pages.mjs'

const PACKS = { th: thPages, id: idPages, ms: msPages }

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

function applyPage(locale, enFile, pages) {
  const rel = enFile.slice(PATHS.sourcesEn.length + 1)
  const enDoc = JSON.parse(readFileSync(enFile, 'utf8'))
  const overlay = pages[enDoc.pageId]
  if (!overlay) return false

  const locDoc = deepClone(enDoc)
  mergeKeys(locDoc.keys, overlay)
  locDoc.sourceHash = enDoc.sourceHash
  locDoc.meta = {
    ...enDoc.meta,
    ...locDoc.meta,
    translationStatus: 'ai_draft',
    method: 'cursor-ai',
  }

  writeJson(join(PATHS.locales, locale, rel), locDoc)
  return true
}

let updated = 0
for (const locale of ['th', 'id', 'ms']) {
  const pages = PACKS[locale]
  for (const f of readdirSync(join(PATHS.sourcesEn, 'account')).filter((x) => x.endsWith('.page.json'))) {
    if (applyPage(locale, join(PATHS.sourcesEn, 'account', f), pages)) updated++
  }
  for (const f of readdirSync(join(PATHS.sourcesEn, 'app')).filter((x) => x.endsWith('.page.json'))) {
    if (applyPage(locale, join(PATHS.sourcesEn, 'app', f), pages)) updated++
  }
  const homeFile = join(PATHS.sourcesEn, 'www', 'home.page.json')
  if (pages['www.home'] && applyPage(locale, homeFile, pages)) updated++
}

console.log(`apply-sea-pack: updated ${updated} locale files (th, id, ms)`)

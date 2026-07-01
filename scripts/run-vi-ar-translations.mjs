#!/usr/bin/env node
/**
 * Apply vi/ar cursor-ai translations to locale files.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { PATHS } from './lib/constants.mjs'
import { flattenKeys, unflattenKeys } from './lib/flatten-keys.mjs'
import { viAccountHome } from './translation-packs/vi-account-home.mjs'

const LOCALES = {
  vi: {
    accountHome: [viAccountHome],
    app: null,
  },
  ar: {
    accountHome: [],
    app: null,
  },
}

async function loadModules() {
  const viPart2 = await import('./translation-packs/vi-account-home-part2.mjs')
  LOCALES.vi.accountHome.push(viPart2.viAccountHomePart2)

  const arHome = await import('./translation-packs/ar-account-home.mjs')
  LOCALES.ar.accountHome.push(arHome.arAccountHome)

  const viApp = await import('./translation-packs/vi-app-overlays.mjs')
  LOCALES.vi.app = viApp.viAppOverlays

  const arApp = await import('./translation-packs/ar-app-overlays.mjs')
  LOCALES.ar.app = arApp.arAppOverlays
}

function listEnPageFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name)
    if (name.isDirectory()) listEnPageFiles(p, acc)
    else if (name.name.endsWith('.page.json')) acc.push(p)
  }
  return acc
}

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

function mergeAccountHomePacks(packs) {
  const merged = {}
  for (const pack of packs) {
    Object.assign(merged, pack)
  }
  return merged
}

function applyPage(locDoc, enDoc, overlay, mode) {
  const enFlat = flattenKeys(enDoc.keys ?? enDoc)
  const locFlat = flattenKeys(locDoc.keys ?? locDoc)
  const merged = { ...locFlat }

  for (const [key, value] of Object.entries(overlay)) {
    if (!(key in enFlat)) continue
    if (mode === 'app' && enFlat[key] !== locFlat[key]) continue
    merged[key] = value
  }

  locDoc.keys = unflattenKeys(merged)
  locDoc.sourceHash = enDoc.sourceHash
  locDoc.meta = {
    ...locDoc.meta,
    translationStatus: 'ai_draft',
    method: 'cursor-ai',
  }
  return locDoc
}

function countChanges(before, after, keys) {
  let n = 0
  for (const k of keys) {
    if (before[k] !== after[k]) n++
  }
  return n
}

async function main() {
  await loadModules()
  const counts = {
    vi: { account: 0, app: 0, www: 0, keys: 0 },
    ar: { account: 0, app: 0, www: 0, keys: 0 },
  }

  for (const locale of ['vi', 'ar']) {
    const accountHome = mergeAccountHomePacks(LOCALES[locale].accountHome)
    const appOverlays = LOCALES[locale].app

    for (const enFile of listEnPageFiles(PATHS.sourcesEn)) {
      const rel = enFile.slice(PATHS.sourcesEn.length + 1)
      const enDoc = JSON.parse(readFileSync(enFile, 'utf8'))
      const locFile = join(PATHS.locales, locale, rel)
      if (!existsSync(locFile)) continue

      let overlay = null
      let mode = 'full'
      if (rel.startsWith('account/') || rel === 'www/home.page.json') {
        overlay = accountHome[enDoc.pageId]
      } else if (rel.startsWith('app/')) {
        overlay = appOverlays?.[enDoc.pageId]
        mode = 'app'
      }
      if (!overlay) continue

      const locDoc = JSON.parse(readFileSync(locFile, 'utf8'))
      const before = flattenKeys(locDoc.keys ?? locDoc)
      applyPage(locDoc, enDoc, overlay, mode)
      const after = flattenKeys(locDoc.keys ?? locDoc)
      const changed = countChanges(before, after, Object.keys(overlay))

      writeJson(locFile, locDoc)
      counts[locale].keys += changed
      if (rel.startsWith('account/')) counts[locale].account++
      else if (rel.startsWith('app/')) counts[locale].app++
      else if (rel === 'www/home.page.json') counts[locale].www++
    }
  }

  console.log(JSON.stringify(counts, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

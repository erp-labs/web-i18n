#!/usr/bin/env node
/**
 * Apply vi/ar translations for account (full), www/home (full), app (EN-identical only).
 */
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { PATHS } from './lib/constants.mjs'
import { flattenKeys, unflattenKeys, deepClone } from './lib/flatten-keys.mjs'

const PACKS = {
  vi: JSON.parse(readFileSync(new URL('./translation-packs/vi-cursor.json', import.meta.url), 'utf8')),
  ar: JSON.parse(readFileSync(new URL('./translation-packs/ar-cursor.json', import.meta.url), 'utf8')),
}

const FULL_SURFACES = new Set(['account'])
const FULL_FILES = new Set(['www/home.page.json'])

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

function applyOverlay(locDoc, enDoc, overlay, mode) {
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

function main() {
  let counts = { vi: { account: 0, app: 0, www: 0, keys: 0 }, ar: { account: 0, app: 0, www: 0, keys: 0 } }

  for (const locale of ['vi', 'ar']) {
    const pack = PACKS[locale]
    if (!pack?.pages) throw new Error(`Missing pack for ${locale}`)

    for (const enFile of listEnPageFiles(PATHS.sourcesEn)) {
      const rel = enFile.slice(PATHS.sourcesEn.length + 1)
      const enDoc = JSON.parse(readFileSync(enFile, 'utf8'))
      const overlay = pack.pages[enDoc.pageId]
      if (!overlay) continue

      const isFull = FULL_SURFACES.has(rel.split('/')[0]) || FULL_FILES.has(rel)
      const isApp = rel.startsWith('app/')
      if (!isFull && !isApp) continue

      const locFile = join(PATHS.locales, locale, rel)
      if (!existsSync(locFile)) continue

      const locDoc = JSON.parse(readFileSync(locFile, 'utf8'))
      const before = flattenKeys(locDoc.keys ?? locDoc)
      applyOverlay(locDoc, enDoc, overlay, isFull ? 'full' : 'app')
      const after = flattenKeys(locDoc.keys ?? locDoc)

      let changed = 0
      for (const k of Object.keys(overlay)) {
        if (before[k] !== after[k]) changed++
      }

      writeJson(locFile, locDoc)
      counts[locale].keys += changed
      if (rel.startsWith('account/')) counts[locale].account++
      else if (rel.startsWith('app/')) counts[locale].app++
      else if (rel === 'www/home.page.json') counts[locale].www++
    }
  }

  console.log(JSON.stringify(counts, null, 2))
}

main()

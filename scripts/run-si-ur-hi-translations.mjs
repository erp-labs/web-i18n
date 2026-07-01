#!/usr/bin/env node
/**
 * Apply full si/ur/hi translations for scoped surfaces:
 * account/*.page.json, app/*.page.json, www/home.page.json
 *
 * Reads packs from scripts/translation-packs/scoped/{locale}-pack.mjs
 * Sets meta.translationStatus → ai_draft, meta.method → cursor-ai, sourceHash from EN.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { PATHS } from './lib/constants.mjs'
import { flattenKeys, unflattenKeys } from './lib/flatten-keys.mjs'

const LOCALES = ['si', 'ur', 'hi']

const SCOPED_PREFIXES = ['account/', 'app/']
const SCOPED_FILES = ['www/home.page.json']

async function loadPacks() {
  const [si, ur, hi] = await Promise.all([
    import('./translation-packs/scoped/si-pack.mjs'),
    import('./translation-packs/scoped/ur-pack.mjs'),
    import('./translation-packs/scoped/hi-pack.mjs'),
  ])
  return { si: si.scopedPack, ur: ur.scopedPack, hi: hi.scopedPack }
}

function listScopedEnFiles() {
  const acc = []
  for (const enFile of listEnPageFiles(PATHS.sourcesEn)) {
    const rel = enFile.slice(PATHS.sourcesEn.length + 1)
    if (SCOPED_PREFIXES.some((p) => rel.startsWith(p)) || SCOPED_FILES.includes(rel)) {
      acc.push(enFile)
    }
  }
  return acc
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

function applyPage(locDoc, enDoc, overlay) {
  const enFlat = flattenKeys(enDoc.keys ?? enDoc)
  const locFlat = flattenKeys(locDoc.keys ?? locDoc)
  const merged = { ...locFlat }

  for (const [key, enVal] of Object.entries(enFlat)) {
    if (typeof enVal !== 'string') continue
    if (overlay && key in overlay) merged[key] = overlay[key]
    else if (!(key in merged)) merged[key] = enVal
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
  const packs = await loadPacks()
  const counts = Object.fromEntries(LOCALES.map((l) => [l, { account: 0, app: 0, www: 0, keys: 0 }]))

  for (const enFile of listScopedEnFiles()) {
    const rel = enFile.slice(PATHS.sourcesEn.length + 1)
    const enDoc = JSON.parse(readFileSync(enFile, 'utf8'))
    const overlay = null

    for (const locale of LOCALES) {
      const pageOverlay = packs[locale]?.[enDoc.pageId]
      if (!pageOverlay) {
        console.error(`run-si-ur-hi: missing pack for ${locale}/${enDoc.pageId}`)
        process.exitCode = 1
        continue
      }

      const locFile = join(PATHS.locales, locale, rel)
      if (!existsSync(locFile)) {
        console.error(`run-si-ur-hi: missing locale file ${locale}/${rel}`)
        process.exitCode = 1
        continue
      }

      const locDoc = JSON.parse(readFileSync(locFile, 'utf8'))
      const before = flattenKeys(locDoc.keys ?? locDoc)
      applyPage(locDoc, enDoc, pageOverlay)
      const after = flattenKeys(locDoc.keys ?? locDoc)
      const changed = countChanges(before, after, Object.keys(pageOverlay))

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

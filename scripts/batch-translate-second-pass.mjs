#!/usr/bin/env node
/**
 * Apply curated 2nd-pass translations from scripts/translation-packs/{locale}.json
 * into locales/{locale} page JSON files. Sets meta.translationStatus → review.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { PATHS, loadNonEnLocales } from './lib/constants.mjs'
import { deepClone } from './lib/flatten-keys.mjs'

const TARGET_LOCALES = ['th', 'id', 'ms', 'si', 'ur', 'hi']
const PACKS_DIR = join(dirname(new URL(import.meta.url).pathname), 'translation-packs')

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

function pageIdToRelPath(pageId) {
  const rel = pageId.replace(/^[^.]+\./, '').replace(/\./g, '/')
  return `${rel}.page.json`
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

function appendVersion(pageId, locale, enHash) {
  const versionPath = join(PATHS.versions, `${pageId.replace(/\./g, '_')}.json`)
  /** @type {Array<Record<string, unknown>>} */
  let history = existsSync(versionPath) ? JSON.parse(readFileSync(versionPath, 'utf8')) : []
  const last = history.filter((h) => h.locale === locale).at(-1)
  const version = (typeof last?.version === 'number' ? last.version : 0) + 1
  history.push({
    version,
    enHash,
    locale,
    method: 'cursor-ai-2',
    at: new Date().toISOString(),
  })
  writeJson(versionPath, history)
  return version
}

function loadPack(locale) {
  const path = join(PACKS_DIR, `${locale}.json`)
  if (!existsSync(path)) return null
  return JSON.parse(readFileSync(path, 'utf8'))
}

function main() {
  const locales = process.argv.includes('--all')
    ? loadNonEnLocales().filter((c) => c !== 'en')
    : TARGET_LOCALES

  let updated = 0
  let skipped = 0

  for (const locale of locales) {
    const pack = loadPack(locale)
    if (!pack?.pages || typeof pack.pages !== 'object') {
      console.warn(`batch-translate-second-pass: skip ${locale} (no pack)`)
      skipped++
      continue
    }

    for (const enFile of listEnPageFiles(PATHS.sourcesEn)) {
      const rel = enFile.slice(PATHS.sourcesEn.length + 1)
      const enDoc = JSON.parse(readFileSync(enFile, 'utf8'))
      const overlay = pack.pages[enDoc.pageId]
      if (!overlay || typeof overlay !== 'object') continue

      const locFile = join(PATHS.locales, locale, rel)
      if (!existsSync(locFile)) continue

      const locDoc = JSON.parse(readFileSync(locFile, 'utf8'))
      locDoc.keys = { ...deepClone(locDoc.keys ?? {}), ...overlay }
      locDoc.version = appendVersion(enDoc.pageId, locale, enDoc.sourceHash)
      locDoc.meta = {
        ...locDoc.meta,
        translationStatus: 'review',
        method: 'cursor-ai-2',
        reviewedAt: new Date().toISOString().slice(0, 10),
      }
      writeJson(locFile, locDoc)
      updated++
    }
  }

  console.log(`batch-translate-second-pass: updated ${updated} locale page files (${skipped} locales skipped)`)
}

main()

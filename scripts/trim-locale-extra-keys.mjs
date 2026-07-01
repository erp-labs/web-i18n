#!/usr/bin/env node
/**
 * Remove locale page keys that no longer exist in the matching EN source file.
 * Keeps optional `translationStatus` when present.
 *
 * Usage: node scripts/trim-locale-extra-keys.mjs [surface]
 * Default surface: all (app, account, www, docs, email)
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { PATHS, loadNonEnLocales } from './lib/constants.mjs'

const surfaceFilter = process.argv[2]?.trim()

function listEnPageFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name)
    if (name.isDirectory()) listEnPageFiles(p, acc)
    else if (name.name.endsWith('.page.json')) acc.push(p)
  }
  return acc
}

function trimFile(enFile, locale) {
  const rel = enFile.slice(PATHS.sourcesEn.length + 1)
  if (surfaceFilter && !rel.startsWith(`${surfaceFilter}/`)) return { trimmed: 0, changed: false }

  const locFile = join(PATHS.locales, locale, rel)
  if (!existsSync(locFile)) return { trimmed: 0, changed: false }

  const enDoc = JSON.parse(readFileSync(enFile, 'utf8'))
  const locDoc = JSON.parse(readFileSync(locFile, 'utf8'))
  const enKeys = new Set(Object.keys(enDoc.keys ?? {}))
  const keys = locDoc.keys ?? {}
  const extras = Object.keys(keys).filter((k) => !enKeys.has(k) && k !== 'translationStatus')
  if (extras.length === 0) return { trimmed: 0, changed: false }

  /** @type {Record<string, unknown>} */
  const next = {}
  for (const [key, value] of Object.entries(keys)) {
    if (enKeys.has(key) || key === 'translationStatus') next[key] = value
  }
  locDoc.keys = next
  writeFileSync(locFile, `${JSON.stringify(locDoc, null, 2)}\n`, 'utf8')
  return { trimmed: extras.length, changed: true }
}

function main() {
  const locales = loadNonEnLocales()
  const enFiles = listEnPageFiles(PATHS.sourcesEn)
  let totalTrimmed = 0
  let filesChanged = 0

  for (const enFile of enFiles) {
    for (const locale of locales) {
      const { trimmed, changed } = trimFile(enFile, locale)
      if (changed) filesChanged += 1
      totalTrimmed += trimmed
    }
  }

  console.log(
    `trim-locale-extra-keys: removed ${totalTrimmed} extra keys across ${filesChanged} locale page files`,
  )
}

main()
